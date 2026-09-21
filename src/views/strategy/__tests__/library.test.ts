import { test } from 'node:test';
import assert from 'node:assert/strict';
/*
 * Same browser-storage shim as the storage round-trip test: installed before
 * the modules under test are imported, because they read `window` at call time.
 */
const entries = new Map<string, string>();
const globalRef = globalThis as unknown as { window: unknown; document: unknown };
globalRef.window = {
  localStorage: {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  },
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
};
globalRef.document = { documentElement: {} };
const {
  MAX_SAVED_STRATEGIES,
  STRATEGY_LIBRARY_KEY,
  activeConfig,
  loadLibrary,
  saveLibrary,
  singleEntryLibrary,
  withActive,
  withActiveConfig,
  withDuplicatedActive,
  withNewStrategy,
  withRenamed,
  withoutStrategy,
} = await import('../library');
const { STRATEGY_STORAGE_KEY } = await import('../storage');
const { createDefaultConfig } = await import('../defaults');
const { C1 } = await import('./fixtures');
const reset = () => entries.clear();
const configNamed = (amount: number) => {
  const config = createDefaultConfig('2021-01-01');
  config.column1.fund = C1;
  config.column1.amount = amount;
  return config;
};
test('an empty browser starts with one strategy on the defaults', () => {
  reset();
  const library = loadLibrary();
  assert.equal(library.entries.length, 1);
  assert.equal(library.entries[0].name, 'Strategy 1');
  assert.equal(library.activeId, library.entries[0].id);
});
test('a library survives save and reload, keeping the selection', () => {
  reset();
  const first = singleEntryLibrary('Retirement', configNamed(111));
  const both = withNewStrategy(first, configNamed(222), 'Aggressive');
  assert.ok(saveLibrary(both));
  const loaded = loadLibrary();
  assert.deepEqual(
    loaded.entries.map((entry) => entry.name),
    ['Retirement', 'Aggressive']
  );
  assert.equal(activeConfig(loaded).column1.amount, 222);
  assert.equal(loaded.activeId, both.activeId);
});
test('a config saved by the single-strategy version is migrated into the library', () => {
  reset();
  entries.set(STRATEGY_STORAGE_KEY, JSON.stringify(configNamed(333)));
  const library = loadLibrary();
  assert.equal(library.entries.length, 1);
  assert.equal(library.entries[0].name, 'Strategy 1');
  assert.equal(activeConfig(library).column1.amount, 333);
  // The legacy key is only dropped once the library has been written.
  assert.ok(entries.has(STRATEGY_LIBRARY_KEY));
  assert.equal(entries.has(STRATEGY_STORAGE_KEY), false);
});
test('an unusable stored library falls back rather than throwing', () => {
  reset();
  entries.set(STRATEGY_LIBRARY_KEY, '{ not json');
  assert.equal(loadLibrary().entries.length, 1);
  reset();
  entries.set(STRATEGY_LIBRARY_KEY, JSON.stringify({ entries: [{ name: 'broken' }] }));
  assert.equal(loadLibrary().entries.length, 1);
});
test('entries that no longer parse are dropped, usable ones kept', () => {
  reset();
  entries.set(
    STRATEGY_LIBRARY_KEY,
    JSON.stringify({
      activeId: 'gone',
      entries: [
        { id: 'a', name: 'Broken', config: { nothing: true } },
        { id: 'b', name: 'Fine', config: configNamed(444) },
      ],
    })
  );
  const loaded = loadLibrary();
  assert.deepEqual(
    loaded.entries.map((entry) => entry.name),
    ['Fine']
  );
  // An active id pointing at a dropped entry falls back to the first survivor.
  assert.equal(loaded.activeId, 'b');
});
test('editing writes to the active entry and leaves the others alone', () => {
  const library = withNewStrategy(singleEntryLibrary('One', configNamed(1)), configNamed(2), 'Two');
  const edited = withActiveConfig(library, configNamed(99));
  assert.equal(edited.entries[0].config.column1.amount, 1);
  assert.equal(edited.entries[1].config.column1.amount, 99);
});
test('a new strategy is selected and named without colliding', () => {
  const library = withNewStrategy(singleEntryLibrary('Strategy 1', configNamed(1)), createDefaultConfig());
  assert.equal(library.entries[1].name, 'Strategy 2');
  assert.equal(library.activeId, library.entries[1].id);
});
test('duplicating copies the active config under a distinct name', () => {
  const library = withDuplicatedActive(singleEntryLibrary('Plan', configNamed(7)));
  assert.equal(library.entries.length, 2);
  assert.equal(library.entries[1].name, 'Plan copy');
  assert.equal(library.entries[1].config.column1.amount, 7);
  assert.equal(library.activeId, library.entries[1].id);
  const thrice = withDuplicatedActive(library);
  assert.equal(thrice.entries[2].name, 'Plan copy 2');
});
test('renaming trims, collapses whitespace and refuses to blank a name', () => {
  const library = singleEntryLibrary('Plan', configNamed(1));
  const id = library.entries[0].id;
  assert.equal(withRenamed(library, id, '  Long   term  ').entries[0].name, 'Long term');
  assert.equal(withRenamed(library, id, '   ').entries[0].name, 'Plan');
});
test('deleting the active strategy selects its neighbour', () => {
  let library = singleEntryLibrary('One', configNamed(1));
  library = withNewStrategy(library, configNamed(2), 'Two');
  library = withNewStrategy(library, configNamed(3), 'Three');
  library = withActive(library, library.entries[1].id);
  const after = withoutStrategy(library, library.entries[1].id);
  assert.deepEqual(
    after.entries.map((entry) => entry.name),
    ['One', 'Three']
  );
  assert.equal(after.activeId, after.entries[1].id);
  assert.equal(activeConfig(after).column1.amount, 3);
});
test('deleting a strategy that is not selected keeps the selection', () => {
  let library = singleEntryLibrary('One', configNamed(1));
  library = withNewStrategy(library, configNamed(2), 'Two');
  const activeId = library.activeId;
  const after = withoutStrategy(library, library.entries[0].id);
  assert.equal(after.activeId, activeId);
});
test('the last strategy cannot be deleted', () => {
  const library = singleEntryLibrary('Only', configNamed(1));
  assert.equal(withoutStrategy(library, library.entries[0].id), library);
});
test('the library refuses to grow past its cap', () => {
  let library = singleEntryLibrary('Strategy 1', createDefaultConfig());
  for (let index = 1; index < MAX_SAVED_STRATEGIES; index += 1) {
    library = withNewStrategy(library, createDefaultConfig());
  }
  assert.equal(library.entries.length, MAX_SAVED_STRATEGIES);
  assert.equal(withNewStrategy(library, createDefaultConfig()), library);
  assert.equal(withDuplicatedActive(library), library);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
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
  activeConfig,
  singleEntryLibrary,
  withActive,
  withActiveConfig,
  withDuplicatedActive,
  withNewStrategy,
  withRenamed,
  withoutStrategy,
} = await import('../library');
const { createDefaultConfig } = await import('../defaults');
const { C1 } = await import('./fixtures');
const configNamed = (amount: number) => {
  const config = createDefaultConfig('2021-01-01');
  config.column1.fund = C1;
  config.column1.amount = amount;
  return config;
};
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

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
  STRATEGY_LIBRARY_KEY,
  activeConfig,
  loadLibrary,
  saveLibrary,
  singleEntryLibrary,
  withNewStrategy,
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
  assert.equal(loaded.activeId, 'b');
});

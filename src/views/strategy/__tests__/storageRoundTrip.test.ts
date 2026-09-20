import { test } from 'node:test';
import assert from 'node:assert/strict';
/*
 * Minimal browser-storage shim, installed before the storage module is
 * imported. The double cast is deliberate and confined to this test: the real
 * `window`/`document` types cannot be satisfied here, and the code under test
 * only reads `localStorage` plus the theme token lookup used for fund colours.
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
const { STRATEGY_STORAGE_KEY, clearStoredConfig, loadStoredConfig, saveStoredConfig } = await import(
  '../storage'
);
const { createDefaultConfig } = await import('../defaults');
const { runStrategy } = await import('../engine');
const { C1, C1_NAV, navBook } = await import('./fixtures');
test('a config survives save, reload and reuse by the engine', () => {
  const original = createDefaultConfig('2021-01-01');
  original.column1.fund = C1;
  original.column1.investmentDate = '2018-01-01';
  saveStoredConfig(original);
  assert.ok(entries.has(STRATEGY_STORAGE_KEY), 'nothing was written to storage');
  const restored = loadStoredConfig();
  assert.ok(restored, 'nothing was restored');
  assert.deepEqual(restored.column1.fund, C1);
  assert.equal(restored.column1.amount, 7000000);
  // The restored config must still drive the engine off actual NAVs. The
  // opening buy is checkable by hand: ₹70,00,000 at the ₹100 NAV on
  // 2018-01-01. Closing units are lower, because the default config also
  // carries two withdrawal periods.
  const fromRestored = runStrategy(restored, navBook());
  const opening = fromRestored.transactions[0];
  assert.equal(opening.navDate, '2018-01-01');
  assert.equal(opening.units, 7000000 / Number(C1_NAV[0].nav));
  assert.ok(fromRestored.totals.column1Units < opening.units);
  assert.ok(fromRestored.totals.withdrawnFromColumn1 > 0);
  assert.ok(fromRestored.snapshots.length > 0);
  assert.deepEqual(fromRestored.warnings, []);
});
test('nothing stored means nothing restored', () => {
  clearStoredConfig();
  assert.equal(loadStoredConfig(), null);
});
test('a corrupt entry is discarded instead of throwing', () => {
  entries.set(STRATEGY_STORAGE_KEY, '{ this is not json');
  assert.equal(loadStoredConfig(), null);
  entries.set(STRATEGY_STORAGE_KEY, '"a bare string"');
  assert.equal(loadStoredConfig(), null);
  clearStoredConfig();
});

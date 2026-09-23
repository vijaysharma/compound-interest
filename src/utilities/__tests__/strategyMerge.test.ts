import { test } from 'node:test';
import assert from 'node:assert/strict';
const { mergeStrategies } = await import('../strategyMerge');
const entry = (id: string, updatedAt: number, name = id) => ({
  id,
  name,
  config: { marker: name },
  savedAt: '2026-09-23',
  updatedAt,
});
const stone = (id: string, deletedAt: number) => ({ id, deletedAt });
const ids = (r: { entries: Array<{ id: string }> }) => r.entries.map((e) => e.id).sort();
test('entries unique to either side are all kept', () => {
  const r = mergeStrategies([entry('a', 10)], [], [entry('b', 20)], [], 20);
  assert.deepEqual(ids(r), ['a', 'b']);
});
test('the newer edit of the same entry wins, whichever side it came from', () => {
  const localNewer = mergeStrategies([entry('a', 30, 'local')], [], [entry('a', 10, 'remote')], [], 20);
  assert.equal(localNewer.entries[0].name, 'local');
  const remoteNewer = mergeStrategies([entry('a', 10, 'local')], [], [entry('a', 30, 'remote')], [], 20);
  assert.equal(remoteNewer.entries[0].name, 'remote');
});
test('two devices editing different strategies both keep their work', () => {
  // The case that rules out storing the library as one blob: whole-library
  // last-write-wins would discard one of these entirely.
  const phone = [entry('a', 50, 'plan-a-edited'), entry('b', 10, 'plan-b-old')];
  const laptop = [entry('a', 10, 'plan-a-old'), entry('b', 60, 'plan-b-edited')];
  const r = mergeStrategies(phone, [], laptop, [], 20);
  const byId = new Map(r.entries.map((e) => [e.id, e.name]));
  assert.equal(byId.get('a'), 'plan-a-edited');
  assert.equal(byId.get('b'), 'plan-b-edited');
});
test('a deletion survives the merge instead of being undone', () => {
  // Without a tombstone the union of both sides silently revives the entry.
  const r = mergeStrategies([], [stone('a', 40)], [entry('a', 20)], [], 20);
  assert.deepEqual(ids(r), []);
  assert.equal(r.tombstones.length, 1, 'the tombstone is retained for other devices');
});
test('an edit newer than the deletion revives the entry', () => {
  const r = mergeStrategies([entry('a', 90)], [], [], [stone('a', 40)], 20);
  assert.deepEqual(ids(r), ['a']);
  assert.equal(r.tombstones.length, 0, 'the spent tombstone is dropped');
});
test('a deletion exactly at the last edit time still deletes', () => {
  const r = mergeStrategies([], [stone('a', 40)], [entry('a', 40)], [], 20);
  assert.deepEqual(ids(r), []);
});
test('entries written before updatedAt existed lose to anything newer', () => {
  // Legacy localStorage rows default to 0 and must not overwrite a real edit.
  const r = mergeStrategies([entry('a', 0, 'legacy')], [], [entry('a', 5, 'known')], [], 20);
  assert.equal(r.entries[0].name, 'known');
});
test('the cap keeps the most recently edited, not the first listed', () => {
  const older = [entry('x', 1), entry('y', 2)];
  const newer = [entry('z', 99)];
  const r = mergeStrategies(older, [], newer, [], 2);
  assert.deepEqual(ids(r), ['y', 'z']);
});
test('tied timestamps resolve to the second argument', () => {
  // Callers pass stored rows second, so a tie settles on the shared copy and
  // devices converge rather than overwriting each other in turn.
  const r = mergeStrategies([entry('a', 10, 'local')], [], [entry('a', 10, 'stored')], [], 20);
  assert.equal(r.entries[0].name, 'stored');
});
test('the newest tombstone for an id wins', () => {
  const r = mergeStrategies([], [stone('a', 10)], [entry('a', 30)], [stone('a', 40)], 20);
  assert.deepEqual(ids(r), []);
  assert.equal(r.tombstones[0].deletedAt, 40);
});
test('malformed records are ignored rather than throwing', () => {
  const junk = [undefined, null, {}] as unknown as Array<ReturnType<typeof entry>>;
  const r = mergeStrategies(junk, [], [entry('a', 1)], [], 20);
  assert.deepEqual(ids(r), ['a']);
});
test('empty input yields empty output', () => {
  const r = mergeStrategies([], [], [], [], 20);
  assert.deepEqual(r.entries, []);
  assert.deepEqual(r.tombstones, []);
});

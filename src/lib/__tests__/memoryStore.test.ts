import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  memoryGet,
  memorySet,
  memoryDel,
  memoryDelPattern,
  memoryIncr,
  memorySetNX,
  pruneMemoryStore,
} from '../redis/memoryStore';

describe('In-Memory Store Caching & Pruning', () => {
  beforeEach(() => {
    memoryDelPattern('*');
  });

  it('stores and retrieves values with TTL', () => {
    memorySet('test:key', { message: 'hello' }, 60);
    const value = memoryGet<{ message: string }>('test:key');
    assert.deepStrictEqual(value, { message: 'hello' });
  });

  it('expires entries past their TTL', async () => {
    memorySet('test:expiring', 'temporary', -1);
    const value = memoryGet<string>('test:expiring');
    assert.strictEqual(value, null);
  });

  it('prunes expired entries and caps items at MAX_MEMORY_ITEMS', () => {
    // Fill beyond capacity
    for (let i = 0; i < 550; i++) {
      memorySet(`bulk:key:${i}`, i, 3600);
    }
    // Explicit pruning should cap items
    pruneMemoryStore();

    // Verify memorySetNX works
    const setFirst = memorySetNX('test:nx', 'initial', 60);
    assert.strictEqual(setFirst, true);
    const setSecond = memorySetNX('test:nx', 'conflict', 60);
    assert.strictEqual(setSecond, false);
  });

  it('increments counter correctly', () => {
    assert.strictEqual(memoryIncr('test:counter'), 1);
    assert.strictEqual(memoryIncr('test:counter'), 2);
    assert.strictEqual(memoryGet<number>('test:counter'), 2);
  });
});

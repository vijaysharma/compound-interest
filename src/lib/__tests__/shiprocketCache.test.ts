import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  withShiprocketCache,
  invalidateShiprocketAccountsCache,
  invalidateShiprocketOrdersCache,
  invalidateShiprocketCustomersCache,
  SR_CACHE_TTL,
} from '../shiprocketCache';
import { redisGet, redisSet, redisDelPattern } from '../redis';
import { memoryDelPattern, memoryGet, memorySet } from '../redis/memoryStore';

describe('Shiprocket Redis Caching & Invalidation Layer', () => {
  beforeEach(async () => {
    await redisDelPattern('sr:*');
  });

  describe('withShiprocketCache', () => {
    it('executes fetcher on cache miss and stores result', async () => {
      let callCount = 0;
      const testFetcher = async () => {
        callCount++;
        return { message: 'fresh_data', count: 42 };
      };

      const res1 = await withShiprocketCache('sr:test:1', 60, testFetcher);
      assert.strictEqual(res1.message, 'fresh_data');
      assert.strictEqual(callCount, 1);

      // Second call should hit cache without calling fetcher
      const res2 = await withShiprocketCache('sr:test:1', 60, testFetcher);
      assert.strictEqual(res2.message, 'fresh_data');
      assert.strictEqual(callCount, 1);
    });

    it('respects different cache keys independently', async () => {
      let callCountA = 0;
      let callCountB = 0;

      const resA = await withShiprocketCache('sr:test:a', 60, async () => {
        callCountA++;
        return 'valueA';
      });

      const resB = await withShiprocketCache('sr:test:b', 60, async () => {
        callCountB++;
        return 'valueB';
      });

      assert.strictEqual(resA, 'valueA');
      assert.strictEqual(resB, 'valueB');
      assert.strictEqual(callCountA, 1);
      assert.strictEqual(callCountB, 1);
    });
  });

  describe('Pattern Deletion & Invalidation', () => {
    it('invalidates accounts and dependent datasets', async () => {
      await redisSet('sr:acc:list', { accounts: ['acc1'] }, 3600);
      await redisSet('sr:orders:1', { orders: ['ord1'] }, 3600);
      await redisSet('sr:statement:1', { items: [] }, 3600);
      await redisSet('sr:cust:list:1', { customers: [] }, 3600);

      await invalidateShiprocketAccountsCache();

      const acc = await redisGet('sr:acc:list');
      const orders = await redisGet('sr:orders:1');
      const stmt = await redisGet('sr:statement:1');
      const cust = await redisGet('sr:cust:list:1');

      assert.strictEqual(acc, null);
      assert.strictEqual(orders, null);
      assert.strictEqual(stmt, null);
      // Customer cache should remain intact
      assert.notStrictEqual(cust, null);
    });

    it('invalidates orders and statements on order creation', async () => {
      await redisSet('sr:orders:page1', { orders: [] }, 3600);
      await redisSet('sr:statement:page1', { items: [] }, 3600);

      await invalidateShiprocketOrdersCache();

      const orders = await redisGet('sr:orders:page1');
      const stmt = await redisGet('sr:statement:page1');

      assert.strictEqual(orders, null);
      assert.strictEqual(stmt, null);
    });

    it('invalidates customer cache on customer updates', async () => {
      await redisSet('sr:cust:list:1:25::updated_at:DESC', { customers: ['cust1'] }, 3600);
      await redisSet('sr:acc:list', { accounts: ['acc1'] }, 3600);

      await invalidateShiprocketCustomersCache();

      const cust = await redisGet('sr:cust:list:1:25::updated_at:DESC');
      const acc = await redisGet('sr:acc:list');

      assert.strictEqual(cust, null);
      assert.notStrictEqual(acc, null);
    });

    it('memoryDelPattern correctly purges matching wildcards in memory store', () => {
      memorySet('test:prefix:one', 'value1', 3600);
      memorySet('test:prefix:two', 'value2', 3600);
      memorySet('other:prefix:three', 'value3', 3600);

      memoryDelPattern('test:prefix:*');

      assert.strictEqual(memoryGet('test:prefix:one'), null);
      assert.strictEqual(memoryGet('test:prefix:two'), null);
      assert.strictEqual(memoryGet('other:prefix:three'), 'value3');
    });
  });
});

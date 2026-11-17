import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorizedUser } from '../userUtils';
test('isAuthorizedUser returns false when no token is provided', async () => {
  assert.equal(await isAuthorizedUser(null), false);
  assert.equal(await isAuthorizedUser(undefined), false);
  assert.equal(await isAuthorizedUser(''), false);
  assert.equal(await isAuthorizedUser('   '), false);
});
test('isAuthorizedUser authorizes valid CRON_SECRET with or without Bearer prefix', async () => {
  const originalCron = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'super-secret-cron-token-12345';
  try {
    // With Bearer prefix
    assert.equal(await isAuthorizedUser('Bearer super-secret-cron-token-12345'), true);
    // Raw token without Bearer prefix
    assert.equal(await isAuthorizedUser('super-secret-cron-token-12345'), true);
    // Invalid token
    assert.equal(await isAuthorizedUser('Bearer invalid-token'), false);
    assert.equal(await isAuthorizedUser('wrong-token'), false);
  } finally {
    if (originalCron !== undefined) {
      process.env.CRON_SECRET = originalCron;
    } else {
      delete process.env.CRON_SECRET;
    }
  }
});
test('isAuthorizedUser authorizes valid ADMIN_SYNC_TOKEN with or without Bearer prefix', async () => {
  const originalAdmin = process.env.ADMIN_SYNC_TOKEN;
  process.env.ADMIN_SYNC_TOKEN = 'DBC2EC7220D2421C8E8891709BEDEDAF';
  try {
    // With Bearer prefix
    assert.equal(await isAuthorizedUser('Bearer DBC2EC7220D2421C8E8891709BEDEDAF'), true);
    // Raw token
    assert.equal(await isAuthorizedUser('DBC2EC7220D2421C8E8891709BEDEDAF'), true);
    // Invalid token
    assert.equal(await isAuthorizedUser('DBC2EC7220D2421C8E8891709BEDEDAX'), false);
  } finally {
    if (originalAdmin !== undefined) {
      process.env.ADMIN_SYNC_TOKEN = originalAdmin;
    } else {
      delete process.env.ADMIN_SYNC_TOKEN;
    }
  }
});
test('isAuthorizedUser checks DB session role when tokens do not match static secrets', async () => {
  const mockSql = (async () => {
    return [
      {
        id: 'user_123',
        email: 'admin@example.com',
        role: 'admin',
      },
    ];
  }) as unknown as Parameters<typeof isAuthorizedUser>[1];
  const result = await isAuthorizedUser('Bearer valid-session-token', mockSql);
  assert.equal(result, true);
  const mockNonAdminSql = (async () => {
    return [
      {
        id: 'user_456',
        email: 'regular@example.com',
        role: 'user',
      },
    ];
  }) as unknown as Parameters<typeof isAuthorizedUser>[1];
  const nonAdminResult = await isAuthorizedUser('Bearer non-admin-token', mockNonAdminSql);
  assert.equal(nonAdminResult, false);
});

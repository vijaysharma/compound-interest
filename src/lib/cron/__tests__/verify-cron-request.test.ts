import test from 'node:test';
import assert from 'node:assert/strict';
import { isCronAuthorised } from '../verify-cron-request';
test('isCronAuthorised validates cron requests correctly', async () => {
  const originalSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'test_secret_123';
  try {
    // 1. Missing header
    const reqNoHeader = new Request('https://example.com/api/cron/sync');
    assert.equal(isCronAuthorised(reqNoHeader), false);
    // 2. Invalid header token
    const reqInvalid = new Request('https://example.com/api/cron/sync', {
      headers: { Authorization: 'Bearer wrong_secret' },
    });
    assert.equal(isCronAuthorised(reqInvalid), false);
    // 3. Query parameter key should NOT authorize (prevent URL parameter token leak)
    const reqQueryParam = new Request('https://example.com/api/cron/sync?key=test_secret_123');
    assert.equal(isCronAuthorised(reqQueryParam), false);
    // 4. Valid Authorization header
    const reqValid = new Request('https://example.com/api/cron/sync', {
      headers: { Authorization: 'Bearer test_secret_123' },
    });
    assert.equal(isCronAuthorised(reqValid), true);
  } finally {
    if (originalSecret !== undefined) process.env.CRON_SECRET = originalSecret;
    else delete process.env.CRON_SECRET;
  }
});

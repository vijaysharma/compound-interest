import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyGoogleToken } from '../authHelpers';

test('verifyGoogleToken rejects tokens with mismatched audience (aud)', async () => {
  const originalFetch = globalThis.fetch;
  const originalAud = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = 'expected-app-client-id.apps.googleusercontent.com';

  try {
    globalThis.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          aud: 'attacker-client-id.apps.googleusercontent.com',
          email: 'victim@example.com',
          email_verified: 'true',
          sub: '123456789',
        }),
      } as unknown as Response;
    };

    const result = await verifyGoogleToken('attacker-id-token');
    assert.equal(result, null, 'Should reject token with foreign audience');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAud !== undefined) {
      process.env.GOOGLE_CLIENT_ID = originalAud;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
  }
});

test('verifyGoogleToken accepts tokens when audience matches configured client ID', async () => {
  const originalFetch = globalThis.fetch;
  const originalAud = process.env.GOOGLE_CLIENT_ID;
  const expectedId = 'valid-app-client-id.apps.googleusercontent.com';
  process.env.GOOGLE_CLIENT_ID = expectedId;

  try {
    globalThis.fetch = async () => {
      return {
        ok: true,
        json: async () => ({
          aud: expectedId,
          email: 'user@example.com',
          email_verified: 'true',
          sub: '987654321',
        }),
      } as unknown as Response;
    };

    const result = await verifyGoogleToken('valid-id-token');
    assert.ok(result);
    assert.equal(result.email, 'user@example.com');
    assert.equal(result.aud, expectedId);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalAud !== undefined) {
      process.env.GOOGLE_CLIENT_ID = originalAud;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
  }
});

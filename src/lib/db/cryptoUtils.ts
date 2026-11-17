export async function hashPassword(
  password: string,
  saltHex?: string
): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hash = Array.from(new Uint8Array(derivedBits))
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltOut = Array.from(salt)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
  return { hash, salt: saltOut };
}
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
export async function verifyPassword(
  password: string,
  hash: string,
  saltHex: string
): Promise<boolean> {
  const computed = await hashPassword(password, saltHex);
  return timingSafeEqual(computed.hash, hash);
}

const ENCRYPTION_SECRET =
  process.env.ENCRYPTION_SECRET ||
  process.env.ADMIN_SYNC_TOKEN ||
  process.env.CRON_SECRET ||
  'rupee-calculator-fallback-secret-2026';

/**
 * Encrypts a sensitive secret string at rest using AES-256-GCM.
 * Prepends 'enc:v1:' to identify encrypted data and enable transparent migration.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  if (!plaintext || plaintext.startsWith('enc:v1:')) return plaintext;
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(plaintext)
    );
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const cipherHex = Array.from(new Uint8Array(encrypted))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `enc:v1:${ivHex}:${cipherHex}`;
  } catch {
    return plaintext;
  }
}

/**
 * Decrypts a sensitive secret string at rest if encrypted with 'enc:v1:'.
 * Gracefully returns unencrypted plaintext for legacy backwards compatibility.
 */
export async function decryptSecret(ciphertext: string): Promise<string> {
  if (!ciphertext || !ciphertext.startsWith('enc:v1:')) return ciphertext;
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 4) return ciphertext;
    const ivHex = parts[2];
    const cipherHex = parts[3];
    const enc = new TextEncoder();
    const keyData = enc.encode(ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const iv = Uint8Array.from(ivHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    const cipherBytes = Uint8Array.from(cipherHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      cipherBytes
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return ciphertext;
  }
}

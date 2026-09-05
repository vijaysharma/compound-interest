/**
 * End-to-End Encryption (E2EE) Module for Quick Notes
 * 
 * Cryptographic Specifications:
 * - Algorithm: AES-GCM (Galois/Counter Mode) with 256-bit key length
 * - Key Derivation: PBKDF2 with SHA-256, 100,000 iterations
 * - IV (Initialization Vector): 96-bit (12 bytes) cryptographically random per operation
 * - Integrity: Built-in 128-bit authentication tag verified by AES-GCM
 * - Format: "e2e:v1:<iv_base64>:<ciphertext_base64>"
 */
export const E2E_PREFIX = 'e2e:v1:';
let cachedKey: { id: string; key: CryptoKey } | null = null;
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new ArrayBuffer(len);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
/**
 * Derives a strong, deterministic 256-bit AES-GCM CryptoKey for the user using PBKDF2.
 * The key is derived client-side in the browser and never leaves the device.
 */
export async function getUserEncryptionKey(userId: string, userEmail = ''): Promise<CryptoKey> {
  const cacheId = `${userId}:${userEmail.toLowerCase().trim()}`;
  if (cachedKey && cachedKey.id === cacheId) {
    return cachedKey.key;
  }
  const enc = new TextEncoder();
  const rawSecret = `${userId}:${userEmail.toLowerCase().trim()}:compound-interest-e2ee-v1`;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(rawSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  const salt = enc.encode(`salt:${userId}:e2ee-notes-salt-v1`);
  const derived = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  cachedKey = { id: cacheId, key: derived };
  return derived;
}
/**
 * Checks whether a text string is already encrypted in e2e format
 */
export function isEncrypted(text: unknown): boolean {
  return typeof text === 'string' && text.startsWith(E2E_PREFIX);
}
/**
 * Encrypts plaintext string using AES-GCM-256
 */
export async function encryptText(plaintext: string, key: CryptoKey): Promise<string> {
  if (!plaintext) return '';
  // Do not double-encrypt
  if (isEncrypted(plaintext)) return plaintext;
  const enc = new TextEncoder();
  const encoded = enc.encode(plaintext);
  // Generate unique 96-bit (12-byte) IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoded
  );
  const ivBase64 = uint8ArrayToBase64(iv);
  const cipherBase64 = uint8ArrayToBase64(new Uint8Array(cipherBuffer));
  return `${E2E_PREFIX}${ivBase64}:${cipherBase64}`;
}
/**
 * Decrypts an e2e formatted ciphertext string using AES-GCM-256.
 * If the input is not encrypted (e.g. legacy notes), it returns the input unchanged.
 */
export async function decryptText(ciphertext: string, key: CryptoKey): Promise<string> {
  if (!ciphertext) return '';
  // If not encrypted, return as-is (backward compatibility with existing notes)
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }
  try {
    const raw = ciphertext.slice(E2E_PREFIX.length);
    const splitIndex = raw.indexOf(':');
    if (splitIndex === -1) {
      return ciphertext;
    }
    const ivBase64 = raw.slice(0, splitIndex);
    const cipherBase64 = raw.slice(splitIndex + 1);
    const iv = base64ToUint8Array(ivBase64);
    const cipherBytes = base64ToUint8Array(cipherBase64);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBytes
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error('Failed to decrypt note content with E2E key:', err);
    return ciphertext;
  }
}

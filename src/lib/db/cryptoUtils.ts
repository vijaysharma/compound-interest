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

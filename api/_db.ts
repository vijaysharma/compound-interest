import { neon } from '@neondatabase/serverless';
declare const process: { env: Record<string, string | undefined> };
export const MF_URL = 'https://api.mfapi.in/mf';
export const IMF_URL = 'https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD';
export const FREE_USAGE_LIMIT = 15;
export type Query = ReturnType<typeof neon>;
export interface DbUser {
  id: string;
  email: string;
  password_hash?: string | null;
  password_salt?: string | null;
  name: string | null;
  picture: string | null;
  provider: string;
  provider_id: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface PaymentSettings {
  id: string;
  title: string;
  upi_id: string;
  upi_qr_code_url: string;
  amount: number;
  instructions: string;
  updated_at: string;
}
export interface PaymentSubmission {
  id: string;
  user_id: string;
  user_email: string;
  utr_ref: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
let tablesReady: Promise<void> | null = null;
export function getDb(): Query {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
}
export function isEmailAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.VITE_ALLOWED_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
export function isUserBlocked(user: DbUser): boolean {
  if (user.role === 'admin') return false;
  if (user.subscription_status === 'active') {
    if (!user.subscription_expires_at) return false;
    const expiry = new Date(user.subscription_expires_at).getTime();
    if (expiry > Date.now()) return false;
  }
  return (user.api_usage_count ?? 0) >= FREE_USAGE_LIMIT;
}
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
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const saltOut = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { hash, salt: saltOut };
}
export async function verifyPassword(
  password: string,
  hash: string,
  saltHex: string
): Promise<boolean> {
  const computed = await hashPassword(password, saltHex);
  return computed.hash === hash;
}
export async function ensureTables(sql: Query) {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          password_salt TEXT,
          name TEXT,
          picture TEXT,
          provider TEXT NOT NULL DEFAULT 'google',
          provider_id TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          api_usage_count INT NOT NULL DEFAULT 0,
          subscription_status TEXT NOT NULL DEFAULT 'free_trial',
          subscription_expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_usage_count INT NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free_trial'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ`;
      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS payment_settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          title TEXT NOT NULL DEFAULT 'Rupee Calculator Pro Subscription',
          upi_id TEXT NOT NULL DEFAULT '',
          upi_qr_code_url TEXT NOT NULL DEFAULT '',
          amount NUMERIC NOT NULL DEFAULT 19,
          instructions TEXT NOT NULL DEFAULT 'Pay ₹19 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO payment_settings (id, title, upi_id, upi_qr_code_url, amount, instructions)
        VALUES (
          'default',
          'Rupee Calculator Pro Subscription',
          '',
          '',
          19,
          'Pay ₹19 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
        )
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS payment_submissions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_email TEXT NOT NULL,
          utr_ref TEXT NOT NULL,
          amount NUMERIC NOT NULL DEFAULT 19,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS mutual_fund_schemes (
          scheme_code TEXT PRIMARY KEY,
          scheme_name TEXT NOT NULL,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS mutual_fund_nav (
          scheme_code TEXT PRIMARY KEY REFERENCES mutual_fund_schemes(scheme_code) ON DELETE CASCADE,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS inflation_sources (
          source TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS users_email_idx
        ON users (email)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
        ON user_sessions (user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS payment_submissions_user_id_idx
        ON payment_submissions (user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx
        ON mutual_fund_schemes (scheme_name)
      `;
    })();
  }
  try {
    await tablesReady;
  } catch (error) {
    tablesReady = null;
    throw error;
  }
}
export async function getUserFromRequest(request: Request, sql: Query): Promise<DbUser | null> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const rows = (await sql`
    SELECT
      u.id,
      u.email,
      u.password_hash,
      u.password_salt,
      u.name,
      u.picture,
      u.provider,
      u.provider_id,
      u.role,
      u.api_usage_count,
      u.subscription_status,
      u.subscription_expires_at,
      u.created_at,
      u.updated_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `) as DbUser[];
  return rows.length > 0 ? rows[0] : null;
}
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
export async function isAuthorized(request: Request, sql?: Query): Promise<boolean> {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  const supplied =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    request.headers.get('x-admin-token');
  if (expected && supplied === expected) return true;
  if (sql && supplied) {
    const user = await getUserFromRequest(request, sql);
    if (user && user.role === 'admin') return true;
  }
  return false;
}
export function unauthorized(): Response {
  return jsonResponse({ error: 'Unauthorized: Admin access required' }, 401);
}

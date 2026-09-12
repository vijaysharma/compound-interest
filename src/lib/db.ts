import { neon } from '@neondatabase/serverless';
export const MF_URL = 'https://api.mfapi.in/mf';
export const IMF_URL = 'https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD';
export const FREE_USAGE_LIMIT = 15;
export const TRIAL_DURATION_HOURS = 48;
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
  free_limit?: number;
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at: string | null;
  subscription_plan?: string | null;
  first_used_at?: string | null;
  trial_expires_at?: string | null;
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
export interface AISettings {
  id: string;
  enabled: boolean;
  provider: string;
  model: string;
  api_key: string;
  system_prompt: string;
  updated_at: string;
}
export function getDb(): Query {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
}
export function isEmailAdmin(email: string): boolean {
  const adminEmails = (
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL ||
    process.env.VITE_ALLOWED_EMAIL ||
    ''
  )
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
export function isUserBlocked(user: DbUser, checkApiQuota = false): boolean {
  if (user.role === 'admin') return false;
  if (user.subscription_status === 'active') {
    if (!user.subscription_expires_at) return false;
    const expiry = new Date(user.subscription_expires_at).getTime();
    if (expiry > Date.now()) return false;
    return true;
  }
  // Calculators Suite tools (offline/math) remain free and are not hard-blocked
  if (!checkApiQuota) {
    return false;
  }
  // For live calculation tools: trial expires whichever is earlier (48h or 15 runs)
  if (user.trial_expires_at) {
    const trialExpiry = new Date(user.trial_expires_at).getTime();
    if (Date.now() > trialExpiry) {
      return true;
    }
  }
  const limit = user.free_limit ?? FREE_USAGE_LIMIT;
  if ((user.api_usage_count ?? 0) >= limit) {
    return true;
  }
  return false;
}
export function isPaidUser(user: DbUser): boolean {
  if (user.role === 'admin') return true;
  if (user.subscription_status === 'active') {
    if (!user.subscription_expires_at) return true;
    const expiry = new Date(user.subscription_expires_at).getTime();
    return expiry > Date.now();
  }
  return false;
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
let tablesReady: Promise<void> | null = null;
let tablesInitialized = false;
/**
 * Bump this whenever a CREATE/ALTER is added to ensureTables.
 *
 * The previous guard probed for one specific column (admin_notes.blob_url) and
 * treated its presence as "schema is current". Any database created before a
 * later column was added therefore skipped the whole migration block forever:
 * adding users.subscription_plan to getUserFromToken's SELECT then made every
 * authenticated request fail with `column u.subscription_plan does not exist`.
 * A recorded version cannot drift like that.
 */
const SCHEMA_VERSION = 3;
async function readSchemaVersion(sql: Query): Promise<number> {
  try {
    const rows = (await sql`SELECT version FROM schema_meta WHERE id = 1`) as {
      version?: number | string | null;
    }[];
    if (rows.length === 0) return 0;
    const parsed = Number(rows[0].version);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    // No schema_meta table: database predates versioning, so migrate.
    return 0;
  }
}
export async function ensureTables(sql: Query) {
  if (tablesInitialized) return;
  if (!tablesReady) {
    tablesReady = (async () => {
      if ((await readSchemaVersion(sql)) >= SCHEMA_VERSION) {
        tablesInitialized = true;
        return;
      }
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
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS free_limit INT NOT NULL DEFAULT 15`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free_trial'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'pro_monthly'`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_used_at TIMESTAMPTZ`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ`;
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
          amount NUMERIC NOT NULL DEFAULT 54,
          instructions TEXT NOT NULL DEFAULT 'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.',
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
          54,
          'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
        )
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`UPDATE payment_settings SET amount = 54, instructions = 'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.' WHERE id = 'default' AND amount IN (19, 29)`;
      await sql`
        CREATE TABLE IF NOT EXISTS payment_submissions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_email TEXT NOT NULL,
          utr_ref TEXT NOT NULL,
          amount NUMERIC NOT NULL DEFAULT 54,
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
        CREATE TABLE IF NOT EXISTS admin_notes (
          id TEXT PRIMARY KEY,
          title TEXT,
          content TEXT NOT NULL,
          folder TEXT NOT NULL DEFAULT 'Notes',
          is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          lock_password_hash TEXT,
          is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
          tags TEXT NOT NULL DEFAULT '[]',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS title TEXT`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'Notes'`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS lock_password_hash TEXT`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN NOT NULL DEFAULT FALSE`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '[]'`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS user_id TEXT`;
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS blob_url TEXT`;
      // Tombstone marker. A deleted note keeps its row so that a stale client
      // replaying an edit cannot resurrect it through the upsert path.
      await sql`ALTER TABLE admin_notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`;
      await sql`
        CREATE TABLE IF NOT EXISTS ai_settings (
          id TEXT PRIMARY KEY DEFAULT 'default',
          enabled BOOLEAN NOT NULL DEFAULT true,
          provider TEXT NOT NULL DEFAULT 'gemini',
          model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
          api_key TEXT NOT NULL DEFAULT '',
          system_prompt TEXT NOT NULL DEFAULT 'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO ai_settings (id, enabled, provider, model, api_key, system_prompt)
        VALUES (
          'default',
          true,
          'gemini',
          'gemini-2.5-flash',
          '',
          'You are an expert Indian Chartered Accountant and Tax Planner. Analyze the user financial numbers, income sources, deductions, capital gains, and dual regime comparison. Provide actionable, structured, prioritized recommendations to legally minimize Indian income tax, optimize Section 80C/80CCD/80D, capital gains harvesting, and recommend the optimal regime.'
        )
        ON CONFLICT (id) DO NOTHING
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS admin_notes_created_at_idx
        ON admin_notes (created_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS admin_notes_updated_at_idx
        ON admin_notes (updated_at DESC)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS admin_notes_user_id_idx
        ON admin_notes (user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS admin_notes_deleted_at_idx
        ON admin_notes (deleted_at)
      `;
      // Recorded last, so a migration that fails part way through is retried on
      // the next call rather than being marked complete.
      await sql`
        CREATE TABLE IF NOT EXISTS schema_meta (
          id INT PRIMARY KEY,
          version INT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO schema_meta (id, version, updated_at)
        VALUES (1, ${SCHEMA_VERSION}, NOW())
        ON CONFLICT (id) DO UPDATE SET version = ${SCHEMA_VERSION}, updated_at = NOW()
      `;
      tablesInitialized = true;
    })();
  }
  try {
    await tablesReady;
  } catch (error) {
    tablesReady = null;
    throw error;
  }
}
export async function getUserFromToken(token: string | null | undefined, sql: Query): Promise<DbUser | null> {
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return null;
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
      COALESCE(u.free_limit, 15) AS free_limit,
      u.subscription_status,
      u.subscription_expires_at,
      u.subscription_plan,
      u.first_used_at,
      u.trial_expires_at,
      u.created_at,
      u.updated_at
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${cleanToken} AND s.expires_at > NOW()
  `) as DbUser[];
  return rows.length > 0 ? rows[0] : null;
}
export async function isAuthorizedUser(token: string | null | undefined, sql?: Query): Promise<boolean> {
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  const expectedAdminToken = process.env.ADMIN_SYNC_TOKEN;
  if (cleanToken && expectedAdminToken && timingSafeEqual(cleanToken, expectedAdminToken)) {
    return true;
  }
  if (sql && cleanToken) {
    const user = await getUserFromToken(cleanToken, sql);
    if (user && user.role === 'admin') return true;
  }
  return false;
}

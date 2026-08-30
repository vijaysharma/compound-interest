import { neon } from '@neondatabase/serverless';
declare const process: { env: Record<string, string | undefined> };
export const MF_URL = 'https://api.mfapi.in/mf';
export const IMF_URL = 'https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD';
export type Query = ReturnType<typeof neon>;
export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string;
  provider_id: string | null;
  role: 'admin' | 'user';
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
export async function ensureTables(sql: Query) {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          picture TEXT,
          provider TEXT NOT NULL DEFAULT 'google',
          provider_id TEXT,
          role TEXT NOT NULL DEFAULT 'user',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    SELECT u.id, u.email, u.name, u.picture, u.provider, u.provider_id, u.role, u.created_at, u.updated_at
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

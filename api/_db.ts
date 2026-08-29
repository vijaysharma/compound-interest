import { neon } from '@neondatabase/serverless';
export const MF_URL = 'https://api.mfapi.in/mf';
export const IMF_URL = 'https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD';
type Query = ReturnType<typeof neon>;
export function getDb(): Query {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(databaseUrl);
}
export async function ensureTables(sql: Query) {
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
}
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
export function isAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_SYNC_TOKEN;
  if (!expected) return false;
  const supplied =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    request.headers.get('x-admin-token');
  return supplied === expected;
}
export function unauthorized(): Response {
  return jsonResponse({ error: 'Invalid admin token' }, 401);
}

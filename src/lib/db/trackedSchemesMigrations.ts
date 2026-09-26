import type { Query } from './types';
export async function applyTrackedSchemesMigrations(sql: Query): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS tracked_schemes (
      scheme_code VARCHAR(20) PRIMARY KEY,
      scheme_name TEXT NOT NULL,
      amfi_name TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS tracked_schemes_active_idx ON tracked_schemes (is_active)`;
  await sql`DROP VIEW IF EXISTS mutual_fund_daily_nav CASCADE`;
  await sql`DROP TABLE IF EXISTS mutual_fund_daily_nav CASCADE`;
  const cols = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'mutual_fund_nav' AND column_name = 'date'
  `) as Array<{ column_name?: string }>;
  if (cols.length === 0) {
    await sql`DROP TABLE IF EXISTS mutual_fund_nav CASCADE`;
    await sql`
      CREATE TABLE mutual_fund_nav (
        scheme_code VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        nav NUMERIC NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (scheme_code, date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS mutual_fund_nav_date_idx ON mutual_fund_nav (date)`;
    await sql`CREATE INDEX IF NOT EXISTS mutual_fund_nav_scheme_code_idx ON mutual_fund_nav (scheme_code)`;
  }
}

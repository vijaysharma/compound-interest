import { Query } from './types';
export async function applyDataMigrations(sql: Query, schemaVersion: number): Promise<void> {
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
  await sql`CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx ON mutual_fund_schemes (scheme_name)`;
  await sql`CREATE INDEX IF NOT EXISTS mutual_fund_nav_updated_at_idx ON mutual_fund_nav (updated_at)`;
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
  await sql`CREATE INDEX IF NOT EXISTS admin_notes_created_at_idx ON admin_notes (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS admin_notes_updated_at_idx ON admin_notes (updated_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS admin_notes_user_id_idx ON admin_notes (user_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS schema_meta (
      id INT PRIMARY KEY,
      version INT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO schema_meta (id, version, updated_at)
    VALUES (1, ${schemaVersion}, NOW())
    ON CONFLICT (id) DO UPDATE SET version = ${schemaVersion}, updated_at = NOW()
  `;
}

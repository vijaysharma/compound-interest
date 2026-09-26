import type { Query } from './types';
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
  /*
   * Saved strategies from /strategy-calculator, one row per strategy.
   *
   * A row each rather than one library blob per user, so two devices editing
   * different strategies both keep their work — see `strategyMerge` for the
   * resolution rules. `updated_at` is the resolution key and is millisecond
   * precision on purpose: the library's own `savedAt` is a calendar date and
   * cannot order two edits made on the same day, which is most real conflicts.
   *
   * `deleted_at` makes a row a tombstone rather than removing it. Hard deletes
   * cannot survive a merge: one device removes a strategy, another still holds
   * its copy, and the union brings it back as though the delete never happened.
   * Tombstones are cleared once every device has converged.
   */
  await sql`
    CREATE TABLE IF NOT EXISTS user_strategies (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      config JSONB NOT NULL,
      saved_at DATE,
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      PRIMARY KEY (user_id, id)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS user_strategies_user_idx
      ON user_strategies (user_id, updated_at DESC)
  `;
  await sql`CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx ON mutual_fund_schemes (scheme_name)`;
  await sql`CREATE INDEX IF NOT EXISTS mutual_fund_nav_updated_at_idx ON mutual_fund_nav (updated_at)`;
  /*
   * The newest NAV date inside `payload`, denormalised out of the blob.
   *
   * Deciding whether a stored row is fresh previously meant parsing the whole
   * history and scanning it for a maximum — ~5,000 rows for a twenty-year
   * scheme, on a request that then usually discarded the result. The date is
   * the only part of the payload that decision needs, so it is kept alongside
   * it. Also the column a future range-query schema would be keyed on.
   *
   * Nullable on purpose: existing rows are backfilled lazily by the next write
   * rather than by a migration that would have to parse every blob in one
   * transaction. A NULL reads as "unknown", which falls back to parsing the
   * payload exactly as before, so the column is safe the moment it is added and
   * self-heals as schemes are refreshed.
   */
  await sql`ALTER TABLE mutual_fund_nav ADD COLUMN IF NOT EXISTS latest_nav_date DATE`;
  await sql`CREATE INDEX IF NOT EXISTS mutual_fund_nav_latest_date_idx ON mutual_fund_nav (latest_nav_date)`;
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

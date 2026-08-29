CREATE TABLE IF NOT EXISTS mutual_fund_schemes (
  scheme_code TEXT PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mutual_fund_nav (
  scheme_code TEXT PRIMARY KEY REFERENCES mutual_fund_schemes(scheme_code) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inflation_sources (
  source TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx
  ON mutual_fund_schemes (scheme_name);
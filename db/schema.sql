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
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS users_email_idx
  ON users (email);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
  ON user_sessions (user_id);

CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx
  ON mutual_fund_schemes (scheme_name);
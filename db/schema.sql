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
);

CREATE TABLE IF NOT EXISTS user_sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  title TEXT NOT NULL DEFAULT 'Rupee Calculator Pro Subscription',
  upi_id TEXT NOT NULL DEFAULT '',
  upi_qr_code_url TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 19,
  instructions TEXT NOT NULL DEFAULT 'Pay ₹19 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  utr_ref TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 19,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

CREATE INDEX IF NOT EXISTS payment_submissions_user_id_idx
  ON payment_submissions (user_id);

CREATE INDEX IF NOT EXISTS mutual_fund_schemes_name_idx
  ON mutual_fund_schemes (scheme_name);
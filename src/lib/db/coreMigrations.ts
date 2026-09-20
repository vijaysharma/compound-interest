import { Query } from './types';
export async function applyCoreMigrations(sql: Query): Promise<void> {
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
  await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`;
  await sql`CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS payment_submissions_user_id_idx ON payment_submissions (user_id)`;
}

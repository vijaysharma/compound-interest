BEGIN;
ALTER TABLE mutual_fund_nav
  DROP CONSTRAINT IF EXISTS fk_mutual_fund_nav_schemes CASCADE;
ALTER TABLE mutual_fund_schemes
  DROP CONSTRAINT IF EXISTS mutual_fund_schemes_pkey CASCADE;
ALTER TABLE mutual_fund_schemes
  ALTER COLUMN scheme_code TYPE INTEGER USING scheme_code::integer;
ALTER TABLE mutual_fund_nav
  ALTER COLUMN scheme_code TYPE INTEGER USING scheme_code::integer;
ALTER TABLE mutual_fund_schemes
  ADD CONSTRAINT mutual_fund_schemes_pkey PRIMARY KEY (scheme_code);
ALTER TABLE mutual_fund_nav
  ADD CONSTRAINT fk_mutual_fund_nav_schemes
  FOREIGN KEY (scheme_code) REFERENCES mutual_fund_schemes(scheme_code) ON DELETE CASCADE;
COMMIT;
VACUUM FULL mutual_fund_schemes;
VACUUM FULL mutual_fund_nav;
ANALYZE mutual_fund_schemes;
ANALYZE mutual_fund_nav;

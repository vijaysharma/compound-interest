import { getDb } from '../src/lib/db';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
async function run() {
  const sql = getDb();
  console.log('Running scheme_code INT4 migration...');
  await sql`ALTER TABLE mutual_fund_nav DROP CONSTRAINT IF EXISTS fk_mutual_fund_nav_schemes CASCADE;`;
  console.log('1. Dropped fk_mutual_fund_nav_schemes constraint');
  await sql`ALTER TABLE mutual_fund_schemes DROP CONSTRAINT IF EXISTS mutual_fund_schemes_pkey CASCADE;`;
  console.log('2. Dropped mutual_fund_schemes_pkey constraint');
  await sql`ALTER TABLE mutual_fund_schemes ALTER COLUMN scheme_code TYPE INTEGER USING scheme_code::integer;`;
  console.log('3. Converted mutual_fund_schemes.scheme_code to INTEGER');
  await sql`ALTER TABLE mutual_fund_nav ALTER COLUMN scheme_code TYPE INTEGER USING scheme_code::integer;`;
  console.log('4. Converted mutual_fund_nav.scheme_code to INTEGER');
  await sql`ALTER TABLE mutual_fund_schemes ADD CONSTRAINT mutual_fund_schemes_pkey PRIMARY KEY (scheme_code);`;
  console.log('5. Added mutual_fund_schemes_pkey constraint');
  await sql`ALTER TABLE mutual_fund_nav ADD CONSTRAINT fk_mutual_fund_nav_schemes FOREIGN KEY (scheme_code) REFERENCES mutual_fund_schemes(scheme_code) ON DELETE CASCADE;`;
  console.log('6. Re-added foreign key constraint');
  try {
    await sql`ANALYZE mutual_fund_schemes;`;
    await sql`ANALYZE mutual_fund_nav;`;
    console.log('7. Analyzed tables');
  } catch (err) {
    console.warn('Analyze warning:', err);
  }
  console.log('Migration complete successfully!');
}
run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

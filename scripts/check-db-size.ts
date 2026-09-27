import { getDb } from '../src/lib/db';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
async function checkSize() {
  const sql = getDb();
  const colTypes = await sql`
    SELECT table_name, column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name IN ('mutual_fund_schemes', 'mutual_fund_nav') 
      AND column_name = 'scheme_code';
  `;
  console.log('COLUMN_TYPES:', JSON.stringify(colTypes));
  const counts = await sql`
    SELECT 
      (SELECT count(*) FROM mutual_fund_schemes) AS schemes_count,
      (SELECT count(*) FROM mutual_fund_nav) AS nav_count;
  `;
  console.log('COUNTS:', JSON.stringify(counts));
  const tableSizes = await sql`
    SELECT 
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_indexes_size(relid)) AS indexes_size,
      pg_total_relation_size(relid) AS total_bytes,
      pg_relation_size(relid) AS table_bytes,
      pg_indexes_size(relid) AS indexes_bytes
    FROM pg_catalog.pg_statio_user_tables
    WHERE relname IN ('mutual_fund_schemes', 'mutual_fund_nav')
    ORDER BY pg_total_relation_size(relid) DESC;
  `;
  console.log('TABLE_SIZES:', JSON.stringify(tableSizes));
}
checkSize().catch((err) => {
  console.error('Error checking size:', err);
  process.exit(1);
});

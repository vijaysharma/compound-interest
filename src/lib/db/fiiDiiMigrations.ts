import type { Query } from './types';
export async function applyFiiDiiMigrations(sql: Query): Promise<void> {
  // 1. Daily Institutional Flows
  await sql`
    CREATE TABLE IF NOT EXISTS institutional_flows (
      trade_date DATE PRIMARY KEY,
      fii_buy_crores NUMERIC(12, 2) NOT NULL,
      fii_sell_crores NUMERIC(12, 2) NOT NULL,
      fii_net_crores NUMERIC(12, 2) GENERATED ALWAYS AS (fii_buy_crores - fii_sell_crores) STORED,
      dii_buy_crores NUMERIC(12, 2) NOT NULL,
      dii_sell_crores NUMERIC(12, 2) NOT NULL,
      dii_net_crores NUMERIC(12, 2) GENERATED ALWAYS AS (dii_buy_crores - dii_sell_crores) STORED
    )
  `;
  // 2. Stock Index Closing Prices
  await sql`
    CREATE TABLE IF NOT EXISTS index_prices (
      trade_date DATE NOT NULL,
      index_name VARCHAR(10) NOT NULL CHECK (index_name IN ('NIFTY50', 'SENSEX')),
      close_price NUMERIC(10, 2) NOT NULL,
      PRIMARY KEY (trade_date, index_name)
    )
  `;
  // 3. Macroeconomic Factors (Inflation CPI & PPP)
  await sql`
    CREATE TABLE IF NOT EXISTS macro_indicators (
      record_date DATE PRIMARY KEY,
      cpi_index NUMERIC(8, 2) NOT NULL,
      ppp_factor NUMERIC(8, 4) NOT NULL
    )
  `;
  // 4. Indexes for fast date-range queries
  await sql`CREATE INDEX IF NOT EXISTS idx_inst_flows_date ON institutional_flows(trade_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_index_prices_date ON index_prices(trade_date DESC, index_name)`;
}

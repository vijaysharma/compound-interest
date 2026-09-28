import type { Query, DbInstitutionalFlow, DbIndexPrice, DbMacroIndicator } from '@/lib/db';
import type { LiveFiiDiiRecord, IndexPricePoint } from './fiiDiiFetcher';
/**
 * Upserts a single daily institutional flow row.
 */
export async function upsertInstitutionalFlow(sql: Query, flow: LiveFiiDiiRecord): Promise<void> {
  await sql`
    INSERT INTO institutional_flows (
      trade_date,
      fii_buy_crores,
      fii_sell_crores,
      dii_buy_crores,
      dii_sell_crores
    )
    VALUES (
      ${flow.tradeDate},
      ${flow.fiiBuyCrores},
      ${flow.fiiSellCrores},
      ${flow.diiBuyCrores},
      ${flow.diiSellCrores}
    )
    ON CONFLICT (trade_date) DO UPDATE SET
      fii_buy_crores = EXCLUDED.fii_buy_crores,
      fii_sell_crores = EXCLUDED.fii_sell_crores,
      dii_buy_crores = EXCLUDED.dii_buy_crores,
      dii_sell_crores = EXCLUDED.dii_sell_crores
  `;
}
/**
 * High-performance batch upsert for institutional flows using jsonb_to_recordset.
 */
export async function upsertInstitutionalFlowsBatch(
  sql: Query,
  flows: LiveFiiDiiRecord[],
  batchSize = 1000
): Promise<number> {
  if (flows.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < flows.length; i += batchSize) {
    const chunk = flows.slice(i, i + batchSize).map((f) => ({
      trade_date: f.tradeDate,
      fii_buy: f.fiiBuyCrores,
      fii_sell: f.fiiSellCrores,
      dii_buy: f.diiBuyCrores,
      dii_sell: f.diiSellCrores,
    }));
    await sql`
      INSERT INTO institutional_flows (
        trade_date,
        fii_buy_crores,
        fii_sell_crores,
        dii_buy_crores,
        dii_sell_crores
      )
      SELECT
        x.trade_date::date,
        x.fii_buy::numeric,
        x.fii_sell::numeric,
        x.dii_buy::numeric,
        x.dii_sell::numeric
      FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb) AS x(
        trade_date TEXT,
        fii_buy NUMERIC,
        fii_sell NUMERIC,
        dii_buy NUMERIC,
        dii_sell NUMERIC
      )
      ON CONFLICT (trade_date) DO UPDATE SET
        fii_buy_crores = EXCLUDED.fii_buy_crores,
        fii_sell_crores = EXCLUDED.fii_sell_crores,
        dii_buy_crores = EXCLUDED.dii_buy_crores,
        dii_sell_crores = EXCLUDED.dii_sell_crores
    `;
    count += chunk.length;
  }
  return count;
}
/**
 * High-performance batch upsert for index prices using jsonb_to_recordset.
 */
export async function upsertIndexPricesBatch(
  sql: Query,
  indexName: 'NIFTY50' | 'SENSEX',
  prices: IndexPricePoint[],
  batchSize = 2000
): Promise<number> {
  if (prices.length === 0) return 0;
  let count = 0;
  for (let i = 0; i < prices.length; i += batchSize) {
    const chunk = prices.slice(i, i + batchSize).map((p) => ({
      trade_date: p.tradeDate,
      index_name: indexName,
      close_price: p.closePrice,
    }));
    await sql`
      INSERT INTO index_prices (trade_date, index_name, close_price)
      SELECT
        x.trade_date::date,
        x.index_name::varchar,
        x.close_price::numeric
      FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb) AS x(
        trade_date TEXT,
        index_name TEXT,
        close_price NUMERIC
      )
      ON CONFLICT (trade_date, index_name) DO UPDATE SET
        close_price = EXCLUDED.close_price
    `;
    count += chunk.length;
  }
  return count;
}
/**
 * High-performance batch upsert for macro indicators using jsonb_to_recordset.
 */
export async function upsertMacroIndicatorsBatch(
  sql: Query,
  indicators: Array<{ recordDate: string; cpiIndex: number; pppFactor: number }>
): Promise<number> {
  if (indicators.length === 0) return 0;
  const chunk = indicators.map((m) => ({
    record_date: m.recordDate,
    cpi_index: m.cpiIndex,
    ppp_factor: m.pppFactor,
  }));
  await sql`
    INSERT INTO macro_indicators (record_date, cpi_index, ppp_factor)
    SELECT
      x.record_date::date,
      x.cpi_index::numeric,
      x.ppp_factor::numeric
    FROM jsonb_to_recordset(${JSON.stringify(chunk)}::jsonb) AS x(
      record_date TEXT,
      cpi_index NUMERIC,
      ppp_factor NUMERIC
    )
    ON CONFLICT (record_date) DO UPDATE SET
      cpi_index = EXCLUDED.cpi_index,
      ppp_factor = EXCLUDED.ppp_factor
  `;
  return chunk.length;
}
/**
 * Fetches institutional flows, index prices, and macro indicators across a date range.
 */
export async function queryFIIDIIRange(
  sql: Query,
  startDate: string,
  endDate?: string
): Promise<{
  flows: DbInstitutionalFlow[];
  nifty: DbIndexPrice[];
  sensex: DbIndexPrice[];
  macros: DbMacroIndicator[];
}> {
  const actualEndDate = endDate || new Date().toISOString().slice(0, 10);
  const flows = (await sql`
    SELECT
      trade_date::text,
      fii_buy_crores,
      fii_sell_crores,
      fii_net_crores,
      dii_buy_crores,
      dii_sell_crores,
      dii_net_crores
    FROM institutional_flows
    WHERE trade_date >= ${startDate}::date AND trade_date <= ${actualEndDate}::date
    ORDER BY trade_date ASC
  `) as DbInstitutionalFlow[];
  const nifty = (await sql`
    SELECT trade_date::text, index_name, close_price
    FROM index_prices
    WHERE index_name = 'NIFTY50'
      AND trade_date >= ${startDate}::date AND trade_date <= ${actualEndDate}::date
    ORDER BY trade_date ASC
  `) as DbIndexPrice[];
  const sensex = (await sql`
    SELECT trade_date::text, index_name, close_price
    FROM index_prices
    WHERE index_name = 'SENSEX'
      AND trade_date >= ${startDate}::date AND trade_date <= ${actualEndDate}::date
    ORDER BY trade_date ASC
  `) as DbIndexPrice[];
  const macros = (await sql`
    SELECT record_date::text, cpi_index, ppp_factor
    FROM macro_indicators
    ORDER BY record_date ASC
  `) as DbMacroIndicator[];
  return { flows, nifty, sensex, macros };
}

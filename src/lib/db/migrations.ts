import { Query } from './types';
import { applyCoreMigrations } from './coreMigrations';
import { applyDataMigrations } from './dataMigrations';
export const SCHEMA_VERSION = 4;
let tablesReady: Promise<void> | null = null;
let tablesInitialized = false;
async function readSchemaVersion(sql: Query): Promise<number> {
  try {
    const rows = (await sql`SELECT version FROM schema_meta WHERE id = 1`) as {
      version?: number | string | null;
    }[];
    if (rows.length === 0) return 0;
    const parsed = Number(rows[0].version);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}
export async function ensureTables(sql: Query): Promise<void> {
  if (tablesInitialized) return;
  if (!tablesReady) {
    tablesReady = (async () => {
      if ((await readSchemaVersion(sql)) >= SCHEMA_VERSION) {
        tablesInitialized = true;
        return;
      }
      await applyCoreMigrations(sql);
      await applyDataMigrations(sql, SCHEMA_VERSION);
      tablesInitialized = true;
    })();
  }
  try {
    await tablesReady;
  } catch (error) {
    tablesReady = null;
    throw error;
  }
}

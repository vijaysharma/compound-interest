import { latestNavDateIn } from '../../utilities/navCalendar';
import {
  claimSchemeRefresh,
  probeMarketWatermark,
  readWatermark,
  recordSchemeOutcome,
} from './navWatermark';
import {
  syncSchemeFromUpstream,
  type NavPayload,
} from './navUpstreamSync';
export type { NavPayload } from './navUpstreamSync';
export { syncSchemeFromUpstream } from './navUpstreamSync';
export const BACKGROUND_FETCH_TIMEOUT_MS = 25_000;
export const FIRST_FETCH_TIMEOUT_MS = 15_000;
export type RefreshOutcome =
  | 'current'
  | 'gated'
  | 'refreshed'
  | 'behind'
  | 'failed';
export async function refreshSchemeIfStale(
  schemeCode: string,
  current: NavPayload | null,
  timeoutMs: number = BACKGROUND_FETCH_TIMEOUT_MS
): Promise<RefreshOutcome> {
  const watermark = await readWatermark();
  const currentLatest = current ? latestNavDateIn(current.data as Array<{ date?: string }>) : null;
  if (watermark?.date && currentLatest && currentLatest >= watermark.date) {
    return 'current';
  }
  if (!(await claimSchemeRefresh(schemeCode))) return 'gated';
  const refreshed = await syncSchemeFromUpstream(schemeCode, timeoutMs, current);
  if (!refreshed) {
    await recordSchemeOutcome(schemeCode, false);
    return 'failed';
  }
  const newLatest = latestNavDateIn(refreshed.data as Array<{ date?: string }>);
  const caughtUp = Boolean(newLatest && (!watermark?.date || newLatest >= watermark.date));
  await recordSchemeOutcome(schemeCode, caughtUp);
  return caughtUp ? 'refreshed' : 'behind';
}
export async function runNavMaintenance(
  schemes: Array<{ code: string; current: NavPayload | null }>
): Promise<void> {
  try {
    await probeMarketWatermark();
    for (const { code, current } of schemes) {
      await refreshSchemeIfStale(code, current);
    }
  } catch (err) {
    console.warn('[nav] background maintenance failed:', err);
  }
}

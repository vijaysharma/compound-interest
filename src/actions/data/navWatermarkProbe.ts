import { MF_URL } from '@/lib/db';
import { redisSetIfAbsent } from '@/lib/redis';
import { navDateToISO } from '../../utilities/dateUtils';
import { probeIntervalSeconds } from '../../utilities/navBackoff';
import type { NavWatermark } from './navWatermarkTypes';
const PROBE_GATE_KEY = 'nav:probe:gate';
const PROBE_SCHEME_CODES = ['118825', '120503', '119551'];
const PROBE_TIMEOUT_MS = 20_000;
function latestDateFromUpstream(payload: unknown): string | null {
  const rows = (payload as { data?: Array<{ date?: string }> } | null)?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let latest = '';
  for (const row of rows) {
    const iso = row?.date ? navDateToISO(row.date) : '';
    if (iso && iso > latest) latest = iso;
  }
  return latest || null;
}
export async function probeMarketWatermark(
  readWatermark: () => Promise<NavWatermark | null>,
  writeWatermark: (next: NavWatermark) => Promise<void>,
  options: { force?: boolean } = {}
): Promise<{ watermark: NavWatermark | null; advanced: boolean; probed: boolean }> {
  const current = await readWatermark();
  if (!options.force) {
    const interval = probeIntervalSeconds(current?.noAdvanceCount ?? 0);
    const claimed = await redisSetIfAbsent(PROBE_GATE_KEY, Date.now(), interval);
    if (!claimed) return { watermark: current, advanced: false, probed: false };
  }
  const observations = await Promise.all(
    PROBE_SCHEME_CODES.map(async (code) => {
      try {
        const res = await fetch(`${MF_URL}/${encodeURIComponent(code)}/latest`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        if (!res.ok) return null;
        return latestDateFromUpstream(await res.json());
      } catch {
        return null;
      }
    })
  );
  let observed = '';
  for (const date of observations) {
    if (date && date > observed) observed = date;
  }
  if (!observed) {
    if (current) {
      const next = { ...current, noAdvanceCount: current.noAdvanceCount + 1 };
      await writeWatermark(next);
      return { watermark: next, advanced: false, probed: true };
    }
    return { watermark: null, advanced: false, probed: true };
  }
  const advanced = !current || observed > current.date;
  const next: NavWatermark = {
    date: advanced ? observed : current.date,
    observedAt: Date.now(),
    noAdvanceCount: advanced ? 0 : (current?.noAdvanceCount ?? 0) + 1,
  };
  await writeWatermark(next);
  return { watermark: next, advanced, probed: true };
}

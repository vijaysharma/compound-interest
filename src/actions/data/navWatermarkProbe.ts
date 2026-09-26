import { redisSetIfAbsent } from '@/lib/redis';
import { navDateToISO } from '../../utilities/dateUtils';
import { probeIntervalSeconds } from '../../utilities/navBackoff';
import type { NavWatermark } from './navWatermarkTypes';
import { fetchAmfiLatest } from '@/lib/amfi/amfiClient';
const PROBE_GATE_KEY = 'nav:probe:gate';
const PROBE_SCHEME_CODES = ['118825', '120503', '119551'];
const PROBE_TIMEOUT_MS = 20_000;
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
  let observed = '';
  try {
    const amfiParsed = await fetchAmfiLatest(PROBE_TIMEOUT_MS);
    for (const code of PROBE_SCHEME_CODES) {
      const rows = amfiParsed.byScheme.get(code);
      if (rows && rows.length > 0) {
        for (const row of rows) {
          const iso = navDateToISO(row.date);
          if (iso && iso > observed) observed = iso;
        }
      }
    }
  } catch {
    // AMFI probe fetch failed
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

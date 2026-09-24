import { getDb, MF_URL } from '@/lib/db';
import { redisSet } from '@/lib/redis';
import { latestNavDateIn } from '../../utilities/navCalendar';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
export type NavPayload = { data: unknown[]; [k: string]: unknown };
export function rememberPayload(schemeCode: string, payload: NavPayload): void {
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
    latest: latestNavDateIn(payload.data as Array<{ date?: string }>),
  });
  redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => {});
}
export async function syncSchemeFromUpstream(
  schemeCode: string,
  timeoutMs: number,
  previous?: NavPayload | null
): Promise<NavPayload | null> {
  let payload: NavPayload | null = null;
  try {
    const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!upstream.ok) return null;
    payload = parseNavPayload(await upstream.json());
  } catch (err) {
    console.warn(`[nav] upstream fetch failed for ${schemeCode}:`, err);
    return null;
  }
  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) return null;
  const isAtLeastAsComplete = !previous || payload.data.length >= previous.data.length;
  if (isAtLeastAsComplete) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO mutual_fund_nav (scheme_code, payload, latest_nav_date, updated_at)
        VALUES (
          ${schemeCode},
          ${JSON.stringify(payload)}::jsonb,
          ${latestNavDateIn(payload.data as Array<{ date?: string }>)}::date,
          NOW()
        )
        ON CONFLICT (scheme_code) DO UPDATE SET
          payload = EXCLUDED.payload,
          latest_nav_date = EXCLUDED.latest_nav_date,
          updated_at = NOW()
      `;
    } catch (dbErr) {
      console.warn(`[nav] DB sync failed for ${schemeCode}:`, dbErr);
    }
  } else {
    console.warn(
      `[nav] upstream payload for ${schemeCode} is shorter than stored ` +
        `(${payload.data.length} < ${previous?.data.length}); keeping stored history.`
    );
    return previous ?? payload;
  }
  rememberPayload(schemeCode, payload);
  return payload;
}

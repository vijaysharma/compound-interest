import { getDb } from '@/lib/db';
import { redisGet } from '@/lib/redis';
import { latestNavDateIn } from '@/utilities/navCalendar';
import {
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
import type { NavPayload } from './navSync';
export async function readStored(schemeCode: string): Promise<{
  payload: NavPayload | null;
  latest: string | null;
  fromDb: boolean;
}> {
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) {
    const payload = parseNavPayload(cached.data);
    if (payload) {
      const latest =
        cached.latest !== undefined
          ? cached.latest
          : latestNavDateIn(payload.data as Array<{ date?: string }>);
      return { payload, latest, fromDb: false };
    }
  }
  const redisPayload = parseNavPayload(await redisGet(navPayloadKey(schemeCode)));
  if (redisPayload) {
    const latest = latestNavDateIn(redisPayload.data as Array<{ date?: string }>);
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
      data: redisPayload,
      latest,
    });
    return { payload: redisPayload, latest, fromDb: false };
  }
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT to_char(date, 'DD-MM-YYYY') as date, nav::text as nav
      FROM mutual_fund_nav
      WHERE scheme_code = ${schemeCode}
      ORDER BY date DESC
    `) as Array<{ date: string; nav: string }>;
    if (rows.length > 0) {
      const payload: NavPayload = {
        meta: { scheme_code: schemeCode },
        data: rows,
      };
      const latest = latestNavDateIn(rows);
      mfNavCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
        data: payload,
        latest,
      });
      return { payload, latest, fromDb: true };
    }
  } catch (dbErr) {
    console.warn('[nav] DB read failed:', dbErr);
  }
  return { payload: null, latest: null, fromDb: false };
}

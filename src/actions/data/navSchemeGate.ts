import { redisGet, redisSet, redisSetIfAbsent } from '@/lib/redis';
import { SCHEME_MAX_INTERVAL_SECONDS, schemeIntervalSeconds } from '../../utilities/navBackoff';
const SCHEME_GATE_KEY = (code: string) => `nav:sync:${code}`;
const SCHEME_ATTEMPTS_KEY = (code: string) => `nav:sync:attempts:${code}`;
export async function claimSchemeRefresh(schemeCode: string): Promise<boolean> {
  const attempts = Number(await redisGet<number>(SCHEME_ATTEMPTS_KEY(schemeCode))) || 0;
  return redisSetIfAbsent(
    SCHEME_GATE_KEY(schemeCode),
    Date.now(),
    schemeIntervalSeconds(attempts)
  );
}
export async function recordSchemeOutcome(schemeCode: string, caughtUp: boolean): Promise<void> {
  if (caughtUp) {
    await redisSet(SCHEME_ATTEMPTS_KEY(schemeCode), 0, SCHEME_MAX_INTERVAL_SECONDS);
    return;
  }
  const attempts = Number(await redisGet<number>(SCHEME_ATTEMPTS_KEY(schemeCode))) || 0;
  await redisSet(SCHEME_ATTEMPTS_KEY(schemeCode), attempts + 1, SCHEME_MAX_INTERVAL_SECONDS);
}

import type { NavType } from '../../types/types';
import { getNearest } from '../../utilities/navUtils';
import { navDateToISO, parseAnyDate } from '../../utilities/dateUtils';
import type { NavPoint } from './types';
/**
 * NAV-date convention used by the whole engine
 * --------------------------------------------
 * AMFI publishes one NAV per business day, in DD-MM-YYYY. A transaction or
 * valuation can land on a weekend, a market holiday, or a day the AMC simply
 * did not publish. For those dates the *applicable NAV* is the most recent NAV
 * published on or before the requested date — the same rule the rest of this
 * app applies through `getNearest`.
 *
 * A date that falls before the fund's first published NAV has no applicable
 * NAV at all. `getNearest` clamps to the earliest row in that case, so this
 * wrapper rejects it explicitly: callers get `undefined` and must surface
 * "NAV unavailable" rather than transact at a fabricated price.
 */
export const resolveNav = (navData: NavType[], isoDate: string): NavPoint | undefined => {
  if (!isoDate || !navData || navData.length === 0) return undefined;
  const nearest = getNearest(isoDate, navData);
  if (!nearest) return undefined;
  const nav = Number(nearest.nav);
  if (!Number.isFinite(nav) || nav <= 0) return undefined;
  const navIso = navDateToISO(nearest.date);
  const navTime = parseAnyDate(navIso).getTime();
  const requestedTime = parseAnyDate(isoDate).getTime();
  if (!Number.isFinite(navTime) || !Number.isFinite(requestedTime)) return undefined;
  if (navTime > requestedTime) return undefined;
  return { date: navIso, nav };
};
interface TimedIso {
  iso: string;
  time: number;
}
const toTimedIsoDates = (navData: NavType[]): TimedIso[] =>
  navData
    .filter((row) => Number(row.nav) > 0)
    .map((row) => {
      const iso = navDateToISO(row.date);
      return { iso, time: parseAnyDate(iso).getTime() };
    })
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => a.time - b.time);
/** ISO date of the fund's first published NAV, or null when there is none. */
export const firstNavDate = (navData: NavType[]): string | null =>
  toTimedIsoDates(navData)[0]?.iso ?? null;
/** ISO date of the fund's most recent published NAV, or null. */
export const lastNavDate = (navData: NavType[]): string | null => {
  const dates = toTimedIsoDates(navData);
  return dates.length > 0 ? dates[dates.length - 1].iso : null;
};
/** Every published NAV date within an inclusive ISO range, ascending. */
export const navDatesBetween = (
  navData: NavType[],
  startIso: string,
  endIso: string
): string[] => {
  const startTime = parseAnyDate(startIso).getTime();
  const endTime = parseAnyDate(endIso).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return [];
  return toTimedIsoDates(navData)
    .filter(({ time }) => time >= startTime && time <= endTime)
    .map(({ iso }) => iso);
};

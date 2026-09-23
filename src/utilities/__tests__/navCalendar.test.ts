import { test } from 'node:test';
import assert from 'node:assert/strict';
const { getTodayISO, getMarketNowParts } = await import('../dateGuards');
const {
  lastExpectedNavDateISO,
  navFreshnessCeiling,
  isMarketWeekend,
  latestNavDateIn,
  isNavHistoryFresh,
} = await import('../navCalendar');
const { navDateToISO } = await import('../dateUtils');
/** An instant expressed in IST, as a UTC `Date`. IST is UTC+05:30, no DST. */
const ist = (iso: string, hour: number, minute = 0) =>
  new Date(`${iso}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:30`);
/**
 * NAV rows in the upstream shape: newest first, `dd-MM-yyyy`.
 *
 * The row list is what both sides actually hold — the server unwraps
 * `{ data: [...] }` before testing freshness and the browser stores `NavType[]`
 * — so the primitives are exercised here rather than the server-only payload
 * wrappers, which are one-line delegations to these.
 */
const rows = (...dates: string[]) =>
  dates.map((d) => {
    const [y, m, day] = d.split('-');
    return { date: `${day}-${m}-${y}`, nav: '100.0' };
  });
// ── The timezone bug ────────────────────────────────────────────────────────
test('today is resolved in IST, not in the host timezone', () => {
  // 00:30 IST on the 23rd is 19:00 UTC on the 22nd. A UTC-based clock — which
  // is what the Vercel runtime gives us — called this the 22nd.
  assert.equal(getTodayISO(ist('2026-09-23', 0, 30)), '2026-09-23');
  // 05:00 IST is 23:30 UTC the previous day, the other side of the same seam.
  assert.equal(getTodayISO(ist('2026-09-23', 5)), '2026-09-23');
  assert.equal(getMarketNowParts(ist('2026-09-23', 5)).hours, 5);
});
// ── The cache-defeating predicate ───────────────────────────────────────────
test('before the publish window, the newest expected NAV is the previous day', () => {
  // Wednesday 14:00 IST — today's NAV does not exist yet.
  assert.equal(lastExpectedNavDateISO(ist('2026-09-23', 14)), '2026-09-22');
});
test('after the publish window, the current business day is expected', () => {
  assert.equal(lastExpectedNavDateISO(ist('2026-09-23', 23, 30)), '2026-09-23');
});
test('the ceiling steps back over a weekend', () => {
  assert.ok(isMarketWeekend('2026-09-26'), 'sanity: 26 Sep 2026 is a Saturday');
  // Saturday and Sunday daytime both resolve to Friday.
  assert.equal(lastExpectedNavDateISO(ist('2026-09-26', 12)), '2026-09-25');
  assert.equal(lastExpectedNavDateISO(ist('2026-09-27', 12)), '2026-09-25');
  // Monday morning, before the window: still Friday, not Sunday.
  assert.equal(lastExpectedNavDateISO(ist('2026-09-28', 9)), '2026-09-25');
});
test('a past date asks only for itself; today asks for the last published NAV', () => {
  const now = ist('2026-09-23', 14);
  assert.equal(navFreshnessCeiling('2025-06-10', now), '2025-06-10');
  assert.equal(navFreshnessCeiling('2026-09-23', now), '2026-09-22');
});
test('a payload ending yesterday satisfies a request for today', () => {
  // This is the regression the whole change exists for. The old predicate was
  // `latestNavDate >= requestedEndDate`; with the request defaulting to today
  // and the newest NAV dated yesterday, it was false on every single call, so
  // memory, Redis and Postgres were all bypassed and every request went
  // upstream.
  const now = ist('2026-09-23', 14);
  const stored = rows('2026-09-22', '2026-09-21');
  const oldPredicate = latestNavDateIn(stored)! >= '2026-09-23';
  assert.equal(oldPredicate, false, 'the old comparison could never be satisfied');
  assert.equal(isNavHistoryFresh(stored, navFreshnessCeiling('2026-09-23', now)), true);
});
test('a payload that is genuinely behind is still reported stale', () => {
  const now = ist('2026-09-23', 14);
  const ceiling = navFreshnessCeiling('2026-09-23', now);
  assert.equal(isNavHistoryFresh(rows('2026-09-15'), ceiling), false);
  assert.equal(isNavHistoryFresh([], ceiling), false);
  assert.equal(isNavHistoryFresh(null, ceiling), false);
});
// ── Date parsing on the hot path ────────────────────────────────────────────
test('both upstream dd-MM-yyyy and our own ISO rows are understood', () => {
  assert.equal(navDateToISO('22-09-2026'), '2026-09-22');
  assert.equal(navDateToISO('2026-09-22'), '2026-09-22');
  assert.equal(navDateToISO('5-9-2026'), '2026-09-05', 'unpadded upstream days');
  assert.equal(navDateToISO('garbage'), '', 'unparseable input yields the empty string');
  assert.equal(navDateToISO(''), '');
});
test('the latest date is the maximum, not the first row', () => {
  // Upstream is newest-first, but nothing in the contract guarantees it.
  assert.equal(latestNavDateIn(rows('2026-01-05', '2026-09-22', '2025-03-01')), '2026-09-22');
});

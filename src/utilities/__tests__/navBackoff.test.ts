import { test } from 'node:test';
import assert from 'node:assert/strict';
const {
  probeIntervalSeconds,
  schemeIntervalSeconds,
  PROBE_BASE_INTERVAL_SECONDS,
  PROBE_MAX_INTERVAL_SECONDS,
} = await import('../navBackoff');
test('the market probe backs off geometrically and then caps', () => {
  assert.equal(probeIntervalSeconds(0), 30 * 60, '30m on the first miss');
  assert.equal(probeIntervalSeconds(1), 60 * 60, '1h');
  assert.equal(probeIntervalSeconds(2), 2 * 60 * 60, '2h');
  assert.equal(probeIntervalSeconds(3), 4 * 60 * 60, '4h');
  assert.equal(probeIntervalSeconds(4), PROBE_MAX_INTERVAL_SECONDS, 'capped at 6h');
  assert.equal(probeIntervalSeconds(50), PROBE_MAX_INTERVAL_SECONDS, 'and stays there');
});
test('a negative or absent count is treated as the first attempt', () => {
  assert.equal(probeIntervalSeconds(-5), PROBE_BASE_INTERVAL_SECONDS);
});
test('a multi-day publication gap costs a bounded number of probes', () => {
  // The case that motivated all of this: upstream published nothing for five
  // days. The previous fixed 15-minute cooldown would have made ~480 upstream
  // calls per scheme over that window; this is the whole-application total.
  const FIVE_DAYS = 5 * 24 * 60 * 60;
  let elapsed = 0;
  let probes = 0;
  while (elapsed < FIVE_DAYS) {
    elapsed += probeIntervalSeconds(probes);
    probes += 1;
  }
  assert.ok(probes <= 25, `expected a couple of dozen probes, got ${probes}`);
  assert.ok(probes >= 5, `expected it to keep checking, got ${probes}`);
});
test('a scheme that never catches up settles at one attempt a day', () => {
  // A delisted or merged scheme can never reach the watermark, so without a cap
  // it would be retried for as long as it stays in the table.
  assert.equal(schemeIntervalSeconds(0), 30 * 60);
  assert.equal(schemeIntervalSeconds(1), 60 * 60);
  const DAY = 24 * 60 * 60;
  assert.equal(schemeIntervalSeconds(20), DAY, 'capped');
  assert.ok(schemeIntervalSeconds(6) <= DAY);
});

import { ISO_DATE_REGEX } from '../../utilities/dateGuards';
import { MAX_SAFE_FINANCIAL_VALUE } from '../../components/value-picker/inputUtils';
import { getChartSeriesColor } from '../../data/chartColors';
import { FREQUENCY_OPTIONS } from './schedule';
import { MAX_STEP_UP_PCT } from './defaults';
import type {
  Column2FundConfig,
  Column3Config,
  Frequency,
  FundRef,
  SwpRule,
  WithdrawalPeriod,
} from './types';
/**
 * Narrowing helpers for stored JSON.
 *
 * A localStorage blob is genuinely untrusted input — it can be stale from an
 * older build, hand-edited, or truncated. `unknown` is the correct type at this
 * boundary, and every field is narrowed to a real type below rather than cast,
 * so no malformed value can reach the calculation engine.
 */
export type RawRecord = Record<string, unknown>;
export const asRecord = (value: unknown): RawRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
export const asText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;
export const asMoney = (value: unknown, fallback = 0, max = MAX_SAFE_FINANCIAL_VALUE): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0), max);
};
export const asIsoDate = (value: unknown, fallback: string): string =>
  typeof value === 'string' && ISO_DATE_REGEX.test(value) ? value : fallback;
export const asFrequency = (value: unknown, fallback: Frequency): Frequency =>
  FREQUENCY_OPTIONS.find((option) => option === value) ?? fallback;
export const parseFund = (value: unknown, colorIndex: number): FundRef | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const schemeCode = asText(raw.schemeCode).trim();
  if (!schemeCode) return null;
  return {
    schemeCode,
    schemeName: asText(raw.schemeName, schemeCode),
    color: asText(raw.color) || getChartSeriesColor(colorIndex),
  };
};
export const parseWithdrawal = (
  value: unknown,
  index: number,
  today: string
): WithdrawalPeriod | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const amount = asMoney(raw.amount);
  return {
    id: asText(raw.id).trim() || `wd-restored-${index}`,
    startDate: asIsoDate(raw.startDate, today),
    endDate: asIsoDate(raw.endDate, today),
    frequency: asFrequency(raw.frequency, 'yearly'),
    amount,
    // Clamped, so the "routes more onward than it withdraws" invariant holds.
    toColumn2: asMoney(raw.toColumn2, 0, amount),
    annualStepUpPct: asMoney(raw.annualStepUpPct, 0, MAX_STEP_UP_PCT),
  };
};
const parseSwp = (value: unknown, sipStartDate: string, today: string): SwpRule => {
  const raw = asRecord(value);
  const amount = asMoney(raw?.amount);
  return {
    enabled: raw?.enabled === true,
    startDate: asIsoDate(raw?.startDate, sipStartDate),
    endDate: asIsoDate(raw?.endDate, today),
    amount,
    frequency: asFrequency(raw?.frequency, 'monthly'),
    toColumn3: asMoney(raw?.toColumn3, 0, amount),
  };
};
export const parseColumn2Fund = (
  value: unknown,
  index: number,
  today: string
): Column2FundConfig | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const fund = parseFund(raw.fund, index + 1);
  if (!fund) return null;
  const sipStartDate = asIsoDate(raw.sipStartDate, today);
  return {
    id: asText(raw.id).trim() || `c2-restored-${index}`,
    fund,
    allocationPct: asMoney(raw.allocationPct, 0, 100),
    sipStartDate,
    swp: parseSwp(raw.swp, sipStartDate, today),
  };
};
export const parseColumn3 = (value: unknown, today: string): Column3Config => {
  const raw = asRecord(value);
  return {
    frequency: asFrequency(raw?.frequency, 'monthly'),
    startDate: asIsoDate(raw?.startDate, today),
    mode: raw?.mode === 'fixed' ? 'fixed' : 'sweep',
    amount: asMoney(raw?.amount),
  };
};

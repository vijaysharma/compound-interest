import { HISTORICAL_PPF_RATES } from '../../data/ppfRates';
export const PPF_STEPS_ANNUAL = [
  { id: 'p1', value: '150000', title: '₹1.5L' },
  { id: 'p2', value: '50000', title: '₹50K' },
  { id: 'p3', value: '25000', title: '₹25K' },
  { id: 'p4', value: '5000', title: '₹5K' },
  { id: 'p5', value: '500', title: '₹500' },
];
export const PPF_STEPS_MONTHLY = [
  { id: 'm1', value: '12500', title: '₹12.5K' },
  { id: 'm2', value: '10000', title: '₹10K' },
  { id: 'm3', value: '5000', title: '₹5K' },
  { id: 'm4', value: '1000', title: '₹1K' },
  { id: 'm5', value: '500', title: '₹500' },
];
const today = new Date();
const CURRENT_FY_START = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
const fyLabel = (y: number) => `FY ${y}-${String((y + 1) % 100).padStart(2, '0')}`;
const lastRateYear = HISTORICAL_PPF_RATES[HISTORICAL_PPF_RATES.length - 1].startYear;
export const PPF_START_YEAR_OPTIONS = [
  ...HISTORICAL_PPF_RATES.map((r) => ({
    year: r.startYear,
    label: r.startYear === CURRENT_FY_START ? `${fyLabel(r.startYear)} (Current)` : `FY ${r.fyLabel}`,
  })),
  ...[CURRENT_FY_START, CURRENT_FY_START + 1]
    .filter((y) => y > lastRateYear)
    .map((y) => ({ year: y, label: `${fyLabel(y)} (${y === CURRENT_FY_START ? 'Current' : 'Next'})` })),
];

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
export const PPF_START_YEAR_OPTIONS = [
  ...HISTORICAL_PPF_RATES.map((r) => ({ year: r.startYear, label: `FY ${r.fyLabel}` })),
  { year: 2026, label: 'FY 2026-27 (Upcoming)' },
  { year: 2027, label: 'FY 2027-28 (Future)' },
];

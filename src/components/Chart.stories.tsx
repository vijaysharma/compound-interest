import type { Meta, StoryObj } from '@storybook/nextjs';
import Chart from './Chart';
import type { ChartDataset } from './chart/types';
/**
 * The portfolio-value chart.
 *
 * These stories exist for the projection work: `/strategy-calculator` is behind
 * sign-in and needs a fund with real NAV history before it renders anything, so
 * the measured-to-extrapolated presentation cannot be checked there quickly.
 * Everything below is synthetic data shaped like the real thing.
 */
const meta = {
  title: 'Components/Chart',
  component: Chart,
  parameters: { width: '100%', showRuler: false, layout: 'fullscreen' },
} satisfies Meta<typeof Chart>;
export default meta;
type Story = StoryObj<typeof meta>;
const CORE = '#6d0b74';
const GROWTH = '#1f7a8c';
const COMBINED = '#9c27b0';
/** Monthly points from `startYear` for `years`, compounding at `annualRate`. */
const series = (startYear: number, years: number, from: number, annualRate: number) => {
  const out: Array<{ date: string; nav: number }> = [];
  for (let month = 0; month <= years * 12; month += 1) {
    const year = startYear + Math.floor(month / 12);
    const mm = String((month % 12) + 1).padStart(2, '0');
    out.push({ date: `${year}-${mm}-01`, nav: from * (1 + annualRate) ** (month / 12) });
  }
  return out;
};
const AS_OF = '2026-01-01';
/** Measured history, then the combined line continuing dashed past the as-of date. */
const projectedDatasets = (horizonYears: number, rate: number): ChartDataset[] => {
  const measured = series(2013, 13, 1_000_000, 0.12);
  const joinValue = measured[measured.length - 1].nav;
  const projected = series(2026, horizonYears, joinValue, rate);
  return [
    { label: 'Core corpus value', color: CORE, data: measured.map((p) => ({ ...p, nav: p.nav * 0.6 })), tooltipNote: 'Actual NAVs' },
    { label: 'Growth funds value', color: GROWTH, data: measured.map((p) => ({ ...p, nav: p.nav * 0.4 })), tooltipNote: 'Actual NAVs' },
    { label: 'Combined value', color: COMBINED, data: measured, tooltipNote: 'Actual NAVs' },
    {
      label: 'Combined, projected (Moderate)',
      color: COMBINED,
      dashed: true,
      strokeOpacity: 0.55,
      tooltipNote: 'Projected · Moderate · extrapolated, not measured',
      data: projected,
    },
  ];
};
const common = {
  investmentAmount: 1_000_000,
  dataMode: 'value' as const,
  startDate: '2013-01-01',
  minHeight: 340,
  className: '',
};
/** Measured history only — no projection active. */
export const HistoryOnly: Story = {
  args: {
    ...common,
    datasets: projectedDatasets(0, 0.12).slice(0, 3),
    endDate: AS_OF,
  },
};
/**
 * 30-year horizon, the default. The dashed segment starts on the solid line's
 * last point, and the `today` rule marks where measurement stops.
 */
export const Projected30Years: Story = {
  args: {
    ...common,
    datasets: projectedDatasets(30, 0.12),
    endDate: '2056-01-01',
    markerDate: AS_OF,
    markerLabel: 'today',
  },
};
/**
 * The case that drove the axis decision: 100 years at a high rate, in **nominal**
 * rupees. The measured history is crushed onto the axis line, which is why the
 * card defaults to today's-rupees instead.
 */
export const Projected100YearsNominal: Story = {
  args: {
    ...common,
    datasets: projectedDatasets(100, 0.18),
    endDate: '2126-01-01',
    markerDate: AS_OF,
    markerLabel: 'today',
  },
};
/**
 * The same 100 years deflated at 6%, which is what the card actually plots.
 * The early decades stay legible.
 */
export const Projected100YearsTodaysRupees: Story = {
  args: {
    ...common,
    datasets: (() => {
      const sets = projectedDatasets(100, 0.18);
      const base = new Date(`${AS_OF}T00:00:00`).getTime();
      const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
      return sets.map((set) =>
        set.dashed
          ? {
              ...set,
              data: set.data.map((point) => {
                const years = (new Date(`${point.date}T00:00:00`).getTime() - base) / MS_PER_YEAR;
                return { ...point, nav: point.nav / 1.06 ** Math.max(0, years) };
              }),
            }
          : set
      );
    })(),
    endDate: '2126-01-01',
    markerDate: AS_OF,
    markerLabel: 'today',
  },
};

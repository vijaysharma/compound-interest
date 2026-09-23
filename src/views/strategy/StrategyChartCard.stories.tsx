import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { StrategyChartCard } from './StrategyChartCard';
import { DEFAULT_PROJECTION_SETTINGS, type ProjectionSettings } from './projection';
import type { StrategyProjection } from './useStrategyProjection';
import type { PortfolioSnapshot, StrategyConfig, StrategyResult } from './types';
/**
 * The real `StrategyChartCard`, with fabricated data.
 *
 * Mounts the actual component rather than a copy of its markup, so the control
 * layout shown here is the one the page renders. `/strategy-calculator` is
 * behind sign-in and needs a fund with NAV history, which makes checking it
 * there slow.
 */
const meta = {
  title: 'Strategy/Chart card',
  parameters: { width: '100%', showRuler: false, layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const AS_OF = '2026-09-23';
const snapshots = (fromYear: number, years: number, start: number, rate: number) => {
  const out: PortfolioSnapshot[] = [];
  for (let month = 0; month <= years * 12; month += 1) {
    const year = fromYear + Math.floor(month / 12);
    const mm = String((month % 12) + 1).padStart(2, '0');
    const total = start * (1 + rate) ** (month / 12);
    out.push({
      date: `${year}-${mm}-23`,
      column1Value: total * 0.6,
      column2Value: total * 0.4,
      totalValue: total,
    });
  }
  return out;
};
const MEASURED = snapshots(2018, 8, 1_000_000, 0.19);
const PROJECTED = [...MEASURED, ...snapshots(2026, 30, MEASURED.at(-1)!.totalValue, 0.19).slice(1)];
const config = {
  column1: {
    fund: { schemeCode: '122639', schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth' },
    amount: 1_000_000,
    investmentDate: '2018-01-23',
    withdrawals: [],
  },
  column2: [],
  column3: null,
  asOfDate: AS_OF,
} as unknown as StrategyConfig;
const result = {
  transactions: [],
  snapshots: MEASURED,
  column2Units: {},
  totals: { initialInvestment: 1_000_000, totalPersonalWithdrawals: 0 },
  warnings: [],
} as unknown as StrategyResult;
const projection: StrategyProjection = {
  isAvailable: true,
  bands: {
    '122639': {
      weak: 0.147,
      median: 0.19,
      strong: 0.235,
      windowYears: 10,
      samples: 40,
      historyYears: 13.3,
      degraded: false,
    },
  },
  scenarios: [],
  selected: {
    key: 'median',
    rates: { '122639': 0.19 },
    result: { ...result, snapshots: PROJECTED } as StrategyResult,
    futurePersonal: 0,
    terminalValue: PROJECTED.at(-1)!.totalValue,
    terminalValueToday: 0,
    firstShortfallDate: null,
    exhaustedDate: null,
  },
  horizonIso: '2056-09-23',
  notes: [],
};
/** Interactive: every control is live, so the layout can be poked at. */
const Harness = ({ enabled }: { enabled: boolean }) => {
  const [settings, setSettings] = useState<ProjectionSettings>({
    ...DEFAULT_PROJECTION_SETTINGS,
    enabled,
  });
  return (
    /*
     * 900px, not the full width. On the real page this card sits in the `2fr`
     * half of `.topRow`'s `2fr 1fr` grid, which is about this wide at a 1440px
     * window — testing at full width is how the control row was signed off as
     * fitting one line when on the page it wrapped into three.
     */
    <div style={{ padding: '1rem', width: 900, outline: '1px dashed rgba(255,0,0,.25)' }}>
      <StrategyChartCard
        config={config}
        result={result}
        projection={projection}
        settings={settings}
        onSettingsChange={(patch) => setSettings((prev) => ({ ...prev, ...patch }))}
        isLoading={false}
        message={null}
      />
    </div>
  );
};
/** Default: projection off, so only the heading and switch show. */
export const ProjectionOff: Story = { render: () => <Harness enabled={false} /> };
/** Projection on: switch beside the heading, three groups on one row. */
export const ProjectionOn: Story = { render: () => <Harness enabled /> };

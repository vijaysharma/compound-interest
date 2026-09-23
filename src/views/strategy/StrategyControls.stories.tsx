import type { Meta, StoryObj } from '@storybook/nextjs';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { HORIZON_PRESETS, SCENARIO_BLURBS, SCENARIO_KEYS } from './projection';
import styles from './StrategyCalculator.module.scss';
/**
 * The projection header and control row above the portfolio chart.
 *
 * A story because `/strategy-calculator` is behind sign-in and needs a fund
 * with NAV history before any of this renders — and the layout is the point:
 * `JoinedButtonGroup` defaults to `width: 100%`, which stacked these into
 * full-width rows.
 */
const meta = {
  title: 'Strategy/Projection controls',
  parameters: { width: '100%', showRuler: false, layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const BUTTON_LABEL: Record<string, string> = { weak: 'Low', median: 'Mod', strong: 'High' };
/** Stand-in for a real rate band: Parag Parikh Flexi Cap, Direct, Growth. */
const BAND = { weak: 0.147, median: 0.19, strong: 0.235, windowYears: 10, samples: 40, historyYears: 13.3 };
const HORIZON = 30;
const INFLATION = 6;
const pct = (r: number) => `${(r * 100).toFixed(1)}%`;
const Row = ({ on }: { on: boolean }) => (
  <div style={{ padding: '1rem', maxWidth: 1180 }}>
    <div className={styles.chartHeader}>
      <h2 className={styles.chartTitle}>Portfolio value</h2>
      <JoinedButtonGroup<boolean>
        title="Projection"
        data={[
          { id: 'off', value: false, title: 'Off' },
          { id: 'on', value: true, title: 'On' },
        ]}
        selectedValue={on}
        updateSelectedValue={() => {}}
        sizePrefix="xs"
        compact
        className={styles.projectionToggle}
      />
    </div>
    {on && (
      <>
        <div className={styles.chartControls}>
          <JoinedButtonGroup<number>
            title="Project to"
            data={HORIZON_PRESETS.map((y) => ({ id: `h${y}`, value: y, title: `${y}y` }))}
            selectedValue={HORIZON}
            updateSelectedValue={() => {}}
            sizePrefix="sm"
            compact
            className={`${styles.chartControl} ${styles.chartControlWide}`}
          />
          <JoinedButtonGroup<string>
            title="Return scenario"
            data={SCENARIO_KEYS.map((k) => ({
              id: k,
              value: k,
              title: BUTTON_LABEL[k],
              tooltip: SCENARIO_BLURBS[k],
            }))}
            selectedValue="median"
            updateSelectedValue={() => {}}
            sizePrefix="sm"
            compact
            className={styles.chartControl}
          />
          <JoinedButtonGroup<string>
            title="Money"
            data={[
              { id: 't', value: 'today', title: "Today's ₹" },
              { id: 'n', value: 'nominal', title: 'Nominal' },
            ]}
            selectedValue="today"
            updateSelectedValue={() => {}}
            sizePrefix="sm"
            compact
            className={styles.chartControl}
          />
        </div>
        <dl className={styles.chartControlNotes}>
          <dt>Low / Moderate / High</dt>
          <dd>
            The 10th, 50th and 90th percentiles of what this fund has actually returned over every
            rolling window in its own published history — not assumptions. Low means it did worse
            than this in 1 window out of 10. For Parag Parikh Flexi Cap Fund - Direct Plan - Growth:
            Low {pct(BAND.weak)}, Moderate {pct(BAND.median)}, High {pct(BAND.strong)} a year,
            from {BAND.historyYears.toFixed(1)} years of NAVs.
          </dd>
          <dt>Today&apos;s ₹ / Nominal</dt>
          <dd>
            Nominal is the rupee figure on that future date. Today&apos;s ₹ discounts it by{' '}
            {INFLATION}% a year, so it reads as what that money would buy now — which is the only
            way the early years stay visible on the chart once decades of compounding are on it.
          </dd>
        </dl>
      </>
    )}
  </div>
);
/** Off is the default: a projection is a different kind of claim from the record. */
export const ProjectionOff: Story = { render: () => <Row on={false} /> };
/** On: the switch beside the heading, three groups on one row, notes beneath. */
export const ProjectionOn: Story = { render: () => <Row on /> };

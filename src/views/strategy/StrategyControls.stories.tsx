import type { Meta, StoryObj } from '@storybook/nextjs';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import {
  HORIZON_PRESETS,
  SCENARIO_BLURBS,
  SCENARIO_KEYS,
  SCENARIO_LABELS,
} from './projection';
import styles from './StrategyCalculator.module.scss';
/**
 * The projection control row above the portfolio chart.
 *
 * A story because `/strategy-calculator` is behind sign-in and needs a fund
 * with NAV history before any of this renders — and the layout is the whole
 * point: four `JoinedButtonGroup`s default to `width: 100%`, which stacked them
 * into four full-width rows.
 */
const meta = {
  title: 'Strategy/Projection controls',
  parameters: { width: '100%', showRuler: false, layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const Row = ({ on }: { on: boolean }) => (
  <div style={{ padding: '1rem', maxWidth: 1100 }}>
    <div className={styles.chartControls}>
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
        className={styles.chartControl}
      />
      {on && (
        <>
          <JoinedButtonGroup<number>
            title="Project to"
            data={HORIZON_PRESETS.map((y) => ({ id: `h${y}`, value: y, title: `${y}y` }))}
            selectedValue={100}
            updateSelectedValue={() => {}}
            sizePrefix="xs"
            compact
            className={styles.chartControl}
          />
          <JoinedButtonGroup<string>
            title="Return scenario"
            data={SCENARIO_KEYS.map((k) => ({
              id: k,
              value: k,
              title: SCENARIO_LABELS[k],
              tooltip: SCENARIO_BLURBS[k],
            }))}
            selectedValue="median"
            updateSelectedValue={() => {}}
            sizePrefix="xs"
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
            sizePrefix="xs"
            compact
            className={styles.chartControl}
          />
        </>
      )}
    </div>
    {on && (
      <dl className={styles.chartControlNotes}>
        <dt>Low / Moderate / High</dt>
        <dd>
          The 10th, 50th and 90th percentiles of what this fund has actually returned over every
          rolling window in its own published history — not assumptions. Low means it did worse
          than this in 1 window out of 10. For Axis ELSS Tax Saver Direct Growth: Low 8.1%,
          Moderate 12.4%, High 18.2% a year, from 13.7 years of NAVs.
        </dd>
        <dt>Today&apos;s ₹ / Nominal</dt>
        <dd>
          Nominal is the rupee figure on that future date. Today&apos;s ₹ discounts it by 6% a
          year, so it reads as what that money would buy now — which is the only way the early
          years stay visible on the chart once decades of compounding are on it.
        </dd>
      </dl>
    )}
  </div>
);
/** Off is the default: a projection is a different kind of claim from the record. */
export const ProjectionOff: Story = { render: () => <Row on={false} /> };
/** On: all four groups on one row, with the labels explained beneath. */
export const ProjectionOn: Story = { render: () => <Row on /> };

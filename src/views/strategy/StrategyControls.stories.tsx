import type { Meta, StoryObj } from '@storybook/nextjs';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import {
  HORIZON_PRESETS,
  SCENARIO_BLURBS,
  SCENARIO_BUTTON_LABELS,
  SCENARIO_KEYS,
} from './projection';
import { InfoTooltip } from './InfoTooltip';
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
const HORIZON = 30;
const INFLATION = 6;
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
            title={
              <span className={styles.chartControlTitle}>
                <span>Risk profile</span>
                <InfoTooltip ariaLabel="Explain Risk Profiles" align="center">
                  <p className={styles.infoTitle}>Understanding Risk Profiles (Cons / Mod / Risk)</p>
                  <p className={styles.infoDesc}>
                    Real stock markets don&apos;t grow in a straight line. They go through great years, flat periods, and sudden dips. Pick a profile that matches your comfort level:
                  </p>
                  <ul>
                    <li>
                      <strong>Cons (Conservative):</strong> Safety first. Targets steady ~8.5% yearly return (or safe fund yield) with mild dips of ~10%.
                      <span className={styles.infoExample}>
                        <strong>Example:</strong> ₹10 Lakhs might temporarily dip to ₹9 Lakhs during a slow market before recovering. Ideal for capital preservation.
                      </span>
                    </li>
                    <li>
                      <strong>Mod (Moderate — Recommended):</strong> Balanced long-term wealth. Targets ~12.0% yearly return (matching India&apos;s 25-year Nifty 50 average) with periodic ~20% market corrections every 4–5 years.
                      <span className={styles.infoExample}>
                        <strong>Example:</strong> ₹10 Lakhs might drop to ₹8 Lakhs during a market cycle before rebounding to new highs over 3–5 years.
                      </span>
                    </li>
                    <li>
                      <strong>Risk (Risky):</strong> Maximum aggressive growth potential. Targets ~14.5% yearly return, but with a roller-coaster ride and steep crashes of ~32% (similar to the 2020 COVID crash).
                      <span className={styles.infoExample}>
                        <strong>Example:</strong> ₹10 Lakhs could plunge to ₹6.8 Lakhs before recovering. For long-term investors with high risk tolerance.
                      </span>
                    </li>
                  </ul>
                  <p className={styles.infoFooter}>
                    <strong>Safe funds note:</strong> Low-risk funds (like Arbitrage or Liquid funds) stay protected and steady without artificial equity market crashes.
                  </p>
                </InfoTooltip>
              </span>
            }
            data={SCENARIO_KEYS.map((k) => ({
              id: k,
              value: k,
              title: SCENARIO_BUTTON_LABELS[k],
              tooltip: SCENARIO_BLURBS[k],
            }))}
            selectedValue="median"
            updateSelectedValue={() => {}}
            sizePrefix="sm"
            compact
            className={styles.chartControl}
          />
          <JoinedButtonGroup<string>
            title={
              <span className={styles.chartControlTitle}>
                <span>Money</span>
                <InfoTooltip ariaLabel="Explain Money Modes" align="right">
                  <p className={styles.infoTitle}>Today&apos;s ₹ vs Nominal (Inflation)</p>
                  <p className={styles.infoDesc}>
                    Due to inflation, prices rise and money loses purchasing power over time. A 100-rupee note today buys far less than it did 20 years ago.
                  </p>
                  <ul>
                    <li>
                      <strong>Today&apos;s ₹ (Recommended):</strong> Adjusts future money for inflation (at ~{INFLATION}% per year) to show what it can <em>actually buy today</em>.
                      <span className={styles.infoExample}>
                        <strong>Example:</strong> If a movie ticket costs ₹200 today, it might cost ₹1,150 in 30 years. Today&apos;s ₹ strips away inflation so you know your real future buying power (how many movie tickets or groceries you can afford).
                      </span>
                    </li>
                    <li>
                      <strong>Nominal:</strong> The raw rupee figure that would be printed on your account statement on that future date, without adjusting for inflation.
                      <span className={styles.infoExample}>
                        <strong>Example:</strong> In 30 years, ₹1 Crore sounds like a fortune on paper, but after 30 years of 6% inflation, it will only buy what ₹17 Lakhs buys today.
                      </span>
                    </li>
                  </ul>
                </InfoTooltip>
              </span>
            }
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
      </>
    )}
  </div>
);
/** Off is the default: a projection is a different kind of claim from the record. */
export const ProjectionOff: Story = { render: () => <Row on={false} /> };
/** On: the switch beside the heading, three groups on one row, notes beneath. */
export const ProjectionOn: Story = { render: () => <Row on /> };

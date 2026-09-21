'use client';
import React from 'react';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { AmountField, DateField, FrequencyField } from './StrategyFields';
import { DerivedChips } from './StrategyReadouts';
import type { StrategyConfigApi } from './useStrategyConfig';
import { COLUMN_LABELS, COLUMN_BLURBS, COLUMN_WORDS } from './labels';
import type { Column3Config, Frequency, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface Column3PanelProps {
  api: StrategyConfigApi;
  result: StrategyResult;
}
const MODE_OPTIONS: { id: string; value: Column3Config['mode']; title: string }[] = [
  { id: 'sweep', value: 'sweep', title: 'Sweep all' },
  { id: 'fixed', value: 'fixed', title: 'Fixed amount' },
];
export const Column3Panel = ({ api, result }: Column3PanelProps) => {
  const { config, patchColumn3 } = api;
  const destination = config.column1.fund;
  const reinvestments = result.transactions.filter((row) => row.kind === 'c3-reinvest');
  const latest = reinvestments.at(-1);
  return (
    <section className={styles.card} aria-labelledby="strategy-column-3">
      <h2 className={styles.cardTitle} id="strategy-column-3">
        3 · {COLUMN_LABELS.reinvest}
      </h2>
      <p className={styles.cardSubtitle}>{COLUMN_BLURBS.reinvest}</p>
      <div className={styles.derivedRow}>
        <span>Destination</span>
        <span className={styles.derivedValue}>
          {destination ? destination.schemeName : `Select the ${COLUMN_WORDS.core} fund first`}
        </span>
      </div>
      <FrequencyField
        title="Frequency"
        value={config.column3.frequency}
        onChange={(frequency: Frequency) => patchColumn3({ frequency })}
      />
      <DateField
        label="Reinvestment start"
        value={config.column3.startDate}
        onChange={(startDate) => patchColumn3({ startDate })}
        minDate={config.column1.investmentDate}
      />
      <JoinedButtonGroup<Column3Config['mode']>
        title="Amount per instalment"
        data={MODE_OPTIONS}
        selectedValue={config.column3.mode}
        updateSelectedValue={(mode) => patchColumn3({ mode })}
        sizePrefix="xs"
        compact
      />
      {config.column3.mode === 'fixed' && (
        <AmountField
          title="Fixed reinvestment"
          value={config.column3.amount}
          onChange={(amount) => patchColumn3({ amount })}
        />
      )}
      <DerivedChips
        items={[
          { label: `From ${COLUMN_WORDS.growth}`, value: result.totals.routedToColumn3 },
          { label: 'Reinvested', value: result.totals.reinvestedIntoColumn1 },
          { label: 'Awaiting', value: result.totals.column3CashBalance },
          { label: 'Instalments', value: String(reinvestments.length) },
          ...(latest
            ? [{ label: `NAV ${latest.navDate}`, value: `₹${latest.nav.toFixed(4)}` }]
            : []),
        ]}
      />
    </section>
  );
};

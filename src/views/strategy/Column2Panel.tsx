'use client';
import React, { useState } from 'react';
import { Column2FundCard } from './Column2FundCard';
import { DerivedChips } from './StrategyReadouts';
import { allocationTotal } from './summaries';
import { MAX_COLUMN2_FUNDS } from './defaults';
import { COLUMN_LABELS, COLUMN_BLURBS, COLUMN_WORDS } from './labels';
import type { StrategyConfigApi } from './useStrategyConfig';
import type { NavBook, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface Column2PanelProps {
  api: StrategyConfigApi;
  navBook: NavBook;
  result: StrategyResult;
  onOpenFundPicker: () => void;
}
const BaseColumn2Panel = ({ api, navBook, result, onOpenFundPicker }: Column2PanelProps) => {
  const { config } = api;
  // Only the fund being edited is expanded. A single fund stays open, since
  // there is no list to scan in that case.
  const [openFund, setOpenFund] = useState<string | null>(null);
  const allocation = allocationTotal(config);
  const isBalanced = config.column2.length === 0 || allocation === 100;
  return (
    <section className={styles.card} aria-labelledby="strategy-column-2">
      <h2 className={styles.cardTitle} id="strategy-column-2">
        2 · {COLUMN_LABELS.growth}
        <span className={`${styles.badge} ${isBalanced ? styles.badgeOk : styles.badgeError}`}>
          {allocation}% allocated
        </span>
      </h2>
      <p className={styles.cardSubtitle}>{COLUMN_BLURBS.growth}</p>
      <button type="button" className={styles.primaryButton} onClick={onOpenFundPicker}>
        Select funds ({config.column2.length}/{MAX_COLUMN2_FUNDS})
      </button>
      {!isBalanced && (
        <p className={styles.emptyHint} role="status">
          Allocation must total exactly 100% before the strategy can be calculated.
        </p>
      )}
      {config.column2.length === 0 ? (
        <p className={styles.emptyHint}>
          Add four or more funds to spread the money the {COLUMN_WORDS.core} routes here.
        </p>
      ) : (
        config.column2.map((entry) => (
          <Column2FundCard
            key={entry.id}
            entry={entry}
            api={api}
            navBook={navBook}
            result={result}
            open={openFund === entry.id || config.column2.length === 1}
            onToggle={() => setOpenFund(openFund === entry.id ? null : entry.id)}
          />
        ))
      )}
      <DerivedChips
        items={[
          { label: `From ${COLUMN_WORDS.core}`, value: result.totals.routedToColumn2 },
          { label: 'Invested', value: result.totals.investedInColumn2 },
          ...(result.totals.unallocatedColumn2Cash > 0
            ? [{ label: 'Uninvested', value: result.totals.unallocatedColumn2Cash }]
            : []),
          { label: 'Personal', value: result.totals.personalFromColumn2 },
          { label: `To ${COLUMN_WORDS.reinvest}`, value: result.totals.routedToColumn3 },
          { label: 'Value', value: result.totals.column2Value },
        ]}
      />
    </section>
  );
};
export const Column2Panel = React.memo(BaseColumn2Panel);

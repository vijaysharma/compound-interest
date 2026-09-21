'use client';
import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { AmountField, DateField } from './StrategyFields';
import { DerivedChips } from './StrategyReadouts';
import { WithdrawalPeriodCard } from './WithdrawalPeriodCard';
import { firstNavDate } from './navLookup';
import { formatUnits } from './money';
import { COLUMN_LABELS, COLUMN_BLURBS, COLUMN_WORDS } from './labels';
import type { StrategyConfigApi } from './useStrategyConfig';
import type { NavBook, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface Column1PanelProps {
  api: StrategyConfigApi;
  navBook: NavBook;
  result: StrategyResult;
  onOpenFundPicker: () => void;
}
export const Column1Panel = ({ api, navBook, result, onOpenFundPicker }: Column1PanelProps) => {
  const { column1 } = api.config;
  // Only the period being edited is expanded, so the column stays scannable.
  const [openPeriod, setOpenPeriod] = useState<string | null>(
    () => column1.withdrawals[0]?.id ?? null
  );
  /*
   * Restoring a saved strategy replaces the period ids, so an id that no longer
   * exists falls back to the first period instead of leaving nothing expanded.
   * An explicit null (user collapsed everything) is preserved.
   */
  const hasOpen = column1.withdrawals.some((period) => period.id === openPeriod);
  const openId =
    openPeriod !== null && !hasOpen ? (column1.withdrawals[0]?.id ?? null) : openPeriod;
  const inception = column1.fund ? firstNavDate(navBook[column1.fund.schemeCode] ?? []) : null;
  const opening = result.transactions.find((row) => row.kind === 'c1-invest');
  return (
    <section className={styles.card} aria-labelledby="strategy-column-1">
      <h2 className={styles.cardTitle} id="strategy-column-1">
        1 · {COLUMN_LABELS.core}
      </h2>
      <p className={styles.cardSubtitle}>{COLUMN_BLURBS.core}</p>
      <button type="button" className={styles.fundButton} onClick={onOpenFundPicker}>
        {column1.fund ? (
          <>
            <span
              className={styles.fundDot}
              ref={(el) => {
                if (el) el.style.backgroundColor = column1.fund!.color;
              }}
              aria-hidden="true"
            />
            <span className={styles.fundName}>{column1.fund.schemeName}</span>
          </>
        ) : (
          'Select fund'
        )}
      </button>
      <AmountField
        title="Initial investment"
        value={column1.amount}
        onChange={api.setColumn1Amount}
      />
      <DateField
        label="Investment date"
        value={column1.investmentDate}
        onChange={api.setInvestmentDate}
        minDate={inception ?? undefined}
      />
      <DerivedChips
        items={[
          ...(opening
            ? [
                { label: `NAV ${opening.navDate}`, value: `₹${opening.nav.toFixed(4)}` },
                { label: 'Units bought', value: formatUnits(opening.units) },
              ]
            : []),
          { label: 'Units now', value: formatUnits(result.totals.column1Units) },
          { label: 'Value', value: result.totals.column1Value },
        ]}
      />
      <h3 className={styles.fieldLabel}>Withdrawals from this investment</h3>
      {column1.withdrawals.length === 0 && (
        <p className={styles.emptyHint}>No withdrawals yet. Add a period to start an SWP.</p>
      )}
      {column1.withdrawals.map((period, index) => (
        <WithdrawalPeriodCard
          key={period.id}
          period={period}
          index={index}
          minDate={column1.investmentDate}
          result={result}
          open={openId === period.id}
          onToggle={() => setOpenPeriod(openId === period.id ? null : period.id)}
          onPatch={api.patchWithdrawal}
          onRemove={api.removeWithdrawal}
        />
      ))}
      <button
        type="button"
        className={styles.addButton}
        onClick={() => setOpenPeriod(api.addWithdrawal())}
      >
        <FiPlus aria-hidden="true" /> Add withdrawal period
      </button>
      <DerivedChips
        items={[
          { label: 'Withdrawn', value: result.totals.withdrawnFromColumn1 },
          { label: 'Personal', value: result.totals.personalFromColumn1 },
          { label: `To ${COLUMN_WORDS.growth}`, value: result.totals.routedToColumn2 },
          { label: 'Reinvested', value: result.totals.reinvestedIntoColumn1 },
        ]}
      />
    </section>
  );
};

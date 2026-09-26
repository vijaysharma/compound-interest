'use client';
import React from 'react';
import {
  AmountField,
  DateField,
  DateRangeField,
  FrequencyField,
  PERCENT_STEPS,
  STEP_UP_OPTIONS,
} from './StrategyFields';
import PairedValuePicker from '../../components/PairedValuePicker';
import { DerivedRow } from './StrategyReadouts';
import { CollapsibleItem } from './CollapsibleItem';
import { column2Summary, sipAmountPerInstallment } from './summaries';
import { formatRupees, formatUnits, roundMoney } from './money';
import type { StrategyConfigApi } from './useStrategyConfig';
import { COLUMN_WORDS } from './labels';
import type { Column2FundConfig, Frequency, NavBook, StrategyResult } from './types';
import styles from './StrategyCalculator.module.scss';
interface Column2FundCardProps {
  entry: Column2FundConfig;
  api: StrategyConfigApi;
  navBook: NavBook;
  result: StrategyResult;
  open: boolean;
  onToggle: () => void;
}
const BaseColumn2FundCard = ({
  entry,
  api,
  navBook,
  result,
  open,
  onToggle,
}: Column2FundCardProps) => {
  const { config, patchColumn2, patchSwp, toggleColumn2Fund } = api;
  const summary = column2Summary(result, navBook, entry, config.asOfDate);
  const perInstallment = sipAmountPerInstallment(config, entry.allocationPct);
  const personalUse = roundMoney(Math.max(0, entry.swp.amount - entry.swp.toColumn3));
  const swpId = `swp-${entry.id}`;
  const stepUpNote = entry.swp.annualStepUpPct && entry.swp.annualStepUpPct > 0 ? ` · +${entry.swp.annualStepUpPct}%/yr` : '';
  const meta =
    `${entry.allocationPct}% · ${formatRupees(perInstallment)}/inst · ` +
    `${formatRupees(summary.value)} now` +
    (entry.swp.enabled ? ` · SWP ${formatRupees(entry.swp.amount)}${stepUpNote}` : '');
  const title = (
    <span className={styles.fundName} title={entry.fund.schemeName}>
      <span
        className={styles.fundDot}
        ref={(el) => {
          if (el) el.style.backgroundColor = entry.fund.color;
        }}
        aria-hidden="true"
      />{' '}
      {entry.fund.schemeName}
    </span>
  );
  return (
    <CollapsibleItem
      title={title}
      meta={meta}
      open={open}
      onToggle={onToggle}
      onRemove={() => toggleColumn2Fund(entry.fund)}
      removeLabel={`Remove ${entry.fund.schemeName}`}
    >
      <AmountField
        title="Allocation"
        value={entry.allocationPct}
        max={100}
        symbol="%"
        stepData={PERCENT_STEPS}
        onChange={(allocationPct) => patchColumn2(entry.id, { allocationPct })}
      />
      <DateField
        label="SIP start"
        value={entry.sipStartDate}
        onChange={(sipStartDate) => patchColumn2(entry.id, { sipStartDate })}
        minDate={config.column1.investmentDate}
      />
      <DerivedRow label="SIP per instalment" value={perInstallment} />
      <DerivedRow label="Invested so far" value={summary.invested} />
      <DerivedRow label="Instalments" value={String(summary.installments)} isMoney={false} />
      <div className={styles.checkboxRow}>
        <input
          id={swpId}
          type="checkbox"
          checked={entry.swp.enabled}
          onChange={(event) => patchSwp(entry.id, { enabled: event.target.checked })}
        />
        <label htmlFor={swpId}>Withdraw from this fund (SWP)</label>
      </div>
      {entry.swp.enabled && (
        <>
          <DateRangeField
            startLabel="SWP from"
            endLabel="SWP to"
            startDate={entry.swp.startDate}
            endDate={entry.swp.endDate}
            onStartChange={(startDate) => patchSwp(entry.id, { startDate })}
            onEndChange={(endDate) => patchSwp(entry.id, { endDate })}
            minDate={entry.sipStartDate}
          />
          <FrequencyField
            title="SWP frequency"
            value={entry.swp.frequency}
            onChange={(frequency: Frequency) => patchSwp(entry.id, { frequency })}
          />
          <PairedValuePicker
            primaryTitle="SWP per instalment"
            primaryValue={entry.swp.amount}
            onPrimaryChange={(amount) =>
              patchSwp(entry.id, { amount, toColumn3: Math.min(entry.swp.toColumn3, amount) })
            }
            secondaryTitle={`Of which to ${COLUMN_WORDS.reinvest}`}
            secondaryValue={entry.swp.toColumn3}
            onSecondaryChange={(toColumn3) => patchSwp(entry.id, { toColumn3 })}
            bridgeId={`swp-step-up-${entry.id}`}
            bridgeLabel="Yearly increase"
            bridgeValue={entry.swp.annualStepUpPct ?? 0}
            bridgeOptions={STEP_UP_OPTIONS}
            onBridgeChange={(value) => patchSwp(entry.id, { annualStepUpPct: Number(value) })}
          />
          <DerivedRow label="Personal use per instalment" value={personalUse} />
          <DerivedRow label="Withdrawn so far" value={summary.withdrawn} />
          <DerivedRow label={`Sent to ${COLUMN_WORDS.reinvest}`} value={summary.routedToColumn3} />
        </>
      )}
      <DerivedRow label="Units held" value={formatUnits(summary.units)} isMoney={false} />
      <DerivedRow label="Current value" value={summary.value} />
    </CollapsibleItem>
  );
};
export const Column2FundCard = React.memo(BaseColumn2FundCard);

'use client';
import React from 'react';
import {
  AmountField,
  DateRangeField,
  FrequencyField,
  StepUpSelect,
} from './StrategyFields';
import { DerivedRow } from './StrategyReadouts';
import { CollapsibleItem } from './CollapsibleItem';
import { FREQUENCY_LABEL } from './schedule';
import { formatRupees, roundMoney } from './money';
import type { Frequency, StrategyResult, WithdrawalPeriod } from './types';
interface WithdrawalPeriodCardProps {
  period: WithdrawalPeriod;
  index: number;
  minDate: string;
  result: StrategyResult;
  open: boolean;
  onToggle: () => void;
  onPatch: (id: string, patch: Partial<WithdrawalPeriod>) => void;
  onRemove: (id: string) => void;
}
export const WithdrawalPeriodCard = ({
  period,
  index,
  minDate,
  result,
  open,
  onToggle,
  onPatch,
  onRemove,
}: WithdrawalPeriodCardProps) => {
  const label = `Withdrawal period ${index + 1}`;
  const executed = result.transactions.filter(
    (row) => row.kind === 'c1-withdraw' && row.date >= period.startDate && row.date <= period.endDate
  );
  const personalUse = roundMoney(Math.max(0, period.amount - period.toColumn2));
  const latest = executed.at(-1);
  const stepUpNote = period.annualStepUpPct > 0 ? ` · +${period.annualStepUpPct}%/yr` : '';
  const meta =
    `${period.startDate} → ${period.endDate} · ` +
    `${formatRupees(period.amount)} ${FREQUENCY_LABEL[period.frequency].toLowerCase()}` +
    `${stepUpNote} · ${formatRupees(period.toColumn2)} to Column 2 · ${executed.length} taken`;
  return (
    <CollapsibleItem
      title={label}
      meta={meta}
      open={open}
      onToggle={onToggle}
      onRemove={() => onRemove(period.id)}
      removeLabel={`Remove ${label}`}
    >
      <DateRangeField
        startLabel="From"
        endLabel="To"
        startDate={period.startDate}
        endDate={period.endDate}
        onStartChange={(startDate) => onPatch(period.id, { startDate })}
        onEndChange={(endDate) => onPatch(period.id, { endDate })}
        minDate={minDate}
      />
      <FrequencyField
        title="Frequency"
        value={period.frequency}
        onChange={(frequency: Frequency) => onPatch(period.id, { frequency })}
      />
      <AmountField
        title="Withdrawal per instalment"
        value={period.amount}
        onChange={(amount) =>
          onPatch(period.id, { amount, toColumn2: Math.min(period.toColumn2, amount) })
        }
      />
      <StepUpSelect
        id={`step-up-${period.id}`}
        label="Yearly increase"
        value={period.annualStepUpPct}
        onChange={(annualStepUpPct) => onPatch(period.id, { annualStepUpPct })}
      />
      <AmountField
        title="Of which to Column 2"
        value={period.toColumn2}
        max={period.amount}
        onChange={(toColumn2) => onPatch(period.id, { toColumn2 })}
      />
      <DerivedRow label="Personal use per instalment" value={personalUse} />
      {period.annualStepUpPct > 0 && latest && (
        <DerivedRow label={`Latest instalment ${latest.date}`} value={latest.settledAmount} />
      )}
      <DerivedRow label="Instalments taken" value={String(executed.length)} isMoney={false} />
    </CollapsibleItem>
  );
};

import { formatRupees, formatUnits } from './money';
import { COLUMN_LABELS } from './labels';
import { inTodaysRupees } from './projectionDeflate';
import type { ProjectionSettings, ScenarioOutcome } from './projectionProfiles';
import type { StrategyTotals } from './types';
export interface StatRow {
  label: string;
  value: string;
  projectedValue?: string;
  strong?: boolean;
  shortfallBadge?: string;
}
export interface StatGroup {
  title: string;
  rows: StatRow[];
}
export const buildGroups = (
  totals: StrategyTotals,
  projTotals?: StrategyTotals | null,
  settings?: ProjectionSettings,
  outcome?: ScenarioOutcome | null
): StatGroup[] => {
  const isProjecting = Boolean(projTotals && settings?.enabled);
  const deflate = (val: number) =>
    settings?.valueMode === 'today'
      ? inTodaysRupees(val, settings.inflationPct, settings.horizonYears)
      : val;
  const projColumn1 = isProjecting && projTotals ? deflate(projTotals.column1Value) : undefined;
  const projColumn2 = isProjecting && projTotals ? deflate(projTotals.column2Value) : undefined;
  const projTotal = isProjecting && projTotals ? deflate(projTotals.totalValue) : undefined;
  return [
    {
      title: 'Holdings',
      rows: [
        {
          label: 'Initial investment',
          value: formatRupees(totals.initialInvestment),
          projectedValue: isProjecting && projTotals ? formatRupees(projTotals.initialInvestment) : undefined,
        },
        {
          label: `${COLUMN_LABELS.core} value`,
          value: formatRupees(totals.column1Value),
          projectedValue: projColumn1 !== undefined ? formatRupees(projColumn1) : undefined,
          strong: true,
        },
        {
          label: `${COLUMN_LABELS.growth} value`,
          value: formatRupees(totals.column2Value),
          projectedValue: projColumn2 !== undefined ? formatRupees(projColumn2) : undefined,
          strong: true,
        },
        {
          label: 'Total portfolio value',
          value: formatRupees(totals.totalValue),
          projectedValue: projTotal !== undefined ? formatRupees(projTotal) : undefined,
          strong: true,
          shortfallBadge:
            isProjecting && outcome?.exhaustedDate ? `Depleted ${outcome.exhaustedDate}` : undefined,
        },
        {
          label: `${COLUMN_LABELS.core} units held`,
          value: formatUnits(totals.column1Units),
          projectedValue:
            isProjecting && projTotals ? formatUnits(projTotals.column1Units) : undefined,
        },
      ],
    },
    {
      title: 'Money taken out',
      rows: [
        {
          label: `Withdrawn from ${COLUMN_LABELS.core.toLowerCase()}`,
          value: formatRupees(totals.withdrawnFromColumn1),
          projectedValue:
            isProjecting && projTotals ? formatRupees(projTotals.withdrawnFromColumn1) : undefined,
        },
        {
          label: `Withdrawn by ${COLUMN_LABELS.growth.toLowerCase()} SWPs`,
          value: formatRupees(totals.routedToColumn3 + totals.personalFromColumn2),
          projectedValue:
            isProjecting && projTotals
              ? formatRupees(projTotals.routedToColumn3 + projTotals.personalFromColumn2)
              : undefined,
        },
      ],
    },
    {
      title: 'Money moved between stages',
      rows: [
        {
          label: `${COLUMN_LABELS.core} to ${COLUMN_LABELS.growth.toLowerCase()}`,
          value: formatRupees(totals.routedToColumn2),
          projectedValue:
            isProjecting && projTotals ? formatRupees(projTotals.routedToColumn2) : undefined,
        },
        {
          label: `Invested by ${COLUMN_LABELS.growth.toLowerCase()} SIPs`,
          value: formatRupees(totals.investedInColumn2),
          projectedValue:
            isProjecting && projTotals ? formatRupees(projTotals.investedInColumn2) : undefined,
        },
        {
          label: `${COLUMN_LABELS.growth} cash uninvested`,
          value: formatRupees(totals.unallocatedColumn2Cash),
          projectedValue:
            isProjecting && projTotals
              ? formatRupees(projTotals.unallocatedColumn2Cash)
              : undefined,
        },
        {
          label: `${COLUMN_LABELS.growth} to ${COLUMN_LABELS.reinvest.toLowerCase()}`,
          value: formatRupees(totals.routedToColumn3),
          projectedValue:
            isProjecting && projTotals ? formatRupees(projTotals.routedToColumn3) : undefined,
        },
        {
          label: `Reinvested into ${COLUMN_LABELS.core.toLowerCase()}`,
          value: formatRupees(totals.reinvestedIntoColumn1),
          projectedValue:
            isProjecting && projTotals
              ? formatRupees(projTotals.reinvestedIntoColumn1)
              : undefined,
        },
        {
          label: `${COLUMN_LABELS.reinvest} cash awaiting`,
          value: formatRupees(totals.column3CashBalance),
          projectedValue:
            isProjecting && projTotals ? formatRupees(projTotals.column3CashBalance) : undefined,
        },
      ],
    },
  ];
};

import { SelectedFund, SwpConfig } from './types';
import { SwpInterval } from './column1Types';
export function createSingleFund(chosen: {
  fundId: string;
  schemeName: string;
  fundType?: 'equity' | 'debt';
  expectedCagr?: number;
}): SelectedFund[] {
  return [
    {
      schemeCode: chosen.fundId,
      schemeName: chosen.schemeName,
      allocationPercent: 100,
      expectedCagr: chosen.expectedCagr || 12.5,
      fundType: chosen.fundType || 'equity',
    },
  ];
}
export function adaptSwpIntervals(
  swpIntervals: SwpInterval[],
  existingConfig: SwpConfig
): SwpConfig {
  const first = swpIntervals[0];
  return {
    ...existingConfig,
    startDate: first?.fromDate || existingConfig.startDate,
    baseAmount: first?.amount || existingConfig.baseAmount,
    hasChange: swpIntervals.length > 1,
    changeDate: swpIntervals[1]?.fromDate || existingConfig.changeDate,
    changeType: swpIntervals[1]?.stepUpType || 'percentage',
    changeValue: swpIntervals[1]?.stepUpValue || 10,
  };
}

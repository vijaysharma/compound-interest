import { useState, useMemo } from 'react';
import {
  calculatePPF,
  type PPFDepositTiming,
  type PPFExtensionMode,
  type PPFFrequency,
  type PPFCalculationResult,
} from '../../utilities/ppfCalculations';
import {
  DEFAULT_PROJECTED_PPF_RATE,
  MAX_PPF_ANNUAL_DEPOSIT,
  MIN_PPF_ANNUAL_DEPOSIT,
} from '../../data/ppfRates';
export function usePpfState() {
  const [frequency, setFrequency] = useState<PPFFrequency>('yearly');
  const [depositAmount, setDepositAmount] = useState<string>('150000');
  const [depositTiming, setDepositTiming] = useState<PPFDepositTiming>('before_5th');
  const [startYear, setStartYear] = useState<number>(2025);
  const [extensionBlocks, setExtensionBlocks] = useState<number>(0);
  const [extensionMode, setExtensionMode] = useState<PPFExtensionMode>('with_contribution');
  const [projectedRate, setProjectedRate] = useState<number>(DEFAULT_PROJECTED_PPF_RATE);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const numericDeposit = useMemo(() => {
    const raw = Number(depositAmount.replace(/[^0-9]/g, '')) || 0;
    if (frequency === 'yearly') {
      return Math.min(MAX_PPF_ANNUAL_DEPOSIT, Math.max(MIN_PPF_ANNUAL_DEPOSIT, raw));
    }
    return Math.min(12500, Math.max(100, raw));
  }, [depositAmount, frequency]);
  const ppfResult: PPFCalculationResult = useMemo(() => {
    return calculatePPF({
      depositAmount: numericDeposit,
      frequency,
      depositTiming,
      startYear,
      extensionBlocks,
      extensionMode,
      projectedRate,
    });
  }, [
    numericDeposit,
    frequency,
    depositTiming,
    startYear,
    extensionBlocks,
    extensionMode,
    projectedRate,
  ]);
  const investedPercent = useMemo(() => {
    if (!ppfResult.maturityAmount) return 50;
    return Math.round((ppfResult.totalInvested / ppfResult.maturityAmount) * 100);
  }, [ppfResult]);
  const gainsPercent = 100 - investedPercent;
  const wealthMultiplier = (ppfResult.maturityAmount / (ppfResult.totalInvested || 1)).toFixed(1);
  return {
    frequency, setFrequency,
    depositAmount, setDepositAmount,
    depositTiming, setDepositTiming,
    startYear, setStartYear,
    extensionBlocks, setExtensionBlocks,
    extensionMode, setExtensionMode,
    projectedRate, setProjectedRate,
    expandedYear, setExpandedYear,
    ppfResult,
    investedPercent,
    gainsPercent,
    wealthMultiplier,
  };
}

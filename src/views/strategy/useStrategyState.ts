import { useState, useMemo } from 'react';
import { SelectedFund, TopUpEvent, SwpConfig, SipConfig } from './types';
import { DEFAULT_SOURCE_FUNDS, DEFAULT_SIP_FUNDS } from './strategyPresets';
import { runStrategySimulation } from './strategyEngine';
export function useStrategyState() {
  const [investmentDate, setInvestmentDate] = useState('2024-01-01');
  const [investmentAmount, setInvestmentAmount] = useState('5000000');
  const [sourceFunds, setSourceFunds] = useState<SelectedFund[]>(DEFAULT_SOURCE_FUNDS);
  const [swpConfig, setSwpConfig] = useState<SwpConfig>({
    startDate: '2025-01-01',
    baseAmount: 35000,
    hasChange: true,
    changeDate: '2027-01-01',
    changeType: 'percentage',
    changeValue: 10,
  });
  const [sipConfig, setSipConfig] = useState<SipConfig>({
    enabled: true,
    linkToSwp: true,
    startDate: '2025-01-01',
    amount: 35000,
    stepUpFrequency: 'Yearly',
    stepUpPercent: 10,
  });
  const [sipFunds, setSipFunds] = useState<SelectedFund[]>(DEFAULT_SIP_FUNDS);
  const [topUps, setTopUps] = useState<TopUpEvent[]>([
    { id: 'tu-1', date: '2026-06-01', amount: 500000, note: 'Bonus allocation' },
  ]);
  const [durationYears, setDurationYears] = useState(10);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tax' | 'chart'>('timeline');
  const simulationResult = useMemo(() => {
    const numericAmount = parseFloat(investmentAmount) || 0;
    return runStrategySimulation(
      investmentDate,
      numericAmount,
      sourceFunds,
      swpConfig,
      sipConfig,
      sipFunds,
      topUps,
      durationYears * 12
    );
  }, [investmentDate, investmentAmount, sourceFunds, swpConfig, sipConfig, sipFunds, topUps, durationYears]);
  const handleAddTopUp = (date: string, amount: number, note?: string) => {
    setTopUps((prev) => [...prev, { id: `tu-${Date.now()}`, date, amount, note }]);
  };
  const handleRemoveTopUp = (id: string) => {
    setTopUps((prev) => prev.filter((t) => t.id !== id));
  };
  const handleUpdateFundCagr = (isSource: boolean, code: string, newCagr: number) => {
    const setter = isSource ? setSourceFunds : setSipFunds;
    setter((prev) => prev.map((f) => f.schemeCode === code ? { ...f, expectedCagr: newCagr } : f));
  };
  return {
    investmentDate, setInvestmentDate,
    investmentAmount, setInvestmentAmount,
    sourceFunds, setSourceFunds,
    swpConfig, setSwpConfig,
    sipConfig, setSipConfig,
    sipFunds, setSipFunds,
    topUps, handleAddTopUp, handleRemoveTopUp,
    durationYears, setDurationYears,
    activeTab, setActiveTab,
    simulationResult,
    handleUpdateFundCagr,
  };
}

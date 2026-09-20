import { useState, useCallback } from 'react';
import type { DetailedFundItem } from '../../components/MutualFundDetailModal';
import { getChartSeriesColor } from '../../data/chartColors';
import { getTodayISO } from '../../utilities/dateGuards';
import { getDateMinusYears, getTodayDate } from './useSwpStorage';
import type { SwpSavedState } from './types';
import type { usePinnedFunds } from '../../components/mutual-fund/usePinnedFunds';
import type { useFundSearch } from '../../components/mutual-fund/useFundSearch';
export function useSwpState() {
  const [lumpsumStartDate, setLumpsumStartDate] = useState<string | null>(getDateMinusYears(5));
  const [startSwpDate, setStartSwpDate] = useState<string | null>(getDateMinusYears(3));
  const [endSwpDate, setEndSwpDate] = useState<string | null>(getTodayDate());
  const [monthlyWithdrawalAmount, setMonthlyWithdrawalAmount] = useState('100000');
  const [lumpSumInvestmentAmount, setLumpSumInvestmentAmount] = useState('30000000');
  const [dayOfMonth, setDayOfMonth] = useState('3');
  const [investmentStepUp, setInvestmentStepUp] = useState('0');
  const [viewChart, setViewChart] = useState(true);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [detailModalFund, setDetailModalFund] = useState<DetailedFundItem | null>(null);
  const getRestoreHandler = useCallback(
    (pinned: ReturnType<typeof usePinnedFunds>, search: ReturnType<typeof useFundSearch>) =>
      (saved: SwpSavedState) => {
        search.setSearchKey(saved.searchKey);
        search.setSelectedType(saved.selectedType);
        search.setSelectedGrowth(saved.selectedGrowth);
        pinned.setSelectedCode(saved.selectedCode);
        setMonthlyWithdrawalAmount(saved.monthlyWithdrawalAmount);
        setLumpSumInvestmentAmount(saved.lumpSumInvestmentAmount);
        setDayOfMonth(saved.dayOfMonth);
        setInvestmentStepUp(saved.investmentStepUp);
        setViewChart(saved.viewChart);
        if (saved.pinnedFunds.length > 0) {
          pinned.setPinnedFunds(
            saved.pinnedFunds.map((fund, index) => ({ ...fund, color: getChartSeriesColor(index) }))
          );
        }
        if (saved.startSwpDate) setStartSwpDate(saved.startSwpDate);
        if (saved.endSwpDate) setEndSwpDate(saved.endSwpDate);
        if (saved.lumpsumStartDate) setLumpsumStartDate(saved.lumpsumStartDate);
      },
    []
  );
  const handleStartSwpDateChange = (val: string | null) => {
    if (!val) {
      setStartSwpDate(null);
      return;
    }
    setStartSwpDate(val);
    if (endSwpDate && val > endSwpDate) setEndSwpDate(val);
  };
  const handleEndSwpDateChange = (val: string | null) => {
    if (!val) {
      setEndSwpDate(null);
      return;
    }
    const today = getTodayISO();
    const safeVal = val > today ? today : val;
    setEndSwpDate(safeVal);
    if (startSwpDate && startSwpDate > safeVal) setStartSwpDate(safeVal);
  };
  const getCurrentState = (
    pinned: ReturnType<typeof usePinnedFunds>,
    search: ReturnType<typeof useFundSearch>
  ): SwpSavedState => ({
    searchKey: search.searchKey,
    selectedType: search.selectedType,
    selectedGrowth: search.selectedGrowth,
    selectedCode: pinned.selectedCode,
    monthlyWithdrawalAmount,
    lumpSumInvestmentAmount,
    viewChart,
    pinnedFunds: pinned.pinnedFunds
      .slice(0, 8)
      .map(({ schemeCode, schemeName }) => ({ schemeCode, schemeName })),
    startSwpDate,
    endSwpDate,
    lumpsumStartDate,
    dayOfMonth,
    investmentStepUp,
  });
  return {
    lumpsumStartDate,
    setLumpsumStartDate,
    startSwpDate,
    setStartSwpDate,
    endSwpDate,
    setEndSwpDate,
    monthlyWithdrawalAmount,
    setMonthlyWithdrawalAmount,
    lumpSumInvestmentAmount,
    setLumpSumInvestmentAmount,
    dayOfMonth,
    setDayOfMonth,
    investmentStepUp,
    setInvestmentStepUp,
    viewChart,
    setViewChart,
    isFundSelectorOpen,
    setIsFundSelectorOpen,
    detailModalFund,
    setDetailModalFund,
    getRestoreHandler,
    getCurrentState,
    handleStartSwpDateChange,
    handleEndSwpDateChange,
  };
}

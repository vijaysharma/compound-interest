import { useState } from 'react';
import Tabs from '../components/Tabs';
import MutualFund, { MutualFundSelection } from './lumpsum';
import { calculateSip, calculateSwp, SimulationResult } from '../utilities/mutualFundCalculations';
const formatCurrency = (value: number) =>
  value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const Result = ({
  result,
  mode,
  name,
}: {
  result: SimulationResult;
  mode: 'sip' | 'swp';
  name: string;
}) => (
  <div className="border border-primary p-2">
    <div className="truncate font-semibold" title={name}>
      {name}
    </div>
    <div className="text-sm">
      {mode === 'sip' ? 'Invested' : 'Initial investment'}: {formatCurrency(result.invested)}
    </div>
    {mode === 'swp' && <div className="text-sm">Withdrawn: {formatCurrency(result.withdrawn)}</div>}
    <div className="text-lg font-semibold">Value at end: {formatCurrency(result.currentValue)}</div>
    <div className="text-xs opacity-70">Final NAV {result.lastNav.toFixed(4)}</div>
  </div>
);
const SWP = () => {
  const [selection, setSelection] = useState<MutualFundSelection>({
    funds: [],
    navData: {},
    startDate: null,
    endDate: null,
  });
  const [activeTab, setActiveTab] = useState('sip');
  const [monthlyAmount, setMonthlyAmount] = useState('10000');
  const [initialInvestment, setInitialInvestment] = useState('1000000');
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState('10000');
  const [investmentStepUp, setInvestmentStepUp] = useState('10');
  const [withdrawalStepUp, setWithdrawalStepUp] = useState('5');
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [error, setError] = useState('');
  const calculate = (mode: 'sip' | 'swp') => {
    setError('');
    const nextResults: Record<string, SimulationResult> = {};
    if (selection.funds.length === 0) {
      setError('Select at least one mutual fund. You can compare up to four.');
      return;
    }
    try {
      for (const fund of selection.funds) {
        const navData = selection.navData[fund.schemeCode] ?? [];
        nextResults[fund.schemeCode] =
          mode === 'sip'
            ? calculateSip(
                navData,
                selection.startDate ?? '',
                selection.endDate ?? '',
                Number(monthlyAmount),
                Number(investmentStepUp)
              )
            : calculateSwp(
                navData,
                selection.startDate ?? '',
                selection.endDate ?? '',
                Number(initialInvestment),
                Number(monthlyWithdrawal),
                Number(withdrawalStepUp)
              );
      }
      setResults(nextResults);
    } catch (calculationError) {
      setResults({});
      setError(
        calculationError instanceof Error ? calculationError.message : 'Unable to calculate.'
      );
    }
  };
  const renderResults = (mode: 'sip' | 'swp') =>
    Object.keys(results).length > 0 && (
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {selection.funds.map(
          (fund) =>
            results[fund.schemeCode] && (
              <Result
                key={fund.schemeCode}
                name={fund.schemeName}
                result={results[fund.schemeCode]}
                mode={mode}
              />
            )
        )}
      </div>
    );
  return (
    <>
      <MutualFund onSelectionChange={setSelection} />
      {error && <div className="alert alert-error mt-3">{error}</div>}
      <Tabs
        name="mutual-fund-plan"
        type="tabs-border"
        activeId={activeTab}
        setActiveId={(id) => {
          setActiveTab(id);
          setResults({});
        }}
      >
        <div id="sip" data-label="SIP">
          <label className="flex flex-col mb-3">
            <span className="text-sm mb-1">Monthly investment</span>
            <input
              className="input input-primary"
              type="number"
              min="1"
              value={monthlyAmount}
              onChange={(event) => setMonthlyAmount(event.target.value)}
            />
          </label>
          <label className="flex flex-col mb-3">
            <span className="text-sm mb-1">Yearly investment increase (%)</span>
            <input
              className="input input-primary"
              type="number"
              min="0"
              value={investmentStepUp}
              onChange={(event) => setInvestmentStepUp(event.target.value)}
            />
          </label>
          <button type="button" className="btn btn-primary w-full" onClick={() => calculate('sip')}>
            Calculate SIP for selected funds
          </button>
          {renderResults('sip')}
        </div>
        <div id="swp" data-label="SWP">
          <label className="flex flex-col mb-3">
            <span className="text-sm mb-1">Initial investment</span>
            <input
              className="input input-primary"
              type="number"
              min="1"
              value={initialInvestment}
              onChange={(event) => setInitialInvestment(event.target.value)}
            />
          </label>
          <label className="flex flex-col mb-3">
            <span className="text-sm mb-1">Monthly withdrawal</span>
            <input
              className="input input-primary"
              type="number"
              min="1"
              value={monthlyWithdrawal}
              onChange={(event) => setMonthlyWithdrawal(event.target.value)}
            />
          </label>
          <label className="flex flex-col mb-3">
            <span className="text-sm mb-1">Yearly withdrawal increase (%)</span>
            <input
              className="input input-primary"
              type="number"
              min="0"
              value={withdrawalStepUp}
              onChange={(event) => setWithdrawalStepUp(event.target.value)}
            />
          </label>
          <button type="button" className="btn btn-primary w-full" onClick={() => calculate('swp')}>
            Calculate SWP for selected funds
          </button>
          {renderResults('swp')}
        </div>
      </Tabs>
    </>
  );
};
export default SWP;

import React from 'react';
import { TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import { VerdictBanner } from './VerdictBanner';
import { RegimeComparisonCards } from './RegimeComparisonCards';
import { BreakevenCard } from './BreakevenCard';
import { TaxStrategyCard } from './TaxStrategyCard';
import { InstantStrategiesCard } from './InstantStrategiesCard';
import styles from '../IncomeTaxCalculator.module.scss';
interface TaxResultsColProps {
  comparison: TaxComparisonResult;
  isSalaried: boolean;
  currencySymbol: string;
  hasTaxPro: boolean;
  strategyLoading: boolean;
  strategyAdvice: string | null;
  strategyQuestion: string;
  setStrategyQuestion: (q: string) => void;
  showUpgradeGate: boolean;
  onGenerateAdvice: (q?: string) => Promise<void>;
  onUpgrade: () => void;
}
export const TaxResultsCol: React.FC<TaxResultsColProps> = ({
  comparison,
  isSalaried,
  currencySymbol,
  hasTaxPro,
  strategyLoading,
  strategyAdvice,
  strategyQuestion,
  setStrategyQuestion,
  showUpgradeGate,
  onGenerateAdvice,
  onUpgrade,
}) => {
  const isNewWinner = comparison.recommendedRegime === 'new';
  return (
    <div className={styles.taxResultsCol}>
      <VerdictBanner
        isNewWinner={isNewWinner}
        taxSavings={comparison.taxSavings}
        currencySymbol={currencySymbol}
      />
      <RegimeComparisonCards
        comparison={comparison}
        isNewWinner={isNewWinner}
        isSalaried={isSalaried}
        currencySymbol={currencySymbol}
      />
      <BreakevenCard comparison={comparison} currencySymbol={currencySymbol} />
      <TaxStrategyCard
        hasTaxPro={hasTaxPro}
        strategyLoading={strategyLoading}
        strategyAdvice={strategyAdvice}
        strategyQuestion={strategyQuestion}
        setStrategyQuestion={setStrategyQuestion}
        showUpgradeGate={showUpgradeGate}
        onGenerateAdvice={onGenerateAdvice}
        onUpgrade={onUpgrade}
      />
      <InstantStrategiesCard
        tips={comparison.optimizationTips}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};

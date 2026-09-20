import React from 'react';
import { TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import { NewRegimeCard } from './NewRegimeCard';
import { OldRegimeCard } from './OldRegimeCard';
import styles from '../IncomeTaxCalculator.module.scss';
interface RegimeComparisonCardsProps {
  comparison: TaxComparisonResult;
  isNewWinner: boolean;
  isSalaried: boolean;
  currencySymbol: string;
}
export const RegimeComparisonCards: React.FC<RegimeComparisonCardsProps> = ({
  comparison,
  isNewWinner,
  isSalaried,
  currencySymbol,
}) => {
  return (
    <section className={styles.comparisonGrid}>
      <NewRegimeCard
        regime={comparison.newRegime}
        isNewWinner={isNewWinner}
        isSalaried={isSalaried}
        currencySymbol={currencySymbol}
      />
      <OldRegimeCard
        regime={comparison.oldRegime}
        isOldWinner={!isNewWinner}
        isSalaried={isSalaried}
        currencySymbol={currencySymbol}
      />
    </section>
  );
};

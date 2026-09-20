import React from 'react';
import { Link } from '@/navigation';
import DisplayCard from '../../components/DisplayCard';
import styles from '../CalculatorPage.module.scss';
interface PPPResultsColProps {
  tgtAmt: string;
  primarySub: string;
  targetCurrencySymbol: string;
  targetLocale: string;
  tgtCountry: string;
  tgtExAmt: number;
}
export const PPPResultsCol: React.FC<PPPResultsColProps> = ({
  tgtAmt,
  primarySub,
  targetCurrencySymbol,
  targetLocale,
  tgtCountry,
  tgtExAmt,
}) => {
  return (
    <div className={styles.resultsCol}>
      <DisplayCard
        primaryAmount={parseFloat(parseFloat(tgtAmt || '0').toFixed(2))}
        primarySub={primarySub}
        currencySymbol={targetCurrencySymbol || 'XYZ'}
        locale={targetLocale || 'en-US'}
        title={`Equivalent Purchasing Power in ${tgtCountry}`}
      />
      <DisplayCard
        primaryAmount={parseFloat(tgtExAmt.toFixed(2))}
        currencySymbol={targetCurrencySymbol || 'XYZ'}
        locale={targetLocale || 'en-US'}
        title={
          tgtExAmt === 0
            ? `No live exchange rate available for ${tgtCountry}`
            : `Nominal Forex Conversion in ${tgtCountry}`
        }
      />
      <div className={styles.promoCard}>
        <div className={styles.promoContent}>
          <span className={styles.promoText}>
            Looking for pure real-time foreign exchange rates across 160+ world currencies?
          </span>
          <Link to="/currency-converter" className={styles.promoLink}>
            <span>Try Currency Converter &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

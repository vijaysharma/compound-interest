import React from 'react';
import { Link } from '@/navigation';
import { FiTrendingUp, FiRefreshCw, FiInfo, FiArrowRight } from 'react-icons/fi';
import DisplayCard from '../../components/DisplayCard';
import { CountryCurrencyInfo } from './currencyDataUtils';
import styles from '../CurrencyConverter.module.scss';
interface CurrencyResultsColProps {
  exchangeRate: number;
  convertedAmount: number;
  targetCurrency: CountryCurrencyInfo;
  sourceCurrency: CountryCurrencyInfo;
  numericAmount: number;
  srcCountry: string;
  tgtCountry: string;
  inverseRate: number;
  lastRefreshed: string;
  handleRefresh: () => void;
  loading: boolean;
}
export const CurrencyResultsCol: React.FC<CurrencyResultsColProps> = ({
  exchangeRate,
  convertedAmount,
  targetCurrency,
  sourceCurrency,
  numericAmount,
  srcCountry,
  tgtCountry,
  inverseRate,
  lastRefreshed,
  handleRefresh,
  loading,
}) => {
  const displayTitle =
    exchangeRate > 0
      ? `${numericAmount.toLocaleString(sourceCurrency.locale)} ${sourceCurrency.code} (${srcCountry}) =`
      : `No live exchange rate available for ${tgtCountry} (${targetCurrency.code})`;
  return (
    <div className={styles.resultsCol}>
      <DisplayCard
        primaryAmount={exchangeRate > 0 ? parseFloat(convertedAmount.toFixed(2)) : 0}
        currencySymbol={targetCurrency.symbol}
        locale={targetCurrency.locale}
        title={displayTitle}
      />
      <div className={styles.rateBar}>
        <div className={styles.rateLeft}>
          <FiTrendingUp className={styles.rateTrendIcon} />
          <span>
            1 {sourceCurrency.code} ={' '}
            <strong className={styles.rateStrong}>
              {exchangeRate > 0 ? exchangeRate.toFixed(4) : 'N/A'} {targetCurrency.code}
            </strong>
          </span>
          {inverseRate > 0 && (
            <>
              <span className={styles.rateDot}>&bull;</span>
              <span className={styles.rateInverse}>
                1 {targetCurrency.code} = {inverseRate.toFixed(4)} {sourceCurrency.code}
              </span>
            </>
          )}
        </div>
        <div className={styles.rateRight}>
          <span>Updated: {lastRefreshed}</span>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading}
            className={styles.refreshBtn}
            title="Refresh live exchange rates"
            aria-label="Refresh live exchange rates"
          >
            <FiRefreshCw className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>
      <div className={`${styles.promoCard} ${styles.marginZero}`}>
        <div className={styles.promoInner}>
          <div className={styles.promoIconBox}>
            <FiInfo />
          </div>
          <div>
            <h3 className={styles.promoTitle}>
              Need to compare purchasing power instead of exchange rates?
            </h3>
            <p className={styles.promoDesc}>
              Nominal exchange rates don&apos;t account for local costs of living. Use our
              Purchasing Power Parity (PPP) calculator to see real living standard equivalents.
            </p>
            <Link to="/ppp-calculator" className={styles.promoLink}>
              <span>Compare salaries using PPP Calculator</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

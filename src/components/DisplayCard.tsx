import convertToWords from '../utilities/currency';
import { IndianFormat } from '../data/currencyCodes';
import { DisplayType } from '../types/types';
import styles from './DisplayCard.module.scss';
const DisplayCard = ({
  primaryAmount,
  primarySub,
  title,
  secondaryInfo,
  colorClass,
  currencySymbol = '₹',
  locale = 'en-IN',
}: DisplayType) => {
  // Always use English numerals: en-IN for Indian numbering, en-US for all others
  const formatLocale = locale === 'en-IN' || IndianFormat.includes(locale) ? 'en-IN' : 'en-US';
  return (
    <div className={styles.card}>
      <div className={styles.statItem}>
        <div className={styles.title}>{title || 'Balance amount'}</div>
        <div
          className={`${styles.value} ${
            colorClass === 'error' || colorClass === 'text-error'
              ? styles.textError
              : colorClass === 'primary' || colorClass === 'text-primary'
                ? styles.textPrimary
                : (colorClass || '')
          }`.trim()}
        >
          <span className={styles.currency}>{currencySymbol}&nbsp;</span>
          {primaryAmount.toLocaleString(formatLocale)}{' '}
          {primarySub && <span className={styles.sub}> {primarySub}</span>}
        </div>
        <div className={styles.words}>
          {convertToWords(primaryAmount, formatLocale)}
        </div>
      </div>
      {secondaryInfo && (
        <div className={styles.statItem}>
          <div className={styles.title}>{secondaryInfo.title}</div>
          <div className={styles.value}>
            <span className={styles.currency}>{currencySymbol}&nbsp;</span>
            {secondaryInfo.amount.toLocaleString(formatLocale)}
          </div>
          <div className={styles.words}>
            {convertToWords(secondaryInfo.amount, formatLocale)}
          </div>
        </div>
      )}
    </div>
  );
};
export default DisplayCard;

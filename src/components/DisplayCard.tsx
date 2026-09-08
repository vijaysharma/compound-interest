import convertToWords from '../utilities/currency';
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
  return (
    <div className={styles.card}>
      <div className={styles.statItem}>
        <div className={styles.title}>{title || 'Balance amount'}</div>
        <div className={`${styles.value} ${colorClass || ''}`.trim()}>
          <span className={styles.currency}>{currencySymbol}&nbsp;</span>
          {primaryAmount.toLocaleString(locale)}{' '}
          {primarySub && <span className={styles.sub}> {primarySub}</span>}
        </div>
        <div className={styles.words}>
          {convertToWords(primaryAmount, locale)}
        </div>
      </div>
      {secondaryInfo && (
        <div className={styles.statItem}>
          <div className={styles.title}>{secondaryInfo.title}</div>
          <div className={styles.value}>
            <span className={styles.currency}>{currencySymbol}&nbsp;</span>
            {secondaryInfo.amount.toLocaleString(locale)}
          </div>
          <div className={styles.words}>
            {convertToWords(secondaryInfo.amount, locale)}
          </div>
        </div>
      )}
    </div>
  );
};
export default DisplayCard;

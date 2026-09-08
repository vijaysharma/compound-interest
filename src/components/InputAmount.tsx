import { useState } from 'react';
import JoinedButtonGroup from './JoinedButtonGroup';
import convertToWords from '../utilities/currency';
import { sanctnum } from '../utilities/numSanitity';
import { InputType } from '../types/types';
import styles from './InputAmount.module.scss';
const InputAmount = ({
  inputAmount,
  setInputAmount,
  currencySymbol = '₹',
  typeSizePrefix = 'sm',
  stepData,
  stepSizePrefix,
  type,
  setType,
  typeData,
  title = 'Invested amount',
  className = '',
  locale = 'en-IN',
  compact = true,
}: InputType) => {
  const [sum, setSum] = useState('+');
  const setSumValue = (amnt: string): void => {
    const initialAmount = parseInt(amnt, 10);
    let total = parseInt(inputAmount, 10);
    if (sum === '+') total += initialAmount;
    if (sum === '-') {
      total -= initialAmount;
      if (total <= 0) {
        total = 0;
        setInputAmount(total.toString());
        setSum('+');
        return;
      }
    }
    setInputAmount(total.toString());
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {!type && !compact && <h5 className={styles.title}>{title}</h5>}
      <div className={styles.compoundWrapper}>
        {type && typeData && setType && (
          <JoinedButtonGroup
            data={typeData}
            selectedValue={type}
            updateSelectedValue={setType}
            sizePrefix={typeSizePrefix}
            attached="top"
          />
        )}
        <div
          className={`${styles.middleRow} ${type ? styles.hasTopGroup : ''} ${
            stepData ? styles.hasBottomGroup : ''
          }`}
        >
          <div className={`${styles.currencyPrefix} ${compact ? styles.compact : ''}`}>
            {compact ? `${title} (${currencySymbol || '₹'})` : currencySymbol || '₹'}
          </div>
          <input
            type="number"
            min="0"
            placeholder="Type here"
            className={styles.numberInput}
            value={inputAmount?.replace(/^0+/, '') || 0}
            onChange={(e) => setInputAmount(e.target?.value)}
          />
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              setInputAmount('0');
              setSum('+');
            }}
            aria-label="Clear amount"
          >
            C
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${sum === '+' ? styles.active : ''}`}
            onClick={() => setSum('+')}
            aria-label="Add amount"
          >
            +
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.lastActionBtn} ${
              sum === '-' ? styles.active : ''
            }`}
            onClick={() => setSum('-')}
            disabled={inputAmount === '0'}
            aria-label="Subtract amount"
          >
            -
          </button>
        </div>
        {stepData && (
          <JoinedButtonGroup
            data={stepData}
            selectedValue={sum}
            sizePrefix={stepSizePrefix}
            updateSelectedValue={setSumValue}
            attached="bottom"
          />
        )}
      </div>
      <div className={styles.words}>
        {convertToWords(sanctnum(inputAmount), locale)}
      </div>
    </div>
  );
};
export default InputAmount;

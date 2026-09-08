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
      <div className={styles.inputGroup}>
        {type && typeData && setType && (
          <JoinedButtonGroup
            data={typeData}
            selectedValue={type}
            updateSelectedValue={setType}
            sizePrefix={typeSizePrefix}
            btnClass="rounded-bl-none rounded-br-none border-b-0"
          />
        )}
        <div className={`join ${styles.inputRow}`}>
          <div
            className={`join-item ${styles.currencyLabel} ${type ? styles.hasType : ''} ${
              compact ? 'px-2' : 'w-12'
            }`}
          >
            {compact ? `${title} (${currencySymbol || '₹'})` : currencySymbol || '₹'}
          </div>
          <input
            type="number"
            min="0"
            placeholder="Type here"
            className={`join-item input input-primary ${styles.numberInput}`}
            value={inputAmount?.replace(/^0+/, '') || 0}
            onChange={(e) => setInputAmount(e.target?.value)}
          />
          <button
            type="button"
            className={`join-item ${styles.btnAction}`}
            onClick={() => {
              setInputAmount('0');
              setSum('+');
            }}
          >
            C
          </button>
          <button
            type="button"
            className={`join-item ${styles.btnAction} ${sum === '+' ? styles.active : ''}`}
            onClick={() => setSum('+')}
          >
            +
          </button>
          <button
            type="button"
            className={`join-item ${styles.btnAction} ${sum === '-' ? styles.active : ''} ${
              !type ? 'rounded-tr-none' : ''
            }`}
            onClick={() => setSum('-')}
            disabled={inputAmount === '0'}
          >
            -
          </button>
        </div>
        <JoinedButtonGroup
          data={stepData}
          selectedValue={sum}
          sizePrefix={stepSizePrefix}
          updateSelectedValue={setSumValue}
          btnClass="rounded-tl-none rounded-tr-none border-t-0"
        />
      </div>
      <div className={styles.words}>
        {convertToWords(sanctnum(inputAmount), locale)}
      </div>
    </div>
  );
};
export default InputAmount;

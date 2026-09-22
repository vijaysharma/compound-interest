import React from 'react';
import { FiRepeat } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import CountrySelect from '../../components/CountrySelect';
import { IndianFormat } from '../../data/currencyCodes';
import { CountryPPPType } from '../../types/types';
import styles from '../CalculatorPage.module.scss';
interface PPPInputsColProps {
  title?: string;
  data: Record<string, CountryPPPType>;
  srcCountry: string;
  tgtCountry: string;
  setSrcCountry: (v: string) => void;
  setTgtCountry: (v: string) => void;
  handleSwapCountries: () => void;
  srcAmt: string;
  setSrcAmt: (v: string) => void;
  sourceLocale?: string;
  sourceCurrencySymbol?: string;
}
export const PPPInputsCol: React.FC<PPPInputsColProps> = ({
  title,
  data,
  srcCountry,
  tgtCountry,
  setSrcCountry,
  setTgtCountry,
  handleSwapCountries,
  srcAmt,
  setSrcAmt,
  sourceLocale,
  sourceCurrencySymbol,
}) => {
  const isIndianLocale = IndianFormat.includes(sourceLocale || '');
  return (
    <div className={styles.inputsCol}>
      <div className={styles.formStack}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <ValuePicker
          variant="paired"
          sourceBadgeText="Source"
          targetBadgeText="Target"
          sourceSlot={(
            <CountrySelect
              label="source"
              value={srcCountry}
              countries={Object.keys(data)}
              onChange={setSrcCountry}
              getSecondaryText={(country) => data[country]?.currencyName}
            />
          )}
          targetSlot={(
            <CountrySelect
              label="target"
              value={tgtCountry}
              countries={Object.keys(data)}
              onChange={setTgtCountry}
              getSecondaryText={(country) => data[country]?.currencyName}
            />
          )}
        />
        <div className={styles.swapRow}>
          <button type="button" onClick={handleSwapCountries} className={styles.swapBtn}>
            <FiRepeat className={styles.swapIcon} />
            <span>Swap source &amp; target countries</span>
          </button>
        </div>
        <ValuePicker
          value={srcAmt}
          onChange={setSrcAmt}
          className={styles.fieldTight}
          title="Amount"
          stepData={[
            { id: 'ip1', value: '50000000', title: isIndianLocale ? '5Cr' : '50M' },
            { id: 'ip2', value: '5000000', title: isIndianLocale ? '50L' : '5M' },
            { id: 'ip3', value: '500000', title: isIndianLocale ? '5L' : '500K' },
            { id: 'ip4', value: '50000', title: '50K' },
            { id: 'ip5', value: '5000', title: '5K' },
            { id: 'ip6', value: '500', title: '500' },
            { id: 'ip7', value: '50', title: '50' },
          ]}
          symbol={sourceCurrencySymbol || 'XYZ'}
          locale={sourceLocale || 'en-US'}
        />
      </div>
    </div>
  );
};

import React from 'react';
import { FiRepeat } from 'react-icons/fi';
import ValuePicker from '../../components/ValuePicker';
import CountrySelect from '../../components/CountrySelect';
import { IndianFormat } from '../../data/currencyCodes';
import { CountryCurrencyInfo } from './currencyDataUtils';
import styles from '../CurrencyConverter.module.scss';
interface CurrencyInputsColProps {
  srcCountry: string;
  tgtCountry: string;
  availableCountries: string[];
  countryData: Map<string, CountryCurrencyInfo>;
  setSrcCountry: (v: string) => void;
  setTgtCountry: (v: string) => void;
  handleSwapCountries: () => void;
  amount: string;
  setAmount: (v: string) => void;
  sourceCurrency: CountryCurrencyInfo;
  error: string | null;
  handleRefresh: () => void;
}
export const CurrencyInputsCol: React.FC<CurrencyInputsColProps> = ({
  srcCountry,
  tgtCountry,
  availableCountries,
  countryData,
  setSrcCountry,
  setTgtCountry,
  handleSwapCountries,
  amount,
  setAmount,
  sourceCurrency,
  error,
  handleRefresh,
}) => {
  return (
    <div className={styles.inputsCol}>
      <ValuePicker
        variant="paired"
        sourceBadgeText="Source"
        targetBadgeText="Target"
        sourceSlot={(
          <CountrySelect
            label="source"
            value={srcCountry}
            countries={availableCountries}
            onChange={setSrcCountry}
            getSecondaryText={(country) => countryData.get(country)?.code}
          />
        )}
        targetSlot={(
          <CountrySelect
            label="target"
            value={tgtCountry}
            countries={availableCountries}
            onChange={setTgtCountry}
            getSecondaryText={(country) => countryData.get(country)?.code}
          />
        )}
      />
      <div className={styles.swapRow}>
        <button type="button" onClick={handleSwapCountries} className={styles.swapBtn}>
          <FiRepeat />
          <span>Swap source &amp; target countries</span>
        </button>
      </div>
      <ValuePicker
        value={amount}
        onChange={setAmount}
        className={styles.amountField}
        title="Amount"
        stepData={[
          {
            id: 'ip1',
            value: '50000000',
            title: `${IndianFormat.includes(sourceCurrency.locale) ? '5Cr' : '50M'}`,
          },
          {
            id: 'ip2',
            value: '5000000',
            title: `${IndianFormat.includes(sourceCurrency.locale) ? '50L' : '5M'}`,
          },
          {
            id: 'ip3',
            value: '500000',
            title: `${IndianFormat.includes(sourceCurrency.locale) ? '5L' : '500K'}`,
          },
          { id: 'ip4', value: '50000', title: '50K' },
          { id: 'ip5', value: '5000', title: '5K' },
          { id: 'ip6', value: '500', title: '500' },
          { id: 'ip7', value: '50', title: '50' },
        ]}
        symbol={sourceCurrency.symbol}
        locale={sourceCurrency.locale}
        tabSize="sm"
      />
      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            className={styles.retryBtn}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import CalculatorContentSection from '../components/CalculatorContentSection';
import { currencyConverterSchema } from '../data/seo/currencyConverterSchema';
import { currencyFaqs } from '../data/seo/currencyConverterData';
import { useCurrencyConverter } from './currency-converter/useCurrencyConverter';
import { CurrencyConverterHeader } from './currency-converter/CurrencyConverterHeader';
import { CurrencyInputsCol } from './currency-converter/CurrencyInputsCol';
import { CurrencyResultsCol } from './currency-converter/CurrencyResultsCol';
import styles from './CurrencyConverter.module.scss';
const CurrencyConverter = () => {
  const {
    loading,
    error,
    srcCountry,
    setSrcCountry,
    tgtCountry,
    setTgtCountry,
    amount,
    setAmount,
    lastRefreshed,
    countryData,
    availableCountries,
    sourceCurrency,
    targetCurrency,
    numericAmount,
    exchangeRate,
    inverseRate,
    convertedAmount,
    handleRefresh,
    handleSwapCountries,
  } = useCurrencyConverter();
  return (
    <main className={styles.container}>
      <SEOHead
        title="Currency Converter — Live Foreign Exchange Rates India 2026"
        description="Free real-time currency converter with live mid-market forex rates for 160+ currencies including USD to INR, EUR to INR, GBP to INR, AED to INR. 100% private."
        keywords="currency converter, live exchange rates, USD to INR, EUR to INR, GBP to INR, AED to INR, foreign exchange converter India, forex rates live, currency exchange calculator"
        canonicalPath="/currency-converter"
        schema={currencyConverterSchema}
      />
      <CurrencyConverterHeader />
      <div className={styles.converterSection}>
        <CurrencyInputsCol
          srcCountry={srcCountry}
          tgtCountry={tgtCountry}
          availableCountries={availableCountries}
          countryData={countryData}
          setSrcCountry={setSrcCountry}
          setTgtCountry={setTgtCountry}
          handleSwapCountries={handleSwapCountries}
          amount={amount}
          setAmount={setAmount}
          sourceCurrency={sourceCurrency}
          error={error}
          handleRefresh={handleRefresh}
        />
        <CurrencyResultsCol
          exchangeRate={exchangeRate}
          convertedAmount={convertedAmount}
          targetCurrency={targetCurrency}
          sourceCurrency={sourceCurrency}
          numericAmount={numericAmount}
          srcCountry={srcCountry}
          tgtCountry={tgtCountry}
          inverseRate={inverseRate}
          lastRefreshed={lastRefreshed}
          handleRefresh={handleRefresh}
          loading={loading}
        />
      </div>
      <CalculatorContentSection
        title="Live Foreign Exchange (Forex) Rates & Currency Conversion"
        subtitle="Global exchange rates change by the millisecond driven by interest rate decisions, global trade flows, inflation rates, and geopolitical shifts. Understand mid-market rates to make smarter travel, remittance, and international business transactions."
        keyBenefits={[
          {
            title: 'Real Mid-Market Rates',
            description:
              'View true wholesale interbank foreign exchange rates without hidden fees or markups.',
          },
          {
            title: '160+ Currencies Supported',
            description:
              'Convert between any sovereign currencies worldwide with instant bidirectional updates.',
          },
          {
            title: 'Zero Latency & 100% Private',
            description:
              'Calculations run client-side in your browser. None of your conversion amounts are logged.',
          },
        ]}
        faqs={currencyFaqs}
      />
    </main>
  );
};
export default CurrencyConverter;

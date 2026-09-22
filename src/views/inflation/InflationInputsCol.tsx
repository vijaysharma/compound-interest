import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import styles from '../CalculatorPage.module.scss';
interface InflationInputsColProps {
  title?: string;
  principal: string;
  setPrincipal: (v: string) => void;
  place: string;
  setPlace: (v: string) => void;
  locale: string;
  currencySymbol: string;
  startYear: string;
  endYear: string;
  setStartYear: (v: string) => void;
  setEndYear: (v: string) => void;
  startYearOptions: string[];
  endYearOptions: string[];
}
export const InflationInputsCol: React.FC<InflationInputsColProps> = ({
  title,
  principal,
  setPrincipal,
  place,
  setPlace,
  locale,
  currencySymbol,
  startYear,
  endYear,
  setStartYear,
  setEndYear,
  startYearOptions,
  endYearOptions,
}) => {
  const isUSOrEU = locale === 'en-US' || locale === 'en-EU';
  return (
    <div className={styles.inputsCol}>
      <div className={styles.formStack}>
        {title && <h5 className={styles.sectionTitle}>{title}</h5>}
        <ValuePicker
          className={styles.fieldTight}
          value={principal}
          onChange={setPrincipal}
          activeTab={place}
          onTabChange={setPlace}
          tabs={[
            { id: 'India', title: 'India' },
            { id: 'World', title: 'World' },
            { id: 'USA', title: 'USA' },
            { id: 'EU', title: 'EU' },
          ]}
          stepData={[
            { id: 'p1', value: '50000000', title: isUSOrEU ? '50M' : '5Cr' },
            { id: 'p2', value: '5000000', title: isUSOrEU ? '5M' : '50L' },
            { id: 'p3', value: '500000', title: isUSOrEU ? '500K' : '5L' },
            { id: 'p4', value: '50000', title: '50K' },
            { id: 'p5', value: '5000', title: '5K' },
            { id: 'p6', value: '500', title: '100' },
          ]}
          symbol={currencySymbol}
          locale={locale}
          singleRow={true}
          tabSize="sm"
        />
        <ValuePicker
          variant="date-range"
          dateMode="year"
          startDate={startYear}
          endDate={endYear}
          setStartDate={setStartYear}
          setEndDate={setEndYear}
          startYearOptions={startYearOptions}
          endYearOptions={endYearOptions}
        />
      </div>
    </div>
  );
};

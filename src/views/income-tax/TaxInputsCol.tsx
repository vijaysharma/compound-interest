import React, { useState } from 'react';
import { Form16Banner } from './Form16Banner';
import { TaxInputsHeader } from './TaxInputsHeader';
import { TabsNav, TaxInputTab } from './TabsNav';
import { TaxTabContent } from './TaxTabContent';
import { useIncomeTaxInputs } from './useIncomeTaxInputs';
import styles from '../IncomeTaxCalculator.module.scss';
interface TaxInputsColProps {
  taxState: ReturnType<typeof useIncomeTaxInputs>;
  currencySymbol: string;
  onNavigateFileItr: () => void;
}
export const TaxInputsCol: React.FC<TaxInputsColProps> = ({
  taxState,
  currencySymbol,
  onNavigateFileItr,
}) => {
  const [activeTab, setActiveTab] = useState<TaxInputTab>('salary');
  return (
    <div className={styles.taxInputsCol}>
      <Form16Banner onNavigateFileItr={onNavigateFileItr} />
      <section>
        <TaxInputsHeader
          financialYear={taxState.financialYear}
          setFinancialYear={taxState.setFinancialYear}
          ageCategory={taxState.ageCategory}
          setAgeCategory={taxState.setAgeCategory}
        />
        <TabsNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <TaxTabContent
          activeTab={activeTab}
          taxState={taxState}
          currencySymbol={currencySymbol}
        />
      </section>
    </div>
  );
};

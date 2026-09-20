import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { BUSINESS_STEPS } from './constants';
import styles from '../IncomeTaxCalculator.module.scss';
interface BusinessTabProps {
  businessIncome: string;
  setBusinessIncome: (val: string) => void;
}
export const BusinessTab: React.FC<BusinessTabProps> = ({
  businessIncome,
  setBusinessIncome,
}) => {
  return (
    <div>
      <p className={styles.cardDesc}>
        Enter net profits from freelance work, consultation, digital creator income, or a second
        business (under Section 44AD / 44ADA or regular accounting).
      </p>
      <ValuePicker
        title="Net Profit from Business / Profession"
        value={businessIncome}
        onChange={setBusinessIncome}
        stepData={BUSINESS_STEPS}
        min={0}
        max={50000000}
      />
    </div>
  );
};

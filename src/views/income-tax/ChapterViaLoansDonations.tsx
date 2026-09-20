import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
import { ChapterViaLoansDonationsProps } from './types';
interface DeductionFieldItem {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
export const ChapterViaLoansDonations: React.FC<ChapterViaLoansDonationsProps> = ({
  section80E,
  setSection80E,
  section80G,
  setSection80G,
  section80Tta,
  setSection80Tta,
  section80Gg,
  setSection80Gg,
  section80Ddb,
  setSection80Ddb,
  section80U,
  setSection80U,
  section80Eea,
  setSection80Eea,
  section80Eeb,
  setSection80Eeb,
  section80Dd,
  setSection80Dd,
  section80Ggc,
  setSection80Ggc,
  otherDeductions,
  setOtherDeductions,
}) => {
  const fields: DeductionFieldItem[] = [
    {
      id: 'tax-deduction-80e',
      label: 'Section 80E — Education Loan Interest',
      value: section80E,
      onChange: setSection80E,
      placeholder: 'Full interest deduction, no limit',
    },
    {
      id: 'tax-deduction-80g',
      label: 'Section 80G — Eligible Charitable Donations',
      value: section80G,
      onChange: setSection80G,
    },
    {
      id: 'tax-deduction-80tta',
      label: 'Section 80TTA/80TTB — Savings Interest Deduction',
      value: section80Tta,
      onChange: setSection80Tta,
      placeholder: 'Max ₹10,000 (₹50,000 for Senior Citizens)',
    },
    {
      id: 'tax-deduction-80gg',
      label: 'Section 80GG — House Rent Paid (No HRA)',
      value: section80Gg,
      onChange: setSection80Gg,
      placeholder: 'Max ₹60,000/yr (when HRA is not provided)',
    },
    {
      id: 'tax-deduction-80ddb',
      label: 'Section 80DDB — Medical Treatment (Specified Diseases)',
      value: section80Ddb,
      onChange: setSection80Ddb,
      placeholder: 'Max ₹40,000 (₹1,00,000 for Senior)',
    },
    {
      id: 'tax-deduction-80u',
      label: 'Section 80U — Person with Disability',
      value: section80U,
      onChange: setSection80U,
      placeholder: '₹75,000 (₹1,25,000 for severe disability)',
    },
    {
      id: 'tax-deduction-80eea',
      label: 'Section 80EEA — Additional Affordable Home Loan Interest',
      value: section80Eea,
      onChange: setSection80Eea,
      placeholder: 'Max ₹1,50,000',
    },
    {
      id: 'tax-deduction-80eeb',
      label: 'Section 80EEB — Electric Vehicle (EV) Loan Interest',
      value: section80Eeb,
      onChange: setSection80Eeb,
      placeholder: 'Max ₹1,50,000 for EV purchase',
    },
    {
      id: 'tax-deduction-80dd',
      label: 'Section 80DD — Maintenance of Disabled Dependent',
      value: section80Dd,
      onChange: setSection80Dd,
      placeholder: '₹75,000 (₹1,25,000 for severe disability)',
    },
    {
      id: 'tax-deduction-80ggc',
      label: 'Section 80GGC — Donations to Political Parties',
      value: section80Ggc,
      onChange: setSection80Ggc,
      placeholder: '100% deduction for non-cash contributions',
    },
    {
      id: 'tax-other-deductions',
      label: 'Other Miscellaneous Deductions',
      value: otherDeductions,
      onChange: setOtherDeductions,
      placeholder: 'Other eligible tax deductions',
    },
  ];
  return (
    <>
      {fields.map((f) => (
        <div key={f.id} className={styles.formField}>
          <label htmlFor={f.id} className={styles.label}>
            {f.label}
          </label>
          <input
            id={f.id}
            type="text"
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            placeholder={f.placeholder}
            className={styles.input}
          />
        </div>
      ))}
    </>
  );
};

import React from 'react';
import convertToWords from '../../utilities/currency';
import { CityCategory } from '../../utilities/incomeTaxCalculations';
import { sanitizeAmount } from './useIncomeTaxDeductions';
import styles from '../IncomeTaxCalculator.module.scss';
interface SalaryBreakdownFieldsProps {
  basicSalary: string;
  setBasicSalary: (val: string) => void;
  cityCategory: CityCategory;
  setCityCategory: (val: CityCategory) => void;
  hraReceived: string;
  setHraReceived: (val: string) => void;
  rentPaid: string;
  setRentPaid: (val: string) => void;
  professionalTax: string;
  setProfessionalTax: (val: string) => void;
  exemptAllowances: string;
  setExemptAllowances: (val: string) => void;
}
export const SalaryBreakdownFields: React.FC<SalaryBreakdownFieldsProps> = ({
  basicSalary,
  setBasicSalary,
  cityCategory,
  setCityCategory,
  hraReceived,
  setHraReceived,
  rentPaid,
  setRentPaid,
  professionalTax,
  setProfessionalTax,
  exemptAllowances,
  setExemptAllowances,
}) => {
  return (
    <div className={`${styles.formGrid2} ${styles.marginTop1}`}>
      <div className={styles.formField}>
        <label htmlFor="tax-basic-salary" className={styles.label}>
          Basic Salary (for HRA / NPS)
        </label>
        <input
          id="tax-basic-salary"
          type="text"
          value={basicSalary}
          onChange={(e) => setBasicSalary(e.target.value)}
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          {convertToWords(sanitizeAmount(basicSalary), 'en-IN')}
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-city-type" className={styles.label}>
          City of Residence (HRA)
        </label>
        <select
          id="tax-city-type"
          value={cityCategory}
          onChange={(e) => setCityCategory(e.target.value as CityCategory)}
          className={styles.select}
        >
          <option value="metro">Metro (Delhi, Mumbai, Kolkata, Chennai - 50%)</option>
          <option value="non_metro">Non-Metro (40%)</option>
        </select>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-hra-received" className={styles.label}>
          HRA Received from Employer
        </label>
        <input
          id="tax-hra-received"
          type="text"
          value={hraReceived}
          onChange={(e) => setHraReceived(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-rent-paid" className={styles.label}>
          Total Annual Rent Paid
        </label>
        <input
          id="tax-rent-paid"
          type="text"
          value={rentPaid}
          onChange={(e) => setRentPaid(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-prof-tax" className={styles.label}>
          Professional Tax (Sec 16(iii))
        </label>
        <input
          id="tax-prof-tax"
          type="text"
          value={professionalTax}
          onChange={(e) => setProfessionalTax(e.target.value)}
          placeholder="e.g. 2400 (Deductible up to ₹2,500 in Old Regime)"
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          Deductible up to ₹2,500/year under Old Regime.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-exempt-allowances" className={styles.label}>
          Exempt Allowances (Sec 10 - LTA, Conveyance, Uniform)
        </label>
        <input
          id="tax-exempt-allowances"
          type="text"
          value={exemptAllowances}
          onChange={(e) => setExemptAllowances(e.target.value)}
          placeholder="e.g. 50000"
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          Exempt from salary in Old Regime with valid receipts.
        </span>
      </div>
    </div>
  );
};

import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface HousePropertyTabProps {
  isSelfOccupied: boolean;
  setIsSelfOccupied: (val: boolean) => void;
  homeLoanInterestProperty: string;
  setHomeLoanInterestProperty: (val: string) => void;
  rentalIncome: string;
  setRentalIncome: (val: string) => void;
  municipalTaxes: string;
  setMunicipalTaxes: (val: string) => void;
}
export const HousePropertyTab: React.FC<HousePropertyTabProps> = ({
  isSelfOccupied,
  setIsSelfOccupied,
  homeLoanInterestProperty,
  setHomeLoanInterestProperty,
  rentalIncome,
  setRentalIncome,
  municipalTaxes,
  setMunicipalTaxes,
}) => {
  return (
    <div className={styles.formGrid2}>
      <div className={styles.formField}>
        <label className={styles.label}>Property Status</label>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="hpStatus"
              checked={isSelfOccupied}
              onChange={() => setIsSelfOccupied(true)}
              className={styles.primaryCheckbox}
            />
            <span>Self-Occupied</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="hpStatus"
              checked={!isSelfOccupied}
              onChange={() => setIsSelfOccupied(false)}
              className={styles.primaryCheckbox}
            />
            <span>Let-Out (Rented)</span>
          </label>
        </div>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-home-loan-interest" className={styles.label}>
          Home Loan Interest (Section 24(b))
        </label>
        <input
          id="tax-home-loan-interest"
          type="text"
          value={homeLoanInterestProperty}
          onChange={(e) => setHomeLoanInterestProperty(e.target.value)}
          placeholder="Max ₹2 Lakh deduction for self-occupied"
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          Deductible up to ₹2,00,000 in Old Regime.
        </span>
      </div>
      {!isSelfOccupied && (
        <>
          <div className={styles.formField}>
            <label htmlFor="tax-rental-income" className={styles.label}>
              Annual Rent Received
            </label>
            <input
              id="tax-rental-income"
              type="text"
              value={rentalIncome}
              onChange={(e) => setRentalIncome(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formField}>
            <label htmlFor="tax-municipal-taxes" className={styles.label}>
              Municipal Taxes Paid
            </label>
            <input
              id="tax-municipal-taxes"
              type="text"
              value={municipalTaxes}
              onChange={(e) => setMunicipalTaxes(e.target.value)}
              className={styles.input}
            />
          </div>
        </>
      )}
    </div>
  );
};

import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { DEDUCTION_80C_STEPS } from './constants';
import { Deductions80CItemized } from './Deductions80CItemized';
import { ChapterViaDeductions } from './ChapterViaDeductions';
import { CustomDeductionsList } from './CustomDeductionsList';
import { useIncomeTaxDeductions } from './useIncomeTaxDeductions';
import styles from '../IncomeTaxCalculator.module.scss';
interface DeductionsTabProps {
  deductions: ReturnType<typeof useIncomeTaxDeductions>;
  currencySymbol: string;
}
export const DeductionsTab: React.FC<DeductionsTabProps> = ({ deductions, currencySymbol }) => {
  const {
    section80C,
    setSection80C,
    is80CItemized,
    setIs80CItemized,
    itemEpf,
    setItemEpf,
    itemPpf,
    setItemPpf,
    itemElss,
    setItemElss,
    itemLifeInsurance,
    setItemLifeInsurance,
    itemHomeLoanPrincipal,
    setItemHomeLoanPrincipal,
    itemSsy,
    setItemSsy,
    itemTaxSaverFd,
    setItemTaxSaverFd,
    itemTuitionFees,
    setItemTuitionFees,
    itemStampDuty,
    setItemStampDuty,
    itemOther80C,
    setItemOther80C,
    itemized80CSum,
    effective80CAmount,
    customDeductionsList,
    handleAddCustomDeduction,
    handleUpdateCustomDeduction,
    handleRemoveCustomDeduction,
    ...chapterViaProps
  } = deductions;
  return (
    <div>
      <p className={styles.cardDesc}>
        Chapter VI-A tax deductions apply primarily to the <strong>Old Tax Regime</strong> (with the
        exception of Section 80CCD(2) employer NPS which applies to both).
      </p>
      <div className={styles.section80CHeader}>
        <span className={styles.section80CTitle}>Section 80C Deduction (Max ₹1.5 Lakh)</span>
        <label className={styles.checkboxToggle}>
          <input
            type="checkbox"
            checked={is80CItemized}
            onChange={(e) => setIs80CItemized(e.target.checked)}
            className={styles.primaryCheckbox}
          />
          <span>Itemize 80C Investments</span>
        </label>
      </div>
      {!is80CItemized ? (
        <ValuePicker
          title="Section 80C (PPF, EPF, ELSS, Life Insurance - Max ₹1.5L)"
          value={section80C}
          onChange={setSection80C}
          stepData={DEDUCTION_80C_STEPS}
          min={0}
          max={150000}
        />
      ) : (
        <Deductions80CItemized
          itemEpf={itemEpf}
          setItemEpf={setItemEpf}
          itemPpf={itemPpf}
          setItemPpf={setItemPpf}
          itemElss={itemElss}
          setItemElss={setItemElss}
          itemLifeInsurance={itemLifeInsurance}
          setItemLifeInsurance={setItemLifeInsurance}
          itemHomeLoanPrincipal={itemHomeLoanPrincipal}
          setItemHomeLoanPrincipal={setItemHomeLoanPrincipal}
          itemSsy={itemSsy}
          setItemSsy={setItemSsy}
          itemTaxSaverFd={itemTaxSaverFd}
          setItemTaxSaverFd={setItemTaxSaverFd}
          itemTuitionFees={itemTuitionFees}
          setItemTuitionFees={setItemTuitionFees}
          itemStampDuty={itemStampDuty}
          setItemStampDuty={setItemStampDuty}
          itemOther80C={itemOther80C}
          setItemOther80C={setItemOther80C}
          itemized80CSum={itemized80CSum}
          effective80CAmount={effective80CAmount}
          currencySymbol={currencySymbol}
        />
      )}
      <ChapterViaDeductions {...chapterViaProps} />
      <CustomDeductionsList
        customDeductionsList={customDeductionsList}
        onAddCustomDeduction={handleAddCustomDeduction}
        onUpdateCustomDeduction={handleUpdateCustomDeduction}
        onRemoveCustomDeduction={handleRemoveCustomDeduction}
      />
    </div>
  );
};

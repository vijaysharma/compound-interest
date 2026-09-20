import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { getFinancialYear, CII_YEARS } from '../../data/propertyTaxData';
import { PROPERTY_STEP_AMOUNT, EXPENSE_STEP_AMOUNT, STCG_SLAB_STEPS } from './constants';
import { sanctnum } from '../../utilities/numSanitity';
import calcStyles from '../CalculatorPage.module.scss';
interface PropertyTaxInputsProps {
  purchaseDate: string;
  onPurchaseDateChange: (val: string) => void;
  saleDate: string;
  onSaleDateChange: (val: string) => void;
  purchasePrice: string;
  onPurchasePriceChange: (val: string) => void;
  salePrice: string;
  onSalePriceChange: (val: string) => void;
  transferExpenses: string;
  onTransferExpensesChange: (val: string) => void;
  improvementCost: string;
  onImprovementCostChange: (val: string) => void;
  improvementYear: string;
  onImprovementYearChange: (val: string) => void;
  sec54Exemption: string;
  onSec54ExemptionChange: (val: string) => void;
  sec54ecExemption: string;
  onSec54ecExemptionChange: (val: string) => void;
  isLongTerm: boolean;
  stcgSlabRate: number;
  onStcgSlabRateChange: (val: number) => void;
}
export function PropertyTaxInputs({
  purchaseDate, onPurchaseDateChange, saleDate, onSaleDateChange,
  purchasePrice, onPurchasePriceChange, salePrice, onSalePriceChange,
  transferExpenses, onTransferExpensesChange, improvementCost, onImprovementCostChange,
  improvementYear, onImprovementYearChange, sec54Exemption, onSec54ExemptionChange,
  sec54ecExemption, onSec54ecExemptionChange, isLongTerm, stcgSlabRate, onStcgSlabRateChange,
}: PropertyTaxInputsProps) {
  return (
    <div className={calcStyles.inputsCol}>
      <div className={calcStyles.formStack}>
        <ValuePicker
          variant="date-range"
          className={calcStyles.field}
          startBadgeText={`Purchase (FY ${getFinancialYear(purchaseDate)})`}
          endBadgeText={`Sale (FY ${getFinancialYear(saleDate)})`}
          startDate={purchaseDate}
          setStartDate={onPurchaseDateChange}
          endDate={saleDate}
          setEndDate={onSaleDateChange}
          title="Property Holding Period"
        />
        <ValuePicker
          className={calcStyles.field}
          value={purchasePrice}
          onChange={onPurchasePriceChange}
          title="Purchase Price (Cost of Acquisition)"
          titleStyle="merged"
          stepData={PROPERTY_STEP_AMOUNT}
          singleRow={true}
        />
        <ValuePicker
          className={calcStyles.field}
          value={salePrice}
          onChange={onSalePriceChange}
          title="Total Sale Value (Full Consideration)"
          titleStyle="merged"
          stepData={PROPERTY_STEP_AMOUNT}
          singleRow={true}
        />
        <ValuePicker
          className={calcStyles.field}
          value={transferExpenses}
          onChange={onTransferExpensesChange}
          title="Transfer Expenses (Brokerage, Legal, Stamp Charges)"
          titleStyle="merged"
          stepData={EXPENSE_STEP_AMOUNT}
          singleRow={true}
        />
        <ValuePicker
          className={calcStyles.field}
          value={improvementCost}
          onChange={onImprovementCostChange}
          title="Renovation / Improvement Cost"
          titleStyle="merged"
          stepData={EXPENSE_STEP_AMOUNT}
          endAdornment={
            <select
              className={calcStyles.tenureFormatSelect}
              value={improvementYear}
              onChange={(e) => onImprovementYearChange(e.target.value)}
              aria-label="Financial Year of Renovation"
            >
              {CII_YEARS.map((fy) => (
                <option key={fy} value={fy}>FY {fy}</option>
              ))}
            </select>
          }
          singleRow={true}
        />
        <ValuePicker
          className={calcStyles.field}
          value={sec54Exemption}
          onChange={onSec54ExemptionChange}
          title="Section 54 (New House Property, Max ₹10 Cr)"
          titleStyle="merged"
          stepData={PROPERTY_STEP_AMOUNT}
          singleRow={true}
        />
        <ValuePicker
          className={calcStyles.field}
          value={sec54ecExemption}
          onChange={onSec54ecExemptionChange}
          title="Section 54EC (Capital Gains Bonds, Max ₹50 L)"
          titleStyle="merged"
          stepData={EXPENSE_STEP_AMOUNT}
          singleRow={true}
        />
        {!isLongTerm && (
          <ValuePicker
            className={calcStyles.field}
            value={stcgSlabRate}
            symbol="%"
            symbolBg={false}
            symbolPosition="right"
            onChange={(v) => onStcgSlabRateChange(sanctnum(v) || 30)}
            title="Your Income Tax Slab (STCG)"
            titleStyle="merged"
            stepData={STCG_SLAB_STEPS}
            showWords={false}
            singleRow={true}
          />
        )}
      </div>
    </div>
  );
}

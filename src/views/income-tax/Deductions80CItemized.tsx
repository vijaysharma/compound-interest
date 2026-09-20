import React from 'react';
import { Itemized80CMeter } from './Itemized80CMeter';
import { Itemized80CGrid } from './Itemized80CGrid';
import styles from '../IncomeTaxCalculator.module.scss';
interface Deductions80CItemizedProps {
  itemEpf: string;
  setItemEpf: (v: string) => void;
  itemPpf: string;
  setItemPpf: (v: string) => void;
  itemElss: string;
  setItemElss: (v: string) => void;
  itemLifeInsurance: string;
  setItemLifeInsurance: (v: string) => void;
  itemHomeLoanPrincipal: string;
  setItemHomeLoanPrincipal: (v: string) => void;
  itemSsy: string;
  setItemSsy: (v: string) => void;
  itemTaxSaverFd: string;
  setItemTaxSaverFd: (v: string) => void;
  itemTuitionFees: string;
  setItemTuitionFees: (v: string) => void;
  itemStampDuty: string;
  setItemStampDuty: (v: string) => void;
  itemOther80C: string;
  setItemOther80C: (v: string) => void;
  itemized80CSum: number;
  effective80CAmount: number;
  currencySymbol: string;
}
export const Deductions80CItemized: React.FC<Deductions80CItemizedProps> = ({
  itemized80CSum,
  effective80CAmount,
  currencySymbol,
  ...gridProps
}) => {
  return (
    <div className={styles.itemized80CContainer}>
      <Itemized80CMeter
        itemized80CSum={itemized80CSum}
        effective80CAmount={effective80CAmount}
        currencySymbol={currencySymbol}
      />
      <Itemized80CGrid {...gridProps} />
    </div>
  );
};

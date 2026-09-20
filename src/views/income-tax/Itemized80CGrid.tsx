import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface Itemized80CGridProps {
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
}
interface Itemized80CField {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}
export const Itemized80CGrid: React.FC<Itemized80CGridProps> = ({
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
}) => {
  const fields: Itemized80CField[] = [
    {
      id: 'tax-item-epf',
      label: "EPF / VPF (Employees' Provident Fund)",
      value: itemEpf,
      onChange: setItemEpf,
      placeholder: 'e.g. 70000',
    },
    {
      id: 'tax-item-ppf',
      label: 'PPF (Public Provident Fund)',
      value: itemPpf,
      onChange: setItemPpf,
      placeholder: 'e.g. 30000',
    },
    {
      id: 'tax-item-elss',
      label: 'ELSS Mutual Funds (Tax Saver 3-Yr Lock-in)',
      value: itemElss,
      onChange: setItemElss,
      placeholder: 'e.g. 25000',
    },
    {
      id: 'tax-item-insurance',
      label: 'Life Insurance Premium (Term / Traditional)',
      value: itemLifeInsurance,
      onChange: setItemLifeInsurance,
      placeholder: 'e.g. 25000',
    },
    {
      id: 'tax-item-hl-principal',
      label: 'Home Loan Principal Repayment',
      value: itemHomeLoanPrincipal,
      onChange: setItemHomeLoanPrincipal,
      placeholder: 'e.g. 50000',
    },
    {
      id: 'tax-item-ssy',
      label: 'Sukanya Samriddhi Yojana (SSY)',
      value: itemSsy,
      onChange: setItemSsy,
      placeholder: 'e.g. 20000',
    },
    {
      id: 'tax-item-fd',
      label: '5-Year Tax Saver Bank FD / NSC',
      value: itemTaxSaverFd,
      onChange: setItemTaxSaverFd,
      placeholder: 'e.g. 10000',
    },
    {
      id: 'tax-item-tuition',
      label: 'Children Tuition Fees (Up to 2 children)',
      value: itemTuitionFees,
      onChange: setItemTuitionFees,
      placeholder: 'e.g. 40000',
    },
    {
      id: 'tax-item-stamp-duty',
      label: 'Stamp Duty & Registration (House Purchase)',
      value: itemStampDuty,
      onChange: setItemStampDuty,
      placeholder: 'e.g. 0',
    },
    {
      id: 'tax-item-other-80c',
      label: 'Other Eligible Section 80C Investments',
      value: itemOther80C,
      onChange: setItemOther80C,
      placeholder: 'e.g. 0',
    },
  ];
  return (
    <div className={styles.itemizedGrid}>
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
    </div>
  );
};

import { useState, useMemo } from 'react';
export const sanitizeAmount = (val: string): number => {
  return Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);
};
export const useIncomeTaxDeductions = () => {
  const [section80C, setSection80C] = useState<string>('150000');
  const [is80CItemized, setIs80CItemized] = useState<boolean>(false);
  const [itemEpf, setItemEpf] = useState<string>('70000');
  const [itemPpf, setItemPpf] = useState<string>('30000');
  const [itemElss, setItemElss] = useState<string>('25000');
  const [itemLifeInsurance, setItemLifeInsurance] = useState<string>('25000');
  const [itemHomeLoanPrincipal, setItemHomeLoanPrincipal] = useState<string>('0');
  const [itemSsy, setItemSsy] = useState<string>('0');
  const [itemTaxSaverFd, setItemTaxSaverFd] = useState<string>('0');
  const [itemTuitionFees, setItemTuitionFees] = useState<string>('0');
  const [itemStampDuty, setItemStampDuty] = useState<string>('0');
  const [itemOther80C, setItemOther80C] = useState<string>('0');
  const [section80Ccd1b, setSection80Ccd1b] = useState<string>('50000');
  const [section80Ccd2, setSection80Ccd2] = useState<string>('0');
  const [section80DSelf, setSection80DSelf] = useState<string>('25000');
  const [seniorSelf80D, setSeniorSelf80D] = useState<boolean>(false);
  const [section80DParents, setSection80DParents] = useState<string>('25000');
  const [seniorParents80D, setSeniorParents80D] = useState<boolean>(false);
  const [section80E, setSection80E] = useState<string>('0');
  const [section80G, setSection80G] = useState<string>('0');
  const [section80Tta, setSection80Tta] = useState<string>('10000');
  const [section80Gg, setSection80Gg] = useState<string>('0');
  const [section80Ddb, setSection80Ddb] = useState<string>('0');
  const [section80U, setSection80U] = useState<string>('0');
  const [section80Eea, setSection80Eea] = useState<string>('0');
  const [section80Eeb, setSection80Eeb] = useState<string>('0');
  const [section80Dd, setSection80Dd] = useState<string>('0');
  const [section80Ggc, setSection80Ggc] = useState<string>('0');
  const [customDeductionsList, setCustomDeductionsList] = useState<
    Array<{ id: string; name: string; amount: string }>
  >([]);
  const [otherDeductions, setOtherDeductions] = useState<string>('0');
  const handleAddCustomDeduction = () => {
    const newId = `custom_${Date.now()}`;
    setCustomDeductionsList((prev) => [
      ...prev,
      { id: newId, name: `Custom Deduction #${prev.length + 1}`, amount: '0' },
    ]);
  };
  const handleUpdateCustomDeduction = (id: string, field: 'name' | 'amount', value: string) => {
    setCustomDeductionsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };
  const handleRemoveCustomDeduction = (id: string) => {
    setCustomDeductionsList((prev) => prev.filter((item) => item.id !== id));
  };
  const itemized80CSum = useMemo(() => {
    return (
      sanitizeAmount(itemEpf) +
      sanitizeAmount(itemPpf) +
      sanitizeAmount(itemElss) +
      sanitizeAmount(itemLifeInsurance) +
      sanitizeAmount(itemHomeLoanPrincipal) +
      sanitizeAmount(itemSsy) +
      sanitizeAmount(itemTaxSaverFd) +
      sanitizeAmount(itemTuitionFees) +
      sanitizeAmount(itemStampDuty) +
      sanitizeAmount(itemOther80C)
    );
  }, [
    itemEpf,
    itemPpf,
    itemElss,
    itemLifeInsurance,
    itemHomeLoanPrincipal,
    itemSsy,
    itemTaxSaverFd,
    itemTuitionFees,
    itemStampDuty,
    itemOther80C,
  ]);
  const effective80CAmount = is80CItemized
    ? Math.min(150000, itemized80CSum)
    : sanitizeAmount(section80C);
  return {
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
    section80Ccd1b,
    setSection80Ccd1b,
    section80Ccd2,
    setSection80Ccd2,
    section80DSelf,
    setSection80DSelf,
    seniorSelf80D,
    setSeniorSelf80D,
    section80DParents,
    setSection80DParents,
    seniorParents80D,
    setSeniorParents80D,
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
    customDeductionsList,
    otherDeductions,
    setOtherDeductions,
    handleAddCustomDeduction,
    handleUpdateCustomDeduction,
    handleRemoveCustomDeduction,
    itemized80CSum,
    effective80CAmount,
  };
};

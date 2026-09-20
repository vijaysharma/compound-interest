import React, { useMemo } from 'react';
import { PartPayment, RateChange } from './types';
import { getTodayDateString } from './emiDateUtils';
export const useEmiModifiers = (
  partPayments: PartPayment[],
  setPartPayments: React.Dispatch<React.SetStateAction<PartPayment[]>>,
  rateChanges: RateChange[],
  setRateChanges: React.Dispatch<React.SetStateAction<RateChange[]>>,
  disbursementDate: string,
  setDisbursementDate: (val: string) => void,
  annualRate: number
) => {
  const isAddPartPaymentDisabled = useMemo(() => {
    if (partPayments.length === 0) return false;
    const lastPayment = partPayments[partPayments.length - 1];
    return !lastPayment.amount || lastPayment.amount <= 0 || !lastPayment.date;
  }, [partPayments]);
  const addPartPayment = () => {
    if (isAddPartPaymentDisabled) return;
    setPartPayments((prev) => [
      ...prev,
      { amount: 0, date: getTodayDateString(), mode: 'emi', enabled: true },
    ]);
  };
  const removePartPayment = (index: number) => {
    setPartPayments((prev) => prev.filter((_, i) => i !== index));
  };
  const updatePartPayment = <K extends keyof PartPayment>(
    index: number,
    field: K,
    value: PartPayment[K]
  ) => {
    let finalValue = value;
    if (field === 'date' && disbursementDate && typeof value === 'string' && value < disbursementDate) {
      finalValue = disbursementDate as PartPayment[K];
    }
    setPartPayments((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: finalValue };
      return updated;
    });
  };
  const isAddRateChangeDisabled = useMemo(() => {
    if (rateChanges.length === 0) return false;
    const lastChange = rateChanges[rateChanges.length - 1];
    return !lastChange.rate || lastChange.rate <= 0 || !lastChange.date;
  }, [rateChanges]);
  const addRateChange = () => {
    if (isAddRateChangeDisabled) return;
    setRateChanges((prev) => [
      ...prev,
      { rate: annualRate, date: getTodayDateString(), mode: 'tenure', enabled: true },
    ]);
  };
  const removeRateChange = (index: number) => {
    setRateChanges((prev) => prev.filter((_, i) => i !== index));
  };
  const updateRateChange = <K extends keyof RateChange>(
    index: number,
    field: K,
    value: RateChange[K]
  ) => {
    let finalValue = value;
    if (field === 'date' && disbursementDate && typeof value === 'string' && value < disbursementDate) {
      finalValue = disbursementDate as RateChange[K];
    }
    setRateChanges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: finalValue };
      return updated;
    });
  };
  const handleDisbursementDateChange = (newDate: string) => {
    setDisbursementDate(newDate);
    if (newDate) {
      setPartPayments((prev) =>
        prev.map((p) => (p.date && p.date < newDate ? { ...p, date: newDate } : p))
      );
      setRateChanges((prev) =>
        prev.map((r) => (r.date && r.date < newDate ? { ...r, date: newDate } : r))
      );
    }
  };
  return {
    isAddPartPaymentDisabled,
    addPartPayment,
    removePartPayment,
    updatePartPayment,
    isAddRateChangeDisabled,
    addRateChange,
    removeRateChange,
    updateRateChange,
    handleDisbursementDateChange,
  };
};

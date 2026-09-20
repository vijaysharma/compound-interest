import { useEffect, useRef } from 'react';
import { RT } from '../../types/types';
import { PartPayment, RateChange } from './types';
interface EmiStorageState {
  loanAmount: string;
  setLoanAmount: (val: string) => void;
  rt: RT;
  setRt: React.Dispatch<React.SetStateAction<RT>>;
  disbursementDate: string;
  setDisbursementDate: (val: string) => void;
  emiDate: number;
  setEmiDate: (val: number) => void;
  partPayments: PartPayment[];
  setPartPayments: (val: PartPayment[]) => void;
  rateChanges: RateChange[];
  setRateChanges: (val: RateChange[]) => void;
  includePrincipalInFirstEmi: boolean;
  setIncludePrincipalInFirstEmi: (val: boolean) => void;
}
export const useEmiStorage = ({
  loanAmount,
  setLoanAmount,
  rt,
  setRt,
  disbursementDate,
  setDisbursementDate,
  emiDate,
  setEmiDate,
  partPayments,
  setPartPayments,
  rateChanges,
  setRateChanges,
  includePrincipalInFirstEmi,
  setIncludePrincipalInFirstEmi,
}: EmiStorageState) => {
  const isLoadedRef = useRef(false);
  useEffect(() => {
    const handleRestore = () => {
      try {
        const savedAmount = window.localStorage.getItem('loanAmount');
        if (savedAmount) {
          const parsed = JSON.parse(savedAmount);
          if (parsed) setLoanAmount(typeof parsed === 'number' ? parsed.toString() : parsed);
        }
        const savedRt = window.localStorage.getItem('emiRateTenure');
        if (savedRt) {
          const parsed = JSON.parse(savedRt);
          if (parsed && parsed.tenure) setRt(parsed);
        } else {
          const oldRate = window.localStorage.getItem('annualRate');
          const oldTenure = window.localStorage.getItem('tenureMonths');
          if (oldRate || oldTenure) {
            const parsedRate = oldRate ? JSON.parse(oldRate) : null;
            const parsedTenure = oldTenure ? JSON.parse(oldTenure) : null;
            setRt({
              roi: parsedRate ? parsedRate.toString() : '8.5',
              tenure: parsedTenure
                ? parsedTenure >= 12 && parsedTenure % 12 === 0
                  ? (parsedTenure / 12).toString()
                  : parsedTenure.toString()
                : '20',
              tenureFormat: parsedTenure && parsedTenure % 12 !== 0 ? 'm' : 'y',
            });
          }
        }
        const savedDate = window.localStorage.getItem('disbursementDate');
        if (savedDate) {
          const parsed = JSON.parse(savedDate);
          if (parsed) setDisbursementDate(parsed);
        }
        const savedEmiDate = window.localStorage.getItem('emiDate');
        if (savedEmiDate) {
          const parsed = JSON.parse(savedEmiDate);
          if (typeof parsed === 'number') setEmiDate(parsed);
        }
        const savedParts = window.localStorage.getItem('partPayments');
        if (savedParts) {
          const parsed = JSON.parse(savedParts);
          if (Array.isArray(parsed)) setPartPayments(parsed);
        }
        const savedRates = window.localStorage.getItem('rateChanges');
        if (savedRates) {
          const parsed = JSON.parse(savedRates);
          if (Array.isArray(parsed)) setRateChanges(parsed);
        }
        const savedInc = window.localStorage.getItem('includePrincipalInFirstEmi');
        if (savedInc !== null) {
          setIncludePrincipalInFirstEmi(JSON.parse(savedInc));
        }
      } catch (error) {
        console.error('Error loading EMI calculator state from localStorage:', error);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, [setLoanAmount, setRt, setDisbursementDate, setEmiDate, setPartPayments, setRateChanges, setIncludePrincipalInFirstEmi]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('loanAmount', JSON.stringify(loanAmount));
  }, [loanAmount]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('emiRateTenure', JSON.stringify(rt));
  }, [rt]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('disbursementDate', JSON.stringify(disbursementDate));
  }, [disbursementDate]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('emiDate', JSON.stringify(emiDate));
  }, [emiDate]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('partPayments', JSON.stringify(partPayments));
  }, [partPayments]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('rateChanges', JSON.stringify(rateChanges));
  }, [rateChanges]);
  useEffect(() => {
    if (!isLoadedRef.current) return;
    window.localStorage.setItem('includePrincipalInFirstEmi', JSON.stringify(includePrincipalInFirstEmi));
  }, [includePrincipalInFirstEmi]);
};

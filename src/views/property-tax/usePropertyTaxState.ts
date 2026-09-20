import { useState, useEffect, useRef, useMemo } from 'react';
import { getTodayISO } from '../../utilities/dateGuards';
import { calculatePropertyCapitalGains, type PropertyTaxInputs } from '../../data/propertyTaxData';
import { PROPERTY_TAX_STORAGE_KEY } from './constants';
export function usePropertyTaxState() {
  const [purchaseDate, setPurchaseDate] = useState<string>('2016-06-15');
  const [purchasePrice, setPurchasePrice] = useState<string>('4500000');
  const [saleDate, setSaleDate] = useState<string>('2025-02-15');
  const [salePrice, setSalePrice] = useState<string>('12000000');
  const [transferExpenses, setTransferExpenses] = useState<string>('150000');
  const [improvementCost, setImprovementCost] = useState<string>('0');
  const [improvementYear, setImprovementYear] = useState<string>('2019-20');
  const [sec54Exemption, setSec54Exemption] = useState<string>('0');
  const [sec54ecExemption, setSec54ecExemption] = useState<string>('0');
  const [stcgSlabRate, setStcgSlabRate] = useState<number>(30);
  const isLoadedRef = useRef(false);
  useEffect(() => {
    const handleRestore = () => {
      try {
        const saved = window.localStorage.getItem(PROPERTY_TAX_STORAGE_KEY);
        if (saved) {
          const p = JSON.parse(saved);
          if (p.purchaseDate) setPurchaseDate(p.purchaseDate);
          if (p.purchasePrice) setPurchasePrice(p.purchasePrice);
          if (p.saleDate) setSaleDate(p.saleDate);
          if (p.salePrice) setSalePrice(p.salePrice);
          if (p.transferExpenses) setTransferExpenses(p.transferExpenses);
          if (p.improvementCost) setImprovementCost(p.improvementCost);
          if (p.improvementYear) setImprovementYear(p.improvementYear);
          if (p.sec54Exemption) setSec54Exemption(p.sec54Exemption);
          if (p.sec54ecExemption) setSec54ecExemption(p.sec54ecExemption);
          if (p.stcgSlabRate) setStcgSlabRate(Number(p.stcgSlabRate));
        }
      } catch (err) {
        console.warn('Failed to restore property tax state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    const state = {
      purchaseDate, purchasePrice, saleDate, salePrice, transferExpenses,
      improvementCost, improvementYear, sec54Exemption, sec54ecExemption, stcgSlabRate,
    };
    try {
      window.localStorage.setItem(PROPERTY_TAX_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to persist property tax state:', err);
    }
  }, [
    purchaseDate, purchasePrice, saleDate, salePrice, transferExpenses,
    improvementCost, improvementYear, sec54Exemption, sec54ecExemption, stcgSlabRate,
  ]);
  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    if (saleDate && val > saleDate) setSaleDate(val);
  };
  const handleSaleDateChange = (val: string) => {
    const today = getTodayISO();
    const safeVal = val > today ? today : val;
    setSaleDate(safeVal);
    if (purchaseDate && purchaseDate > safeVal) setPurchaseDate(safeVal);
  };
  const comparison = useMemo(() => {
    const inputs: PropertyTaxInputs = {
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      saleDate,
      salePrice: parseFloat(salePrice) || 0,
      improvementCost: parseFloat(improvementCost) || 0,
      improvementYear,
      transferExpenses: parseFloat(transferExpenses) || 0,
      sec54Exemption: parseFloat(sec54Exemption) || 0,
      sec54ecExemption: parseFloat(sec54ecExemption) || 0,
      stcgSlabRate,
    };
    return calculatePropertyCapitalGains(inputs);
  }, [
    purchaseDate, purchasePrice, saleDate, salePrice, improvementCost,
    improvementYear, transferExpenses, sec54Exemption, sec54ecExemption, stcgSlabRate,
  ]);
  const recommendedTax = useMemo(() => {
    if (!comparison.isLongTerm) return comparison.stcg.totalTax;
    return comparison.recommendedOption === 'old'
      ? comparison.oldRegime.totalTax
      : comparison.newRegime.totalTax;
  }, [comparison]);
  return {
    purchaseDate, setPurchaseDate, handlePurchaseDateChange,
    purchasePrice, setPurchasePrice,
    saleDate, setSaleDate, handleSaleDateChange,
    salePrice, setSalePrice,
    transferExpenses, setTransferExpenses,
    improvementCost, setImprovementCost,
    improvementYear, setImprovementYear,
    sec54Exemption, setSec54Exemption,
    sec54ecExemption, setSec54ecExemption,
    stcgSlabRate, setStcgSlabRate,
    comparison, recommendedTax,
  };
}

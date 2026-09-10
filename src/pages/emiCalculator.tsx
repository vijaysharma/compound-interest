import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DisplayCard from '../components/DisplayCard.tsx';
import ValuePicker from '../components/ValuePicker.tsx';
import { RT, StepAmountType } from '../types/types.ts';
import { STEP_AMOUNT } from '../data/default_data.ts';
import { sanctnum } from '../utilities/numSanitity.ts';
import SEOHead from '../components/SEOHead.tsx';
import CalculatorContentSection from '../components/CalculatorContentSection.tsx';
import { TbTrash } from 'react-icons/tb';
import styles from './EmiCalculator.module.scss';
interface ScheduleRow {
  date: string;
  emi: string;
  principal: string;
  interest: string;
  balance: string;
  cumulativePrincipal: string;
  cumulativeInterest: string;
  remainingInterest: string;
  note?: string;
}
interface PartPayment {
  amount: number;
  date: string; // ISO string
  mode: 'tenure' | 'emi'; // Individual mode for each part payment
  enabled: boolean; // Toggle to include/exclude from calculation
}
interface RateChange {
  rate: number;
  date: string; // ISO string
  mode: 'tenure' | 'emi'; // Keep EMI same (increase tenure) or Keep tenure same (increase EMI)
  enabled: boolean; // Toggle to include/exclude from calculation
}
const emiSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Home & Personal Loan EMI Amortization Calculator India',
      description:
        'Calculates equated monthly installments (EMI), complete loan repayment schedules, and interest savings from part payments and floating interest rate adjustments.',
      category: 'LoanOrCredit',
      provider: {
        '@type': 'Organization',
        name: 'Rupee Calculator',
        url: 'https://rupees.vercel.app/',
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://rupees.vercel.app/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'EMI Calculator',
          item: 'https://rupees.vercel.app/emi-calculator',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the mathematical formula for calculating loan EMI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Loan EMI is calculated using the formula: E = P × r × (1 + r)^n / [((1 + r)^n) - 1], where P is the loan principal, r is the monthly interest rate (annual interest rate / 12 / 100), and n is the total loan tenure in months.',
          },
        },
        {
          '@type': 'Question',
          name: 'When making a loan part-payment, should I choose to reduce EMI or reduce tenure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Choosing to "Reduce Tenure" saves significantly more total interest over the life of the loan than reducing EMI. Reducing tenure accelerates principal reduction, preventing compound interest accumulation across future years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What income tax deductions are available on Home Loans in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Home loan borrowers in India can claim tax deductions up to ₹1.5 Lakh on principal repayment under Section 80C and up to ₹2.0 Lakh on interest paid for a self-occupied property under Section 24(b) of the Income Tax Act (Old Tax Regime).',
          },
        },
        {
          '@type': 'Question',
          name: 'How to calculate EMI for a home loan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Home loan EMI is calculated using the reducing balance formula: EMI = P × r × (1+r)^n / [(1+r)^n – 1], where P is loan principal, r is monthly interest rate (annual rate ÷ 12 ÷ 100), and n is total months. For a ₹50 Lakh loan at 8.5% for 20 years: EMI = ₹43,391/month.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between flat rate and reducing balance EMI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Flat rate EMI charges interest on the original loan amount throughout the tenure, resulting in a higher effective interest rate. Reducing balance EMI (used by all major Indian banks for home loans) charges interest only on the outstanding principal, which decreases with each payment. A flat rate of 8% is roughly equivalent to a reducing balance rate of 14-15%.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'EMI Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/emi-calculator',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires JavaScript',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
    },
  ],
};
const emiFaqs = [
  {
    question: 'How do interest rate hikes by RBI impact my floating rate home loan?',
    answer:
      'When the RBI increases the repo rate, banks typically increase the loan tenure while keeping your EMI amount constant. However, for large rate hikes, tenure can extend past retirement unless you make regular lump-sum part-payments or increase your monthly EMI.',
  },
  {
    question: 'What is the difference between Fixed Rate and Floating Rate loans?',
    answer:
      'Fixed Rate loans maintain an identical interest rate throughout the entire loan tenure, offering payment certainty. Floating Rate loans vary in tandem with benchmark interest rates (Repo Linked Lending Rate - RLLR). In India, floating-rate home loans have zero prepayment or foreclosure penalty for individual borrowers.',
  },
  {
    question: 'How much interest can I save by paying one extra EMI every year?',
    answer:
      'On a standard 20-year home loan at 9% interest, making just one additional EMI payment per calendar year can reduce your total loan tenure by approximately 4 to 5 years and save over 25% of your total interest liability.',
  },
  {
    question: 'Is there any penalty for home loan prepayments or part-payments in India?',
    answer:
      'Under Reserve Bank of India (RBI) guidelines, commercial banks and Housing Finance Companies (HFCs) cannot levy any prepayment charges or foreclosure penalties on floating-rate individual home loans.',
  },
  {
    question: 'How to calculate EMI for a home loan?',
    answer:
      'Home loan EMI is calculated using the reducing balance formula: EMI = P × r × (1+r)^n / [(1+r)^n – 1], where P is loan principal, r is monthly interest rate (annual rate ÷ 12 ÷ 100), and n is total months. For a ₹50 Lakh loan at 8.5% for 20 years: EMI = ₹43,391/month.',
  },
  {
    question: 'What is the difference between flat rate and reducing balance EMI?',
    answer:
      'Flat rate EMI charges interest on the original loan amount throughout the tenure, resulting in a higher effective interest rate. Reducing balance EMI (used by all major Indian banks for home loans) charges interest only on the outstanding principal, which decreases with each payment. A flat rate of 8% is roughly equivalent to a reducing balance rate of 14-15%.',
  },
];
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const EmiCalculator: React.FC = () => {
  // Helper for localStorage
  const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };
  const [loanAmount, setLoanAmount] = useState<string>(() => {
    const saved = loadFromLocalStorage<number | string>('loanAmount', '3000000');
    return typeof saved === 'number' ? saved.toString() : saved || '3000000';
  });
  const [rt, setRt] = useState<RT>(() => {
    const saved = loadFromLocalStorage<RT | null>('emiRateTenure', null);
    if (saved && saved.tenure) return saved;
    const oldRate = loadFromLocalStorage<number | null>('annualRate', null);
    const oldTenure = loadFromLocalStorage<number | null>('tenureMonths', null);
    return {
      roi: oldRate ? oldRate.toString() : '8.5',
      tenure: oldTenure
        ? oldTenure >= 12 && oldTenure % 12 === 0
          ? (oldTenure / 12).toString()
          : oldTenure.toString()
        : '20',
      tenureFormat: oldTenure && oldTenure % 12 !== 0 ? 'm' : 'y',
    };
  });
  const [disbursementDate, setDisbursementDate] = useState<string>(() =>
    loadFromLocalStorage('disbursementDate', getTodayDateString())
  );
  const [emiDate, setEmiDate] = useState<number>(() => loadFromLocalStorage('emiDate', 10));
  const [partPayments, setPartPayments] = useState<PartPayment[]>(() =>
    loadFromLocalStorage('partPayments', [])
  );
  const [rateChanges, setRateChanges] = useState<RateChange[]>(() =>
    loadFromLocalStorage('rateChanges', [])
  );
  const [includePrincipalInFirstEmi, setIncludePrincipalInFirstEmi] = useState<boolean>(() =>
    loadFromLocalStorage('includePrincipalInFirstEmi', false)
  );
  const stepData: StepAmountType[] = STEP_AMOUNT;
  // Save state to localStorage
  useEffect(() => {
    window.localStorage.setItem('loanAmount', JSON.stringify(loanAmount));
  }, [loanAmount]);
  useEffect(() => {
    window.localStorage.setItem('emiRateTenure', JSON.stringify(rt));
  }, [rt]);
  useEffect(() => {
    window.localStorage.setItem('disbursementDate', JSON.stringify(disbursementDate));
  }, [disbursementDate]);
  useEffect(() => {
    window.localStorage.setItem('emiDate', JSON.stringify(emiDate));
  }, [emiDate]);
  useEffect(() => {
    window.localStorage.setItem('partPayments', JSON.stringify(partPayments));
  }, [partPayments]);
  useEffect(() => {
    window.localStorage.setItem('rateChanges', JSON.stringify(rateChanges));
  }, [rateChanges]);
  useEffect(() => {
    window.localStorage.setItem(
      'includePrincipalInFirstEmi',
      JSON.stringify(includePrincipalInFirstEmi)
    );
  }, [includePrincipalInFirstEmi]);
  // Calculation parameters
  const principalAmount = useMemo(() => sanctnum(loanAmount), [loanAmount]);
  const annualRate = useMemo(() => (rt.roi ? parseFloat(rt.roi) : 0), [rt.roi]);
  const tenureMonths = useMemo(
    () => (rt.tenureFormat === 'y' ? sanctnum(rt.tenure) * 12 : sanctnum(rt.tenure)),
    [rt.tenure, rt.tenureFormat]
  );
  // Helper date functions
  const differenceInDays = (date1: Date, date2: Date): number => {
    const diffTime = date1.getTime() - date2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };
  // Base monthly EMI without prepayments
  const baseMonthlyEmi = useMemo(() => {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate <= 0 || tenureMonths <= 0 || principalAmount <= 0) return 0;
    return (
      (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
  }, [principalAmount, annualRate, tenureMonths]);
  // Full Amortization Schedule Calculation
  const calculateSchedule = useCallback((): ScheduleRow[] => {
    if (!disbursementDate || principalAmount <= 0 || tenureMonths <= 0) return [];
    let principal: number = principalAmount;
    let currentAnnualRate: number = annualRate;
    let monthlyRate: number = currentAnnualRate / 12 / 100;
    let cumulativePrincipal = 0;
    let cumulativeInterest = 0;
    // Sort part payments and rate changes by date
    const sortedPartPayments = [...partPayments]
      .filter((p) => p.enabled && p.amount > 0 && p.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedRateChanges = [...rateChanges]
      .filter((r) => r.enabled && r.rate > 0 && r.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentDate: Date = new Date(disbursementDate);
    type RawRow = Omit<ScheduleRow, 'remainingInterest'>;
    const rawRows: RawRow[] = [];
    // Handle prorated first EMI
    let firstEmiDate: Date = new Date(currentDate);
    firstEmiDate.setDate(emiDate);
    if (firstEmiDate <= currentDate) {
      firstEmiDate = addMonths(firstEmiDate, 1);
    }
    const days: number = differenceInDays(firstEmiDate, currentDate);
    const proratedInterest: number = (principal * annualRate * days) / (365 * 100);
    // Calculate initial EMI amount for the loan
    const initialEmiAmount: number =
      monthlyRate > 0
        ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        : principal / tenureMonths;
    if (includePrincipalInFirstEmi) {
      const principalComponent = initialEmiAmount - principal * monthlyRate;
      const totalFirstEmi = proratedInterest + principalComponent;
      principal -= principalComponent;
      cumulativePrincipal += principalComponent;
      cumulativeInterest += proratedInterest;
      rawRows.push({
        date: firstEmiDate.toDateString(),
        emi: totalFirstEmi.toFixed(2),
        principal: principalComponent.toFixed(2),
        interest: proratedInterest.toFixed(2),
        balance: principal.toFixed(2),
        cumulativePrincipal: cumulativePrincipal.toFixed(2),
        cumulativeInterest: cumulativeInterest.toFixed(2),
        note: 'Prorated Interest + Principal',
      });
    } else {
      cumulativeInterest += proratedInterest;
      rawRows.push({
        date: firstEmiDate.toDateString(),
        emi: proratedInterest.toFixed(2),
        principal: '0.00',
        interest: proratedInterest.toFixed(2),
        balance: principal.toFixed(2),
        cumulativePrincipal: cumulativePrincipal.toFixed(2),
        cumulativeInterest: cumulativeInterest.toFixed(2),
        note: 'Prorated Interest Only',
      });
    }
    currentDate = firstEmiDate;
    let monthCounter = 1;
    let remainingTenureMonths = tenureMonths;
    let baseEmiAmount: number =
      monthlyRate > 0
        ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        : principal / tenureMonths;
    let currentMode: 'tenure' | 'emi' = 'tenure';
    while (principal > 1 && monthCounter <= tenureMonths + 120) {
      const nextEmiDate = addMonths(currentDate, 1);
      // Check for rate changes in this period
      const rateChangesInPeriod = sortedRateChanges.filter((r) => {
        const changeDate = new Date(r.date);
        return changeDate > currentDate && changeDate <= nextEmiDate;
      });
      for (const rateChange of rateChangesInPeriod) {
        if (principal <= 1) break;
        const changeDate = new Date(rateChange.date);
        const oldRate = currentAnnualRate;
        currentAnnualRate = rateChange.rate;
        monthlyRate = currentAnnualRate / 12 / 100;
        rawRows.push({
          date: changeDate.toDateString(),
          emi: '0.00',
          principal: '0.00',
          interest: '0.00',
          balance: principal.toFixed(2),
          cumulativePrincipal: cumulativePrincipal.toFixed(2),
          cumulativeInterest: cumulativeInterest.toFixed(2),
          note: `ROI Change: ${oldRate}% → ${currentAnnualRate}% (${rateChange.mode === 'emi' ? 'Adjust EMI' : 'Adjust Tenure'})`,
        });
        if (rateChange.mode === 'emi') {
          if (remainingTenureMonths > 0 && monthlyRate > 0) {
            baseEmiAmount =
              (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
              (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
          }
          currentMode = 'emi';
        } else {
          currentMode = 'tenure';
        }
      }
      let emiAmount: number;
      if (currentMode === 'tenure') {
        emiAmount = baseEmiAmount;
      } else {
        if (remainingTenureMonths > 0 && monthlyRate > 0) {
          emiAmount =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
            (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
        } else {
          emiAmount = principal;
        }
      }
      // Check for part payments in this period
      const partPaymentsInPeriod = sortedPartPayments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate > currentDate && paymentDate <= nextEmiDate;
      });
      for (const payment of partPaymentsInPeriod) {
        if (principal <= 1) break;
        const paymentDate = new Date(payment.date);
        const actualPaymentAmount = Math.min(payment.amount, principal);
        principal -= actualPaymentAmount;
        cumulativePrincipal += actualPaymentAmount;
        rawRows.push({
          date: paymentDate.toDateString(),
          emi: actualPaymentAmount.toFixed(2),
          principal: actualPaymentAmount.toFixed(2),
          interest: '0.00',
          balance: principal.toFixed(2),
          cumulativePrincipal: cumulativePrincipal.toFixed(2),
          cumulativeInterest: cumulativeInterest.toFixed(2),
          note: `Part Payment (${payment.mode === 'emi' ? 'Reduce EMI' : 'Reduce Tenure'})`,
        });
        currentMode = payment.mode;
        if (currentMode === 'emi' && principal > 1) {
          if (remainingTenureMonths > 0 && monthlyRate > 0) {
            emiAmount =
              (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
              (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
            baseEmiAmount = emiAmount;
          }
        }
      }
      if (principal <= 1) break;
      const interest = principal * monthlyRate;
      let principalComponent = emiAmount - interest;
      if (principalComponent > principal) {
        principalComponent = principal;
        emiAmount = principalComponent + interest;
      }
      principal -= principalComponent;
      cumulativePrincipal += principalComponent;
      cumulativeInterest += interest;
      remainingTenureMonths--;
      rawRows.push({
        date: nextEmiDate.toDateString(),
        emi: emiAmount.toFixed(2),
        principal: principalComponent.toFixed(2),
        interest: interest.toFixed(2),
        balance: Math.max(0, principal).toFixed(2),
        cumulativePrincipal: cumulativePrincipal.toFixed(2),
        cumulativeInterest: cumulativeInterest.toFixed(2),
      });
      currentDate = nextEmiDate;
      monthCounter++;
    }
    const totalScheduleInterest = cumulativeInterest;
    return rawRows.map((row) => ({
      ...row,
      remainingInterest: Math.max(
        0,
        totalScheduleInterest - parseFloat(row.cumulativeInterest)
      ).toFixed(2),
    }));
  }, [
    principalAmount,
    annualRate,
    tenureMonths,
    disbursementDate,
    emiDate,
    partPayments,
    rateChanges,
    includePrincipalInFirstEmi,
  ]);
  const schedule = useMemo(() => calculateSchedule(), [calculateSchedule]);
  const isAddPartPaymentDisabled = useMemo(() => {
    if (partPayments.length === 0) return false;
    const lastPayment = partPayments[partPayments.length - 1];
    return !lastPayment.amount || lastPayment.amount <= 0 || !lastPayment.date;
  }, [partPayments]);
  const addPartPayment = () => {
    if (isAddPartPaymentDisabled) return;
    setPartPayments([
      ...partPayments,
      { amount: 0, date: getTodayDateString(), mode: 'emi', enabled: true },
    ]);
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
  const removePartPayment = (index: number) => {
    const updated = partPayments.filter((_, i) => i !== index);
    setPartPayments(updated);
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
    const updated = [...partPayments];
    updated[index] = { ...updated[index], [field]: finalValue };
    setPartPayments(updated);
  };
  const isAddRateChangeDisabled = useMemo(() => {
    if (rateChanges.length === 0) return false;
    const lastChange = rateChanges[rateChanges.length - 1];
    return !lastChange.rate || lastChange.rate <= 0 || !lastChange.date;
  }, [rateChanges]);
  const addRateChange = () => {
    if (isAddRateChangeDisabled) return;
    setRateChanges([
      ...rateChanges,
      { rate: annualRate, date: getTodayDateString(), mode: 'tenure', enabled: true },
    ]);
  };
  const removeRateChange = (index: number) => {
    const updated = rateChanges.filter((_, i) => i !== index);
    setRateChanges(updated);
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
    const updated = [...rateChanges];
    updated[index] = { ...updated[index], [field]: finalValue };
    setRateChanges(updated);
  };
  const totalInterest = useMemo(
    () => schedule.reduce((sum, row) => sum + parseFloat(row.interest), 0),
    [schedule]
  );
  const totalPayable = useMemo(
    () => principalAmount + totalInterest,
    [principalAmount, totalInterest]
  );
  const principalPercent = useMemo(
    () => (totalPayable > 0 ? (principalAmount / totalPayable) * 100 : 0),
    [principalAmount, totalPayable]
  );
  const interestPercent = useMemo(
    () => (totalPayable > 0 ? (totalInterest / totalPayable) * 100 : 0),
    [totalInterest, totalPayable]
  );
  const pieSlices = useMemo(() => {
    if (totalPayable <= 0) return null;
    if (principalPercent >= 100) return { type: 'full-principal' as const };
    if (principalPercent <= 0) return { type: 'full-interest' as const };
    const angle = (principalPercent / 100) * 2 * Math.PI;
    const x = 100 + 85 * Math.sin(angle);
    const y = 100 - 85 * Math.cos(angle);
    const largeArc = principalPercent > 50 ? 1 : 0;
    return {
      type: 'slices' as const,
      principalD: `M 100 100 L 100 15 A 85 85 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`,
      interestD: `M 100 100 L ${x.toFixed(2)} ${y.toFixed(2)} A 85 85 0 ${largeArc ? 0 : 1} 1 100 15 Z`,
    };
  }, [totalPayable, principalPercent]);
  return (
    <main className={styles.container}>
      <SEOHead
        title="EMI Calculator — Home Loan, Car & Personal Loan EMI Calculator India 2026"
        description="Free online EMI calculator for home loan, car loan & personal loan. Full amortization schedule with part-payment modeling & floating rate simulation. 100% private."
        keywords="EMI calculator, home loan EMI calculator, loan amortization schedule India, prepayment EMI calculator, part payment home loan calculator, personal loan EMI, car loan EMI calculator, education loan calculator, loan calculator, amortization calculator, EMI calculation formula, how to calculate EMI"
        canonicalPath="/emi-calculator"
        schema={emiSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          Loan Intelligence &bull; Amortization Engine
        </div>
        <h1 className={styles.title}>
          Home &amp; Personal Loan EMI Calculator India
        </h1>
        <p className={styles.subtitle}>
          Calculate equated monthly installments, model lump-sum prepayments, and simulate floating
          rate adjustments.
        </p>
      </header>
      {/* Input Section */}
      <div className={styles.inputSection}>
        <ValuePicker
          className={styles.fieldTight}
          value={loanAmount}
          onChange={setLoanAmount}
          title="Loan amount"
          stepData={stepData}
          tabs={[]}
        />
        <ValuePicker.ROI className={styles.fieldTight} rt={rt} setRt={setRt} />
        <ValuePicker.Tenure className={styles.fieldTight} rt={rt} setRt={setRt} />
        {/* Joined Disbursement Date & EMI Deduction Date */}
        <div className={styles.disbursementWrapper}>
          <ValuePicker.Paired
            title="Disbursement & Repayment"
            sourceBadgeText="Disbursed"
            targetBadgeText="EMI Day"
            sourceSlot={
              <input
                id="disbursement-date"
                className={styles.dateInput}
                title="Disbursement Date"
                type="date"
                value={disbursementDate}
                onChange={(e) => handleDisbursementDateChange(e.target.value)}
              />
            }
            targetSlot={
              <input
                id="emi-date"
                className={styles.dayInput}
                title="EMI Deduction Date (Day of Month)"
                type="number"
                min="1"
                max="31"
                value={emiDate}
                onChange={(e) => setEmiDate(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
              />
            }
          />
          <label className={styles.advanceEmiLabel}>
            <input
              type="checkbox"
              title="Include Principal Payment in First EMI"
              className={styles.checkbox}
              checked={includePrincipalInFirstEmi}
              onChange={(e) => setIncludePrincipalInFirstEmi(e.target.checked)}
            />
            <span className={styles.checkboxText}>
              Include principal repayment in prorated first EMI
            </span>
          </label>
        </div>
        <DisplayCard primaryAmount={Math.round(baseMonthlyEmi)} title="Monthly EMI Amount" />
      </div>
      {/* Loan Statistics & Pie Chart Section */}
      {principalAmount > 0 && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>
                Breakdown &amp; Analytics
              </p>
              <h2 className={styles.cardHeading}>Loan Statistics &amp; Payment Proportion</h2>
            </div>
            {schedule.length > 0 && (
              <span className={styles.countBadge}>
                {schedule.length} Total Payments
              </span>
            )}
          </div>
          <div className={styles.analyticsGrid}>
            {/* Pie Chart Visual */}
            <div className={styles.pieContainer}>
              <div className={styles.pieSvgWrapper}>
                <svg
                  viewBox="0 0 200 200"
                  className={styles.pieSvg}
                  aria-label="Loan Principal vs Interest Pie Chart"
                >
                  {pieSlices?.type === 'full-principal' && (
                    <circle cx="100" cy="100" r="85" className={styles.pieSlicePrimary} />
                  )}
                  {pieSlices?.type === 'full-interest' && (
                    <circle cx="100" cy="100" r="85" className={styles.pieSliceError} />
                  )}
                  {pieSlices?.type === 'slices' && (
                    <>
                      <path
                        d={pieSlices.principalD}
                        className={styles.pieSlicePrimary}
                      >
                        <title>
                          Principal: ₹{Math.round(principalAmount).toLocaleString('en-IN')} (
                          {principalPercent.toFixed(1)}%)
                        </title>
                      </path>
                      <path
                        d={pieSlices.interestD}
                        className={styles.pieSliceError}
                      >
                        <title>
                          Interest: ₹{Math.round(totalInterest).toLocaleString('en-IN')} (
                          {interestPercent.toFixed(1)}%)
                        </title>
                      </path>
                    </>
                  )}
                </svg>
              </div>
            </div>
            {/* Legend & Key Metrics */}
            <div className={styles.metricsStack}>
              {/* Principal Pill */}
              <div className={`${styles.metricPill} ${styles.metricPillPrimary}`}>
                <div className={styles.metricIndicatorGroup}>
                  <div className={`${styles.metricDot} ${styles.metricDotPrimary}`} />
                  <div>
                    <span className={styles.metricLabel}>Principal Loan Amount</span>
                    <span className={styles.metricSub}>
                      {principalPercent.toFixed(1)}% of total
                    </span>
                  </div>
                </div>
                <span className={`${styles.metricValue} ${styles.metricValuePrimary}`}>
                  ₹{Math.round(principalAmount).toLocaleString('en-IN')}
                </span>
              </div>
              {/* Interest Pill */}
              <div className={`${styles.metricPill} ${styles.metricPillError}`}>
                <div className={styles.metricIndicatorGroup}>
                  <div className={`${styles.metricDot} ${styles.metricDotError}`} />
                  <div>
                    <span className={styles.metricLabel}>Total Interest Payable</span>
                    <span className={styles.metricSub}>
                      {interestPercent.toFixed(1)}% of total
                    </span>
                  </div>
                </div>
                <span className={`${styles.metricValue} ${styles.metricValueError}`}>
                  ₹{Math.round(totalInterest).toLocaleString('en-IN')}
                </span>
              </div>
              {/* Total Payable Pill */}
              <div className={`${styles.metricPill} ${styles.metricPillNeutral}`}>
                <span className={styles.metricLabel}>
                  Total Loan Cost (P + I)
                </span>
                <span className={`${styles.metricValue} ${styles.metricValueTotal}`}>
                  ₹{Math.round(totalPayable).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Part Payments Section */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardEyebrow}>
              Prepayment Optimizer
            </p>
            <h2 className={styles.cardHeading}>Lump-Sum Part Payments</h2>
          </div>
        </div>
        <div className={styles.inputSection}>
          {partPayments.length === 0 && (
            <p className={styles.emptyStateText}>
              No part payments added yet. Click &quot;Add Part Payment&quot; below to simulate
              prepayments.
            </p>
          )}
          {partPayments.map((p, idx) => (
            <div
              key={idx}
              className={`${styles.prepaymentItem} ${
                p.enabled ? styles.prepaymentItemEnabled : styles.prepaymentItemDisabled
              }`}
            >
              <div className={styles.prepaymentInputsRow}>
                <span className={styles.itemIndex}>#{idx + 1}</span>
                <input
                  type="checkbox"
                  title={`Enable/Disable Part Payment #${idx + 1}`}
                  checked={p.enabled}
                  onChange={(e) => updatePartPayment(idx, 'enabled', e.target.checked)}
                  className={styles.checkbox}
                />
                <input
                  className={styles.textInput}
                  title={`Part Payment Amount #${idx + 1}`}
                  type="number"
                  placeholder="Payment Amount (₹)"
                  value={p.amount || ''}
                  onChange={(e) => updatePartPayment(idx, 'amount', Math.max(0, Number(e.target.value) || 0))}
                  disabled={!p.enabled}
                />
                <input
                  className={styles.textInput}
                  title={`Part Payment Date #${idx + 1}`}
                  type="date"
                  min={disbursementDate || undefined}
                  value={p.date}
                  onChange={(e) => updatePartPayment(idx, 'date', e.target.value)}
                  disabled={!p.enabled}
                />
                <TbTrash
                  onClick={() => removePartPayment(idx)}
                  size={24}
                  className={styles.deleteIcon}
                />
              </div>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    title={`Reduce EMI for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="emi"
                    checked={p.mode === 'emi'}
                    onChange={() => updatePartPayment(idx, 'mode', 'emi')}
                    className={styles.radio}
                    disabled={!p.enabled}
                  />
                  <span>Reduce EMI</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    title={`Reduce Tenure for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="tenure"
                    checked={p.mode === 'tenure'}
                    onChange={() => updatePartPayment(idx, 'mode', 'tenure')}
                    className={styles.radio}
                    disabled={!p.enabled}
                  />
                  <span>Reduce Tenure</span>
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPartPayment}
          disabled={isAddPartPaymentDisabled}
          className={styles.primaryButton}
        >
          + Add Part Payment
        </button>
      </section>
      {/* Interest Rate Changes Section */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.cardEyebrow}>
              Repo Rate Shifts
            </p>
            <h2 className={styles.cardHeading}>Floating Interest Rate Changes</h2>
          </div>
          <button
            type="button"
            onClick={addRateChange}
            disabled={isAddRateChangeDisabled}
            className={styles.primaryButton}
          >
            + Add Rate Change
          </button>
        </div>
        <div className={styles.inputSection}>
          {rateChanges.length === 0 && (
            <p className={styles.emptyStateText}>
              No rate changes added yet. Model RBI rate increases or decreases during the loan
              tenure.
            </p>
          )}
          {rateChanges.map((r, idx) => (
            <div
              key={idx}
              className={`${styles.prepaymentItem} ${
                r.enabled ? styles.prepaymentItemEnabled : styles.prepaymentItemDisabled
              }`}
            >
              <div className={styles.prepaymentInputsRow}>
                <input
                  type="checkbox"
                  title={`Enable/Disable Rate Change #${idx + 1}`}
                  checked={r.enabled}
                  onChange={(e) => updateRateChange(idx, 'enabled', e.target.checked)}
                  className={styles.checkbox}
                />
                <input
                  className={styles.textInput}
                  title={`New Interest Rate #${idx + 1}`}
                  type="number"
                  step="0.1"
                  placeholder="New Interest Rate (%)"
                  value={r.rate || ''}
                  min="0"
                  max="100"
                  onChange={(e) => updateRateChange(idx, 'rate', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  disabled={!r.enabled}
                />
                <input
                  className={styles.textInput}
                  title={`Rate Change Date #${idx + 1}`}
                  type="date"
                  min={disbursementDate || undefined}
                  value={r.date}
                  onChange={(e) => updateRateChange(idx, 'date', e.target.value)}
                  disabled={!r.enabled}
                />
              </div>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    title={`Keep Tenure for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="emi"
                    checked={r.mode === 'emi'}
                    onChange={() => updateRateChange(idx, 'mode', 'emi')}
                    className={styles.radio}
                    disabled={!r.enabled}
                  />
                  <span>Adjust EMI</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    title={`Keep EMI for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="tenure"
                    checked={r.mode === 'tenure'}
                    onChange={() => updateRateChange(idx, 'mode', 'tenure')}
                    className={styles.radio}
                    disabled={!r.enabled}
                  />
                  <span>Adjust Tenure</span>
                </label>
              </div>
              <button
                onClick={() => removeRateChange(idx)}
                type="button"
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
      {/* Schedule Table */}
      {schedule.length > 0 && (
        <>
          {/* Mobile Amortization Card View */}
          <div className={styles.mobileScheduleList}>
            {schedule.map((row, idx) => (
              <article
                key={idx}
                className={`${styles.mobileCard} ${
                  row.note?.includes('Part Payment')
                    ? styles.mobileCardPartPayment
                    : row.note?.includes('ROI Change')
                      ? styles.mobileCardRoiChange
                      : ''
                }`}
              >
                <div className={styles.mobileCardHeader}>
                  <p className={styles.mobileCardTitle}>
                    {idx + 1}. {row.date}
                  </p>
                  {row.note && (
                    <span className={styles.badgeWarning}>{row.note}</span>
                  )}
                </div>
                <div className={styles.mobileCardGrid}>
                  <div>
                    <span className={styles.textMuted}>EMI: </span>
                    <span className={styles.textPrimary}>
                      ₹{parseFloat(row.emi).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className={styles.textMuted}>Balance: </span>
                    <span className={styles.textBase}>
                      ₹{parseFloat(row.balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className={styles.textMuted}>Principal: </span>
                    <span className={styles.textEmerald}>
                      ₹{parseFloat(row.principal).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className={styles.textMuted}>Interest: </span>
                    <span className={styles.textRose}>
                      ₹{parseFloat(row.interest).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.mobileCardRowDivided}>
                    <span className={styles.textMuted}>Cum. Principal: </span>
                    <span className={styles.textEmerald}>
                      ₹{parseFloat(row.cumulativePrincipal).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.mobileCardRowDivided}>
                    <span className={styles.textMuted}>Cum. Interest: </span>
                    <span className={styles.textRose}>
                      ₹{parseFloat(row.cumulativeInterest).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className={styles.mobileCardFullWidth}>
                    <span className={styles.textMuted}>Remaining Interest: </span>
                    <span className={styles.textAmber}>
                      ₹{parseFloat(row.remainingInterest).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {/* Desktop Amortization Table View */}
          <div className={styles.desktopTableWrapper}>
            <table className={styles.table} title="EMI Amortization Schedule">
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={`${styles.th} ${styles.thRight}`}>EMI</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Principal</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Interest</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Balance</th>
                  <th className={`${styles.th} ${styles.thRight} ${styles.textEmerald}`}>
                    Cum. Principal
                  </th>
                  <th className={`${styles.th} ${styles.thRight} ${styles.textRose}`}>
                    Cum. Interest
                  </th>
                  <th className={`${styles.th} ${styles.thRight} ${styles.textAmber}`}>
                    Remaining Interest
                  </th>
                  <th className={styles.th}>Note</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, idx) => (
                  <tr
                    key={idx}
                    className={
                      row.note?.includes('Part Payment')
                        ? styles.rowPartPayment
                        : row.note?.includes('ROI Change')
                          ? styles.rowRoiChange
                          : styles.rowNormal
                    }
                  >
                    <td className={`${styles.td} ${styles.tdMono}`}>
                      {row.date}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.textPrimary}`}>
                      ₹{parseFloat(row.emi).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.textEmerald}`}>
                      ₹{parseFloat(row.principal).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.textRose}`}>
                      ₹{parseFloat(row.interest).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono}`}>
                      ₹{parseFloat(row.balance).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textEmerald}`}>
                      ₹{parseFloat(row.cumulativePrincipal).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textRose}`}>
                      ₹{parseFloat(row.cumulativeInterest).toLocaleString('en-IN')}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textAmber}`}>
                      ₹{parseFloat(row.remainingInterest).toLocaleString('en-IN')}
                    </td>
                    <td className={styles.td}>
                      {row.note && (
                        <span className={styles.badgeOutline}>
                          {row.note}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <CalculatorContentSection
        title="Understanding Loan Amortization & Smart Prepayment Strategies"
        subtitle="An Equated Monthly Installment (EMI) consists of two components: the interest on the outstanding loan balance and the principal repayment. In the initial years of a loan, up to 75% of your EMI goes toward interest rather than principal reduction."
        comparisonTable={{
          headers: [
            'Prepayment Option',
            'Tenure Impact',
            'Monthly EMI Impact',
            'Total Interest Saved',
          ],
          rows: [
            [
              'Reduce Loan Tenure',
              'Reduces by 3-6 years',
              'Stays the same',
              'Maximum Interest Saved (Up to 40%)',
            ],
            [
              'Reduce Monthly EMI',
              'Stays at original years',
              'Decreases monthly burden',
              'Moderate Interest Saved (~15-20%)',
            ],
            [
              'Annual 1 Extra EMI',
              'Reduces 20-yr loan to ~16 yrs',
              'Stays the same',
              'Saves ₹7-10 Lakhs on ₹30L loan',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Dynamic Part-Payment Modeling',
            description:
              'Simulate the exact compounding impact of ad-hoc or scheduled prepayments on your debt schedule.',
          },
          {
            title: 'Floating Rate Adjustment',
            description:
              'Model future RBI repo rate hikes or cuts to prepare your household cashflow in advance.',
          },
          {
            title: 'Month-by-Month Transparency',
            description:
              'Track exact principal vs. interest breakdown for accurate Income Tax deduction claims under Section 80C & 24(b).',
          },
        ]}
        faqs={emiFaqs}
      />
    </main>
  );
};
export default EmiCalculator;

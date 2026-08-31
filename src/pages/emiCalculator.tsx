import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import CalculatorContentSection from '../components/CalculatorContentSection.tsx';

interface ScheduleRow {
  date: string;
  emi: string;
  principal: string;
  interest: string;
  balance: string;
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
          item: 'https://rupees.vercel.app/emi',
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
      ],
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
];

const EmiCalculator: React.FC = () => {
  // Load from localStorage or use defaults
  const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [loanAmount, setLoanAmount] = useState<number>(() =>
    loadFromLocalStorage('loanAmount', 3000000)
  );
  const [annualRate, setAnnualRate] = useState<number>(() => loadFromLocalStorage('annualRate', 9));
  const [tenureMonths, setTenureMonths] = useState<number>(() =>
    loadFromLocalStorage('tenureMonths', 120)
  );
  const [disbursementDate, setDisbursementDate] = useState<string>(() =>
    loadFromLocalStorage('disbursementDate', '2025-01-25')
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

  // Save to localStorage whenever values change
  useEffect(() => {
    window.localStorage.setItem('loanAmount', JSON.stringify(loanAmount));
  }, [loanAmount]);

  useEffect(() => {
    window.localStorage.setItem('annualRate', JSON.stringify(annualRate));
  }, [annualRate]);

  useEffect(() => {
    window.localStorage.setItem('tenureMonths', JSON.stringify(tenureMonths));
  }, [tenureMonths]);

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

  // Helpers
  const differenceInDays = (date1: Date, date2: Date): number => {
    const diffTime = date1.getTime() - date2.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const addMonths = (date: Date, months: number): Date => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const calculateSchedule = useCallback((): ScheduleRow[] => {
    if (!disbursementDate) return [];

    let principal: number = loanAmount;
    let currentAnnualRate: number = annualRate;
    let monthlyRate: number = currentAnnualRate / 12 / 100;

    // Sort part payments and rate changes by date
    const sortedPartPayments = [...partPayments]
      .filter((p) => p.enabled && p.amount > 0 && p.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sortedRateChanges = [...rateChanges]
      .filter((r) => r.enabled && r.rate > 0 && r.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentDate: Date = new Date(disbursementDate);
    const results: ScheduleRow[] = [];

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
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    if (includePrincipalInFirstEmi) {
      const principalComponent = initialEmiAmount - principal * monthlyRate;
      const totalFirstEmi = proratedInterest + principalComponent;
      principal -= principalComponent;
      results.push({
        date: firstEmiDate.toDateString(),
        emi: totalFirstEmi.toFixed(2),
        principal: principalComponent.toFixed(2),
        interest: proratedInterest.toFixed(2),
        balance: principal.toFixed(2),
        note: 'Prorated Interest + Principal',
      });
    } else {
      results.push({
        date: firstEmiDate.toDateString(),
        emi: proratedInterest.toFixed(2),
        principal: '0.00',
        interest: proratedInterest.toFixed(2),
        balance: principal.toFixed(2),
        note: 'Prorated Interest Only',
      });
    }

    currentDate = firstEmiDate;
    let monthCounter = 1;
    let remainingTenureMonths = tenureMonths;

    let baseEmiAmount: number =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    let currentMode: 'tenure' | 'emi' = 'tenure';

    while (principal > 1 && monthCounter <= tenureMonths + 120) {
      const nextEmiDate = addMonths(currentDate, 1);

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
        results.push({
          date: changeDate.toDateString(),
          emi: '0.00',
          principal: '0.00',
          interest: '0.00',
          balance: principal.toFixed(2),
          note: `ROI Change: ${oldRate}% → ${currentAnnualRate}% (${rateChange.mode === 'emi' ? 'Adjust EMI' : 'Adjust Tenure'})`,
        });

        if (rateChange.mode === 'emi') {
          if (remainingTenureMonths > 0) {
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
        if (remainingTenureMonths > 0) {
          emiAmount =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
            (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
        } else {
          emiAmount = principal;
        }
      }

      const partPaymentsInPeriod = sortedPartPayments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate > currentDate && paymentDate <= nextEmiDate;
      });

      for (const payment of partPaymentsInPeriod) {
        if (principal <= 1) break;
        const paymentDate = new Date(payment.date);
        const actualPaymentAmount = Math.min(payment.amount, principal);
        principal -= actualPaymentAmount;
        results.push({
          date: paymentDate.toDateString(),
          emi: actualPaymentAmount.toFixed(2),
          principal: actualPaymentAmount.toFixed(2),
          interest: '0.00',
          balance: principal.toFixed(2),
          note: `Part Payment (${payment.mode === 'emi' ? 'Reduce EMI' : 'Reduce Tenure'})`,
        });

        currentMode = payment.mode;

        if (currentMode === 'emi' && principal > 1) {
          if (remainingTenureMonths > 0) {
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
      remainingTenureMonths--;

      results.push({
        date: nextEmiDate.toDateString(),
        emi: emiAmount.toFixed(2),
        principal: principalComponent.toFixed(2),
        interest: interest.toFixed(2),
        balance: Math.max(0, principal).toFixed(2),
      });

      currentDate = nextEmiDate;
      monthCounter++;
    }

    return results;
  }, [
    loanAmount,
    annualRate,
    tenureMonths,
    disbursementDate,
    emiDate,
    partPayments,
    rateChanges,
    includePrincipalInFirstEmi,
  ]);

  const schedule = useMemo(() => calculateSchedule(), [calculateSchedule]);

  const addPartPayment = () => {
    setPartPayments([...partPayments, { amount: 0, date: '', mode: 'emi', enabled: true }]);
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
    const updated = [...partPayments];
    updated[index] = { ...updated[index], [field]: value };
    setPartPayments(updated);
  };

  const addRateChange = () => {
    setRateChanges([...rateChanges, { rate: annualRate, date: '', mode: 'tenure', enabled: true }]);
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
    const updated = [...rateChanges];
    updated[index] = { ...updated[index], [field]: value };
    setRateChanges(updated);
  };

  const totalInterest = schedule.reduce((sum, row) => sum + parseFloat(row.interest), 0);
  const totalPaid = schedule.reduce((sum, row) => sum + parseFloat(row.emi), 0);

  return (
    <main className="mx-auto px-2 w-full max-w-6xl space-y-6 py-4">
      <SEOHead
        title="EMI Calculator India | Home & Personal Loan Amortization"
        description="Calculate exact Home Loan and Personal Loan EMIs. Model part-prepayments, interest rate fluctuations, and view complete month-by-month amortization schedules."
        keywords="EMI calculator, home loan EMI calculator, loan amortization schedule India, prepayment EMI calculator, part payment home loan calculator"
        canonicalPath="/emi"
        schema={emiSchema}
      />

      <header className="text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Loan Intelligence &bull; Amortization Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Advanced Loan EMI &amp; Part-Payment Amortization Calculator
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Calculate equated monthly installments, model lump-sum prepayments, and simulate floating interest rate changes.
        </p>
      </header>

      <section className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="label label-text font-semibold text-xs" htmlFor="loan-amount">
                Loan Amount (₹)
              </label>
              <input
                id="loan-amount"
                className="input input-bordered w-full"
                title="Loan Amount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label label-text font-semibold text-xs" htmlFor="annual-rate">
                Annual Interest Rate (%)
              </label>
              <input
                id="annual-rate"
                className="input input-bordered w-full"
                title="Annual Interest Rate"
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label label-text font-semibold text-xs" htmlFor="tenure-months">
                Tenure (Months)
              </label>
              <input
                id="tenure-months"
                className="input input-bordered w-full"
                title="Tenure in Months"
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label label-text font-semibold text-xs" htmlFor="disbursement-date">
                Disbursement Date
              </label>
              <input
                id="disbursement-date"
                className="input input-bordered w-full"
                title="Disbursement Date"
                type="date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label label-text font-semibold text-xs" htmlFor="emi-date">
                EMI Date (Day of Month)
              </label>
              <input
                id="emi-date"
                className="input input-bordered w-full"
                title="EMI Date (Day of Month)"
                type="number"
                min="1"
                max="31"
                value={emiDate}
                onChange={(e) => setEmiDate(Number(e.target.value))}
              />
            </div>
            <div className="pt-2">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  title="Include Principal Payment in First EMI"
                  className="checkbox checkbox-primary"
                  checked={includePrincipalInFirstEmi}
                  onChange={(e) => setIncludePrincipalInFirstEmi(e.target.checked)}
                />
                <span className="label-text text-xs sm:text-sm font-medium">
                  Include principal payment in first EMI
                </span>
              </label>
              <p className="ml-7 text-[11px] opacity-60">
                If checked, the first EMI includes both prorated interest and principal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Part Payments Section */}
      <section className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-base-300 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Prepayment Optimizer</p>
            <h2 className="text-lg font-bold">Lump-Sum Part Payments</h2>
          </div>
          <button type="button" onClick={addPartPayment} className="btn btn-primary btn-sm">
            + Add Part Payment
          </button>
        </div>
        <div className="space-y-3">
          {partPayments.length === 0 && (
            <p className="text-xs opacity-60 italic">No part payments added yet. Click &quot;Add Part Payment&quot; above to simulate prepayments.</p>
          )}
          {partPayments.map((p, idx) => (
            <div
              key={idx}
              className={`grid gap-3 rounded-box border border-base-300 p-3 sm:grid-cols-2 lg:flex lg:items-center ${p.enabled ? 'bg-base-100' : 'bg-base-200 opacity-60'}`}
            >
              <input
                type="checkbox"
                title={`Enable/Disable Part Payment #${idx + 1}`}
                checked={p.enabled}
                onChange={(e) => updatePartPayment(idx, 'enabled', e.target.checked)}
                className="checkbox checkbox-primary self-center"
              />
              <input
                className="input input-bordered w-full lg:flex-1"
                title={`Part Payment Amount #${idx + 1}`}
                type="number"
                placeholder="Payment Amount (₹)"
                value={p.amount}
                onChange={(e) => updatePartPayment(idx, 'amount', Number(e.target.value))}
                disabled={!p.enabled}
              />
              <input
                className="input input-bordered w-full lg:flex-1"
                title={`Part Payment Date #${idx + 1}`}
                type="date"
                value={p.date}
                onChange={(e) => updatePartPayment(idx, 'date', e.target.value)}
                disabled={!p.enabled}
              />
              <div className="flex flex-wrap items-center gap-3 text-sm lg:flex-nowrap">
                <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
                  <input
                    type="radio"
                    title={`Reduce EMI for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="emi"
                    checked={p.mode === 'emi'}
                    onChange={() => updatePartPayment(idx, 'mode', 'emi')}
                    className="radio radio-primary radio-sm"
                    disabled={!p.enabled}
                  />
                  <span>Reduce EMI</span>
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
                  <input
                    type="radio"
                    title={`Reduce Tenure for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="tenure"
                    checked={p.mode === 'tenure'}
                    onChange={() => updatePartPayment(idx, 'mode', 'tenure')}
                    className="radio radio-primary radio-sm"
                    disabled={!p.enabled}
                  />
                  <span>Reduce Tenure</span>
                </label>
              </div>
              <button
                onClick={() => removePartPayment(idx)}
                type="button"
                className="btn btn-error btn-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Interest Rate Changes Section */}
      <section className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-base-300 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Repo Rate Shifts</p>
            <h2 className="text-lg font-bold">Floating Interest Rate Changes</h2>
          </div>
          <button type="button" onClick={addRateChange} className="btn btn-primary btn-sm">
            + Add Rate Change
          </button>
        </div>
        <div className="space-y-3">
          {rateChanges.length === 0 && (
            <p className="text-xs opacity-60 italic">No rate changes added yet. Model RBI rate increases or decreases during the loan tenure.</p>
          )}
          {rateChanges.map((r, idx) => (
            <div
              key={idx}
              className={`grid gap-3 rounded-box border border-base-300 p-3 sm:grid-cols-2 lg:flex lg:items-center ${r.enabled ? 'bg-base-100' : 'bg-base-200 opacity-60'}`}
            >
              <input
                type="checkbox"
                title={`Enable/Disable Rate Change #${idx + 1}`}
                checked={r.enabled}
                onChange={(e) => updateRateChange(idx, 'enabled', e.target.checked)}
                className="checkbox checkbox-primary self-center"
              />
              <input
                className="input input-bordered w-full lg:flex-1"
                title={`New Interest Rate #${idx + 1}`}
                type="number"
                step="0.1"
                placeholder="New Interest Rate (%)"
                value={r.rate}
                onChange={(e) => updateRateChange(idx, 'rate', Number(e.target.value))}
                disabled={!r.enabled}
              />
              <input
                className="input input-bordered w-full lg:flex-1"
                title={`Rate Change Date #${idx + 1}`}
                type="date"
                value={r.date}
                onChange={(e) => updateRateChange(idx, 'date', e.target.value)}
                disabled={!r.enabled}
              />
              <div className="flex flex-wrap items-center gap-3 text-sm lg:flex-nowrap">
                <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
                  <input
                    type="radio"
                    title={`Keep Tenure for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="emi"
                    checked={r.mode === 'emi'}
                    onChange={() => updateRateChange(idx, 'mode', 'emi')}
                    className="radio radio-primary radio-sm"
                    disabled={!r.enabled}
                  />
                  <span>Adjust EMI</span>
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
                  <input
                    type="radio"
                    title={`Keep EMI for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="tenure"
                    checked={r.mode === 'tenure'}
                    onChange={() => updateRateChange(idx, 'mode', 'tenure')}
                    className="radio radio-primary radio-sm"
                    disabled={!r.enabled}
                  />
                  <span>Adjust Tenure</span>
                </label>
              </div>
              <button
                onClick={() => removeRateChange(idx)}
                type="button"
                className="btn btn-error btn-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Schedule Summary & Table */}
      {schedule.length > 0 && (
        <>
          <div className="stats stats-vertical w-full border border-primary sm:stats-horizontal shadow-md bg-base-100">
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-primary">
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
              <div className="stat-title text-xs font-semibold">Total Amount Paid</div>
            </div>
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-error">
                ₹{totalInterest.toLocaleString('en-IN')}
              </div>
              <div className="stat-title text-xs font-semibold">Total Interest Paid</div>
            </div>
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-success">{schedule.length}</div>
              <div className="stat-title text-xs font-semibold">Total Installments</div>
            </div>
          </div>

          <div className="md:hidden">
            {schedule.map((row, idx) => (
              <article
                key={idx}
                className={`text-base-content/60 border-t border-base-300 p-2 ${row.note?.includes('Part Payment') ? 'border-warning bg-warning/10' : row.note?.includes('ROI Change') ? 'border-info bg-info/10' : 'bg-base-100'}`}
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm">
                    {idx + 1}. {row.date}
                  </p>
                  {row.note && (
                    <span className="badge badge-warning badge text-xs">{row.note}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-sm">
                  <div>
                    EMI:{' '}
                    <span className="font-semibold text-secondary">
                      ₹{parseFloat(row.emi).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    Balance:{' '}
                    <span className="font-semibold text-secondary">
                      ₹{parseFloat(row.balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    Principal:{' '}
                    <span className="font-semibold text-success">
                      ₹{parseFloat(row.principal).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    Interest:{' '}
                    <span className="font-semibold text-error">
                      ₹{parseFloat(row.interest).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-box border border-base-300 md:block bg-base-100 shadow-xs max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm" title="EMI Amortization Schedule">
              <thead className="sticky top-0 bg-base-200 z-10">
                <tr>
                  <th className="border-b border-base-300 px-4 py-3 text-left font-bold">
                    Date
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right font-bold">
                    EMI
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right font-bold">
                    Principal
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right font-bold">
                    Interest
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right font-bold">
                    Balance
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-left font-bold">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${row.note?.includes('Part Payment') ? 'bg-warning/10' : row.note?.includes('ROI Change') ? 'bg-info/10' : 'hover:bg-base-200/50'}`}
                  >
                    <td className="border-b border-base-300 px-4 py-2.5 text-xs font-mono">{row.date}</td>
                    <td className="border-b border-base-300 px-4 py-2.5 text-right font-semibold">
                      ₹{parseFloat(row.emi).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-2.5 text-right text-success">
                      ₹{parseFloat(row.principal).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-2.5 text-right text-error">
                      ₹{parseFloat(row.interest).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-2.5 text-right font-mono">
                      ₹{parseFloat(row.balance).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-2.5">
                      {row.note && <span className="badge badge-outline badge-sm text-[10px] font-medium">{row.note}</span>}
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
        formulaTitle="Mathematical Formula for Loan EMI Calculation"
        formula="E = P × r × (1 + r)^n / [((1 + r)^n) - 1]"
        formulaExplanation={[
          { symbol: 'E', label: 'Equated Monthly Installment (EMI) payable each month (₹)' },
          { symbol: 'P', label: 'Loan Principal borrowed amount (₹)' },
          { symbol: 'r', label: 'Monthly interest rate: Annual rate / 12 / 100' },
          { symbol: 'n', label: 'Total loan repayment tenure in months (Years × 12)' },
        ]}
        workedExample={{
          title: 'Worked Example: ₹30 Lakh Home Loan for 20 Years at 8.75%',
          description: 'Borrowing ₹30,00,000 at 8.75% annual interest over 240 months (r = 0.0072916):',
          calculation: 'E = 30,00,000 × 0.0072916 × (1.0072916)^240 / [(1.0072916)^240 - 1] = ₹26,511 / month',
          result: 'Total Amount Payable: ₹63,62,708 | Total Interest Paid: ₹33,62,708 (Exceeds Principal Loan Amount!)',
        }}
        comparisonTable={{
          headers: ['Prepayment Option', 'Tenure Impact', 'Monthly EMI Impact', 'Total Interest Saved'],
          rows: [
            ['Reduce Loan Tenure', 'Reduces by 3-6 years', 'Stays the same', 'Maximum Interest Saved (Up to 40%)'],
            ['Reduce Monthly EMI', 'Stays at original years', 'Decreases monthly burden', 'Moderate Interest Saved (~15-20%)'],
            ['Annual 1 Extra EMI', 'Reduces 20-yr loan to ~16 yrs', 'Stays the same', 'Saves ₹7-10 Lakhs on ₹30L loan'],
          ],
        }}
        keyBenefits={[
          {
            title: 'Dynamic Part-Payment Modeling',
            description: 'Simulate the exact compounding impact of ad-hoc or scheduled prepayments on your debt schedule.',
          },
          {
            title: 'Floating Rate Adjustment',
            description: 'Model future RBI repo rate hikes or cuts to prepare your household cashflow in advance.',
          },
          {
            title: 'Month-by-Month Transparency',
            description: 'Track exact principal vs. interest breakdown for accurate Income Tax deduction claims under Section 80C & 24(b).',
          },
        ]}
        faqs={emiFaqs}
      />
    </main>
  );
};

export default EmiCalculator;

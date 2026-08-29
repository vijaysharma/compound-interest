import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
      .filter((p) => p.enabled && p.amount > 0 && p.date) // Only include enabled payments
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedRateChanges = [...rateChanges]
      .filter((r) => r.enabled && r.rate > 0 && r.date) // Only include enabled rate changes
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
      // First EMI includes both prorated interest and principal
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
      // First EMI is interest only
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
    // Calculate initial EMI amount - this will be used for "tenure" mode
    let baseEmiAmount: number =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    // Track which mode is currently active (starts with tenure mode by default)
    let currentMode: 'tenure' | 'emi' = 'tenure';
    while (principal > 1 && monthCounter <= tenureMonths + 120) {
      // Add buffer for tenure extensions
      const nextEmiDate = addMonths(currentDate, 1);
      // Check for rate changes between current date and next EMI date
      const rateChangesInPeriod = sortedRateChanges.filter((r) => {
        const changeDate = new Date(r.date);
        return changeDate > currentDate && changeDate <= nextEmiDate;
      });
      // Process rate changes first
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
          // Keep tenure same, recalculate EMI with new rate
          if (remainingTenureMonths > 0) {
            baseEmiAmount =
              (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
              (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
          }
          currentMode = 'emi'; // Switch to EMI mode after rate change
        } else {
          // Keep EMI same (tenure will adjust naturally)
          // baseEmiAmount stays the same, but with new rate, tenure will extend/reduce
          currentMode = 'tenure';
        }
      }
      // Calculate current EMI amount based on current mode
      let emiAmount: number;
      if (currentMode === 'tenure') {
        // In tenure mode, keep EMI constant (use base EMI)
        emiAmount = baseEmiAmount;
      } else {
        // In EMI mode, recalculate EMI based on remaining principal and tenure
        if (remainingTenureMonths > 0) {
          emiAmount =
            (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
            (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
        } else {
          emiAmount = principal; // Pay remaining balance
        }
      }
      // Check for part payments between current date and next EMI date
      const partPaymentsInPeriod = sortedPartPayments.filter((p) => {
        const paymentDate = new Date(p.date);
        return paymentDate > currentDate && paymentDate <= nextEmiDate;
      });
      // Process part payments first
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
        // Switch mode based on this part payment's preference
        currentMode = payment.mode;
        // After part payment, handle mode-specific recalculation
        if (currentMode === 'emi' && principal > 1) {
          // Recalculate EMI with same remaining tenure
          if (remainingTenureMonths > 0) {
            emiAmount =
              (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) /
              (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
            // Update base EMI for future calculations in EMI mode
            baseEmiAmount = emiAmount;
          }
        } else if (currentMode === 'tenure' && principal > 1) {
          // In tenure mode, keep the current baseEmiAmount
          // Tenure will reduce naturally
        }
      }
      if (principal <= 1) break;
      // Process regular EMI
      const interest = principal * monthlyRate;
      let principalComponent = emiAmount - interest;
      // Ensure we don't pay more principal than what's remaining
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
  // The schedule is derived from the current inputs.
  const schedule = useMemo(() => calculateSchedule(), [calculateSchedule]);
  // Add/remove part-payments
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
  // Add/remove rate changes
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
  // Calculate summary statistics
  const totalInterest = schedule.reduce((sum, row) => sum + parseFloat(row.interest), 0);
  const totalPaid = schedule.reduce((sum, row) => sum + parseFloat(row.emi), 0);
  return (
    <main className="mx-auto px-2 w-full max-w-6xl space-y-2">
      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div>
            <label className="label label-text" htmlFor="loan-amount">
              Loan amount
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
            <label className="label label-text" htmlFor="annual-rate">
              Annual interest rate (%)
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
            <label className="label label-text" htmlFor="tenure-months">
              Tenure (months)
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
        <div className="space-y-2">
          <div>
            <label className="label label-text" htmlFor="disbursement-date">
              Disbursement date
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
            <label className="label label-text" htmlFor="emi-date">
              EMI date (day of month)
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
        </div>
      </section>
      <label className="label cursor-pointer justify-start gap-3">
        <input
          type="checkbox"
          title="Include Principal Payment in First EMI"
          className="checkbox checkbox-primary"
          checked={includePrincipalInFirstEmi}
          onChange={(e) => setIncludePrincipalInFirstEmi(e.target.checked)}
        />
        <span className="label-text text-sm font-medium">
          Include principal payment in first EMI
        </span>
      </label>
      <p className="ml-7 text-xs text-base-content/60">
        If checked, the first EMI will include both prorated interest and principal component
      </p>
      <section className="grid grid-cols-1 gap-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Adjustments</p>
            <h2 className="text-xl font-semibold">Part payments</h2>
          </div>
          <button type="button" onClick={addPartPayment} className="btn btn-primary btn-sm">
            Add part payment
          </button>
        </div>
        <div className="space-y-3">
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
                placeholder="Payment Amount"
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
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
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
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
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
      <section className="grid grid-cols-1 gap-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Adjustments</p>
            <h2 className="text-xl font-semibold">Interest rate changes</h2>
          </div>
          <button type="button" onClick={addRateChange} className="btn btn-primary btn-sm">
            Add rate change
          </button>
        </div>
        <div className="space-y-3">
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
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
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
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
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
      {schedule.length > 0 && (
        <>
          <div className="stats stats-vertical w-full border border-primary sm:stats-horizontal">
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-primary">
                ₹{totalPaid.toLocaleString('en-IN')}
              </div>
              <div className="stat-title">Total amount paid</div>
            </div>
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-error">
                ₹{totalInterest.toLocaleString('en-IN')}
              </div>
              <div className="stat-title">Total interest</div>
            </div>
            <div className="stat place-items-center text-center">
              <div className="stat-value text-2xl text-success">{schedule.length}</div>
              <div className="stat-title">Total installments</div>
            </div>
          </div>
          <div className="md:hidden">
            {schedule.map((row, idx) => (
              <article
                key={idx}
                className={`text-base-content/60 border-t border-base-300 p-2 ${row.note?.includes('Part Payment') ? 'border-warning bg-warning/10' : row.note?.includes('ROI Change') ? 'border-info bg-info/10' : 'bg-base-100'}`}
              >
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm ">
                    {idx + 1} .{row.date}
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
          <div className="hidden overflow-x-auto rounded-box border border-base-300 md:block">
            <table className="w-full" title="EMI Amortization Schedule">
              <thead>
                <tr className="bg-base-200">
                  <th className="border-b border-base-300 px-4 py-3 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right text-sm font-semibold">
                    EMI
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right text-sm font-semibold">
                    Principal
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right text-sm font-semibold">
                    Interest
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-right text-sm font-semibold">
                    Balance
                  </th>
                  <th className="border-b border-base-300 px-4 py-3 text-left text-sm font-semibold">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${row.note?.includes('Part Payment') ? 'bg-warning/10' : row.note?.includes('ROI Change') ? 'bg-info/10' : 'hover:bg-base-200'}`}
                  >
                    <td className="border-b border-base-300 px-4 py-3 text-sm">{row.date}</td>
                    <td className="border-b border-base-300 px-4 py-3 text-right text-sm">
                      ₹{parseFloat(row.emi).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-3 text-right text-sm">
                      ₹{parseFloat(row.principal).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-3 text-right text-sm">
                      ₹{parseFloat(row.interest).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-3 text-right text-sm">
                      ₹{parseFloat(row.balance).toLocaleString('en-IN')}
                    </td>
                    <td className="border-b border-base-300 px-4 py-3 text-sm">
                      {row.note && <span className="badge badge-outline badge-sm">{row.note}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
};
export default EmiCalculator;

import React, { useState, useEffect } from "react";

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
  mode: "tenure" | "emi"; // Individual mode for each part payment
  enabled: boolean; // Toggle to include/exclude from calculation
}

interface RateChange {
  rate: number;
  date: string; // ISO string
  mode: "tenure" | "emi"; // Keep EMI same (increase tenure) or Keep tenure same (increase EMI)
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

  const [loanAmount, setLoanAmount] = useState<number>(() => loadFromLocalStorage("loanAmount", 3000000));
  const [annualRate, setAnnualRate] = useState<number>(() => loadFromLocalStorage("annualRate", 9));
  const [tenureMonths, setTenureMonths] = useState<number>(() => loadFromLocalStorage("tenureMonths", 120));
  const [disbursementDate, setDisbursementDate] = useState<string>(() => loadFromLocalStorage("disbursementDate", "2025-01-25"));
  const [emiDate, setEmiDate] = useState<number>(() => loadFromLocalStorage("emiDate", 10));
  const [partPayments, setPartPayments] = useState<PartPayment[]>(() => loadFromLocalStorage("partPayments", []));
  const [rateChanges, setRateChanges] = useState<RateChange[]>(() => loadFromLocalStorage("rateChanges", []));
  const [includePrincipalInFirstEmi, setIncludePrincipalInFirstEmi] = useState<boolean>(() => loadFromLocalStorage("includePrincipalInFirstEmi", false));
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);

  // Save to localStorage whenever values change
  useEffect(() => {
    window.localStorage.setItem("loanAmount", JSON.stringify(loanAmount));
  }, [loanAmount]);

  useEffect(() => {
    window.localStorage.setItem("annualRate", JSON.stringify(annualRate));
  }, [annualRate]);

  useEffect(() => {
    window.localStorage.setItem("tenureMonths", JSON.stringify(tenureMonths));
  }, [tenureMonths]);

  useEffect(() => {
    window.localStorage.setItem("disbursementDate", JSON.stringify(disbursementDate));
  }, [disbursementDate]);

  useEffect(() => {
    window.localStorage.setItem("emiDate", JSON.stringify(emiDate));
  }, [emiDate]);

  useEffect(() => {
    window.localStorage.setItem("partPayments", JSON.stringify(partPayments));
  }, [partPayments]);

  useEffect(() => {
    window.localStorage.setItem("rateChanges", JSON.stringify(rateChanges));
  }, [rateChanges]);

  useEffect(() => {
    window.localStorage.setItem("includePrincipalInFirstEmi", JSON.stringify(includePrincipalInFirstEmi));
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

  const calculateSchedule = (): void => {
    if (!disbursementDate) return;

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
    const initialEmiAmount: number = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

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
        note: "Prorated Interest + Principal",
      });
    } else {
      // First EMI is interest only
      results.push({
        date: firstEmiDate.toDateString(),
        emi: proratedInterest.toFixed(2),
        principal: "0.00",
        interest: proratedInterest.toFixed(2),
        balance: principal.toFixed(2),
        note: "Prorated Interest Only",
      });
    }

    currentDate = firstEmiDate;

    let monthCounter = 1;
    let remainingTenureMonths = tenureMonths;

    // Calculate initial EMI amount - this will be used for "tenure" mode
    let baseEmiAmount: number = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    // Track which mode is currently active (starts with tenure mode by default)
    let currentMode: "tenure" | "emi" = "tenure";

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
          emi: "0.00",
          principal: "0.00",
          interest: "0.00",
          balance: principal.toFixed(2),
          note: `ROI Change: ${oldRate}% → ${currentAnnualRate}% (${rateChange.mode === "emi" ? "Adjust EMI" : "Adjust Tenure"})`,
        });

        if (rateChange.mode === "emi") {
          // Keep tenure same, recalculate EMI with new rate
          if (remainingTenureMonths > 0) {
            baseEmiAmount = (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) / (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
          }
          currentMode = "emi"; // Switch to EMI mode after rate change
        } else {
          // Keep EMI same (tenure will adjust naturally)
          // baseEmiAmount stays the same, but with new rate, tenure will extend/reduce
          currentMode = "tenure";
        }
      }

      // Calculate current EMI amount based on current mode
      let emiAmount: number;
      if (currentMode === "tenure") {
        // In tenure mode, keep EMI constant (use base EMI)
        emiAmount = baseEmiAmount;
      } else {
        // In EMI mode, recalculate EMI based on remaining principal and tenure
        if (remainingTenureMonths > 0) {
          emiAmount = (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) / (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
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
          interest: "0.00",
          balance: principal.toFixed(2),
          note: `Part Payment (${payment.mode === "emi" ? "Reduce EMI" : "Reduce Tenure"})`,
        });

        // Switch mode based on this part payment's preference
        currentMode = payment.mode;

        // After part payment, handle mode-specific recalculation
        if (currentMode === "emi" && principal > 1) {
          // Recalculate EMI with same remaining tenure
          if (remainingTenureMonths > 0) {
            emiAmount = (principal * monthlyRate * Math.pow(1 + monthlyRate, remainingTenureMonths)) / (Math.pow(1 + monthlyRate, remainingTenureMonths) - 1);
            // Update base EMI for future calculations in EMI mode
            baseEmiAmount = emiAmount;
          }
        } else if (currentMode === "tenure" && principal > 1) {
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

    setSchedule(results);
  };

  // Auto recalc whenever inputs change
  useEffect(() => {
    calculateSchedule();
  }, [loanAmount, annualRate, tenureMonths, disbursementDate, emiDate, partPayments, rateChanges, includePrincipalInFirstEmi]);

  // Add/remove part-payments
  const addPartPayment = () => {
    setPartPayments([...partPayments, { amount: 0, date: "", mode: "emi", enabled: true }]);
  };

  const removePartPayment = (index: number) => {
    const updated = partPayments.filter((_, i) => i !== index);
    setPartPayments(updated);
  };

  const updatePartPayment = (index: number, field: keyof PartPayment, value: string | number | boolean) => {
    const updated = [...partPayments];
    (updated[index] as any)[field] = value;
    setPartPayments(updated);
  };

  // Add/remove rate changes
  const addRateChange = () => {
    setRateChanges([...rateChanges, { rate: annualRate, date: "", mode: "tenure", enabled: true }]);
  };

  const removeRateChange = (index: number) => {
    const updated = rateChanges.filter((_, i) => i !== index);
    setRateChanges(updated);
  };

  const updateRateChange = (index: number, field: keyof RateChange, value: string | number | boolean) => {
    const updated = [...rateChanges];
    (updated[index] as any)[field] = value;
    setRateChanges(updated);
  };

  // Calculate summary statistics
  const totalInterest = schedule.reduce((sum, row) => sum + parseFloat(row.interest), 0);
  const totalPaid = schedule.reduce((sum, row) => sum + parseFloat(row.emi), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">EMI Calculator with Multiple Part Payments</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount:</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Loan Amount"
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest Rate (%):</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Annual Interest Rate"
              type="number"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (months):</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Tenure in Months"
              type="number"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disbursement Date:</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Disbursement Date"
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">EMI Date (day of month):</label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="EMI Date (Day of Month)"
              type="number"
              min="1"
              max="31"
              value={emiDate}
              onChange={(e) => setEmiDate(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                title="Include Principal Payment in First EMI"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={includePrincipalInFirstEmi}
                onChange={(e) => setIncludePrincipalInFirstEmi(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Include principal payment in first EMI</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">If checked, the first EMI will include both prorated interest and principal component</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Part Payments</h3>
        <div className="space-y-3">
          {partPayments.map((p, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-md ${p.enabled ? "bg-gray-50" : "bg-gray-200 opacity-60"}`}>
              <input
                type="checkbox"
                title={`Enable/Disable Part Payment #${idx + 1}`}
                checked={p.enabled}
                onChange={(e) => updatePartPayment(idx, "enabled", e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Part Payment Amount #${idx + 1}`}
                type="number"
                placeholder="Payment Amount"
                value={p.amount}
                onChange={(e) => updatePartPayment(idx, "amount", Number(e.target.value))}
                disabled={!p.enabled}
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Part Payment Date #${idx + 1}`}
                type="date"
                value={p.date}
                onChange={(e) => updatePartPayment(idx, "date", e.target.value)}
                disabled={!p.enabled}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    title={`Reduce EMI for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="emi"
                    checked={p.mode === "emi"}
                    onChange={() => updatePartPayment(idx, "mode", "emi")}
                    className="w-4 h-4 text-blue-600"
                    disabled={!p.enabled}
                  />
                  <span className="text-gray-700">Reduce EMI</span>
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    title={`Reduce Tenure for Payment #${idx + 1}`}
                    name={`mode-${idx}`}
                    value="tenure"
                    checked={p.mode === "tenure"}
                    onChange={() => updatePartPayment(idx, "mode", "tenure")}
                    className="w-4 h-4 text-blue-600"
                    disabled={!p.enabled}
                  />
                  <span className="text-gray-700">Reduce Tenure</span>
                </label>
              </div>
              <button onClick={() => removePartPayment(idx)} className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button onClick={addPartPayment} className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
          + Add Part Payment
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Interest Rate Changes</h3>
        <div className="space-y-3">
          {rateChanges.map((r, idx) => (
            <div key={idx} className={`flex gap-3 items-center p-3 rounded-md ${r.enabled ? "bg-blue-50" : "bg-gray-200 opacity-60"}`}>
              <input
                type="checkbox"
                title={`Enable/Disable Rate Change #${idx + 1}`}
                checked={r.enabled}
                onChange={(e) => updateRateChange(idx, "enabled", e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`New Interest Rate #${idx + 1}`}
                type="number"
                step="0.1"
                placeholder="New Interest Rate (%)"
                value={r.rate}
                onChange={(e) => updateRateChange(idx, "rate", Number(e.target.value))}
                disabled={!r.enabled}
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Rate Change Date #${idx + 1}`}
                type="date"
                value={r.date}
                onChange={(e) => updateRateChange(idx, "date", e.target.value)}
                disabled={!r.enabled}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    title={`Keep Tenure for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="emi"
                    checked={r.mode === "emi"}
                    onChange={() => updateRateChange(idx, "mode", "emi")}
                    className="w-4 h-4 text-blue-600"
                    disabled={!r.enabled}
                  />
                  <span className="text-gray-700">Adjust EMI</span>
                </label>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="radio"
                    title={`Keep EMI for Rate Change #${idx + 1}`}
                    name={`rate-mode-${idx}`}
                    value="tenure"
                    checked={r.mode === "tenure"}
                    onChange={() => updateRateChange(idx, "mode", "tenure")}
                    className="w-4 h-4 text-blue-600"
                    disabled={!r.enabled}
                  />
                  <span className="text-gray-700">Adjust Tenure</span>
                </label>
              </div>
              <button onClick={() => removeRateChange(idx)} className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button onClick={addRateChange} className="mt-3 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
          + Add Rate Change
        </button>
      </div>

      {schedule.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₹{totalPaid.toLocaleString("en-IN")}</div>
              <div className="text-sm text-gray-600">Total Amount Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">₹{totalInterest.toLocaleString("en-IN")}</div>
              <div className="text-sm text-gray-600">Total Interest</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{schedule.length} payments</div>
              <div className="text-sm text-gray-600">Total Installments</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow-sm" title="EMI Amortization Schedule">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">EMI</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Principal</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Interest</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Note</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, idx) => (
                  <tr key={idx} className={`${row.note?.includes("Part Payment") ? "bg-yellow-50" : row.note?.includes("ROI Change") ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b">{row.date}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 border-b">₹{parseFloat(row.emi).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 border-b">₹{parseFloat(row.principal).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 border-b">₹{parseFloat(row.interest).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 border-b">₹{parseFloat(row.balance).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-b">{row.note && <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{row.note}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EmiCalculator;

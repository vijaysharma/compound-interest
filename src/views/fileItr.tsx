'use client';
import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiShield,
  FiArrowRight,
  FiDownload,
  FiExternalLink,
  FiLayers,
} from 'react-icons/fi';
import SEOHead from '../components/SEOHead';
import {
  compareTaxRegimes,
  getAssessmentYear,
  getLatestRunningFinancialYear,
} from '../utilities/incomeTaxCalculations';
import styles from './FileItr.module.scss';
interface Form16ExtractedData {
  employerName: string;
  employerTan: string;
  employeePan: string;
  assessmentYear: string;
  grossSalary: number;
  basicSalary: number;
  hraReceived: number;
  rentPaid: number;
  exemptAllowances: number;
  standardDeduction: number;
  professionalTax: number;
  section80C: number;
  section80Ccd1b: number;
  section80D: number;
  section80E: number;
  section80G: number;
  section80Tta: number;
  otherDeductions: number;
  otherIncome: number;
  tdsDeducted: number;
}
const DEFAULT_SAMPLE_FORM16: Form16ExtractedData = {
  employerName: 'Tata Consultancy Services Ltd.',
  employerTan: 'MUMB12345E',
  employeePan: 'ABCDE1234F',
  assessmentYear: getAssessmentYear(getLatestRunningFinancialYear()),
  grossSalary: 1650000,
  basicSalary: 825000,
  hraReceived: 330000,
  rentPaid: 240000,
  exemptAllowances: 25000,
  standardDeduction: 75000,
  professionalTax: 2400,
  section80C: 150000,
  section80Ccd1b: 50000,
  section80D: 25000,
  section80E: 0,
  section80G: 10000,
  section80Tta: 8500,
  otherDeductions: 0,
  otherIncome: 25000,
  tdsDeducted: 145000,
};
const FileItr: React.FC = () => {
  const [formData, setFormData] = useState<Form16ExtractedData>(DEFAULT_SAMPLE_FORM16);
  const [fileName, setFileName] = useState<string>('Sample_Form_16_Part_B.pdf');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Parse Form 16 text (supports CSV, TXT, JSON, and regex scanning)
  const parseForm16Text = (text: string) => {
    const data: Partial<Form16ExtractedData> = {};
    // Check if JSON
    try {
      const parsedJson = JSON.parse(text);
      if (typeof parsedJson === 'object' && parsedJson !== null) {
        setFormData((prev) => ({ ...prev, ...parsedJson }));
        return;
      }
    } catch {
      // Continue to regex parsing
    }
    const extractNumber = (patterns: RegExp[]): number => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const clean = match[1].replace(/,/g, '').trim();
          const num = parseFloat(clean);
          if (!Number.isNaN(num) && num > 0) return num;
        }
      }
      return 0;
    };
    const extractString = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return '';
    };
    // Extract fields
    const pan = extractString([/[A-Z]{5}[0-9]{4}[A-Z]{1}/i, /PAN(?:\s+of\s+the\s+Employee)?[:\s]+([A-Z0-9]{10})/i]);
    if (pan) data.employeePan = pan.toUpperCase();
    const tan = extractString([/TAN(?:\s+of\s+the\s+Employer)?[:\s]+([A-Z0-9]{10})/i, /[A-Z]{4}[0-9]{5}[A-Z]{1}/i]);
    if (tan) data.employerTan = tan.toUpperCase();
    const employer = extractString([/Name\s+and\s+address\s+of\s+the\s+Employer[:\s]+([^\n\r]+)/i]);
    if (employer) data.employerName = employer;
    // Gross Salary
    const gross = extractNumber([
      /Gross\s+Salary[^\d]*([\d,]+(?:\.\d+)?)/i,
      /Salary\s+as\s+per\s+provisions\s+contained\s+in\s+sec(?:\.|\s+)17\(1\)[^\d]*([\d,]+(?:\.\d+)?)/i,
      /Total\s+Salary[^\d]*([\d,]+(?:\.\d+)?)/i,
    ]);
    if (gross > 0) data.grossSalary = gross;
    // Standard Deduction
    const std = extractNumber([/Standard\s+Deduction[^\d]*([\d,]+(?:\.\d+)?)/i, /16\(ia\)[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (std > 0) data.standardDeduction = std;
    // Professional Tax
    const pt = extractNumber([/Professional\s+Tax[^\d]*([\d,]+(?:\.\d+)?)/i, /16\(iii\)[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (pt > 0) data.professionalTax = pt;
    // HRA / Exempt Allowances
    const hra = extractNumber([/House\s+Rent\s+Allowance[^\d]*([\d,]+(?:\.\d+)?)/i, /10\(13A\)[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (hra > 0) data.hraReceived = hra;
    // 80C
    const sec80C = extractNumber([/80C[^\d]*([\d,]+(?:\.\d+)?)/i, /Chapter\s+VIA.*80C[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (sec80C > 0) data.section80C = Math.min(150000, sec80C);
    // 80CCD(1B)
    const sec80Ccd1b = extractNumber([/80CCD\(1B\)[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (sec80Ccd1b > 0) data.section80Ccd1b = Math.min(50000, sec80Ccd1b);
    // 80D
    const sec80D = extractNumber([/80D[^\d]*([\d,]+(?:\.\d+)?)/i]);
    if (sec80D > 0) data.section80D = sec80D;
    // TDS
    const tds = extractNumber([
      /Total\s+tax\s+deducted[^\d]*([\d,]+(?:\.\d+)?)/i,
      /Tax\s+deducted\s+at\s+source[^\d]*([\d,]+(?:\.\d+)?)/i,
      /TDS[^\d]*([\d,]+(?:\.\d+)?)/i,
    ]);
    if (tds > 0) data.tdsDeducted = tds;
    setFormData((prev) => ({
      ...prev,
      ...data,
      basicSalary: data.basicSalary || Math.round((data.grossSalary || prev.grossSalary) * 0.5),
    }));
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsSampleLoaded(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        parseForm16Text(content);
      }
    };
    reader.readAsText(file);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsSampleLoaded(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          parseForm16Text(content);
        }
      };
      reader.readAsText(file);
    }
  };
  const loadSampleForm16 = () => {
    setFormData(DEFAULT_SAMPLE_FORM16);
    setFileName('Sample_Form_16_Infosys.pdf');
    setIsSampleLoaded(true);
  };
  const updateField = (field: keyof Form16ExtractedData, val: string | number) => {
    const numericFields: (keyof Form16ExtractedData)[] = [
      'grossSalary',
      'basicSalary',
      'hraReceived',
      'rentPaid',
      'exemptAllowances',
      'standardDeduction',
      'professionalTax',
      'section80C',
      'section80Ccd1b',
      'section80D',
      'section80E',
      'section80G',
      'section80Tta',
      'otherDeductions',
      'otherIncome',
      'tdsDeducted',
    ];
    if (numericFields.includes(field)) {
      const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.]/g, '')) || 0 : Number(val) || 0;
      setFormData((prev) => ({ ...prev, [field]: num }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: String(val) }));
    }
  };
  // Compare Tax Regimes
  const taxComparison = useMemo(() => {
    return compareTaxRegimes({
      financialYear: getLatestRunningFinancialYear(),
      ageCategory: 'general',
      isSalaried: true,
      grossSalary: formData.grossSalary,
      basicSalary: formData.basicSalary,
      hraReceived: formData.hraReceived,
      rentPaid: formData.rentPaid,
      cityCategory: 'metro',
      professionalTax: formData.professionalTax,
      exemptAllowances: formData.exemptAllowances,
      customStandardDeduction: formData.standardDeduction,
      businessIncome: 0,
      isSelfOccupied: true,
      rentalIncome: 0,
      municipalTaxes: 0,
      homeLoanInterestProperty: 0,
      equityStcg: 0,
      equityLtcg: 0,
      otherCapitalGains: 0,
      savingsInterest: formData.section80Tta,
      fdInterest: 0,
      ppfInterest: 0,
      otherIncome: formData.otherIncome,
      section80C: formData.section80C,
      section80Ccd1b: formData.section80Ccd1b,
      section80Ccd2: 0,
      section80D_self: formData.section80D,
      selfSeniorCitizen: false,
      section80D_parents: 0,
      parentsSeniorCitizen: false,
      section80E: formData.section80E,
      section80G: formData.section80G,
      section80Tta: formData.section80Tta,
      otherDeductions: formData.otherDeductions,
    });
  }, [formData]);
  const recommendedResult =
    taxComparison.recommendedRegime === 'new' ? taxComparison.newRegime : taxComparison.oldRegime;
  const refundDifference = formData.tdsDeducted - recommendedResult.totalTaxPayable;
  const isRefundDue = refundDifference > 0;
  const isBalanceTaxPayable = refundDifference < 0;
  // Download ITR Return Computation Sheet
  const handleDownloadSummary = () => {
    const exportData = {
      title: 'Income Tax Return (ITR-1) Computation Summary',
      generatedOn: new Date().toLocaleDateString('en-IN'),
      assessmentYear: formData.assessmentYear,
      employer: {
        name: formData.employerName,
        tan: formData.employerTan,
      },
      employee: {
        pan: formData.employeePan,
      },
      salarySummary: {
        grossSalary: formData.grossSalary,
        exemptionsSec10: formData.exemptAllowances + recommendedResult.hraExemption,
        standardDeduction: recommendedResult.standardDeduction,
        professionalTax: formData.professionalTax,
        netSalary: recommendedResult.grossTotalIncome,
      },
      deductionsClaimed: {
        section80C: formData.section80C,
        section80CCD1B: formData.section80Ccd1b,
        section80D: formData.section80D,
        section80TTA: formData.section80Tta,
        totalDeductions: recommendedResult.totalDeductions,
      },
      taxComputation: {
        recommendedRegime: taxComparison.recommendedRegime.toUpperCase() + ' TAX REGIME',
        totalTaxableIncome: recommendedResult.taxableIncome,
        taxPayable: recommendedResult.totalTaxPayable,
        tdsDeductedByEmployer: formData.tdsDeducted,
        netOutcome: isRefundDue
          ? `REFUND DUE: ₹${Math.abs(refundDifference).toLocaleString('en-IN')}`
          : isBalanceTaxPayable
            ? `BALANCE TAX PAYABLE: ₹${Math.abs(refundDifference).toLocaleString('en-IN')}`
            : 'ZERO TAX / NIL BALANCE',
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ITR_Computation_${formData.employeePan}_${formData.assessmentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className={styles.container}>
      <SEOHead
        title={`Upload Form 16 & Prepare Income Tax Return (ITR) India — FY ${getLatestRunningFinancialYear()} (${getAssessmentYear(getLatestRunningFinancialYear())})`}
        description="Auto-extract salary from Form 16, verify TDS deducted, compare New vs Old Tax Regime, compute refund or balance tax payable, and prepare your ITR filing summary."
        keywords="Form 16 upload, prepare ITR 1, tax refund check, compare old new regime, Form 16 parser India, file income tax return"
        canonicalPath="/file-itr"
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield /> Form 16 Auto-Reader &bull; ITR-1 Return Preparation
        </div>
        <h1 className={styles.title}>Upload Form 16 &amp; Prepare Tax Return</h1>
        <p className={styles.subtitle}>
          Extract details from your employer&apos;s Form 16, compare Old vs New Tax Regime, verify your TDS
          credit, and prepare all schedules needed to file your return on the income tax portal.
        </p>
      </header>
      {/* Upload Dropzone */}
      <section className={styles.uploadCard}>
        <div
          className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.json,.csv"
            className={styles.fileInputHidden}
            onChange={handleFileUpload}
          />
          <div className={styles.dropzoneIcon}>
            <FiUploadCloud size={28} />
          </div>
          <h3 className={styles.dropzoneTitle}>Upload Form 16 (PDF, Text, or JSON)</h3>
          <p className={styles.dropzoneSubtitle}>
            Drag and drop your Form 16 Part B here, or click to browse from your device.
            <br />
            100% private: All data stays in your browser and is never stored on a server.
          </p>
          <div className={styles.dropzoneActions} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiFileText /> Browse File
            </button>
            <button
              type="button"
              className={styles.sampleBtn}
              onClick={loadSampleForm16}
            >
              <FiCheckCircle /> Load Sample Form 16
            </button>
          </div>
        </div>
        {fileName && (
          <div className={styles.fileSuccessBanner}>
            <div className={styles.fileSuccessInfo}>
              <FiCheckCircle size={18} />
              <span>
                Loaded: <strong>{fileName}</strong> {isSampleLoaded && '(Pre-filled with Sample Data)'}
              </span>
            </div>
            <button
              type="button"
              className={styles.clearFileBtn}
              onClick={() => {
                setFileName('');
                setFormData({
                  employerName: '',
                  employerTan: '',
                  employeePan: '',
                  assessmentYear: '2025-26',
                  grossSalary: 0,
                  basicSalary: 0,
                  hraReceived: 0,
                  rentPaid: 0,
                  exemptAllowances: 0,
                  standardDeduction: 75000,
                  professionalTax: 0,
                  section80C: 0,
                  section80Ccd1b: 0,
                  section80D: 0,
                  section80E: 0,
                  section80G: 0,
                  section80Tta: 0,
                  otherDeductions: 0,
                  otherIncome: 0,
                  tdsDeducted: 0,
                });
              }}
            >
              Clear &amp; Reset
            </button>
          </div>
        )}
      </section>
      {/* Hero Result Banner: Refund or Tax Payable */}
      <section
        className={`${styles.heroBanner} ${
          isRefundDue ? styles.heroRefund : isBalanceTaxPayable ? styles.heroPayable : styles.heroNil
        }`}
      >
        <div className={styles.heroContent}>
          <div
            className={`${styles.heroTag} ${
              isRefundDue ? styles.tagRefund : isBalanceTaxPayable ? styles.tagPayable : styles.tagPrimary
            }`}
          >
            {isRefundDue ? '🟢 Income Tax Refund Due' : isBalanceTaxPayable ? '🔴 Balance Tax Payable' : '⚪ Nil Return / Zero Balance'}
          </div>
          <h2 className={styles.heroTitle}>
            ₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}
          </h2>
          <p className={styles.heroSub}>
            {isRefundDue ? (
              <>
                You are entitled to a refund of{' '}
                <strong>₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}</strong> because
                your employer deducted ₹{formData.tdsDeducted.toLocaleString('en-IN')} TDS, but your total tax
                liability under the {taxComparison.recommendedRegime.toUpperCase()} Regime is only ₹
                {Math.round(recommendedResult.totalTaxPayable).toLocaleString('en-IN')}.
              </>
            ) : isBalanceTaxPayable ? (
              <>
                You have a pending tax liability of{' '}
                <strong>₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}</strong> to pay
                before filing your return.
              </>
            ) : (
              <>Your TDS matches your tax liability exactly. No additional payment or refund is due.</>
            )}
          </p>
        </div>
        <div className={styles.heroMetrics}>
          <div className={styles.heroMetricItem}>
            <span className={styles.heroMetricLabel}>TDS Deducted (Form 16)</span>
            <span className={styles.heroMetricValue}>₹{formData.tdsDeducted.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.heroMetricItem}>
            <span className={styles.heroMetricLabel}>Optimal Tax Liability</span>
            <span
              className={`${styles.heroMetricValue} ${
                isRefundDue ? styles.metricRefund : styles.metricPayable
              }`}
            >
              ₹{Math.round(recommendedResult.totalTaxPayable).toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.heroMetricItem}>
            <span className={styles.heroMetricLabel}>Recommended Regime</span>
            <span className={`${styles.heroMetricValue} ${styles.textCapitalize}`}>
              {taxComparison.recommendedRegime} Regime
            </span>
          </div>
          <div className={styles.heroMetricItem}>
            <span className={styles.heroMetricLabel}>Regime Tax Savings</span>
            <span className={`${styles.heroMetricValue} ${styles.metricSuccess}`}>
              ₹{Math.round(taxComparison.taxSavings).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>
      {/* Main Grid: Form 16 Review / Live Inputs & Regime Breakdown */}
      <div className={styles.mainGrid}>
        {/* Left Column: Form 16 Extracted Data Editor */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                <FiFileText /> Form 16 Extracted Details
              </h3>
              <p className={styles.cardSub}>
                Review or edit extracted figures to recalculate taxes in real time.
              </p>
            </div>
          </div>
          <div className={styles.columnGap125}>
            {/* Employer & Employee Details */}
            <div>
              <h4 className={styles.formSectionTitle}>
                Employer &amp; Employee Identification
              </h4>
              <div className={styles.formGrid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Employer Name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.employerName}
                    onChange={(e) => updateField('employerName', e.target.value)}
                  />
                </div>
                <div className={`${styles.formGrid2} ${styles.gridGapSmall}`}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Employer TAN</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.employerTan}
                      onChange={(e) => updateField('employerTan', e.target.value)}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Employee PAN</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.employeePan}
                      onChange={(e) => updateField('employeePan', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Salary Breakdown */}
            <div>
              <h4 className={styles.formSectionTitle}>
                Salary &amp; Allowances (Section 17)
              </h4>
              <div className={styles.formGrid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Gross Salary (Sec 17(1))</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.grossSalary ? formData.grossSalary.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('grossSalary', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Basic Salary</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.basicSalary ? formData.basicSalary.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('basicSalary', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>HRA Received (Sec 10(13A))</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.hraReceived ? formData.hraReceived.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('hraReceived', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Actual Rent Paid for Year</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.rentPaid ? formData.rentPaid.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('rentPaid', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Standard Deduction (Sec 16(ia))</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.standardDeduction ? formData.standardDeduction.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('standardDeduction', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Professional Tax (Sec 16(iii))</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.professionalTax ? formData.professionalTax.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('professionalTax', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Chapter VI-A Deductions */}
            <div>
              <h4 className={styles.formSectionTitle}>
                Chapter VI-A Deductions &amp; Investments
              </h4>
              <div className={styles.formGrid2}>
                <div className={styles.formField}>
                  <label className={styles.label}>Section 80C (PPF, EPF, ELSS - Max ₹1.5L)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.section80C ? formData.section80C.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('section80C', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Section 80CCD(1B) (NPS Self - Max ₹50K)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.section80Ccd1b ? formData.section80Ccd1b.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('section80Ccd1b', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Section 80D (Health Insurance)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.section80D ? formData.section80D.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('section80D', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Savings Interest (Sec 80TTA)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.section80Tta ? formData.section80Tta.toLocaleString('en-IN') : ''}
                    onChange={(e) => updateField('section80Tta', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* TDS Already Deducted */}
            <div>
              <h4 className={styles.formSectionTitleGreen}>
                Tax Deducted at Source (TDS Paid)
              </h4>
              <div className={styles.formField}>
                <label className={styles.label}>Total TDS Deducted by Employer (₹)</label>
                <input
                  type="text"
                  className={`${styles.input} ${styles.highlightGreenInput}`}
                  value={formData.tdsDeducted ? formData.tdsDeducted.toLocaleString('en-IN') : ''}
                  onChange={(e) => updateField('tdsDeducted', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Right Column: Dual Regime Comparison & ITR Summary */}
        <div className={styles.columnGap15}>
          {/* Regime Comparison Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FiLayers /> Old vs New Regime Comparison
                </h3>
                <p className={styles.cardSub}>
                  Compare side-by-side to choose the regime that maximizes your refund.
                </p>
              </div>
            </div>
            <div className={styles.regimeCompareGrid}>
              {/* New Tax Regime */}
              <div
                className={`${styles.regimeCard} ${
                  taxComparison.recommendedRegime === 'new' ? styles.regimeCardRecommended : ''
                }`}
              >
                <span
                  className={`${styles.regimeTag} ${
                    taxComparison.recommendedRegime === 'new' ? styles.regimeTagRecommended : ''
                  }`}
                >
                  New Regime {taxComparison.recommendedRegime === 'new' ? '★ Optimal Choice' : ''}
                </span>
                <div className={styles.regimeTaxAmount}>
                  ₹{Math.round(taxComparison.newRegime.totalTaxPayable).toLocaleString('en-IN')}
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Gross Salary:</span>
                  <span className={styles.regimeRowVal}>₹{formData.grossSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Standard Deduction:</span>
                  <span className={styles.regimeRowVal}>₹75,000</span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Chapter VI-A Deductions:</span>
                  <span className={styles.regimeRowVal}>₹0 (Disallowed)</span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Taxable Income:</span>
                  <span className={styles.regimeRowVal}>
                    ₹{Math.round(taxComparison.newRegime.taxableIncome).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Rebate u/s 87A:</span>
                  <span className={`${styles.regimeRowVal} ${styles.rowValSuccess}`}>
                    -₹{Math.round(taxComparison.newRegime.rebate87A).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              {/* Old Tax Regime */}
              <div
                className={`${styles.regimeCard} ${
                  taxComparison.recommendedRegime === 'old' ? styles.regimeCardRecommended : ''
                }`}
              >
                <span
                  className={`${styles.regimeTag} ${
                    taxComparison.recommendedRegime === 'old' ? styles.regimeTagRecommended : ''
                  }`}
                >
                  Old Regime {taxComparison.recommendedRegime === 'old' ? '★ Optimal Choice' : ''}
                </span>
                <div className={styles.regimeTaxAmount}>
                  ₹{Math.round(taxComparison.oldRegime.totalTaxPayable).toLocaleString('en-IN')}
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Gross Salary:</span>
                  <span className={styles.regimeRowVal}>₹{formData.grossSalary.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Standard Deduction:</span>
                  <span className={styles.regimeRowVal}>₹50,000</span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>HRA Exemption:</span>
                  <span className={styles.regimeRowVal}>
                    ₹{Math.round(taxComparison.oldRegime.hraExemption).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Chapter VI-A (80C, 80D...):</span>
                  <span className={styles.regimeRowVal}>
                    ₹{Math.round(taxComparison.oldRegime.totalDeductions - 50000 - taxComparison.oldRegime.hraExemption).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.regimeRow}>
                  <span className={styles.regimeRowLabel}>Taxable Income:</span>
                  <span className={styles.regimeRowVal}>
                    ₹{Math.round(taxComparison.oldRegime.taxableIncome).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* ITR Return Preparation Checklist Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FiCheckCircle /> Ready to File ITR-1 (Sahaj)
                </h3>
                <p className={styles.cardSub}>
                  Follow these 4 verified steps to complete your e-filing on the government portal.
                </p>
              </div>
            </div>
            <div className={styles.checklist}>
              <div className={styles.checklistItem}>
                <FiCheckCircle className={styles.checkIcon} size={18} />
                <div>
                  <strong>1. Verify Form 26AS &amp; AIS/TIS</strong>
                  <br />
                  Login to incometax.gov.in, go to &quot;Services &gt; Annual Information Statement (AIS)&quot; and verify that your employer has deposited ₹{formData.tdsDeducted.toLocaleString('en-IN')} TDS under Section 192.
                </div>
              </div>
              <div className={styles.checklistItem}>
                <FiCheckCircle className={styles.checkIcon} size={18} />
                <div>
                  <strong>2. Select ITR Form: ITR-1 (Sahaj)</strong>
                  <br />
                  Since your income is from salary, one house property, and other sources (interest) totaling under ₹50 Lakhs, select <strong>ITR-1</strong> on the portal.
                </div>
              </div>
              <div className={styles.checklistItem}>
                <FiCheckCircle className={styles.checkIcon} size={18} />
                <div>
                  <strong>3. Opt for {taxComparison.recommendedRegime.toUpperCase()} Tax Regime</strong>
                  <br />
                  The {taxComparison.recommendedRegime.toUpperCase()} Regime saves you ₹{Math.round(taxComparison.taxSavings).toLocaleString('en-IN')} in tax. Select this regime when prompted in Part A of the ITR.
                </div>
              </div>
              <div className={styles.checklistItem}>
                <FiCheckCircle className={styles.checkIcon} size={18} />
                <div>
                  <strong>4. E-Verify with Aadhaar OTP for Instant Refund</strong>
                  <br />
                  Ensure your bank account is pre-validated for direct ECS refund credit. E-verify immediately using Aadhaar OTP to get refunds credited in 10-15 business days.
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.actionBtnPrimary}
                onClick={handleDownloadSummary}
              >
                <FiDownload /> Download ITR Computation (JSON)
              </button>
              <a
                href="https://eportal.incometax.gov.in/iec/foservices/#/login"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionBtnSecondary}
              >
                Go to Income Tax Portal <FiExternalLink />
              </a>
              <Link href="/income-tax-calculator" className={styles.actionBtnSecondary}>
                Full Tax Calculator <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
export default FileItr;

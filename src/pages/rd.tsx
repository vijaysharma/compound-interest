import { useState } from 'react';
import DisplayCard from '../components/DisplayCard.tsx';
import InputAmount from '../components/InputAmount.tsx';
import RateOfInterest from '../components/RateOfInterest.tsx';
import Tenure from '../components/Tenure.tsx';
import { sanctnum } from '../utilities/numSanitity.ts';
import { RT } from '../types/types.ts';
import SEOHead from '../components/SEOHead.tsx';
import CalculatorContentSection from '../components/CalculatorContentSection.tsx';

const rdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Recurring Deposit (RD) Maturity Calculator India',
      description:
        'Calculates Recurring Deposit (RD) maturity amount, total interest yield, and compound growth on monthly savings across commercial banks and Post Office RD schemes.',
      category: 'DepositAccount',
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
          name: 'Recurring Deposit Calculator',
          item: 'https://rupees.vercel.app/deposits/rd',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is interest compounded on Recurring Deposits in Indian banks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Indian banks compound Recurring Deposit interest on a quarterly basis. Each monthly installment earns interest for the remaining quarters in the tenure, compounding at the bank agreed interest rate.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is TDS deducted on Recurring Deposit interest in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Under Section 194A of the Income Tax Act, TDS is deducted at 10% on cumulative RD and FD interest exceeding ₹40,000 in a financial year across a bank (₹50,000 for senior citizens).',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I withdraw from a Recurring Deposit prematurely?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, banks allow premature closure of RDs with a nominal penalty (usually 0.5% to 1.0% deduction from the applicable interest rate for the actual period held).',
          },
        },
      ],
    },
  ],
};

const rdFaqs = [
  {
    question: 'How is an RD different from a Fixed Deposit (FD)?',
    answer:
      'In a Fixed Deposit, you deposit a single lump-sum amount at inception. In a Recurring Deposit, you deposit a fixed monthly installment every month over a chosen tenure, making RD ideal for salaried individuals saving from monthly income.',
  },
  {
    question: 'What is the Post Office Recurring Deposit scheme interest rate and tenure?',
    answer:
      'The Post Office 5-Year National Savings Recurring Deposit Account (RD) offers sovereign-backed guaranteed quarterly compounding returns (historically ~6.7% p.a.) with a mandatory 5-year tenure and options for loan advances against the deposit.',
  },
  {
    question: 'Is Recurring Deposit interest taxable under the New Tax Regime?',
    answer:
      'Yes. RD interest is fully taxable under both Old and New Tax Regimes as "Income from Other Sources" according to your marginal income tax slab.',
  },
  {
    question: 'Should I choose an RD or a Mutual Fund SIP for a 3-year goal?',
    answer:
      'For short-term non-negotiable goals under 3 years (e.g., vacation, wedding down payment, emergency fund), an RD or Debt Fund provides zero market volatility. For goals 5+ years away, an Equity SIP offers higher inflation-beating potential.',
  },
];

const RD = ({ className, title }: { className?: string; title?: string }) => {
  const [pa, setPa] = useState('10000');
  const [rt, setRt] = useState<RT>({
    roi: '7.1',
    tenure: '5',
    tenureFormat: 'y',
  });
  const [invType, setInvType] = useState('my');
  const stepData = [
    { id: 'p1', value: '50000000', title: '5Cr' },
    { id: 'p2', value: '5000000', title: '50L' },
    { id: 'p3', value: '500000', title: '5L' },
    { id: 'p4', value: '50000', title: '50K' },
    { id: 'p5', value: '5000', title: '5K' },
    { id: 'p6', value: '500', title: '500' },
    { id: 'p7', value: '50', title: '50' },
  ];

  const calculate = (p: string, t: string, tf: string, invType: string, r?: string) => {
    const tenure = tf === 'y' ? sanctnum(t) : sanctnum(t) / 12;
    const principal = sanctnum(p);
    const rate = r ? sanctnum(r) / 100 : 0;
    const n = 4;
    const totalMonths = tenure * 12;
    let fa = 0;
    if (invType === 'my') {
      for (let i = 1; i <= totalMonths; i++) {
        const monthsLeft = totalMonths - i + 1;
        const yearsLeft = monthsLeft / 12;
        fa += principal * Math.pow(1 + rate / n, n * yearsLeft);
      }
    } else {
      let sum = 0;
      for (let i = 1; i <= totalMonths; i++) {
        const monthsLeft = totalMonths - i + 1;
        const yearsLeft = monthsLeft / 12;
        sum += Math.pow(1 + rate / n, n * yearsLeft);
      }
      fa = principal / sum;
    }
    return sanctnum(fa);
  };

  const payoutAmount = Math.ceil(calculate(pa, rt.tenure, rt.tenureFormat, invType, rt.roi));

  return (
    <main className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
      <SEOHead
        title="RD Calculator India | Recurring Deposit Interest & Maturity Planner"
        description="Calculate Recurring Deposit (RD) maturity amount and interest yield for Indian banks and Post Office RD schemes with quarterly compounding."
        keywords="RD calculator, recurring deposit calculator, post office RD calculator, bank RD interest rate, monthly deposit calculator India"
        canonicalPath="/deposits/rd"
        schema={rdSchema}
      />

      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Disciplined Savings &bull; Guaranteed Returns
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Recurring Deposit (RD) Calculator India
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Calculate maturity values, total interest yield, and compound returns on monthly recurring deposits.
        </p>
      </header>

      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        {title && <h5 className="font-bold">{title}</h5>}
        <InputAmount
          className="mb-1"
          inputAmount={pa}
          setInputAmount={setPa}
          type={invType}
          setType={setInvType}
          typeData={[
            { id: 'ty1', value: 'my', title: 'Monthly amount' },
            { id: 'ty2', value: 'tgt', title: 'Target amount' },
          ]}
          stepData={stepData}
          stepSizePrefix={'sm'}
          title={invType === 'my' ? 'Monthly Investment' : 'Target amount'}
        />
        <RateOfInterest className="mb-1" rt={rt} setRt={setRt} />
        <Tenure className="mb-1" rt={rt} setRt={setRt} />
        <DisplayCard
          primaryAmount={payoutAmount}
          title={invType === 'tgt' ? 'Monthly investment required' : 'Maturity amount'}
        />
      </div>

      <CalculatorContentSection
        title="How Recurring Deposit Compounding Works in India"
        subtitle="A Recurring Deposit (RD) is a guaranteed investment instrument tailored for individuals with regular monthly earnings. By depositing a fixed sum each month, each installment compounds quarterly until maturity."
        formulaTitle="Quarterly Compounding Formula for Recurring Deposits"
        formula="M = ∑ [ P × (1 + r / 4)^(4 × (N - i + 1) / 12) ]  for i = 1 to N"
        formulaExplanation={[
          { symbol: 'M', label: 'Total maturity corpus payable at tenure end (₹)' },
          { symbol: 'P', label: 'Monthly recurring installment amount (₹)' },
          { symbol: 'r', label: 'Nominal annual interest rate in decimal form (e.g. 7.1% = 0.071)' },
          { symbol: 'N', label: 'Total number of monthly installments across the tenure' },
          { symbol: 'i', label: 'Index of installment number (1st month, 2nd month, ..., Nth month)' },
        ]}
        workedExample={{
          title: 'Worked Example: ₹10,000/Month RD for 5 Years at 7.1% p.a.',
          description: 'Depositing ₹10,000 each month for 60 months in a bank recurring deposit yielding 7.1% compounded quarterly:',
          calculation: 'Total Principal Invested = 60 × 10,000 = ₹6,00,000 | Compounded Maturity Value = ₹7,22,860',
          result: 'Total Invested: ₹6,00,000 | Guaranteed Interest Earned: ₹1,22,860 | Maturity Value: ₹7,22,860',
        }}
        comparisonTable={{
          headers: ['Parameter', 'Bank Recurring Deposit (RD)', 'Post Office 5-Year RD', 'Mutual Fund Equity SIP'],
          rows: [
            ['Minimum Deposit', '₹500 / month (varies by bank)', '₹100 / month', '₹500 / month'],
            ['Returns Structure', 'Guaranteed & Fixed', 'Sovereign Guarantee (Govt)', 'Market Linked (~12-15% CAGR)'],
            ['Compounding Frequency', 'Quarterly Compounding', 'Quarterly Compounding', 'Daily NAV Compounding'],
            ['Tenure Flexibility', '6 months to 10 years', 'Fixed 5-year tenure', 'Open-ended / Any duration'],
            ['Risk Profile', 'Very Low (DICGC insured)', 'Zero Risk (Govt of India)', 'Moderate to High Equity Risk'],
          ],
        }}
        keyBenefits={[
          {
            title: 'Disciplined Monthly Habits',
            description: 'Automate deductions from your salary account to build a predictable savings cushion.',
          },
          {
            title: 'Guaranteed Interest Lock-in',
            description: 'Your agreed interest rate remains immune to future RBI repo rate cuts throughout the tenure.',
          },
          {
            title: 'Loan Against RD Facility',
            description: 'Borrow up to 90% of your accumulated RD balance at low interest rates in emergencies.',
          },
        ]}
        faqs={rdFaqs}
      />
    </main>
  );
};
export default RD;

import React, { useMemo, useState } from 'react';
import DisplayCard from '../components/DisplayCard.tsx';
import InputAmount from '../components/InputAmount.tsx';
import RateOfInterest from '../components/RateOfInterest.tsx';
import Tenure from '../components/Tenure.tsx';
import JoinedButtonGroup from '../components/JoinedButtonGroup.tsx';
import { RT, StepAmountType } from '../types/types.ts';
import { calculateInterest, calculatePrincipal } from '../utilities/utility.ts';
import {
  FREQUENCY_DATA,
  PA,
  PAYOUT_MODE_DATA,
  RATE_TENURE,
  STEP_AMOUNT,
} from '../data/default_data.ts';
import SEOHead from '../components/SEOHead.tsx';
import CalculatorContentSection from '../components/CalculatorContentSection.tsx';

const fdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Fixed Deposit Compound Interest Calculator India',
      description:
        'Calculates Fixed Deposit maturity amount, total interest yield, and compound growth across monthly, quarterly, semi-annual, and annual compounding frequencies.',
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
          name: 'Fixed Deposit Calculator',
          item: 'https://rupees.vercel.app/deposits/fd',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How is compound interest calculated on Fixed Deposits in Indian banks?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Indian banks typically compound Fixed Deposit interest on a quarterly basis using the formula: A = P(1 + r/n)^(nt), where P is the principal, r is the annual rate of interest, n is 4 (quarterly compounding), and t is the tenure in years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the TDS limit on Fixed Deposit interest in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Under Indian Income Tax rules, TDS (Tax Deducted at Source) is deducted at 10% if the total annual FD interest exceeds ₹40,000 across all branches of a bank (₹50,000 for senior citizens under Section 80TTB). Submit Form 15G or 15H if your total income is below the taxable threshold.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between Cumulative and Non-Cumulative Fixed Deposits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'In Cumulative FDs, interest is reinvested and paid along with the principal at maturity, maximizing compound interest. In Non-Cumulative FDs, interest is paid out periodically (monthly, quarterly, or annually) into your bank account as regular income.',
          },
        },
      ],
    },
  ],
};

const fdFaqs = [
  {
    question: 'How does quarterly compounding increase FD returns compared to simple interest?',
    answer:
      'With quarterly compounding (standard for Indian bank FDs), interest earned in each 3-month quarter is added to your principal balance. In the subsequent quarter, you earn interest on both your initial deposit and accumulated interest, resulting in a higher effective annual yield (Annual Percentage Yield) than the nominal interest rate.',
  },
  {
    question: 'What are the tax implications on Fixed Deposit interest in India?',
    answer:
      'FD interest is fully taxable as "Income from Other Sources" at your applicable income tax slab rate. Banks deduct TDS at 10% if interest exceeds ₹40,000 (₹50,000 for senior citizens). If PAN is not provided, TDS is deducted at 20%.',
  },
  {
    question: 'Are 5-year Tax Saving Fixed Deposits eligible for Section 80C deductions?',
    answer:
      'Yes, deposits in 5-year Tax Saving FDs qualify for tax deductions up to ₹1.5 Lakh under Section 80C of the Income Tax Act (Old Tax Regime). These deposits have a mandatory 5-year lock-in period with no premature withdrawal or loan facility.',
  },
  {
    question: 'Is FD investment safe in Indian Commercial and Small Finance Banks?',
    answer:
      'All deposits across commercial, small finance, and cooperative banks are insured up to ₹5,00,000 (including principal and interest) per depositor per bank by DICGC (Deposit Insurance and Credit Guarantee Corporation), a wholly-owned subsidiary of the Reserve Bank of India (RBI).',
  },
];

const FD: React.FC = () => {
  const [pa, setPa] = useState(PA);
  const [rt, setRt] = useState<RT>(RATE_TENURE);
  const [mode, setMode] = useState('1');
  const [frequency, setFrequency] = useState('4');
  const [invType, setInvType] = useState('inv');
  const stepData: StepAmountType[] = STEP_AMOUNT;

  const payoutAmount = useMemo(() => {
    const rtRoi = rt.roi ? rt.roi : '0';
    const finalAmount =
      invType === 'tgt'
        ? calculatePrincipal(pa, rtRoi, frequency, rt.tenure, rt.tenureFormat)
        : calculateInterest(pa, rtRoi, mode, frequency, rt.tenure, rt.tenureFormat);
    if (mode === '100' && invType === 'inv') {
      return Math.round(finalAmount) + Math.round(parseFloat(pa));
    }
    return Math.round(finalAmount);
  }, [pa, rt, mode, invType, frequency]);

  return (
    <main className="w-full max-w-4xl mx-auto px-2 py-4">
      <SEOHead
        title="FD Calculator India | Compound Interest & Maturity Simulator"
        description="Calculate Fixed Deposit maturity amount and compound interest across monthly, quarterly, half-yearly, and annual compounding frequencies with live tax insights."
        keywords="compound interest calculator India, FD calculator, fixed deposit calculator, quarterly compounding calculator, bank FD interest rate"
        canonicalPath="/deposits/fd"
        schema={fdSchema}
      />

      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Fixed Income &bull; Guaranteed Returns
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Fixed Deposit (FD) &amp; Compound Interest Calculator India
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Simulate cumulative maturity amounts, periodic payout yields, and compound growth with institutional precision.
        </p>
      </header>

      <div className="card bg-base-100 border border-base-300 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <InputAmount
          className="mb-1"
          inputAmount={pa}
          setInputAmount={setPa}
          type={invType}
          setType={setInvType}
          typeData={[
            { id: 'ty1', value: 'inv', title: 'One time amount' },
            { id: 'ty2', value: 'tgt', title: 'Target amount' },
          ]}
          stepData={stepData}
          stepSizePrefix={'sm'}
          title={invType === 'tgt' ? 'Target amount' : ''}
        />
        <RateOfInterest className="mb-1" rt={rt} setRt={setRt} />
        <Tenure className="mb-1" rt={rt} setRt={setRt} />
        <JoinedButtonGroup
          className="mb-1"
          data={FREQUENCY_DATA}
          sizePrefix="sm"
          selectedValue={frequency}
          updateSelectedValue={setFrequency}
          title="Compounded"
        />
        {invType === 'inv' && (
          <JoinedButtonGroup
            className="mb-1"
            data={PAYOUT_MODE_DATA}
            sizePrefix="sm"
            selectedValue={mode}
            updateSelectedValue={setMode}
            title="Payout Mode"
          />
        )}
        <DisplayCard
          primaryAmount={payoutAmount}
          title={invType === 'tgt' ? 'Lumpsum amount required' : ''}
        />
      </div>

      <CalculatorContentSection
        title="Understanding Fixed Deposit Compounding & Maturity Mathematics"
        subtitle="A Fixed Deposit (FD) is one of India's most trusted fixed-income investment instruments, offering assured capital protection and predictable returns. Understanding how compounding intervals impact your final wealth is key to maximizing interest income."
        formulaTitle="Fixed Deposit Compound Interest Formula"
        formula="A = P × (1 + r / n)^(n × t)"
        formulaExplanation={[
          { symbol: 'A', label: 'Total maturity amount receivable at the end of the tenure' },
          { symbol: 'P', label: 'Initial principal deposit amount (₹)' },
          { symbol: 'r', label: 'Annual nominal interest rate in decimal form (e.g., 7.5% = 0.075)' },
          { symbol: 'n', label: 'Compounding frequency per year (Quarterly = 4, Monthly = 12, Annually = 1)' },
          { symbol: 't', label: 'Total duration/tenure of the deposit in years' },
        ]}
        workedExample={{
          title: 'Worked Example: 5-Year Bank FD with Quarterly Compounding',
          description: 'Suppose you invest ₹1,00,000 in a 5-year fixed deposit at an annual interest rate of 7.5% compounded quarterly (n = 4).',
          calculation: 'A = 1,00,000 × (1 + 0.075 / 4)^(4 × 5) = 1,00,000 × (1.01875)^20 = ₹1,44,995',
          result: 'Total Maturity Value: ₹1,44,995 | Total Interest Earned: ₹44,995 (Effective Yield: 8.99% p.a.)',
        }}
        comparisonTable={{
          headers: ['Feature / Parameter', 'Bank Fixed Deposit (FD)', 'Debt Mutual Funds', 'Public Provident Fund (PPF)'],
          rows: [
            ['Capital Safety', 'Very High (DICGC Insured up to ₹5L)', 'Moderate (Market-linked NAV)', 'Sovereign Guarantee (Govt of India)'],
            ['Returns Predictability', 'Guaranteed & Fixed at deposit date', 'Variable (Depends on interest cycle)', 'Govt reset quarterly (currently ~7.1%)'],
            ['Compounding Frequency', 'Quarterly (typically)', 'Daily NAV compounding', 'Annual Compounding (March 31st)'],
            ['Tax Treatment', 'Taxed at slab rate (TDS applicable)', 'Taxed at slab rate post April 2023', 'Exempt-Exempt-Exempt (EEE) - 100% Tax Free'],
            ['Liquidity / Premature Exit', 'Allowed with 0.5% - 1% penalty', 'High (Redeem in 1-2 business days)', '15-Year Lock-in (Partial exit after 7 yrs)'],
          ],
        }}
        keyBenefits={[
          {
            title: 'Guaranteed Capital Preservation',
            description: 'Unlike equities, your principal and committed interest rate are unaffected by stock market swings.',
          },
          {
            title: 'Flexible Interest Payouts',
            description: 'Choose Cumulative reinvestment to maximize compound growth or periodic monthly/quarterly payouts for living expenses.',
          },
          {
            title: 'Senior Citizen Bonus',
            description: 'Most Indian banks offer an additional 0.50% to 0.75% higher interest rate to citizens aged 60 and above.',
          },
        ]}
        faqs={fdFaqs}
      />
    </main>
  );
};
export default FD;

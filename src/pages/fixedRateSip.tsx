import { useMemo, useState } from 'react';
import DisplayCard from '../components/DisplayCard.tsx';
import InputAmount from '../components/InputAmount.tsx';
import RateOfInterest from '../components/RateOfInterest.tsx';
import Tenure from '../components/Tenure.tsx';
import { sanctnum } from '../utilities/numSanitity.ts';
import { RT } from '../types/types.ts';
import SEOHead from '../components/SEOHead.tsx';
import CalculatorContentSection from '../components/CalculatorContentSection.tsx';

const sipSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FinancialProduct',
      name: 'Systematic Investment Plan (SIP) Calculator India',
      description:
        'Calculates mutual fund SIP wealth accumulation, total invested amount, maturity corpus, and estimated capital gains using monthly compounding.',
      category: 'InvestmentAccount',
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
          name: 'SIP Calculator',
          item: 'https://rupees.vercel.app/fixed-plans/fixed-rate-sip',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the formula for calculating SIP returns?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The maturity amount of a Systematic Investment Plan (SIP) is calculated using the future value of an annuity formula: M = P × [((1 + i)^n - 1) / i] × (1 + i), where P is the monthly investment amount, i is the monthly interest rate (annual rate / 12 / 100), and n is the total number of monthly payments.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does a Step-Up SIP accelerate wealth accumulation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Step-Up SIP (or Top-Up SIP) increases your monthly contribution annually (typically by 10% in line with salary increments). Over a 15-20 year investment horizon, a 10% annual step-up can more than double your final maturity corpus compared to a flat SIP.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the tax on Equity Mutual Fund SIP returns in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'For Equity Mutual Funds, Long-Term Capital Gains (LTCG) on units held for more than 12 months are tax-exempt up to ₹1.25 Lakh per financial year; gains exceeding ₹1.25 Lakh are taxed at 12.5% without indexation. Short-Term Capital Gains (STCG on units held under 12 months) are taxed at 20%.',
          },
        },
      ],
    },
  ],
};

const sipFaqs = [
  {
    question: 'Why is Rupee Cost Averaging the biggest advantage of a SIP?',
    answer:
      'Rupee Cost Averaging automatically allocates more mutual fund units when markets dip (low NAV) and fewer units when markets rise (high NAV). Over time, this smooths out market volatility and lowers your average purchase cost per unit without requiring you to time the market.',
  },
  {
    question: 'What is the ideal expected return (CAGR) for an Equity SIP in India?',
    answer:
      'Historically, diversified Indian equity mutual funds (Flexi Cap, Large & Mid Cap, Nifty 50 Index) have delivered annualized long-term returns between 12% to 15% CAGR over 10+ year rolling horizons. For conservative planning, 11% to 12% CAGR is recommended.',
  },
  {
    question: 'Can I pause, increase, or stop my SIP at any time without penalty?',
    answer:
      'Yes. Mutual fund SIPs are completely flexible. You can modify your monthly amount, pause deductions for a few months, or cancel the SIP at any time without any financial penalty or forfeiture of accumulated capital.',
  },
  {
    question: 'How does SIP compare against recurring deposits (RD) for 10+ year goals?',
    answer:
      'Recurring Deposits offer fixed pre-tax interest (~6.5%-7.5%) that is taxed at your income tax slab, resulting in post-tax returns that frequently lag inflation. Equity SIPs offer potential inflation-beating real returns (12-15% CAGR) with favorable capital gains tax treatment.',
  },
];

const FixedRateSIP = ({ className, title }: { className?: string; title?: string }) => {
  const [pa, setPa] = useState('10000');
  const [rt, setRt] = useState<RT>({
    roi: '12',
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
    const n = 12;
    let fa = 0;
    if (invType === 'my') {
      for (let i = 1; i <= tenure * n; i++) {
        fa += principal * Math.pow(1 + rate / n, n * (i / 12));
      }
    } else {
      let sum = 0;
      for (let i = 1; i <= tenure * n; i++) {
        sum += Math.pow(1 + rate / n, n * (i / 12));
      }
      fa = principal / sum;
    }
    return sanctnum(fa);
  };

  const payoutAmount = useMemo(
    () => Math.ceil(calculate(pa, rt.tenure, rt.tenureFormat, invType, rt.roi)),
    [pa, rt.tenure, rt.tenureFormat, invType, rt.roi]
  );

  return (
    <main className={`w-full max-w-4xl mx-auto px-2 py-4 ${className || ''}`}>
      <SEOHead
        title="SIP Calculator India | Mutual Fund Return & Wealth Planner"
        description="Free SIP calculator to project mutual fund wealth accumulation, maturity value, and absolute vs. annualized returns with step-up and historical NAV backtesting."
        keywords="SIP calculator, systematic investment plan calculator, mutual fund return calculator, step up SIP calculator, best SIP calculator India"
        canonicalPath="/fixed-plans/fixed-rate-sip"
        schema={sipSchema}
      />

      <header className="mb-6 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-2 uppercase tracking-wider">
          Compounding Engine &bull; Wealth Accumulation
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Mutual Fund SIP Calculator India (Systematic Investment Plan)
        </h1>
        <p className="mt-1 text-xs sm:text-sm opacity-70">
          Simulate compound growth, total maturity corpus, and required monthly investment targets.
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
        title="The Compounding Science of Systematic Investment Plans (SIP)"
        subtitle="A Systematic Investment Plan (SIP) enables disciplined retail investors to invest fixed sums regularly into equity and hybrid mutual funds. By combining compounding returns with rupee cost averaging, SIPs are India's premier vehicle for long-term wealth creation."
        formulaTitle="Systematic Investment Plan (SIP) Compound Formula"
        formula="M = P × [((1 + i)^n - 1) / i] × (1 + i)"
        formulaExplanation={[
          { symbol: 'M', label: 'Expected final maturity amount (Corpus)' },
          { symbol: 'P', label: 'Monthly SIP installment amount (₹)' },
          { symbol: 'i', label: 'Periodic monthly interest rate: Annual CAGR (%) / 12 / 100' },
          { symbol: 'n', label: 'Total number of monthly contributions (Years × 12)' },
        ]}
        workedExample={{
          title: 'Worked Example: ₹10,000 Monthly SIP for 15 Years at 12% CAGR',
          description: 'If you invest ₹10,000 every month into an equity mutual fund delivering an average of 12% annualized returns (i = 0.01/month, n = 180 months):',
          calculation: 'M = 10,000 × [((1 + 0.01)^180 - 1) / 0.01] × (1 + 0.01) = ₹50,45,760',
          result: 'Total Invested: ₹18,00,000 | Estimated Capital Gains: ₹32,45,760 | Wealth Multiplier: 2.8x',
        }}
        comparisonTable={{
          headers: ['Metric', 'Flat Monthly SIP', '10% Annual Step-Up SIP', 'Bank Recurring Deposit (RD)'],
          rows: [
            ['Monthly Start Amount', '₹10,000 / month', '₹10,000 / month (+10% yearly)', '₹10,000 / month'],
            ['Total Invested (15 Yrs)', '₹18,00,000', '₹38,12,700', '₹18,00,000'],
            ['Expected Returns (CAGR)', '12% p.a.', '12% p.a.', '7.0% p.a.'],
            ['Final Maturity Value', '₹50,45,760', '₹89,28,400', '₹31,88,000'],
            ['Tax Efficiency', '12.5% LTCG (above ₹1.25L/yr)', '12.5% LTCG (above ₹1.25L/yr)', 'Taxed at standard slab rate'],
          ],
        }}
        keyBenefits={[
          {
            title: 'Rupee Cost Averaging',
            description: 'Eliminate emotional market timing by purchasing more fund units during market corrections.',
          },
          {
            title: 'Exponential Compounding',
            description: 'In the later years of a 15-20 year SIP, annual gains often surpass your entire accumulated principal investment.',
          },
          {
            title: 'Inflation-Beating Growth',
            description: 'Equity mutual funds historically generate 5-8% alpha over India CPI inflation.',
          },
        ]}
        faqs={sipFaqs}
      />
    </main>
  );
};
export default FixedRateSIP;

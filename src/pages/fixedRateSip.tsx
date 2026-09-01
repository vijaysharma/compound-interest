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
          item: 'https://rupees.vercel.app/sip-calculator',
        },
      ],
    },
    {
      '@type': 'HowTo',
      name: 'How to Use the SIP Calculator',
      description:
        'Calculate your Systematic Investment Plan returns and projected wealth in 4 simple steps.',
      totalTime: 'PT1M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Enter Monthly Investment Amount',
          text: 'Enter the amount you plan to invest every month via SIP (e.g., ₹10,000). You can also switch to "Target Amount" mode to calculate the required monthly SIP.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Set Expected Annual Return (CAGR)',
          text: 'Enter the expected annualized return rate. Use 12% for diversified equity mutual funds based on historical Indian market performance.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Choose Investment Duration',
          text: 'Select how many years or months you plan to continue your SIP (1–35 years).',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'View Instant Results',
          text: 'Your projected maturity value, total amount invested, estimated capital gains, and wealth multiplier are calculated and displayed instantly.',
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
        {
          '@type': 'Question',
          name: 'What is SIP and how does it work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A Systematic Investment Plan (SIP) is a method of investing a fixed amount regularly (monthly or weekly) in mutual funds. Each SIP installment buys units at the prevailing NAV, enabling rupee cost averaging — you automatically buy more units when markets are low and fewer when markets are high, reducing the average cost per unit over time.',
          },
        },
        {
          '@type': 'Question',
          name: 'SIP vs Lump Sum: Which is better for mutual fund investment?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SIP is better for salaried investors who want disciplined, regular investing with reduced market timing risk through rupee cost averaging. Lump sum is better when you have a large corpus available and markets are at reasonable valuations. Historical data shows that over 10+ year periods, lump sum investments slightly outperform SIP in rising markets, but SIP provides better risk-adjusted returns during volatile periods.',
          },
        },
      ],
    },
    {
      '@type': 'WebApplication',
      name: 'SIP Calculator — Rupee Calculator',
      url: 'https://rupees.vercel.app/sip-calculator',
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
  {
    question: 'What is SIP and how does it work?',
    answer:
      'A Systematic Investment Plan (SIP) is a method of investing a fixed amount regularly (monthly or weekly) in mutual funds. Each SIP installment buys units at the prevailing NAV, enabling rupee cost averaging — you automatically buy more units when markets are low and fewer when markets are high, reducing the average cost per unit over time.',
  },
  {
    question: 'SIP vs Lump Sum: Which is better for mutual fund investment?',
    answer:
      'SIP is better for salaried investors who want disciplined, regular investing with reduced market timing risk through rupee cost averaging. Lump sum is better when you have a large corpus available and markets are at reasonable valuations. Historical data shows that over 10+ year periods, lump sum investments slightly outperform SIP in rising markets, but SIP provides better risk-adjusted returns during volatile periods.',
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
        title="SIP Calculator — Free Mutual Fund SIP Return Calculator India 2026"
        description="Calculate SIP returns with step-up SIP & target corpus planning. Estimate mutual fund growth for ₹500–₹1 Lakh monthly SIP over 1–35 years. 100% free & private."
        keywords="SIP calculator, systematic investment plan calculator, mutual fund return calculator, step up SIP calculator, best SIP calculator India, SIP maturity calculator, mutual fund calculator, investment calculator, future value calculator, CAGR calculator, MF calculator, how to calculate SIP returns, SIP vs lump sum"
        canonicalPath="/sip-calculator"
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
      <div className="space-y-4">
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
        comparisonTable={{
          headers: [
            'Metric',
            'Flat Monthly SIP',
            '10% Annual Step-Up SIP',
            'Bank Recurring Deposit (RD)',
          ],
          rows: [
            [
              'Monthly Start Amount',
              '₹10,000 / month',
              '₹10,000 / month (+10% yearly)',
              '₹10,000 / month',
            ],
            ['Total Invested (15 Yrs)', '₹18,00,000', '₹38,12,700', '₹18,00,000'],
            ['Expected Returns (CAGR)', '12% p.a.', '12% p.a.', '7.0% p.a.'],
            ['Final Maturity Value', '₹50,45,760', '₹89,28,400', '₹31,88,000'],
            [
              'Tax Efficiency',
              '12.5% LTCG (above ₹1.25L/yr)',
              '12.5% LTCG (above ₹1.25L/yr)',
              'Taxed at standard slab rate',
            ],
          ],
        }}
        keyBenefits={[
          {
            title: 'Rupee Cost Averaging',
            description:
              'Eliminate emotional market timing by purchasing more fund units during market corrections.',
          },
          {
            title: 'Exponential Compounding',
            description:
              'In the later years of a 15-20 year SIP, annual gains often surpass your entire accumulated principal investment.',
          },
          {
            title: 'Inflation-Beating Growth',
            description:
              'Equity mutual funds historically generate 5-8% alpha over India CPI inflation.',
          },
        ]}
        faqs={sipFaqs}
      />
    </main>
  );
};
export default FixedRateSIP;

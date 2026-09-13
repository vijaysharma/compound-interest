import type { Metadata } from 'next';
export interface PageMetadataOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath: string;
  ogImage?: string;
  noIndex?: boolean;
}
const DOMAIN = 'https://rupees.vercel.app';
const DEFAULT_OG_IMAGE = `${DOMAIN}/images/og-image.png`;
export function createPageMetadata({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const cleanPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  const canonicalUrl = cleanPath === '/' ? DOMAIN : `${DOMAIN}${cleanPath}`;
  const image = ogImage.startsWith('http') ? ogImage : `${DOMAIN}${ogImage}`;
  return {
    title,
    description,
    keywords: keywords || [],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: 'Rupee Calculator',
      locale: 'en_IN',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@RupeeCalc',
      title,
      description,
      images: [image],
    },
  };
}
export const SEO_PAGES = {
  home: createPageMetadata({
    title: 'Free Online Financial Calculators India — SIP, EMI, FD, SWP & More | Rupee Calculator',
    description:
      'Calculate SIP returns, compound interest, EMI amortization, SWP withdrawals, inflation impact & PPP with 100% free, private financial tools. Trusted by Indian investors.',
    keywords: [
      'rupee calculator',
      'compound interest calculator India',
      'SIP calculator',
      'SWP calculator',
      'mutual fund return calculator',
      'EMI calculator',
      'inflation calculator India',
      'PPP calculator',
      'financial planning tools India',
      'FD calculator',
      'RD calculator',
    ],
    canonicalPath: '/',
  }),
  emiCalculator: createPageMetadata({
    title: 'EMI Calculator — Home Loan, Car & Personal Loan EMI Calculator India 2026',
    description:
      'Free online EMI calculator for home loan, car loan & personal loan. Full amortization schedule with part-payment modeling & floating rate simulation. 100% private.',
    keywords: [
      'EMI calculator',
      'home loan EMI calculator',
      'loan amortization schedule India',
      'prepayment EMI calculator',
      'part payment home loan calculator',
      'personal loan EMI',
      'car loan EMI calculator',
      'education loan calculator',
      'loan calculator',
      'amortization calculator',
      'EMI calculation formula',
      'how to calculate EMI',
    ],
    canonicalPath: '/emi-calculator',
  }),
  incomeTaxCalculator: createPageMetadata({
    title: 'Income Tax Calculator FY 2024-25 & 2025-26 — Old vs New Tax Regime | Rupee Calculator',
    description:
      'Calculate & compare income tax under Old vs New Tax Regime with Budget 2024 slabs, capital gains rules, PPF exemption, breakeven deductions, and Tax Strategy Advisory.',
    keywords: [
      'income tax calculator',
      'old vs new tax regime',
      'tax calculator FY 2024-25',
      'Section 87A rebate',
      'standard deduction 75000',
      'capital gains tax calculator',
      'tax strategy advisory India',
      'income tax slab 2025',
      'tax regime comparison',
      'income tax return calculator',
    ],
    canonicalPath: '/income-tax-calculator',
  }),
  fileItr: createPageMetadata({
    title: 'Upload Form 16 & Prepare Income Tax Return (ITR) India FY 2024-25 & FY 2025-26',
    description:
      'Upload your Form 16 to auto-extract salary, calculate tax under Old vs New Regime, verify TDS, check refund status, and prepare your Income Tax Return filing summary.',
    keywords: [
      'Form 16 upload',
      'file ITR India',
      'Form 16 auto parser',
      'income tax return preparation',
      'ITR 1 Sahaj filing',
      'tax refund calculator',
      'Form 16 TDS check',
      'income tax filing guide',
    ],
    canonicalPath: '/file-itr',
  }),
  fdCalculator: createPageMetadata({
    title: 'Compound Interest Calculator & FD Calculator — Fixed Deposit India 2026',
    description:
      'Free compound interest calculator for Indian fixed deposits. Calculate FD maturity with daily, monthly & quarterly compounding. Compare cumulative vs non-cumulative FD returns.',
    keywords: [
      'compound interest calculator India',
      'FD calculator',
      'fixed deposit calculator',
      'quarterly compounding calculator',
      'bank FD interest rate',
      'FD maturity calculator',
      'daily compound interest calculator',
      'monthly compound interest calculator',
      'maturity calculator',
      'interest rate calculator savings',
      'compound interest formula',
      'savings calculator',
    ],
    canonicalPath: '/fd-calculator',
  }),
  rdCalculator: createPageMetadata({
    title: 'RD Calculator — Recurring Deposit Maturity & Interest Calculator India 2026',
    description:
      'Free recurring deposit calculator for Indian banks & Post Office RD. Calculate RD maturity amount with quarterly compounding. Compare RD vs FD vs SIP returns.',
    keywords: [
      'RD calculator',
      'recurring deposit calculator',
      'post office RD calculator',
      'bank RD interest rate',
      'monthly deposit calculator India',
      'compound interest calculator RD',
      'post office RD interest rate',
      'RD vs FD',
      'how to calculate RD maturity',
    ],
    canonicalPath: '/rd-calculator',
  }),
  sipCalculator: createPageMetadata({
    title: 'SIP Calculator — Free Mutual Fund SIP Return Calculator India 2026',
    description:
      'Calculate SIP returns with step-up SIP & target corpus planning. Estimate mutual fund growth for ₹500–₹1 Lakh monthly SIP over 1–35 years. 100% free & private.',
    keywords: [
      'SIP calculator',
      'systematic investment plan calculator',
      'mutual fund return calculator',
      'step up SIP calculator',
      'best SIP calculator India',
      'SIP maturity calculator',
      'mutual fund calculator',
      'investment calculator',
      'future value calculator',
      'CAGR calculator',
      'MF calculator',
      'how to calculate SIP returns',
      'SIP vs lump sum',
    ],
    canonicalPath: '/sip-calculator',
  }),
  swpCalculator: createPageMetadata({
    title: 'SWP Calculator — Systematic Withdrawal Plan Calculator India 2026',
    description:
      'Free SWP calculator to plan retirement income. Model monthly pension withdrawals, inflation-adjusted cashflows & corpus longevity from mutual funds. 100% private.',
    keywords: [
      'SWP calculator',
      'systematic withdrawal plan calculator',
      'monthly pension calculator',
      'retirement withdrawal calculator India',
      'safe withdrawal rate India',
      'retirement calculator',
      'annuity calculator',
      'retirement planning',
      'safe withdrawal rate',
    ],
    canonicalPath: '/swp-calculator',
  }),
  ppfCalculator: createPageMetadata({
    title: 'PPF Calculator India — Historical & Projected Public Provident Fund Returns',
    description:
      'Official PPF Calculator following RBI 5th-of-the-month rules, real historical interest rates, 5-year extension blocks, and EEE tax-exempt maturity value.',
    keywords: [
      'PPF calculator',
      'public provident fund calculator',
      'PPF interest rate',
      '5th of month rule PPF',
      'PPF extension calculator',
      'PPF maturity calculator',
      'tax free savings India',
      'Section 80C PPF',
      'PPF rules RBI',
    ],
    canonicalPath: '/ppf-calculator',
  }),
  npsCalculator: createPageMetadata({
    title: 'NPS Calculator India — Retirement Pension & Corpus Planner | Rupee Calculator',
    description:
      'Calculate your National Pension System (NPS) Tier-1 retirement corpus, 40% mandatory annuity, 60% tax-free lump sum withdrawal, and monthly pension payout.',
    keywords: [
      'NPS calculator',
      'national pension system calculator',
      'retirement calculator India',
      'pension calculator India',
      '80CCD 1B calculator',
      'annuity calculator',
      'lump sum withdrawal NPS',
      'PFRDA pension',
    ],
    canonicalPath: '/nps-calculator',
  }),
  mfLumpsum: createPageMetadata({
    title: 'Mutual Fund Calculator — Lumpsum Return & CAGR Calculator India 2026',
    description:
      'Analyze historical mutual fund lumpsum returns, CAGR growth, and rolling NAV trajectories with live AMFI data. Compare up to 8 funds simultaneously.',
    keywords: [
      'mutual fund return calculator',
      'lumpsum mutual fund calculator',
      'mutual fund CAGR calculator',
      'AMFI NAV history',
      'Indian mutual funds backtesting',
      'ROI calculator',
      'CAGR calculator',
      'NAV calculator',
      'investment calculator',
    ],
    canonicalPath: '/mutual-funds/lumpsum',
  }),
  mfSip: createPageMetadata({
    title: 'Mutual Fund SIP Backtest — XIRR & Historical NAV Calculator India 2026',
    description:
      'Backtest historical mutual fund SIP performance, XIRR returns, units accumulation, and rupee cost averaging on live AMFI data.',
    keywords: [
      'mutual fund SIP calculator',
      'mutual fund return calculator',
      'SIP XIRR calculator',
      'AMFI NAV history',
      'step up SIP backtest',
      'XIRR calculator',
      'SIP backtest calculator',
    ],
    canonicalPath: '/mutual-funds/sip',
  }),
  mfSwp: createPageMetadata({
    title: 'Mutual Fund SWP Backtest — Retirement Withdrawal Calculator India 2026',
    description:
      'Backtest historical mutual fund SWP cashflows, capital longevity, monthly retirement pension drawdowns, and portfolio yields with verified AMFI daily NAVs.',
    keywords: [
      'mutual fund SWP calculator',
      'SWP backtest calculator',
      'retirement SWP planner',
      'AMFI NAV history',
      'systematic withdrawal plan India',
      'retirement pension calculator',
      'mutual fund withdrawal planner',
    ],
    canonicalPath: '/mutual-funds/swp',
  }),
  inflationCalculator: createPageMetadata({
    title: 'Inflation Calculator India — Future Value of Money & Purchasing Power 2026',
    description:
      'Free inflation calculator with IMF historical CPI data. See how ₹1 Lakh today compares to future purchasing power. Plan retirement with real inflation projections.',
    keywords: [
      'inflation calculator India',
      'future value of money calculator',
      'historical inflation calculator India',
      'IMF inflation forecast',
      'purchasing power calculator India',
      'CPI calculator',
      'cost of living calculator',
      'salary purchasing power',
      'inflation rate calculator',
      'historical inflation calculator',
    ],
    canonicalPath: '/inflation-calculator',
  }),
  pppCalculator: createPageMetadata({
    title: 'PPP Calculator — Purchasing Power Parity & Salary Comparison India 2026',
    description:
      'Compare salaries and living costs across 150+ countries using World Bank PPP data. Convert Indian Rupee salary to real USD/EUR purchasing power equivalent. 100% free.',
    keywords: [
      'purchasing power parity calculator',
      'PPP calculator India to USA',
      'salary comparison PPP',
      'cost of living converter',
      'World Bank PPP conversion',
      'India US salary comparison',
      'cost of living calculator',
      'salary purchasing power',
      'PPP conversion factor',
    ],
    canonicalPath: '/ppp-calculator',
  }),
  currencyConverter: createPageMetadata({
    title: 'Currency Converter — Live Foreign Exchange Rates India 2026',
    description:
      'Free real-time currency converter with live mid-market forex rates for 160+ currencies including USD to INR, EUR to INR, GBP to INR, AED to INR. 100% private.',
    keywords: [
      'currency converter',
      'live exchange rates',
      'USD to INR',
      'EUR to INR',
      'GBP to INR',
      'AED to INR',
      'foreign exchange converter India',
      'forex rates live',
      'currency exchange calculator',
    ],
    canonicalPath: '/currency-converter',
  }),
  calculator: createPageMetadata({
    title: 'Online Calculator — Free Scientific & Basic Calculator India 2026',
    description:
      'Fast, institutional-grade online calculator with editable cursor display, implicit multiplication, copy/paste support, memory operations (M+, M-, MC, MR), percentages, y-th root of x (³√(27)), and trigonometry.',
    keywords: [
      'online calculator',
      'scientific calculator',
      'basic calculator',
      'percentage calculator',
      'cube root calculator',
      'math calculator',
      'memory operations calculator',
      'fast calculator',
    ],
    canonicalPath: '/calculator',
  }),
  dateCalculator: createPageMetadata({
    title: 'Date Calculator — Free Age, Duration & Working Days Calculator India',
    description:
      'Calculate exact age in years, months, and days, duration between two calendar dates, business days, and future/past date milestones.',
    keywords: [
      'date calculator',
      'age calculator',
      'days between dates',
      'working days calculator',
      'business days calculator India',
      'calendar calculator',
    ],
    canonicalPath: '/date-calculator',
  }),
  unitConverter: createPageMetadata({
    title: 'Unit Converter — Free Length, Weight, Area & Temperature Conversion',
    description:
      'Instant metric and imperial conversion for length, area, weight, volume, temperature, and speed. Includes Indian land measurement units (Gaj, Bigha, Acre).',
    keywords: [
      'unit converter',
      'measurement converter',
      'gaj to sq ft',
      'bigha to acre converter',
      'kg to lbs',
      'celsius to fahrenheit',
      'area converter India',
    ],
    canonicalPath: '/utilities/unit-converter',
  }),
  quickNotes: createPageMetadata({
    title: 'Quick Notes & Financial Notepad | Rupee Calculator',
    description: 'Private, secure encrypted scratchpad for quick financial calculations, numbers, and notes.',
    canonicalPath: '/utilities/quick-notes',
    noIndex: true,
  }),
  about: createPageMetadata({
    title: 'About Us — Free Institutional Financial Modeling Tools for India | Rupee Calculator',
    description:
      'Learn about Rupee Calculator: a privacy-first suite of Indian financial calculators designed for investors, chartered accountants, and households.',
    keywords: [
      'about rupee calculator',
      'financial independence India',
      'open source finance India',
      'private financial tools',
    ],
    canonicalPath: '/about',
  }),
  privacy: createPageMetadata({
    title: 'Privacy Policy — 100% Client-Side Private Financial Calculations',
    description:
      'Our strict zero-logging privacy guarantee. Your salary, loans, portfolio, and financial simulations never leave your device.',
    canonicalPath: '/privacy',
  }),
  disclaimer: createPageMetadata({
    title: 'Financial Disclaimer & Terms — Rupee Calculator',
    description:
      'Important information regarding calculations, tax advice, estimates, and financial projections provided by Rupee Calculator.',
    canonicalPath: '/disclaimer',
  }),
  upgrade: createPageMetadata({
    title: 'Upgrade to Rupee Calculator Pro — Unlimited Financial Analytics',
    description:
      'Unlock advanced tax advisory, multi-fund historical backtesting, and unlimited financial simulations.',
    canonicalPath: '/upgrade',
    noIndex: true,
  }),
  login: createPageMetadata({
    title: 'Sign In to Your Rupee Calculator Account',
    description: 'Sign in to access your saved notes, custom preferences, and Pro financial tools.',
    canonicalPath: '/login',
    noIndex: true,
  }),
};

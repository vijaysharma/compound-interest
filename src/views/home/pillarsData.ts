export interface PillarItem {
  title: string;
  description: string;
  href: string;
  linkText: string;
  iconType:
    | 'tax'
    | 'shield'
    | 'clock'
    | 'trending'
    | 'layers'
    | 'globe'
    | 'chart'
    | 'percent'
    | 'tool'
    | 'calendar'
    | 'repeat';
}
export const PILLARS_DATA: PillarItem[] = [
  {
    title: 'Income Tax & AI Optimizer',
    description:
      'Dual-regime comparison (Old vs New) with Budget 2024 slab updates, capital gains rules, PPF EEE exemption, breakeven deductions, and personalized AI recommendations.',
    href: '/income-tax-calculator',
    linkText: 'Calculate & Optimize Tax →',
    iconType: 'tax',
  },
  {
    title: 'PPF Calculator',
    description:
      'Calculate Public Provident Fund compounding with real historical interest rates declared by the Ministry of Finance, 5th-of-month banking rules, and 5-year extensions.',
    href: '/ppf-calculator',
    linkText: 'Calculate PPF Growth →',
    iconType: 'shield',
  },
  {
    title: 'NPS Retirement Calculator',
    description:
      'Model National Pension System wealth accumulation, 40% mandatory annuity purchase, 60% tax-free lump sum withdrawal, and monthly pension payouts under PFRDA rules.',
    href: '/nps-calculator',
    linkText: 'Plan NPS Retirement →',
    iconType: 'clock',
  },
  {
    title: 'Mutual Fund Engine',
    description:
      'Search thousands of AMFI mutual funds with live NAV history. Analyze CAGR, benchmark growth, and visualize historical lumpsum and SIP performance.',
    href: '/mutual-funds/lumpsum',
    linkText: 'Explore Mutual Funds →',
    iconType: 'trending',
  },
  {
    title: 'SIP & SWP Planning',
    description:
      'Calculate forward systematic investments or retirement withdrawals. Model target capital accumulation or monthly income sustainability.',
    href: '/sip-calculator',
    linkText: 'Explore Systematic Plans →',
    iconType: 'clock',
  },
  {
    title: 'Fixed & Recurring Deposits',
    description:
      'High-precision compound interest calculator with support for monthly, quarterly, semi-annual, and annual compounding frequencies.',
    href: '/fd-calculator',
    linkText: 'Explore Deposit Plans →',
    iconType: 'layers',
  },
  {
    title: 'Purchasing Power Parity (PPP)',
    description:
      'Convert salary and living costs across 150+ countries using real World Bank PPP conversion factors and currency mappings.',
    href: '/ppp-calculator',
    linkText: 'Calculate Global PPP →',
    iconType: 'globe',
  },
  {
    title: 'Inflation Modeling',
    description:
      'Understand the true purchasing power erosion over decades with IMF historical inflation data and forward forecasts.',
    href: '/inflation-calculator',
    linkText: 'Explore Inflation Rates →',
    iconType: 'chart',
  },
  {
    title: 'EMI & Loan Amortization',
    description:
      'Calculate home, personal, or vehicle loan EMIs with full month-by-month principal vs interest repayment breakdown schedules.',
    href: '/emi-calculator',
    linkText: 'Calculate Loan EMI →',
    iconType: 'percent',
  },
  {
    title: 'Mathematical Calculator',
    description:
      'Full-featured basic and scientific calculator with trigonometry, logarithms, powers, factorials, and degree/radian support.',
    href: '/calculator',
    linkText: 'Open Calculator →',
    iconType: 'tool',
  },
  {
    title: 'Date Calculator',
    description:
      'Calculate exact days, weeks, months, and years between dates or add and subtract time intervals from any date.',
    href: '/date-calculator',
    linkText: 'Open Date Calculator →',
    iconType: 'calendar',
  },
  {
    title: 'Currency Converter',
    description:
      'Convert 160+ global currencies in real time with live mid-market forex rates, zero bank markups, and instant bidirectional calculation.',
    href: '/currency-converter',
    linkText: 'Open Currency Converter →',
    iconType: 'repeat',
  },
];

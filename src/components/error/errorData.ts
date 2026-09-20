export interface ErrorCalculatorItem {
  title: string;
  href: string;
  cat: 'invest' | 'loans' | 'tax';
  icon: string;
  desc: string;
}
export const ERROR_CALCULATORS: ErrorCalculatorItem[] = [
  { title: 'Mutual Fund Lumpsum', href: '/mutual-funds/lumpsum', cat: 'invest', icon: '📈', desc: 'Historical rolling returns & CAGR' },
  { title: 'SIP Calculator', href: '/sip-calculator', cat: 'invest', icon: '💰', desc: 'Systematic compounding & growth' },
  { title: 'SWP Calculator', href: '/swp-calculator', cat: 'invest', icon: '🏧', desc: 'Tax-efficient regular cash flows' },
  { title: 'EMI Calculator', href: '/emi-calculator', cat: 'loans', icon: '🏠', desc: 'Loan amortization & interest breakdown' },
  { title: 'Income Tax Calculator', href: '/income-tax-calculator', cat: 'tax', icon: '⚖️', desc: 'New vs Old tax regime comparison' },
  { title: 'PPF Calculator', href: '/ppf-calculator', cat: 'invest', icon: '🛡️', desc: 'Public Provident Fund 15-yr growth' },
];
export interface DiagnosticResult {
  tested: boolean;
  online: boolean;
  storage: boolean;
  latencyMs: number | null;
}

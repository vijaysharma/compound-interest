export interface DataSourceItem {
  name: string;
  url: string;
  usage: string;
  iconType: 'database' | 'globe';
}
export const DATA_SOURCES: DataSourceItem[] = [
  {
    name: 'AMFI India (Association of Mutual Funds in India)',
    url: 'https://www.amfiindia.com/',
    usage:
      'Live mutual fund NAV history, scheme metadata, and fund house data for all 2,000+ SEBI-registered schemes.',
    iconType: 'database',
  },
  {
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/',
    usage:
      'Purchasing Power Parity (PPP) conversion factors, GDP per capita, and macroeconomic indicators for 150+ countries.',
    iconType: 'globe',
  },
  {
    name: 'IMF DataMapper (International Monetary Fund)',
    url: 'https://www.imf.org/external/datamapper/',
    usage:
      'Historical Consumer Price Index (CPI) inflation data and forward IMF forecasts for India and global economies.',
    iconType: 'database',
  },
];
export interface AvailableToolItem {
  name: string;
  href: string;
  desc: string;
}
export const AVAILABLE_TOOLS: AvailableToolItem[] = [
  {
    name: 'SIP Calculator',
    href: '/sip-calculator',
    desc: 'Systematic Investment Plan returns & corpus projection',
  },
  {
    name: 'SWP Calculator',
    href: '/swp-calculator',
    desc: 'Retirement withdrawal planning & corpus longevity',
  },
  {
    name: 'FD Calculator',
    href: '/fd-calculator',
    desc: 'Fixed Deposit compound interest & maturity value',
  },
  {
    name: 'RD Calculator',
    href: '/rd-calculator',
    desc: 'Recurring Deposit returns with monthly compounding',
  },
  {
    name: 'EMI Calculator',
    href: '/emi-calculator',
    desc: 'Loan amortization with part-payment & rate change modeling',
  },
  {
    name: 'Inflation Calculator',
    href: '/inflation-calculator',
    desc: 'Purchasing power erosion with IMF CPI data',
  },
  {
    name: 'PPP Calculator',
    href: '/ppp-calculator',
    desc: 'Global salary comparison across 150+ countries',
  },
  {
    name: 'Mutual Fund Engine',
    href: '/mutual-funds/sip',
    desc: 'Live AMFI NAV history & CAGR analysis',
  },
];

export interface FiiDiiSectionExplanation {
  id: string;
  title: string;
  badge: string;
  explanation: string;
  keyTakeaway: string;
}
export const FII_DII_EXPLANATIONS: FiiDiiSectionExplanation[] = [
  {
    id: 'fii-vs-dii',
    title: 'FII vs DII Net Activity',
    badge: 'Core Concept',
    explanation:
      'FIIs (Foreign Investors) are big foreign funds, and DIIs (Domestic Investors) are Indian mutual funds and banks. When FIIs sell and DIIs buy, Indian domestic savings are supporting the stock market.',
    keyTakeaway: 'DII inflows (via SIPs) act as a strong buffer when global funds pull capital out.',
  },
  {
    id: 'inflation-adjustment',
    title: 'Inflation Adjustment (Real ₹)',
    badge: 'Macro Normalization',
    explanation:
      "Shows what past investments are worth in today's money value after removing the effect of rising prices (CPI Inflation).",
    keyTakeaway: '₹1,000 Cr in 2008 had much higher market impact than ₹1,000 Cr today.',
  },
  {
    id: 'ppp-adjustment',
    title: 'Purchasing Power Parity (PPP)',
    badge: 'Global Benchmark',
    explanation:
      'Normalizes investment amounts to compare global purchasing strength consistently across years, independent of local currency fluctuations.',
    keyTakeaway: 'Expresses flow values in international dollars based on World Bank PPP factors.',
  },
  {
    id: 'index-overlay',
    title: 'NSE Nifty 50 & BSE Sensex Overlay',
    badge: 'Price Correlation',
    explanation:
      'Shows how the stock market index moved alongside foreign and domestic money flows. Higher inflows often correlate with long-term market growth.',
    keyTakeaway: 'Dual-axis comparison highlights how institutional momentum drives index direction.',
  },
];

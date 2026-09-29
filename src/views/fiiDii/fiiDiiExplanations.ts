export interface FiiDiiSectionExplanation {
  id: string;
  title: string;
  badge: string;
  formula?: string;
  explanation: string;
  steps?: string[];
  keyTakeaway: string;
}
export const FII_DII_EXPLANATIONS: FiiDiiSectionExplanation[] = [
  {
    id: 'fii-vs-dii',
    title: 'FII vs DII Net Activity & Derivation',
    badge: 'Daily Net Flow',
    formula: 'Net Flow (₹ Cr) = Gross Purchases (Buy) - Gross Sales (Sell)',
    explanation:
      'Every trading day around 6:00 PM IST, NSE and BSE publish total gross turnover for institutional categories. Net Flow reveals institutional conviction: a positive balance indicates net capital accumulation, while negative indicates net distribution.',
    steps: [
      '1. FIIs (Foreign Institutional Investors / FPIs): Global pension, sovereign, and hedge funds allocating foreign capital to Indian equities.',
      '2. DIIs (Domestic Institutional Investors): Indian asset managers (Mutual Funds, Insurance companies like LIC, Banks, and National Pension System).',
      '3. Ingestion: Data is parsed and verified directly against official exchange clearing settlement reports.',
    ],
    keyTakeaway: 'When FIIs sell aggressively, sustained DII buying funded by monthly retail SIPs acts as a market stabilizer.',
  },
  {
    id: 'inflation-adjustment',
    title: 'Inflation Adjustment (Real ₹ Purchasing Power)',
    badge: 'CPI Normalization',
    formula: 'Flow_real = Flow_nominal × (CPI_latest / CPI_trade_date)',
    explanation:
      "Calculates the true real purchasing power of historical flows in today's rupee value by removing Consumer Price Index (CPI) inflation published by MOSPI and the World Bank.",
    steps: [
      '1. Historical CPI: Each trade date is pegged to the applicable monthly CPI index number (Base 2012 = 100).',
      '2. Escalation Factor: The ratio of today\'s CPI to the historical trade date\'s CPI scales up past purchasing impact.',
      '3. Real Impact: A ₹1,000 Cr net inflow in 2008 had the equivalent liquidity force of over ₹3,200 Cr today.',
    ],
    keyTakeaway: 'Allows fair, multi-decade comparisons of capital concentration without distortion from currency devaluation.',
  },
  {
    id: 'ppp-adjustment',
    title: 'Purchasing Power Parity (PPP $ Global Standard)',
    badge: 'International Value',
    formula: 'Flow_PPP ($M) = (Flow_nominal in ₹ Cr × 10,000,000) / (PPP_factor × 1,000,000)',
    explanation:
      'Standardizes flow amounts into international dollars using World Bank Purchasing Power Parity conversion rates (PA.NUS.PPP), neutralizing short-term FX currency swings.',
    steps: [
      '1. PPP Factor: Represents the number of Indian Rupees required to buy the exact basket of goods costing $1 in the United States.',
      '2. Currency Independence: Eliminates artificial swings caused solely by USD/INR exchange rate volatility.',
      '3. Cross-Border Comparison: Measures Indian institutional volume on equal footing with global financial markets.',
    ],
    keyTakeaway: 'Reflects true economic volume of institutional movements relative to global purchasing benchmarks.',
  },
  {
    id: 'index-overlay',
    title: 'NSE Nifty 50 & BSE Sensex Dual-Axis Correlation',
    badge: 'Price Action Correlation',
    formula: 'Period Change (%) = ((Index_last - Index_first) / Index_first) × 100',
    explanation:
      'Plots foreign and domestic capital flows side-by-side with benchmark index closing prices on synchronized dual Y-axes to uncover market liquidity dynamics.',
    steps: [
      '1. Leading Indicator: Clustered positive net inflows across both FII and DII consistently precede major index expansions.',
      '2. Divergence Warning: If indices rally while both FII and DII are net sellers, the move is often driven by low-volume retail speculation.',
      '3. Floor Support: Heavy DII absorption during FII liquidation creates institutional price floors during market corrections.',
    ],
    keyTakeaway: 'Visualizes whether market movements are fundamentally underpinned by institutional capital.',
  },
];

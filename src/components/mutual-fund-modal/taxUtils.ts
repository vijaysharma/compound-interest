import type { TaxMode, PerformanceMetrics, TaxCalculations } from './types';
export function calculateFundTax(
  performance: PerformanceMetrics,
  taxMode: TaxMode,
  fundCategory: string,
  isLongTerm: boolean,
  holdingDays: number,
  holdingYears: number
): TaxCalculations {
  const gains = Math.max(0, performance.gain);
  let effectiveTax = 0;
  let rateLabel = '';
  let categoryBadge = '';
  let effectiveMode = taxMode;
  if (taxMode === 'auto') {
    if (fundCategory === 'debt') {
      effectiveMode = 'slab30';
    } else if (fundCategory === 'hybrid_conservative') {
      effectiveMode = holdingDays > 1095 ? 'ltcg' : 'slab30';
    } else {
      effectiveMode = isLongTerm ? 'ltcg' : 'stcg';
    }
  }
  if (effectiveMode === 'none') {
    effectiveTax = 0;
    rateLabel = '0% (Tax-Exempt)';
    categoryBadge = 'Exempt';
  } else if (effectiveMode === 'ltcg') {
    const taxableGains = Math.max(0, gains - 125000);
    effectiveTax = taxableGains * 0.13;
    rateLabel = '12.5% LTCG (>₹1.25L Exemption + 4% Cess)';
    categoryBadge = 'Equity LTCG (12.5%)';
  } else if (effectiveMode === 'stcg') {
    effectiveTax = gains * 0.208;
    rateLabel = '20% STCG (+ 4% Cess)';
    categoryBadge = 'Equity STCG (20%)';
  } else if (effectiveMode === 'slab30') {
    effectiveTax = gains * 0.312;
    rateLabel = '30% Slab (+ 4% Cess)';
    categoryBadge = 'Income Tax Slab (30%)';
  } else if (effectiveMode === 'slab20') {
    effectiveTax = gains * 0.208;
    rateLabel = '20% Slab (+ 4% Cess)';
    categoryBadge = 'Income Tax Slab (20%)';
  }
  const postTaxMaturity = performance.maturity - effectiveTax;
  const postTaxProfit = performance.gain - effectiveTax;
  const postTaxCagr =
    performance.invested > 0 && postTaxMaturity > 0
      ? (Math.pow(postTaxMaturity / performance.invested, 1 / holdingYears) - 1) * 100
      : 0;
  return {
    taxAmount: effectiveTax,
    postTaxMaturity,
    postTaxProfit,
    postTaxCagr,
    rateLabel,
    categoryBadge,
  };
}

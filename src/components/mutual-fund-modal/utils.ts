import type { MFMetaType } from '../../data/api_data';
import type { ConstituentProfile } from './types';
export const formatINR = (val: number): string => `₹${Math.round(val).toLocaleString('en-IN')}`;
export const parseDateParts = (dStr: string): number => {
  const p = dStr.split('-');
  if (p.length === 3) {
    if (p[0].length === 4) {
      return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
    }
    return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime();
  }
  return 0;
};
export const getPresetStartDateISO = (
  preset: string,
  maxDateISO: string,
  minDateISO: string
): string => {
  if (preset === 'All' || !maxDateISO) return minDateISO;
  const end = new Date(maxDateISO);
  if (Number.isNaN(end.getTime())) return minDateISO;
  const target = new Date(end);
  switch (preset) {
    case '1M':
      target.setMonth(target.getMonth() - 1);
      break;
    case '6M':
      target.setMonth(target.getMonth() - 6);
      break;
    case '1Y':
      target.setFullYear(target.getFullYear() - 1);
      break;
    case '3Y':
      target.setFullYear(target.getFullYear() - 3);
      break;
    case '5Y':
      target.setFullYear(target.getFullYear() - 5);
      break;
    default:
      return minDateISO;
  }
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const computedISO = `${year}-${month}-${day}`;
  return computedISO < minDateISO ? minDateISO : computedISO;
};
export const getFundCategory = (metaCategory?: string, fundName?: string): string => {
  const text = `${metaCategory || ''} ${fundName || ''}`.toLowerCase();
  if (
    text.includes('debt') ||
    text.includes('liquid') ||
    text.includes('money market') ||
    text.includes('overnight') ||
    text.includes('gilt') ||
    text.includes('corporate bond') ||
    text.includes('banking and psu') ||
    text.includes('floater')
  ) {
    return 'debt';
  }
  if (text.includes('conservative hybrid') || text.includes('equity savings')) {
    return 'hybrid_conservative';
  }
  return 'equity';
};
export const getConstituentProfile = (
  meta: MFMetaType | null,
  fundName?: string
): ConstituentProfile => {
  const cat = (meta?.scheme_category || fundName || '').toLowerCase();
  if (cat.includes('elss') || cat.includes('tax saver')) {
    return {
      categoryType: 'Equity: Tax Saving (ELSS)',
      benchmark: 'NIFTY 500 TRI',
      topHoldings:
        'HDFC Bank, ICICI Bank, Infosys, Reliance Industries, TCS, Larsen & Toubro, Bharti Airtel',
      sectors:
        'Financial Services (31%), Technology (12%), Oil & Gas (9%), Capital Goods (8%), Auto (7%)',
    };
  }
  if (cat.includes('arbitrage')) {
    return {
      categoryType: 'Hybrid: Arbitrage (Equity Taxation)',
      benchmark: 'NIFTY 50 Arbitrage Index',
      topHoldings:
        'Cash-Futures Equities (Fully Hedged), Sovereign T-Bills, AAA Short-term Corporate Bonds',
      sectors: 'Arbitrage Equities (68%), Debt & Money Market (28%), Cash & Collateral (4%)',
    };
  }
  if (cat.includes('small cap')) {
    return {
      categoryType: 'Equity: Small Cap Fund',
      benchmark: 'NIFTY Smallcap 250 TRI',
      topHoldings:
        'High-growth emerging Indian enterprises across Capital Goods, Chemicals, Auto Ancillaries, and Digital Tech',
      sectors:
        'Industrial Manufacturing (22%), Consumer Discretionary (16%), Financials (14%), Chemicals (11%)',
    };
  }
  if (cat.includes('mid cap')) {
    return {
      categoryType: 'Equity: Mid Cap Fund',
      benchmark: 'NIFTY Midcap 150 TRI',
      topHoldings:
        'Market-leading mid-sized companies with proven compounding and robust balance sheets',
      sectors: 'Financials (20%), Auto & Auto Components (15%), Healthcare (12%), IT (10%)',
    };
  }
  if (cat.includes('flexi cap') || cat.includes('multi cap')) {
    return {
      categoryType: 'Equity: Dynamic Multi-Cap Allocation',
      benchmark: 'NIFTY 500 TRI',
      topHoldings: 'ICICI Bank, HDFC Bank, Infosys, Reliance, ITC, Tata Motors, L&T, Sun Pharma',
      sectors: 'Banking & Financials (28%), IT & Tech (14%), Healthcare (9%), Industrials (8%)',
    };
  }
  return {
    categoryType: meta?.scheme_category || 'Indian Mutual Fund Scheme',
    benchmark: 'Broad Market Composite TRI',
    topHoldings: 'Leading diversified holdings as per AMFI and SEBI investment mandates',
    sectors: 'Diversified across key growth sectors of the Indian economy',
  };
};

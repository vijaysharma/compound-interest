import { FundType } from './types';
export interface Tranche {
  acquisitionDate: string;
  costBasis: number;
  currentValue: number;
  fundType: FundType;
}
export interface RedemptionTaxResult {
  stcgGains: number;
  ltcgGains: number;
  taxPayable: number;
  netWithdrawn: number;
}
export class TaxTracker {
  private annualLtcgUsed: Map<string, number> = new Map();
  getFinancialYear(dateStr: string): string {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  }
  calculateRedemptionTax(
    dateStr: string,
    grossWithdrawal: number,
    totalPortfolioCostBasis: number,
    totalPortfolioMarketValue: number,
    equityFraction: number,
    daysSinceInvestment: number
  ): RedemptionTaxResult {
    if (grossWithdrawal <= 0 || totalPortfolioMarketValue <= 0) {
      return { stcgGains: 0, ltcgGains: 0, taxPayable: 0, netWithdrawn: grossWithdrawal };
    }
    const gainRatio = Math.max(0, (totalPortfolioMarketValue - totalPortfolioCostBasis) / totalPortfolioMarketValue);
    const totalGainsInWithdrawal = grossWithdrawal * gainRatio;
    const equityGains = totalGainsInWithdrawal * equityFraction;
    const debtGains = totalGainsInWithdrawal * (1 - equityFraction);
    let stcgGains = 0;
    let ltcgGains = 0;
    let taxPayable = 0;
    if (daysSinceInvestment <= 365) {
      stcgGains = equityGains;
      taxPayable += stcgGains * 0.20;
    } else {
      ltcgGains = equityGains;
      const fy = this.getFinancialYear(dateStr);
      const usedExemption = this.annualLtcgUsed.get(fy) || 0;
      const availableExemption = Math.max(0, 125000 - usedExemption);
      const taxableLtcg = Math.max(0, ltcgGains - availableExemption);
      const exemptionApplied = Math.min(ltcgGains, availableExemption);
      this.annualLtcgUsed.set(fy, usedExemption + exemptionApplied);
      taxPayable += taxableLtcg * 0.125;
    }
    taxPayable += debtGains * 0.30;
    const netWithdrawn = Math.max(0, grossWithdrawal - taxPayable);
    return {
      stcgGains: Math.round(stcgGains),
      ltcgGains: Math.round(ltcgGains),
      taxPayable: Math.round(taxPayable),
      netWithdrawn: Math.round(netWithdrawn),
    };
  }
}

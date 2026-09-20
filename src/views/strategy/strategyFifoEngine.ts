import { FundLot, FundType } from './types';
export interface FifoRedemptionResult {
  unitsRedeemed: number;
  costBasisRedeemed: number;
  grossAmount: number;
  stcgGains: number;
  ltcgGains: number;
  debtGains: number;
  stcgTax: number;
  ltcgTax: number;
  debtTax: number;
  totalTax: number;
  netProceeds: number;
}
export class FifoPortfolioTracker {
  private lotsByFund = new Map<string, FundLot[]>();
  private annualLtcgUsed = new Map<string, number>();
  private getFinancialYear(dateStr: string): string {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return m >= 4 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  }
  addLot(fundCode: string, units: number, purchaseNav: number, purchaseDate: string, fundType: FundType): void {
    if (units <= 0) return;
    const existing = this.lotsByFund.get(fundCode) || [];
    existing.push({
      schemeCode: fundCode,
      units,
      purchaseNav,
      purchaseDate,
      costBasis: units * purchaseNav,
      fundType,
    });
    this.lotsByFund.set(fundCode, existing);
  }
  getFundUnits(fundCode: string): number {
    const lots = this.lotsByFund.get(fundCode) || [];
    return lots.reduce((sum, l) => sum + l.units, 0);
  }
  getFundCostBasis(fundCode: string): number {
    const lots = this.lotsByFund.get(fundCode) || [];
    return lots.reduce((sum, l) => sum + l.costBasis, 0);
  }
  redeemUnitsFifo(
    fundCode: string,
    redemptionDate: string,
    currentNav: number,
    unitsToRedeem: number
  ): FifoRedemptionResult {
    const lots = this.lotsByFund.get(fundCode) || [];
    let remainingUnits = unitsToRedeem;
    let costBasisRedeemed = 0;
    let stcgGains = 0;
    let ltcgGains = 0;
    let debtGains = 0;
    const rDateObj = new Date(redemptionDate);
    while (remainingUnits > 0.0001 && lots.length > 0) {
      const lot = lots[0];
      const lotUnits = lot.units;
      const takeUnits = Math.min(remainingUnits, lotUnits);
      const lotCostPortion = takeUnits * lot.purchaseNav;
      const lotProceeds = takeUnits * currentNav;
      const gain = Math.max(0, lotProceeds - lotCostPortion);
      const pDateObj = new Date(lot.purchaseDate);
      const holdingDays = Math.max(0, Math.floor((rDateObj.getTime() - pDateObj.getTime()) / 86400000));
      if (lot.fundType === 'equity') {
        if (holdingDays <= 365) {
          stcgGains += gain;
        } else {
          ltcgGains += gain;
        }
      } else {
        debtGains += gain;
      }
      costBasisRedeemed += lotCostPortion;
      lot.units -= takeUnits;
      lot.costBasis -= lotCostPortion;
      remainingUnits -= takeUnits;
      if (lot.units <= 0.0001) {
        lots.shift();
      }
    }
    this.lotsByFund.set(fundCode, lots);
    const stcgTax = Math.round(stcgGains * 0.20);
    const fy = this.getFinancialYear(redemptionDate);
    const usedExemption = this.annualLtcgUsed.get(fy) || 0;
    const availableExemption = Math.max(0, 125000 - usedExemption);
    const taxableLtcg = Math.max(0, ltcgGains - availableExemption);
    const exemptionUsed = Math.min(ltcgGains, availableExemption);
    this.annualLtcgUsed.set(fy, usedExemption + exemptionUsed);
    const ltcgTax = Math.round(taxableLtcg * 0.125);
    const debtTax = Math.round(debtGains * 0.30);
    const totalTax = stcgTax + ltcgTax + debtTax;
    const grossAmount = Math.round((unitsToRedeem - remainingUnits) * currentNav);
    const netProceeds = Math.max(0, grossAmount - totalTax);
    return {
      unitsRedeemed: unitsToRedeem - remainingUnits,
      costBasisRedeemed: Math.round(costBasisRedeemed),
      grossAmount,
      stcgGains: Math.round(stcgGains),
      ltcgGains: Math.round(ltcgGains),
      debtGains: Math.round(debtGains),
      stcgTax,
      ltcgTax,
      debtTax,
      totalTax,
      netProceeds,
    };
  }
}

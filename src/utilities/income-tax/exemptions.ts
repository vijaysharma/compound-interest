import type { CityCategory } from './types';
/**
 * Calculates Section 10(13A) HRA Exemption
 */
export function calculateHRAExemption(
  hraReceived: number,
  rentPaid: number,
  basicSalary: number,
  cityCategory: CityCategory
): number {
  if (!hraReceived || !rentPaid || rentPaid <= 0.1 * basicSalary) {
    return 0;
  }
  const rentMinus10Percent = Math.max(0, rentPaid - 0.1 * basicSalary);
  const cityPercentageCap = cityCategory === 'metro' ? 0.5 * basicSalary : 0.4 * basicSalary;
  return Math.round(Math.min(hraReceived, rentMinus10Percent, cityPercentageCap));
}
/**
 * Calculates Income or Loss from House Property
 */
export function calculateHousePropertyIncome(
  isSelfOccupied: boolean,
  rentalIncome: number,
  municipalTaxes: number,
  homeLoanInterest: number
): { incomeOrLoss: number; lossForSetOff: number } {
  if (isSelfOccupied) {
    const loss = Math.min(200000, homeLoanInterest);
    return {
      incomeOrLoss: -loss,
      lossForSetOff: loss,
    };
  }
  const netAnnualValue = Math.max(0, rentalIncome - municipalTaxes);
  const standardDeduction30 = 0.3 * netAnnualValue;
  const netIncome = netAnnualValue - standardDeduction30 - homeLoanInterest;
  if (netIncome < 0) {
    const setOffLoss = Math.min(200000, Math.abs(netIncome));
    return {
      incomeOrLoss: netIncome,
      lossForSetOff: setOffLoss,
    };
  }
  return {
    incomeOrLoss: netIncome,
    lossForSetOff: 0,
  };
}

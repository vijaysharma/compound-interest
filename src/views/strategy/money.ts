/**
 * Money and unit precision helpers.
 *
 * Rupee amounts are held as numbers but every value that leaves the engine is
 * snapped to paise, so accumulated binary-float drift can never surface as a
 * displayed figure or flip a "can I afford this withdrawal?" comparison.
 * Intermediate units and NAV products are deliberately left unrounded.
 */
const PAISE = 100;
/** Half a paisa: below this, two rupee amounts are the same amount. */
export const MONEY_EPSILON = 0.005;
export const roundMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * PAISE) / PAISE : 0;
export const addMoney = (a: number, b: number): number => roundMoney(a + b);
export const isZeroMoney = (value: number): boolean => Math.abs(value) < MONEY_EPSILON;
/** Units bought or sold for a rupee amount at an actual NAV. */
export const unitsFor = (amount: number, nav: number): number =>
  nav > 0 && Number.isFinite(amount) ? amount / nav : 0;
/** Rupee value of a unit holding at an actual NAV. */
export const valueFor = (units: number, nav: number): number =>
  units > 0 && nav > 0 ? roundMoney(units * nav) : 0;
/** Rupee amount, rounded for display in Indian digit grouping. */
export const formatRupees = (value: number): string =>
  `₹${Math.round(value).toLocaleString('en-IN')}`;
/** Units, rounded for display only. */
export const formatUnits = (units: number): string =>
  units.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

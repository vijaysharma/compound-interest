import { CURRENCIES as PART1 } from './currenciesPart1';
import { CURRENCIES as PART2 } from './currenciesPart2';
import { IndianFormat } from './indianFormat';
export interface CurrencyCodeEntry {
  name: string;
  currency_name: string;
  currency_code: string;
}
export const CURRENCY_CODES: CurrencyCodeEntry[] = [
  ...PART1,
  ...PART2,
];
export { IndianFormat };
export default CURRENCY_CODES;

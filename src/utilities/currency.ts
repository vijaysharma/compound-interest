import { ToWords as ToWordsEnIn } from 'to-words/en-IN';
import { ToWords as ToWordsEnUs } from 'to-words/en-US';
import { IndianFormat } from '../data/currencyCodes';
const toWordsIn = new ToWordsEnIn();
const toWordsUs = new ToWordsEnUs();
const currencySymbolCache = new Map<string, string>();
const convertToWords = (values: number, i18N = 'en-IN'): string => {
  if (i18N === 'en-IN' || IndianFormat.includes(i18N)) {
    return toWordsIn.convert(values, { currency: false });
  }
  return toWordsUs.convert(values, { currency: false });
};
export const getCurrencySymbol = (locale: string, currency: string): string => {
  const cacheKey = `${locale}-${currency}`;
  const cached = currencySymbolCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const symbol = (0)
    .toLocaleString(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, '')
    .trim();
  currencySymbolCache.set(cacheKey, symbol);
  return symbol;
};
export default convertToWords;

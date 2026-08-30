import { ToWords } from 'to-words';
import { IndianFormat } from '../data/currencyCodes';
const VALID_LOCALES = new Set([
  'en-AE',
  'en-BD',
  'en-GB',
  'en-GH',
  'en-IE',
  'en-IN',
  'en-MM',
  'en-MU',
  'en-NG',
  'en-NP',
  'en-US',
  'en-PH',
  'ee-EE',
  'fa-IR',
  'fr-BE',
  'fr-FR',
  'gu-IN',
  'hi-IN',
  'mr-IN',
  'nl-SR',
  'pt-BR',
  'tr-TR',
  'ko-KR',
]);
const toWordsCache = new Map<string, ToWords>();
const currencySymbolCache = new Map<string, string>();
const getToWordsInstance = (localeCode: string): ToWords => {
  let instance = toWordsCache.get(localeCode);
  if (!instance) {
    instance = new ToWords({ localeCode });
    toWordsCache.set(localeCode, instance);
  }
  return instance;
};
const convertToWords = (values: number, i18N = 'en-IN'): string => {
  const localeCode = VALID_LOCALES.has(i18N)
    ? i18N
    : IndianFormat.includes(i18N)
      ? 'en-IN'
      : 'en-US';
  const toWords = getToWordsInstance(localeCode);
  return toWords.convert(values, { currency: false });
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

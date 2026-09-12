import { ToWords as ToWordsEnIn } from 'to-words/en-IN';
import { ToWords as ToWordsEnUs } from 'to-words/en-US';
import { IndianFormat } from '../data/currencyCodes';
const toWordsIn = new ToWordsEnIn();
const toWordsUs = new ToWordsEnUs();
const currencySymbolCache = new Map<string, string>();
const ENGLISH_CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'AED',
  SAR: 'SAR',
  QAR: 'QAR',
  KWD: 'KWD',
  BHD: 'BHD',
  OMR: 'OMR',
  CAD: 'CA$',
  AUD: 'A$',
  SGD: 'SG$',
  NZD: 'NZ$',
  JPY: '¥',
  CNY: 'CN¥',
  CHF: 'CHF',
  HKD: 'HK$',
  KRW: '₩',
  THB: '฿',
  MYR: 'MYR',
  IDR: 'IDR',
  PHP: '₱',
  VND: '₫',
  ZAR: 'ZAR',
  BRL: 'R$',
  RUB: 'RUB',
  TRY: 'TRY',
  SEK: 'SEK',
  NOK: 'NOK',
  DKK: 'DKK',
  PLN: 'PLN',
  ILS: '₪',
  NGN: '₦',
  BDT: 'BDT',
  PKR: 'PKR',
  LKR: 'LKR',
  NPR: 'NPR',
  EGP: 'EGP',
  MXN: 'MX$',
  HUF: 'HUF',
  CZK: 'CZK',
  RON: 'RON',
  BGN: 'BGN',
  HRK: 'HRK',
};
const convertToWords = (values: number, i18N = 'en-IN'): string => {
  if (i18N === 'en-IN' || IndianFormat.includes(i18N)) {
    return toWordsIn.convert(values, { currency: false });
  }
  return toWordsUs.convert(values, { currency: false });
};
export const getCurrencySymbol = (locale: string, currency: string): string => {
  const cleanCode = currency?.trim().toUpperCase();
  if (cleanCode && ENGLISH_CURRENCY_SYMBOLS[cleanCode]) {
    return ENGLISH_CURRENCY_SYMBOLS[cleanCode];
  }
  const cacheKey = `${locale}-${cleanCode}`;
  const cached = currencySymbolCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  try {
    // Format using en-US to avoid non-English / Arabic scripts
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cleanCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === 'currency')?.value?.trim();
    // Verify sym contains only Latin/ASCII/common currency symbols
    if (sym && /^[\x20-\x7E\u00A0-\u00FF\u20A0-\u20CF]+$/.test(sym)) {
      currencySymbolCache.set(cacheKey, sym);
      return sym;
    }
  } catch {
    // Non-fatal, fallback to 3-letter currency code
  }
  const fallback = cleanCode || '₹';
  currencySymbolCache.set(cacheKey, fallback);
  return fallback;
};
export default convertToWords;

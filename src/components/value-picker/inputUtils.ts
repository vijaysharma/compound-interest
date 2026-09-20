import convertToWords from '../../utilities/currency';
export const MAX_SAFE_FINANCIAL_VALUE = 1e12;
export const MAX_RAW_INPUT_LENGTH = 16;
export function getWordsText(
  numericValue: number,
  showWords: boolean,
  effectiveSymbol: string | null,
  supportsDecimals: boolean,
  title?: string,
  locale = 'en-IN'
): string {
  const shouldShow =
    showWords &&
    effectiveSymbol === '₹' &&
    !supportsDecimals &&
    !title?.toLowerCase().includes('rate') &&
    !title?.toLowerCase().includes('roi') &&
    !title?.toLowerCase().includes('tenure');
  if (!shouldShow || numericValue <= 0 || numericValue > 999999999999) return '';
  try {
    return convertToWords(numericValue, locale);
  } catch {
    return '';
  }
}
export function formatRawInput(
  rawValue: string,
  cursor: number,
  supportsDecimals: boolean,
  min: number,
  safeMax: number,
  locale: string
): { formatted: string; valStr: string; nextCursor: number | null } {
  if (supportsDecimals) {
    const sanitized = rawValue.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const cleanDecimalStr = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
    if (cleanDecimalStr === '' || cleanDecimalStr === '.') {
      return { formatted: cleanDecimalStr, valStr: min.toString(), nextCursor: null };
    }
    const parsed = parseFloat(cleanDecimalStr);
    if (Number.isFinite(parsed) && parsed > safeMax) {
      return { formatted: String(safeMax), valStr: String(safeMax), nextCursor: null };
    }
    return { formatted: cleanDecimalStr, valStr: cleanDecimalStr, nextCursor: null };
  }
  const digitsBeforeCursor = rawValue.slice(0, cursor).replace(/[^0-9]/g, '').length;
  const rawDigits = rawValue.replace(/[^0-9]/g, '').slice(0, MAX_RAW_INPUT_LENGTH);
  if (rawDigits === '') {
    return { formatted: '', valStr: min.toString(), nextCursor: null };
  }
  const parsed = parseInt(rawDigits, 10);
  const clampedVal = Number.isNaN(parsed) ? min : Math.min(safeMax, Math.max(min, parsed));
  const formatted = clampedVal.toLocaleString(locale);
  if (digitsBeforeCursor === 0) {
    return { formatted, valStr: clampedVal.toString(), nextCursor: 0 };
  }
  let count = 0;
  let newPos = formatted.length;
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9]/.test(formatted[i])) {
      count++;
      if (count === digitsBeforeCursor) {
        newPos = i + 1;
        break;
      }
    }
  }
  return { formatted, valStr: clampedVal.toString(), nextCursor: newPos };
}

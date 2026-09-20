export type DurationType = {
  startDate: string;
  endDate: string;
  type?: 'Y' | 'M' | 'D' | 'H' | 'MM' | 'S' | 'MS';
  inclusive?: boolean;
};
/**
 * Convert the application's NAV date format (DD-MM-YYYY)
 * into a local Date object.
 *
 * This deliberately avoids new Date("DD-MM-YYYY"),
 * which is not reliably parsed by JavaScript.
 */
export const parseNavDate = (date: string): Date => {
  const parts = date.split('-');
  if (parts.length !== 3) {
    return new Date(NaN);
  }
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  return new Date(year, month, day);
};
/**
 * Convert either:
 * YYYY-MM-DD
 * DD-MM-YYYY
 * into a local Date object.
 */
export const parseAnyDate = (date: string): Date => {
  const parts = date.split('-');
  if (parts.length !== 3) {
    return new Date(NaN);
  }
  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return new Date(year, month, day);
  }
  return parseNavDate(date);
};
export const getDuration = ({
  startDate,
  endDate,
  type,
  inclusive = true,
}: DurationType): number => {
  const sDate = parseAnyDate(startDate).getTime();
  const eDate = parseAnyDate(endDate).getTime();
  const dMS = inclusive ? eDate - sDate + 86400000 : eDate - sDate;
  let result: number;
  switch (type) {
    case 'Y':
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;
    case 'M':
      result = dMS / (1000 * 60 * 60 * 24 * 30);
      break;
    case 'D':
      result = dMS / (1000 * 60 * 60 * 24);
      break;
    case 'H':
      result = dMS / (1000 * 60 * 60);
      break;
    case 'MM':
      result = dMS / (1000 * 60);
      break;
    case 'S':
      result = dMS / 1000;
      break;
    case 'MS':
      result = dMS;
      break;
    default:
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;
  }
  return result;
};
/**
 * Return a local YYYY-MM-DD string.
 */
export const getDateAsISO = (minusDays = 0, date = new Date()): string => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() - minusDays);
  const year = result.getFullYear();
  const month = String(result.getMonth() + 1).padStart(2, '0');
  const day = String(result.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
/**
 * Convert application NAV date (DD-MM-YYYY) to HTML date input format (YYYY-MM-DD).
 */
export const navDateToISO = (navDate: string): string => {
  const parts = navDate.split('-');
  if (parts.length !== 3) {
    return '';
  }
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};
/**
 * Convert HTML date input format (YYYY-MM-DD) to application NAV date (DD-MM-YYYY).
 */
export const isoDateToNavDate = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return '';
  }
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

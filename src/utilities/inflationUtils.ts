import type { INFLATION_TYPE } from '../types/types';
export const checkNAYear = (d: INFLATION_TYPE, p: string): boolean =>
  d[p as 'India' | 'USA' | 'EU' | 'World'] !== 'n/a';
export const calculateInflatedPrice = (
  principal: string,
  startYear: string,
  endYear: string,
  place: string,
  data: INFLATION_TYPE[]
): number[] => {
  const p = principal || '0';
  const stYear = parseInt(startYear);
  const edYear = parseInt(endYear);
  const splitData = data.filter((d) => {
    return d.Year >= stYear && d.Year < edYear && checkNAYear(d, place);
  });
  const updatedSplitData = splitData
    .map((d) => ({
      year: d.Year,
      ir: parseFloat(d[place as 'India' | 'USA' | 'EU' | 'World'].replace('%', '')),
    }))
    .reverse();
  let ia = parseFloat(p);
  for (let i = 0; i < updatedSplitData.length; i++) {
    ia = ia * (1 + updatedSplitData[i].ir / 100);
  }
  let da = parseFloat(p);
  for (let i = 0; i < updatedSplitData.length; i++) {
    da = da / (1 + updatedSplitData[i].ir / 100);
  }
  return [ia, da];
};
export const getCurrencySymbolAndLocale = (place: string): [string, string] => {
  let sym: string;
  let locale: string;
  switch (place) {
    case 'India':
      sym = '₹';
      locale = 'en-IN';
      break;
    case 'USA':
      sym = '$';
      locale = 'en-US';
      break;
    case 'EU':
      sym = '€';
      locale = 'en-EU';
      break;
    default:
      sym = '₹';
      locale = 'en-IN';
  }
  return [sym, locale];
};

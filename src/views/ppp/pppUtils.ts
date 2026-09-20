import CURRENCY_CODES from '../../data/currencyCodes';
import { CountryPPPType } from '../../types/types';
import { WorldBankPPPRecord } from '../../data/api_data';
import { DEFAULT_PPP_RECORDS } from '../../data/default_ppp_data';
const currencyLookup = new Map(CURRENCY_CODES.map((cc) => [cc.name.toLowerCase(), cc]));
export const transformPPPRecords = (
  records: WorldBankPPPRecord[]
): Record<string, CountryPPPType> => {
  const transformed: Record<string, CountryPPPType> = {};
  // 1. Pre-seed with verified fallback records so UAE, USA, India etc. are guaranteed present
  for (const fallback of DEFAULT_PPP_RECORDS) {
    if (fallback.value == null) continue;
    const country = fallback.country.value;
    const matchedCurrency = currencyLookup.get(country.toLowerCase());
    const cName = matchedCurrency ? matchedCurrency.currency_name : 'USD';
    const cLocale = cName === 'INR' ? 'en-IN' : 'en-US';
    transformed[country] = {
      currencyName: cName,
      currencyCode: cLocale,
      [parseInt(fallback.date, 10)]: fallback.value,
    };
  }
  // 2. Overlay live fetched World Bank records
  for (const record of records) {
    if (record.value == null) continue;
    const country = record.country.value;
    if (!transformed[country]) {
      const matchedCurrency = currencyLookup.get(country.toLowerCase());
      const cName = matchedCurrency
        ? matchedCurrency.currency_name
        : country.substring(0, 3).toUpperCase();
      const cLocale = cName === 'INR' ? 'en-IN' : 'en-US';
      transformed[country] = {
        currencyName: cName,
        currencyCode: cLocale,
      };
    }
    transformed[country][parseInt(record.date, 10)] = record.value;
  }
  return transformed;
};
export const DEFAULT_TRANSFORMED_PPP = transformPPPRecords(DEFAULT_PPP_RECORDS);
export const calculatePPP = (
  srcCountry: string,
  tgtCountry: string,
  pppData: { [key: string]: CountryPPPType }
): [number, number] => {
  const sourceCountry = srcCountry;
  const targetCountry = tgtCountry;
  const SourcePPP =
    pppData[sourceCountry][
      Math.max(
        ...Object.keys(pppData[sourceCountry])
          .filter((x) => x !== 'currencyName' && x !== 'currencyCode')
          .map((x) => parseInt(x, 10))
      )
    ];
  const TargetPPP =
    pppData[targetCountry][
      Math.max(
        ...Object.keys(pppData[targetCountry])
          .filter((x) => x !== 'currencyName' && x !== 'currencyCode')
          .map((x) => parseInt(x, 10))
      )
    ];
  return [SourcePPP, TargetPPP];
};
export const calculateTargetAmount = (
  srcAmt: string,
  srcPPP: number,
  tgtPPP: number
): string => {
  const cleanAmt = srcAmt || '0';
  const targetAmount = (parseFloat(cleanAmt) / srcPPP) * tgtPPP;
  return `${targetAmount}`;
};

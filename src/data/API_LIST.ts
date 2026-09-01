export const MF_URL = '/api/mutual-funds';
export const getMFSchemeCodeUrl = (schemeCode: string) =>
  `/api/mutual-funds/${encodeURIComponent(schemeCode)}`;
export const EXCHANGE_URL = 'https://open.er-api.com/v6/latest';
export const WORLD_BANK_PPP_URL = '/api/ppp-rates';
export const WORLD_BANK_INFLATION_URL =
  'https://api.worldbank.org/v2/country/IND;USA;EUU;WLD/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1000&date=1990:2026';
export const IMF_INFLATION_URL = '/api/imf-inflation';

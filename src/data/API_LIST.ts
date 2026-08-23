export const MF_URL = "https://api.mfapi.in/mf";
export const getMFSchemeCodeUrl = (schemeCode: string) =>
  `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`;
export const EXCHANGE_URL = "https://open.er-api.com/v6/latest";
export const WORLD_BANK_PPP_URL =
  "https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1";
export const WORLD_BANK_INFLATION_URL =
  "https://api.worldbank.org/v2/country/IND;USA;EUU;WLD/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1000&date=1990:2026";
export const IMF_URL =
  "https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD";
export const IMF_INFLATION_URL ="/api/imf-inflation";
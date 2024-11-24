export const MF_URL = "https://api.mfapi.in/mf";
export const getMFSchemeCodeUrl = (schemeCode: string) =>
  `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`;
export const EXCHANGE_URL = "https://open.er-api.com/v6/latest";

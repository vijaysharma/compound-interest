import { EXCHANGE_URL, getMFSchemeCodeUrl, MF_URL } from "./API_LIST";

export const fetchAllMfs = async () => {
  try {
    const response = await fetch(MF_URL);
    const data = await response.json();
    //    Filter data for duplicate schemeCodes
    const filteredData = data.filter(
      (fd: { schemeCode: number }, i: number) => {
        if (i === 0) return true;
        if (i > 0) return fd.schemeCode !== data[i - 1].schemeCode;
      }
    );
    //   Sort the data alphabetically by schemeName
    const sortedData = filteredData.sort(
      (a: { schemeName: string }, b: { schemeName: string }) => {
        if (a.schemeName < b.schemeName) {
          return -1;
        }
        if (a.schemeName > b.schemeName) {
          return 1;
        }
        return 0;
      }
    );
    return sortedData;
  } catch {
    throw Error(`Failed to fetch mutual funds at this url ${MF_URL}`);
  }
};

export const fetchMFbySchemeCode = async (schemeCode: string) => {
  const response = await fetch(getMFSchemeCodeUrl(schemeCode));
  const data = await response.json();
  return data.data;
};

export const fetchExchangeRates = async () => {
  const response = await fetch(EXCHANGE_URL);
  const data = await response.json();
  return data.rates;
};

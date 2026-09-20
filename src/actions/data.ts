'use server';
import { handleGetExchangeRates } from './data/exchangeRatesHandler';
import { handleGetPPPData, handleGetIMFInflation } from './data/macroDataHandler';
import { handleSearchMutualFunds } from './data/mfSearchHandler';
import { handleGetMutualFundNav } from './data/mfNavHandler';
import { handleGetBatchMutualFundNav } from './data/mfBatchNavHandler';
export async function getExchangeRatesAction(): Promise<{
  result: string;
  base_code: string;
  rates: Record<string, number>;
}> {
  return handleGetExchangeRates();
}
export async function getPPPDataAction(): Promise<unknown> {
  return handleGetPPPData();
}
export async function getIMFInflationAction(): Promise<unknown> {
  return handleGetIMFInflation();
}
export async function searchMutualFundsAction(
  searchQuery = ''
): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  return handleSearchMutualFunds(searchQuery);
}
export async function getMutualFundNavAction(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null
): Promise<unknown> {
  return handleGetMutualFundNav(schemeCodeRaw, requestedEndDate);
}
export async function getBatchMutualFundNavAction(
  schemeCodesRaw: (string | number)[],
  requestedEndDate?: string | null
): Promise<Record<string, unknown>> {
  return handleGetBatchMutualFundNav(schemeCodesRaw, requestedEndDate);
}

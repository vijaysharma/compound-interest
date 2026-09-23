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
/**
 * `requestedStartDate` is optional. Supplying it trims the response to that
 * window plus a lookup margin, which is a large saving — a full history is
 * ~133KB over ~3,400 rows, a two-year window roughly a fifth of that. Omitting
 * it returns the whole history, which is what the strategy engine needs.
 */
export async function getMutualFundNavAction(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<unknown> {
  return handleGetMutualFundNav(schemeCodeRaw, requestedEndDate, requestedStartDate);
}
/** See `getMutualFundNavAction` for the meaning of `requestedStartDate`. */
export async function getBatchMutualFundNavAction(
  schemeCodesRaw: (string | number)[],
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<Record<string, unknown>> {
  return handleGetBatchMutualFundNav(schemeCodesRaw, requestedEndDate, requestedStartDate);
}

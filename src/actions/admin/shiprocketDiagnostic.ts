/**
 * Diagnostic helper for debugging Shiprocket sync issues
 */
'use server';

import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { DbShiprocketAccount } from '@/lib/db/types';

export async function diagnosticShiprocketSync(token?: string | null): Promise<{
  success: boolean;
  accounts: number;
  firstAccountTest?: {
    label: string;
    hasToken: boolean;
    apiTest?: {
      status: number;
      ordersCount: number;
      sampleOrder?: Record<string, unknown>;
      error?: string;
    };
  };
  message: string;
}> {
  const sql = getDb();
  await ensureTables(sql);

  if (!(await isAuthorizedUser(token, sql))) {
    return { success: false, accounts: 0, message: 'Unauthorized' };
  }

  // Fetch accounts
  const accounts = (await sql`
    SELECT id, account_label, auth_token
    FROM shiprocket_accounts
  `) as Array<DbShiprocketAccount>;

  if (accounts.length === 0) {
    return {
      success: false,
      accounts: 0,
      message: 'No Shiprocket accounts configured. Add an account in Account Manager first.',
    };
  }

  const firstAcc = accounts[0];
  const result: {
    success: boolean;
    accounts: number;
    firstAccountTest?: {
      label: string;
      hasToken: boolean;
      apiTest?: {
        status: number;
        ordersCount: number;
        sampleOrder?: Record<string, unknown>;
        error?: string;
      };
    };
    message: string;
  } = {
    success: true,
    accounts: accounts.length,
    firstAccountTest: {
      label: firstAcc.account_label,
      hasToken: !!firstAcc.auth_token,
    },
    message: `Found ${accounts.length} account(s)`,
  };

  if (!firstAcc.auth_token) {
    result.message = `Account '${firstAcc.account_label}' has no auth token. Please re-authenticate.`;
    result.success = false;
    return result;
  }

  // Test API call
  try {
    const testRes = await fetch(
      'https://apiv2.shiprocket.in/v1/external/orders?page=1&per_page=10&filter_by=ALL',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firstAcc.auth_token}`,
        },
      }
    );

    const data = testRes.ok ? await testRes.json().catch(() => ({})) : null;
    const ordersList = Array.isArray(data?.data) ? data.data : [];

    result.firstAccountTest!.apiTest = {
      status: testRes.status,
      ordersCount: ordersList.length,
      sampleOrder: ordersList[0] as Record<string, unknown>,
    };

    if (!testRes.ok) {
      result.firstAccountTest!.apiTest.error = data?.message || `HTTP ${testRes.status}`;
      result.message = `API test failed: ${result.firstAccountTest!.apiTest.error}`;
      result.success = false;
    } else if (ordersList.length === 0) {
      result.message = 'API responded OK but returned 0 orders. Check date range or order history.';
    } else {
      result.message = `✓ API working. Fetched ${ordersList.length} orders. Sample customer: ${ordersList[0]?.customer_name || 'N/A'}`;
    }
  } catch (apiErr) {
    result.firstAccountTest!.apiTest = {
      status: 0,
      ordersCount: 0,
      error: apiErr instanceof Error ? apiErr.message : String(apiErr),
    };
    result.message = `API fetch failed: ${result.firstAccountTest!.apiTest.error}`;
    result.success = false;
  }

  return result;
}

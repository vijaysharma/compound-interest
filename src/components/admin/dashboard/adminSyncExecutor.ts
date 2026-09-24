import {
  syncMutualFundsAction,
  syncIMFAction,
  syncPPPAction,
  syncNavAction,
} from '../../../actions/admin';
import type { NavSyncReport } from '../../../actions/admin/navSync';
export interface SyncExecutionResult {
  report?: NavSyncReport;
  messageText: string;
}
export async function executeAdminSync(
  endpoint: string,
  effectiveToken: string,
  body?: string,
  navSchemeCodes?: string
): Promise<SyncExecutionResult> {
  if (endpoint.includes('sync-nav')) {
    const codes = (navSchemeCodes ?? '')
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const report = await syncNavAction(effectiveToken, codes.length ? { schemeCodes: codes } : undefined);
    const stored = report.schemes.filter((r) => r.outcome === 'stored').length;
    const text =
      `NAV sync: ${stored} of ${report.considered} stored. ` +
      `Market as of ${report.watermark ?? 'unknown'}` +
      (report.watermarkAdvanced ? ' (advanced)' : '') +
      `, ${(report.elapsedMs / 1000).toFixed(1)}s.`;
    return { report, messageText: text };
  }
  if (endpoint.includes('sync-mutual-funds')) {
    const res = await syncMutualFundsAction(effectiveToken);
    return { messageText: `Mutual funds synced: ${res.synced}.` };
  }
  if (endpoint.includes('sync-imf')) {
    await syncIMFAction(effectiveToken, body);
    return { messageText: 'IMF inflation data synced successfully.' };
  }
  if (endpoint.includes('sync-ppp')) {
    const res = await syncPPPAction(effectiveToken, body);
    const text =
      typeof res.synced === 'number'
        ? `World Bank PPP synced: ${res.synced} records.`
        : 'World Bank PPP data synced successfully.';
    return { messageText: text };
  }
  throw new Error('Unknown sync action');
}

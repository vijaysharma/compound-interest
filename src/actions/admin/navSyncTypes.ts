export interface NavSyncSchemeResult {
  schemeCode: string;
  schemeName: string | null;
  before: string | null;
  after: string | null;
  rowsBefore: number;
  rowsAfter: number;
  outcome: 'stored' | 'unchanged' | 'failed' | 'skipped-no-time';
}
export interface NavSyncReport {
  watermark: string | null;
  watermarkAdvanced: boolean;
  noAdvanceCount: number;
  considered: number;
  schemes: NavSyncSchemeResult[];
  elapsedMs: number;
}
export type AdminNavCandidateRow = {
  scheme_code: string;
  scheme_name: string | null;
  payload: unknown;
  latest_nav_date: string | null;
};

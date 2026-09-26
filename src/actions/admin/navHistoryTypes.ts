export interface NavHistorySyncOptions {
  fromDate: string;
  toDate: string;
  schemeCodes?: string[];
}
export interface NavHistorySampleScheme {
  schemeCode: string;
  schemeName?: string;
  rowsAdded: number;
}
export interface NavHistorySyncReport {
  fromDate: string;
  toDate: string;
  fromAmfi: string;
  toAmfi: string;
  totalRecords: number;
  totalSchemes: number;
  schemesUpdated: number;
  hasMoreSchemes?: boolean;
  elapsedMs: number;
  nextFromDate: string;
  nextToDate: string;
  nextFromAmfi: string;
  nextToAmfi: string;
  sampleSchemes?: NavHistorySampleScheme[];
}
export interface NavHistoryCheckpoint {
  lastSyncedFrom: string;
  lastSyncedTo: string;
  nextFrom: string;
  nextTo: string;
  recordsStored: number;
  schemesUpdated: number;
  syncedAt: number;
}

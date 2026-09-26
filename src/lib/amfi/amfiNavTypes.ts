export interface TrackedScheme {
  scheme_code: string;
  scheme_name: string;
  amfi_name: string | null;
  is_active: boolean;
  created_at?: string;
}
export interface AmfiNavRecord {
  schemeCode: string;
  schemeName: string;
  nav: number;
  date: string;
}
export interface NavRecord {
  scheme_code: string;
  date: string;
  nav: number;
  updated_at?: string;
}
export interface SingleDaySyncResult {
  success: boolean;
  dateSynced: string;
  requestedDate?: string;
  isFallback?: boolean;
  message?: string;
  totalRecords: number;
  error?: string;
}
export interface SeederOptions {
  days: number;
  offset: number;
  batchSize: number;
}
export interface ChunkSeedingStats {
  chunkIndex: number;
  totalChunks: number;
  fromIso: string;
  toIso: string;
  recordsFound: number;
  recordsInserted: number;
  elapsedMs: number;
}

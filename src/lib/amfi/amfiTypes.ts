import type { NavType } from '@/types/types';
export interface AmfiNavRecord {
  schemeCode: string;
  schemeName: string;
  isinGrowth: string | null;
  isinReinvest: string | null;
  nav: string;
  navNumeric: number;
  date: string; // DD-MM-YYYY (internal NavType format)
  isoDate: string; // YYYY-MM-DD
}
export interface AmfiParseResult {
  records: AmfiNavRecord[];
  byScheme: Map<string, NavType[]>;
  schemes: Map<string, { schemeCode: string; schemeName: string; isinGrowth: string | null }>;
  skippedLines: number;
}
export interface AmfiChunk {
  fromIso: string;
  toIso: string;
  fromAmfi: string; // DD-Mon-YYYY
  toAmfi: string; // DD-Mon-YYYY
}

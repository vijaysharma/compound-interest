export interface ScheduleRow {
  date: string;
  emi: string;
  principal: string;
  interest: string;
  balance: string;
  cumulativePrincipal: string;
  cumulativeInterest: string;
  remainingInterest: string;
  note?: string;
}
export interface PartPayment {
  amount: number;
  date: string; // ISO string
  mode: 'tenure' | 'emi';
  enabled: boolean;
}
export interface RateChange {
  rate: number;
  date: string; // ISO string
  mode: 'tenure' | 'emi';
  enabled: boolean;
}
export interface ScheduleCalculationResult {
  rows: ScheduleRow[];
  currentEmi: number;
  regularEmisCount: number;
  partPaymentsCount: number;
  roiChangesCount: number;
  totalPaymentsCount: number;
  hasEmiAdjustment: boolean;
}

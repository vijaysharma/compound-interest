export interface NavPoint {
  date: string;
  nav: number;
}
export interface SimulationResult {
  invested: number;
  withdrawn: number;
  units: number;
  currentValue: number;
  lastNav: number;
  installments: number;
  xirr?: number;
  latestXirr?: number;
  lastWithdrawalAmount?: number;
  lastWithdrawalDate?: string;
  remainingInvested?: number;
}
export interface CashFlow {
  date: string;
  amount: number;
}

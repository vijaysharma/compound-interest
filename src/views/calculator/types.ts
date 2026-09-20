import { HistoryItem, LastOperation } from '../../utilities/calculatorHelper';
export type { HistoryItem, LastOperation };
export const isErrorState = (expr: string): boolean =>
  expr === 'Error' || expr === 'Undefined' || expr === 'Overflow';

// Google Analytics 4 (GA4) Custom Interaction Tracking Utility
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
export type CalcActionType =
  | 'calculated'
  | 'slider_changed'
  | 'input_changed'
  | 'part_payment_added'
  | 'rate_change_added'
  | 'fund_pinned'
  | 'scenario_compared'
  | 'shared';
export const trackCalculatorEvent = (
  calculatorName: string,
  action: CalcActionType,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', `calc_${action}`, {
      calculator_name: calculatorName,
      event_category: 'Financial Calculator',
      event_label: label,
      value: value,
    });
  }
};

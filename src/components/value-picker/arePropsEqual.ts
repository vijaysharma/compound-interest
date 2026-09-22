import type { ValuePickerProps } from './types';
export function arePropsEqual(prev: ValuePickerProps, next: ValuePickerProps): boolean {
  if (prev.variant !== next.variant) return false;
  if (
    prev.value !== next.value ||
    prev.inputAmount !== next.inputAmount ||
    prev.activeTab !== next.activeTab ||
    prev.type !== next.type ||
    prev.defaultTab !== next.defaultTab ||
    prev.title !== next.title ||
    prev.titleStyle !== next.titleStyle ||
    prev.symbol !== next.symbol ||
    prev.currencySymbol !== next.currencySymbol ||
    prev.symbolPosition !== next.symbolPosition ||
    prev.symbolBg !== next.symbolBg ||
    prev.locale !== next.locale ||
    prev.min !== next.min ||
    prev.max !== next.max ||
    prev.defaultStep !== next.defaultStep ||
    prev.showWords !== next.showWords ||
    prev.allowDecimals !== next.allowDecimals ||
    prev.className !== next.className ||
    prev.compact !== next.compact ||
    prev.embedded !== next.embedded ||
    prev.condensed !== next.condensed ||
    prev.layout !== next.layout ||
    prev.disabled !== next.disabled ||
    prev.readOnly !== next.readOnly ||
    prev.placeholder !== next.placeholder ||
    prev.tabSize !== next.tabSize ||
    prev.singleRow !== next.singleRow ||
    prev.sourceBadgeText !== next.sourceBadgeText ||
    prev.targetBadgeText !== next.targetBadgeText ||
    prev.sourceValue !== next.sourceValue ||
    prev.targetValue !== next.targetValue ||
    prev.startDate !== next.startDate ||
    prev.endDate !== next.endDate ||
    prev.startBadgeText !== next.startBadgeText ||
    prev.endBadgeText !== next.endBadgeText
  ) {
    return false;
  }
  if (prev.stepRows !== next.stepRows) {
    if (!prev.stepRows || !next.stepRows) return false;
    if (prev.stepRows.length !== next.stepRows.length) return false;
  }
  if (prev.endAdornment !== next.endAdornment) return false;
  if (prev.sourceSlot !== next.sourceSlot || prev.targetSlot !== next.targetSlot) return false;
  if (prev.stepData !== next.stepData) {
    if (!prev.stepData || !next.stepData) return false;
    if (prev.stepData.length !== next.stepData.length) return false;
    for (let i = 0; i < prev.stepData.length; i++) {
      const a = prev.stepData[i];
      const b = next.stepData[i];
      if (a.id !== b.id || a.value !== b.value || a.label !== b.label || a.title !== b.title) return false;
    }
  }
  if (prev.tabs !== next.tabs) {
    if (!prev.tabs || !next.tabs) return false;
    if (prev.tabs.length !== next.tabs.length) return false;
    for (let i = 0; i < prev.tabs.length; i++) {
      const a = prev.tabs[i];
      const b = next.tabs[i];
      if (a.id !== b.id || a.title !== b.title || a.value !== b.value) return false;
    }
  }
  return true;
}

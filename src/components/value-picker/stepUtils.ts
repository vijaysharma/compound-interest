import { DEFAULT_VALUE_PICKER_ROWS, type ValuePickerStep } from '../../data/valuePickerData';
export function normalizeStepRows(
  stepRows?: ValuePickerStep[][] | ValuePickerStep[],
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>,
  singleRow?: boolean
): ValuePickerStep[][] {
  if (stepRows && stepRows.length > 0) {
    if (Array.isArray(stepRows[0])) {
      const rows = stepRows as ValuePickerStep[][];
      return singleRow ? [rows.flat()] : rows;
    }
    const flat = stepRows as ValuePickerStep[];
    if (singleRow) return [flat];
    const mid = Math.ceil(flat.length / 2);
    return [flat.slice(0, mid), flat.slice(mid)];
  }
  if (stepData && stepData.length > 0) {
    const formatted: ValuePickerStep[] = stepData.map((s, idx) => ({
      id: s.id || `step-${idx}`,
      label: s.label || s.title || `${s.value}`,
      value: typeof s.value === 'string' ? parseFloat(s.value) || 0 : Number(s.value) || 0,
    }));
    if (singleRow) return [formatted];
    const mid = Math.ceil(formatted.length / 2);
    return [formatted.slice(0, mid), formatted.slice(mid)];
  }
  if (singleRow) return [DEFAULT_VALUE_PICKER_ROWS.flat()];
  return DEFAULT_VALUE_PICKER_ROWS;
}

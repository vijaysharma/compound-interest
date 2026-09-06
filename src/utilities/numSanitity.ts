export const sanctnum = (
  inputValue: string | number | null | undefined,
  min?: number,
  max?: number
): number => {
  if (inputValue === null || inputValue === undefined) return min ?? 0;
  let val = typeof inputValue === 'string' ? parseFloat(inputValue) : inputValue;
  if (!Number.isFinite(val) || Number.isNaN(val)) {
    val = min ?? 0;
  }
  if (min !== undefined && val < min) val = min;
  if (max !== undefined && val > max) val = max;
  return val;
};

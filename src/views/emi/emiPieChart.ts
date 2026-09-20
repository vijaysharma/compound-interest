export type PieSlices =
  | { type: 'full-principal' }
  | { type: 'full-interest' }
  | { type: 'slices'; principalD: string; interestD: string }
  | null;
export const calculateEmiPieSlices = (
  totalPayable: number,
  principalPercent: number
): PieSlices => {
  if (totalPayable <= 0) return null;
  if (principalPercent >= 100) return { type: 'full-principal' };
  if (principalPercent <= 0) return { type: 'full-interest' };
  const angle = (principalPercent / 100) * 2 * Math.PI;
  const x = 100 + 85 * Math.sin(angle);
  const y = 100 - 85 * Math.cos(angle);
  const largeArc = principalPercent > 50 ? 1 : 0;
  return {
    type: 'slices',
    principalD: `M 100 100 L 100 15 A 85 85 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`,
    interestD: `M 100 100 L ${x.toFixed(2)} ${y.toFixed(2)} A 85 85 0 ${largeArc ? 0 : 1} 1 100 15 Z`,
  };
};

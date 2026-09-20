export const calculateBaseMonthlyEmi = (
  principalAmount: number,
  annualRate: number,
  tenureMonths: number
): number => {
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate <= 0 || tenureMonths <= 0 || principalAmount <= 0) return 0;
  return (
    (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  );
};

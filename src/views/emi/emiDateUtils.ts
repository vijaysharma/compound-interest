export const getTodayDateString = (): string => new Date().toISOString().split('T')[0];
export const differenceInDays = (date1: Date, date2: Date): number => {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

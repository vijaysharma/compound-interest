import { NavType } from "../types/types";
import { getNearest } from "./utility";

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
}

const toDate = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addMonths = (date: Date, months: number): Date => {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(date.getDate(), lastDay));
  return next;
};

const getNav = (isoDate: string, data: NavType[]): NavPoint | undefined => {
  const nearest = getNearest(isoDate, data);
  const nav = Number(nearest?.nav);
  return nearest && Number.isFinite(nav) && nav > 0 ? { date: nearest.date, nav } : undefined;
};

const getMonthlyDates = (startDate: string, endDate: string): string[] => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const dates: string[] = [];
  for (let month = 0; ; month += 1) {
    const date = addMonths(start, month);
    if (date > end) break;
    dates.push(toISO(date));
  }
  return dates;
};

const validateInputs = (startDate: string, endDate: string, amount: number) => {
  if (!startDate || !endDate || toDate(startDate) > toDate(endDate)) {
    throw new Error("Choose a valid start and end date.");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter an amount greater than zero.");
  }
};

export const calculateSip = (
  navData: NavType[],
  startDate: string,
  endDate: string,
  monthlyAmount: number,
  annualStepUp: number
): SimulationResult => {
  validateInputs(startDate, endDate, monthlyAmount);
  const dates = getMonthlyDates(startDate, endDate);
  let invested = 0;
  let units = 0;
  let lastNav = 0;

  for (const [index, date] of dates.entries()) {
    const nav = getNav(date, navData);
    if (!nav) continue;
    const amount = monthlyAmount * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12));
    invested += amount;
    units += amount / nav.nav;
    lastNav = nav.nav;
  }

  if (!units || !lastNav) throw new Error("No NAV data is available for the selected dates.");
  const finalNav = getNav(endDate, navData)?.nav ?? lastNav;
  return {
    invested,
    withdrawn: 0,
    units,
    currentValue: units * finalNav,
    lastNav: finalNav,
    installments: dates.length,
  };
};

export const calculateSwp = (
  navData: NavType[],
  startDate: string,
  endDate: string,
  initialInvestment: number,
  monthlyWithdrawal: number,
  annualStepUp: number
): SimulationResult => {
  validateInputs(startDate, endDate, initialInvestment);
  validateInputs(startDate, endDate, monthlyWithdrawal);
  const startNav = getNav(startDate, navData);
  if (!startNav) throw new Error("No NAV data is available for the selected start date.");

  let units = initialInvestment / startNav.nav;
  let withdrawn = 0;
  let lastNav = startNav.nav;
  const dates = getMonthlyDates(startDate, endDate).slice(1);

  for (const [index, date] of dates.entries()) {
    const nav = getNav(date, navData);
    if (!nav) continue;
    const amount = monthlyWithdrawal * Math.pow(1 + annualStepUp / 100, Math.floor(index / 12));
    units -= amount / nav.nav;
    withdrawn += amount;
    lastNav = nav.nav;
    if (units <= 0) {
      units = 0;
      break;
    }
  }

  const finalNav = getNav(endDate, navData)?.nav ?? lastNav;
  return {
    invested: initialInvestment,
    withdrawn,
    units,
    currentValue: units * finalNav,
    lastNav: finalNav,
    installments: dates.length,
  };
};

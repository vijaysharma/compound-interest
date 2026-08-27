import { INFLATION_TYPE, NavType } from "../types/types";

type DurationType = {
  startDate: string;
  endDate: string;
  type?: "Y" | "M" | "D" | "H" | "MM" | "S" | "MS";
  inclusive?: boolean;
};

/**
 * Convert the application's NAV date format (DD-MM-YYYY)
 * into a local Date object.
 *
 * This deliberately avoids new Date("DD-MM-YYYY"),
 * which is not reliably parsed by JavaScript.
 */
const parseNavDate = (date: string): Date => {
  const parts = date.split("-");

  if (parts.length !== 3) {
    return new Date(NaN);
  }

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);

  return new Date(year, month, day);
};

/**
 * Convert either:
 *
 * YYYY-MM-DD
 * DD-MM-YYYY
 *
 * into a local Date object.
 */
const parseAnyDate = (date: string): Date => {
  const parts = date.split("-");

  if (parts.length !== 3) {
    return new Date(NaN);
  }

  /*
   * ISO date: YYYY-MM-DD
   */
  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    return new Date(year, month, day);
  }

  /*
   * NAV date: DD-MM-YYYY
   */
  return parseNavDate(date);
};

export const getDuration = ({
  startDate,
  endDate,
  type,
  inclusive = true,
}: DurationType): number => {
  const sDate = parseAnyDate(startDate).getTime();

  const eDate = parseAnyDate(endDate).getTime();

  const dMS = inclusive ? eDate - sDate + 86400000 : eDate - sDate;

  let result: number;

  switch (type) {
    case "Y":
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;

    case "M":
      result = dMS / (1000 * 60 * 60 * 24 * 30);
      break;

    case "D":
      result = dMS / (1000 * 60 * 60 * 24);
      break;

    case "H":
      result = dMS / (1000 * 60 * 60);
      break;

    case "MM":
      result = dMS / (1000 * 60);
      break;

    case "S":
      result = dMS / 1000;
      break;

    case "MS":
      result = dMS;
      break;

    default:
      result = dMS / (1000 * 60 * 60 * 24 * 365);
      break;
  }

  return result;
};

/**
 * Return a local YYYY-MM-DD string.
 *
 * We intentionally do NOT use toISOString().
 * toISOString() converts to UTC and can shift the
 * calendar date around midnight depending on timezone.
 */
export const getDateAsISO = (minusDays = 0, date = new Date()): string => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() - minusDays);

  const year = result.getFullYear();

  const month = String(result.getMonth() + 1).padStart(2, "0");

  const day = String(result.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Convert application NAV date:
 *
 * DD-MM-YYYY
 *
 * to HTML date input format:
 *
 * YYYY-MM-DD
 */
export const navDateToISO = (navDate: string): string => {
  const parts = navDate.split("-");

  if (parts.length !== 3) {
    return "";
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

/**
 * Convert HTML date input format:
 *
 * YYYY-MM-DD
 *
 * to application NAV date:
 *
 * DD-MM-YYYY
 */
export const isoDateToNavDate = (isoDate: string): string => {
  const parts = isoDate.split("-");

  if (parts.length !== 3) {
    return "";
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

/**
 * Find the nearest available NAV on or before
 * the requested calendar date.
 *
 * This handles:
 *
 * - weekends
 * - market holidays
 * - current dates without NAV yet
 * - historical dates
 *
 * If the requested date is before all available
 * NAV data, the earliest available NAV is returned.
 */
export const getNearest = (dateString: string, data: NavType[]): NavType | undefined => {
  if (!dateString || data.length === 0) {
    return undefined;
  }

  const targetDate = parseAnyDate(dateString);

  if (Number.isNaN(targetDate.getTime())) {
    return undefined;
  }

  /*
   * Sort a copy so we never mutate the API data.
   */
  const sortedData = [...data].sort(
    (a, b) => parseNavDate(a.date).getTime() - parseNavDate(b.date).getTime()
  );

  /*
   * First look for the latest NAV that is
   * on or before the requested date.
   */
  let nearest: NavType | undefined;

  for (const nav of sortedData) {
    const navTime = parseNavDate(nav.date).getTime();

    if (navTime <= targetDate.getTime()) {
      nearest = nav;
    } else {
      break;
    }
  }

  /*
   * If requested date is before the earliest
   * available NAV, use the earliest available.
   */
  return nearest ?? sortedData[0];
};

export const sanctnum = (inputValue: string | number): number => {
  let intValue = typeof inputValue === "string" ? parseFloat(inputValue) : inputValue;

  intValue = isFinite(intValue) ? intValue : 0;

  return intValue;
};

export const calculateInterest = (
  p: string,
  r: string,
  m: string,
  f: string,
  t: string,
  tf: "m" | "y"
) => {
  const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);

  const mode = m === "100" ? tenure : sanctnum(m);

  const principal = sanctnum(p);

  const rate = sanctnum(r);

  const frequency = sanctnum(f);

  return sanctnum(
    principal * (1 + rate / frequency / 100) ** ((frequency * mode) / 12) - principal
  );
};

export const calculatePrincipal = (tgt: string, r: string, f: string, t: string, tf: "m" | "y") => {
  const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);

  const targetAmount = sanctnum(tgt);

  const rate = sanctnum(r);

  const frequency = sanctnum(f);

  return sanctnum(targetAmount / (1 + rate / frequency / 100) ** ((frequency * tenure) / 12));
};

export const checkNAYear = (d: INFLATION_TYPE, p: string): boolean =>
  d[p as "India" | "USA" | "EU" | "World"] !== "n/a";

export const calculateInflatedPrice = (
  principal: string,
  startYear: string,
  endYear: string,
  place: string,
  data: INFLATION_TYPE[]
): number[] => {
  principal = principal || "0";

  const stYear = parseInt(startYear);

  const edYear = parseInt(endYear);

  const splitData = data.filter((d) => {
    return d.Year >= stYear && d.Year < edYear && checkNAYear(d, place);
  });

  const updatedSplitData = splitData
    .map((d) => ({
      year: d.Year,
      ir: parseFloat(d[place as "India" | "USA" | "EU" | "World"].replace("%", "")),
    }))
    .reverse();

  let ia = parseFloat(principal);

  for (let i = 0; i < updatedSplitData.length; i++) {
    ia = ia * (1 + updatedSplitData[i].ir / 100);
  }

  let da = parseFloat(principal);

  for (let i = 0; i < updatedSplitData.length; i++) {
    da = da / (1 + updatedSplitData[i].ir / 100);
  }

  return [ia, da];
};

export const getCurrencySymbolAndLocale = (place: string) => {
  let sym: string;
  let locale: string;

  switch (place) {
    case "India":
      sym = "₹";
      locale = "en-IN";
      break;

    case "USA":
      sym = "$";
      locale = "en-US";
      break;

    case "EU":
      sym = "€";
      locale = "en-EU";
      break;

    default:
      sym = "₹";
      locale = "en-IN";
  }

  return [sym, locale];
};

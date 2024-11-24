import { INFLATION_TYPE, NavType } from "../types/types";

type DurationType = {
  startDate: string;
  endDate: string;
  type?: "Y" | "M" | "D" | "H" | "MM" | "S" | "MS";
  inclusive?: boolean;
};
export const getDuration = ({
  startDate,
  endDate,
  type,
  inclusive = true,
}: DurationType): number => {
  const sDate = new Date(startDate.split("-").reverse().join("-")).getTime();
  const eDate = new Date(endDate.split("-").reverse().join("-")).getTime();
  const dMS = inclusive ? eDate - sDate + 86400000 : eDate - sDate;

  let result = 0;
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
export const getDateAsISO = (minusDays = 0, date = new Date()) => {
  return new Date(date.getTime() - minusDays * 1000 * 60 * 60 * 24)
    .toISOString()
    .substring(0, 10);
};
export const getNearest = (dateString: string, data: NavType[]) => {
  let i = 0;
  const getNav = (dateStr: string) => {
    const drs = dateStr.split("-").reverse().join("-");
    const nav = data.find((d) => d.date === drs);

    if (nav || i === 5) return nav || data[data.length - 1];
    i++;
    return getNav(getDateAsISO(1, new Date(dateStr)));
  };
  return getNav(dateString);
};

export const sanctnum = (inputValue: string | number): number => {
  // parseFloat the input value
  let intValue =
    typeof inputValue === "string" ? parseFloat(inputValue) : inputValue;
  // check if the input value is finite or not
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
    principal * (1 + rate / frequency / 100) ** ((frequency * mode) / 12) -
      principal
  );
};

export const calculatePrincipal = (
  tgt: string,
  r: string,
  f: string,
  t: string,
  tf: "m" | "y"
) => {
  const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
  const targetAmount = sanctnum(tgt);
  const rate = sanctnum(r);
  const frequency = sanctnum(f);
  return sanctnum(
    targetAmount / (1 + rate / frequency / 100) ** ((frequency * tenure) / 12)
  );
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
      ir: parseFloat(
        d[place as "India" | "USA" | "EU" | "World"].replace("%", "")
      ),
    }))
    .reverse();
  let ia = parseFloat(principal);
  for (let i = 0; i < updatedSplitData.length; i++) {
    ia = ia * (1 + updatedSplitData[i]["ir"] / 100);
  }
  let da = parseFloat(principal);
  for (let i = 0; i < updatedSplitData.length; i++) {
    da = da / (1 + updatedSplitData[i]["ir"] / 100);
  }
  return [ia, da];
};
export const getCurrencySymbolAndLocale = (place: string) => {
  let sym = "₹";
  let locale = "en-IN";
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

import { ToWords } from "to-words";
import { IndianFormat } from "../data/currencyCodes";

const convertToWords = (values: number, i18N = "en-IN"): string => {
  const validLocales = [
    "en-AE",
    "en-BD",
    "en-GB",
    "en-GH",
    "en-IE",
    "en-IN",
    "en-MM",
    "en-MU",
    "en-NG",
    "en-NP",
    "en-US",
    "en-PH",
    "ee-EE",
    "fa-IR",
    "fr-BE",
    "fr-FR",
    "gu-IN",
    "hi-IN",
    "mr-IN",
    "nl-SR",
    "pt-BR",
    "tr-TR",
    "ko-KR",
  ];
  const localeCode = validLocales.includes(i18N)
    ? i18N
    : IndianFormat.includes(i18N)
    ? "en-IN"
    : "en-US";
  const toWords = new ToWords({ localeCode });
  return toWords.convert(values, { currency: false });
};
export const getCurrencySymbol = (locale: string, currency: string): string => {
  return (0)
    .toLocaleString(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, "")
    .trim();
};

export default convertToWords;

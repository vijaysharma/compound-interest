import { ToWords } from "to-words";

const convertToWords = (values, i18N = "en-IN") => {
  let toWords;
  switch (i18N) {
    case "en-IN":
      toWords = new ToWords({
        localeCode: "en-IN",
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: true,
          currencyOptions: {
            name: "Rupee",
            plural: "Rupees",
            symbol: "₹",
            fractionalUnit: {
              name: "Paisa",
              plural: "Paise",
              symbol: "",
            },
          },
        },
      });
      break;
    case "en-US":
      toWords = new ToWords({
        localeCode: "en-US",
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: true,
          currencyOptions: {
            name: "Dollar",
            plural: "Dollars",
            symbol: "$",
            fractionalUnit: {
              name: "Cent",
              plural: "Cents",
              symbol: "",
            },
          },
        },
      });
      break;
    case "en-EU":
      toWords = new ToWords({
        localeCode: "en-GB",
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: true,
          currencyOptions: {
            name: "Euro",
            plural: "Euros",
            symbol: "€",
            fractionalUnit: {
              name: "Euro Cent",
              plural: "Euro Cents",
              symbol: "",
            },
          },
        },
      });
      break;
    default:
      toWords = new ToWords({
        localeCode: "en-US",
        converterOptions: {
          currency: true,
          ignoreDecimal: false,
          ignoreZeroCurrency: false,
          doNotAddOnly: true,
          currencyOptions: {
            name: "Rupee",
            plural: "Rupees",
            symbol: "₹",
            fractionalUnit: {
              name: "Paisa",
              plural: "Paise",
              symbol: "",
            },
          },
        },
      });
  }
  return toWords.convert(values, { currency: false });
};
export const getCurrencySymbol = (locale, currency) => {
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

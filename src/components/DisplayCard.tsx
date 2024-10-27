import convertToWords from "../utilities/currency";
import { DisplayType } from "../types/types";

const DisplayCard = ({
  primaryAmount,
  title,
  secondaryInfo,
  colorClass,
  currencySymbol = "₹",
  locale = "en-IN",
}: DisplayType) => {
  return (
    <div className="stats stats-vertical border-solid border border-primary w-full text-center">
      <div className="stat">
        <div className="stat-title text-wrap text-base/[16px]">
          {title || "Balance amount"}
        </div>
        <div className={`stat-value text-3xl ${colorClass || "text-primary"}`}>
          <span className="text-lg">{currencySymbol}&nbsp;</span>
          {primaryAmount.toLocaleString(locale)}
        </div>
        <div className="stat-desc text-xs/[1] text-wrap">
          {convertToWords(primaryAmount, locale)}
        </div>
      </div>
      {secondaryInfo && (
        <div className="stat">
          <div className="stat-title text-wrap text-base/[12px]">
            {secondaryInfo.title}
          </div>
          <div className="stat-value text-2xl text-primary">
            <span className="text-lg">{currencySymbol}&nbsp;</span>
            {secondaryInfo.amount.toLocaleString(locale)}
          </div>
          <div className="stat-desc text-xs/[1] text-wrap">
            {convertToWords(secondaryInfo.amount, locale)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplayCard;

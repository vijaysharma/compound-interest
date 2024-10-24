import convertToWords from "../utilities/currency";

const FinalPaymentCard = ({
  finalAmount,
  title,
  additonalAmount,
  color,
  currencySymbol,
  locale = "en-IN",
}) => {
  return (
    <div className="stats stats-vertical border-solid border border-primary w-full text-center">
      <div className="stat">
        <div className="stat-title text-base/[12px]">
          {title || "Balance amount"}
        </div>
        <div className={`stat-value text-3xl ${color || "text-primary"}`}>
          {currencySymbol || "₹"}
          {finalAmount.toLocaleString(locale)}
        </div>
        <div className="stat-desc text-xs/[1] text-wrap">
          {convertToWords(finalAmount, locale)}
        </div>
      </div>
      {additonalAmount && (
        <div className="stat">
          <div className="stat-title text-base/[12px]">
            {additonalAmount.title}
          </div>
          <div className="stat-value text-2xl text-primary">
            {currencySymbol || "₹"}
            {additonalAmount.amount.toLocaleString(locale)}
          </div>
          <div className="stat-desc text-xs/[1] text-wrap">
            {convertToWords(additonalAmount.amount, locale)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalPaymentCard;

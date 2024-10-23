import convertToWords from "../utilities/currency";

const FinalPaymentCard = ({ finalAmount, title, additonalAmount, color }) => {
  return (
    <div className="stats stats-vertical border-solid border border-primary w-full text-center">
      <div className="stat">
        <div className="stat-title text-base/[12px]">
          {title || "Balance amount"}
        </div>
        <div className={`stat-value text-3xl ${color || "text-primary"}`}>
          ₹{finalAmount.toLocaleString("en-IN")}
        </div>
        <div className="stat-desc text-xs/[1] text-wrap">
          {convertToWords(finalAmount)}
        </div>
      </div>
      {additonalAmount && (
        <div className="stat">
          <div className="stat-title text-base/[12px]">
            {additonalAmount.title}
          </div>
          <div className="stat-value text-2xl text-primary">
            ₹{additonalAmount.amount.toLocaleString("en-IN")}
          </div>
          <div className="stat-desc text-xs/[1] text-wrap">
            {convertToWords(additonalAmount.amount)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalPaymentCard;

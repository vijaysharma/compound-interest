import convertToWords from "../utilities/currency";

const FinalPaymentCard = ({ finalAmount, additonalAmount }) => {
  return (
    <div className="stats stats-vertical border-solid border border-primary w-full text-center">
      <div className="stat">
        <div className="stat-title">Balance amount</div>
        <div className="stat-value text-primary">
          ₹{finalAmount.toLocaleString("en-IN")}
        </div>
        <div className="stat-desc text-wrap">{convertToWords(finalAmount)}</div>
      </div>
      {additonalAmount && (
        <div className="stat">
          <div className="stat-title">{additonalAmount.title}</div>
          <div className="stat-value text-primary">
            ₹{additonalAmount.amount.toLocaleString("en-IN")}
          </div>
          <div className="stat-desc text-wrap">
            {convertToWords(additonalAmount.amount)}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalPaymentCard;

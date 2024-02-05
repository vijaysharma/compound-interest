import convertToWords from "../utilities/currency";

const Interest = ({ payoutAmount }) => {
  return (
    <div className="stats shadow w-full text-center">
      <div className="stat">
        <div className="stat-value text-primary">
          ₹{payoutAmount.toLocaleString("en-IN")}
        </div>
        <div className="stat-desc">{convertToWords(payoutAmount)}</div>
      </div>
    </div>
  );
};

export default Interest;

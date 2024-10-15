import convertToWords from "../utilities/currency";

const Interest = ({ payoutAmount }) => {
  return (
    <div className="stats h-28 border-solid border border-primary w-full text-center">
      <div className="stat">
        <div className="stat-value text-primary">
          ₹{payoutAmount.toLocaleString("en-IN")}
        </div>
        <div className="stat-desc text-wrap">
          {convertToWords(payoutAmount)}
        </div>
      </div>
    </div>
  );
};

export default Interest;

import convertToWords from "../utilities/currency";

const Interest = ({ payoutAmount }) => {
  return (
    <div className="text-center bg-primary/25 p-4">
      <h2 className="text-2xl primary-content">
        ₹{payoutAmount.toLocaleString("en-IN")}
      </h2>
      <p className="text-sm primary-content">{convertToWords(payoutAmount)}</p>
    </div>
  );
};

export default Interest;

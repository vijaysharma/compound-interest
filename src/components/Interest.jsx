import convertToWords from "../utilities/currency";

const Interest = ({ payoutAmount }) => {
  return (
    <div className="text-center bg-primary/25 p-4">
      <h2 className="text-2xl text-primary-content">₹{payoutAmount}</h2>
      <p className="text-xs text-primary-content">
        {convertToWords(payoutAmount)}
      </p>
    </div>
  );
};

export default Interest;

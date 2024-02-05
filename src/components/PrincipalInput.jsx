import convertToWords from "../utilities/currency";
import { sanctnum } from "../utilities/numSanitity";

const PrincipalInput = ({ principalAmount, setPrincipalAmount }) => {
  return (
    <>
      <div className="form-control w-full">
        <div className="label">
          <span className="label-text text-sm/3">
            {convertToWords(sanctnum(principalAmount))}
          </span>
        </div>
        <div className="join mb-2 focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
          <strong className="join-item w-12 pt-2 bg-primary text-primary-content inline-block rounded-r-full border border-primary text-center align-middle text-lg">
            ₹
          </strong>
          <input
            type="number"
            placeholder="Type here"
            className="join-item input input-bordered input-primary w-full focus:outline-none"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(e.target.value)}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100000000}
          step={1000}
          value={sanctnum(principalAmount)}
          className="range range-primary range-sm mt-2"
          onChange={(e) => setPrincipalAmount(e.target.value)}
        />
        <div className="label">
          <span className="label-text">₹0.00</span>
          <span className="label-text">₹10,00,00,000.00</span>
        </div>
      </div>
    </>
  );
};

export default PrincipalInput;

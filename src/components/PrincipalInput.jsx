import { useState } from "react";
import HoriJoinedPill from "./HoriJoinedPill";
import convertToWords from "../utilities/currency";
import { sanctnum } from "../utilities/numSanitity";

const PrincipalInput = ({
  principalAmount,
  setPrincipalAmount,
  stepData,
  title,
  className,
}) => {
  const [sum, setSum] = useState("+");
  const setSumValue = (amnt) => {
    let total = parseInt(principalAmount);
    if (sum === "+") total += amnt;
    if (sum === "-") {
      total -= amnt;
      if (total <= 0) {
        total = 0;
        setPrincipalAmount(total);
        setSum("+");
        return;
      }
    }
    setPrincipalAmount(total);
  };
  return (
    <>
      <div className={`form-control w-full ${className}`}>
        <h5>{title || "Invested amount"}</h5>
        <div className="join mb-1 focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
          <strong className="join-item w-12 pt-2 bg-primary text-primary-content inline-block rounded-r-full border border-primary text-center align-middle text-lg">
            &nbsp;&nbsp;₹&nbsp;&nbsp;
          </strong>
          <input
            type="number"
            min="0"
            placeholder="Type here"
            className="join-item input input-bordered input-primary w-full focus:outline-none"
            value={principalAmount.toString().replace(/^0+/, "") || 0}
            onChange={(e) => setPrincipalAmount(Math.abs(e.target.value))}
          />
          <button
            className="join-item input-bordered input-primary btn"
            onClick={(e) => {
              setPrincipalAmount(0);
              setSum("+");
            }}
          >
            C
          </button>
          <button
            className={`join-item btn border-primary ${
              sum === "+" ? "btn-primary" : ""
            }`}
            onClick={(e) => setSum("+")}
          >
            +
          </button>
          <button
            className={`join-item btn border-primary ${
              sum === "-" ? "btn-primary" : ""
            }`}
            onClick={(e) => setSum("-")}
            disabled={principalAmount === 0}
          >
            -
          </button>
        </div>
        <div className="label-text text-primary text-sm/3 mb-1">
          {convertToWords(sanctnum(principalAmount))}
        </div>
        <HoriJoinedPill
          data={stepData}
          selectedValue={sum}
          updateSelectedValue={setSumValue}
        />
      </div>
    </>
  );
};

export default PrincipalInput;

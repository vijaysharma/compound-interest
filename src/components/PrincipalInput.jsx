import { useState } from "react";
import HoriJoinedPill from "./HoriJoinedPill";
import convertToWords from "../utilities/currency";
import { sanctnum } from "../utilities/numSanitity";

const PrincipalInput = ({
  principalAmount,
  setPrincipalAmount,
  currencySymbol,
  size,
  stepData,
  stepSize,
  type,
  setType,
  typeData,
  title,
  className,
  locale = "en-IN",
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
    <div className={`form-control w-full ${className}`}>
      {!type && <h5>{title || "Invested amount"}</h5>}
      <div className="focus-within:outline-primary rounded-lg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        {type && (
          <HoriJoinedPill
            data={typeData}
            selectedValue={type}
            updateSelectedValue={setType}
            size={size || "sm"}
            styleClass="rounded-bl-none rounded-br-none border-b-0"
          />
        )}
        <div className="join mb-0 w-full">
          <div
            className={`join-item w-12 pt-2 bg-primary text-primary-content border border-primary text-center align-middle rounded-bl-none ${
              type ? "rounded-tl-none" : ""
            } ${size ? `text-${size}` : "text-sm"}`}
          >
            &nbsp;&nbsp;{currencySymbol || "₹"}&nbsp;&nbsp;
          </div>
          <input
            type="number"
            min="0"
            placeholder="Type here"
            className={`join-item grow input input-bordered input-primary w-full focus:outline-none ${
              size ? `input-${size}` : "input-sm"
            }`}
            value={principalAmount.toString().replace(/^0+/, "") || 0}
            onChange={(e) => setPrincipalAmount(Math.abs(e.target.value))}
          />
          <button
            className={`join-item input-bordered input-primary btn grow ${
              size ? `btn-${size}` : "btn-sm"
            }`}
            onClick={(e) => {
              setPrincipalAmount(0);
              setSum("+");
            }}
          >
            C
          </button>
          <button
            className={`join-item btn border-primary btn grow ${
              sum === "+" ? "btn-primary" : ""
            } ${size ? `btn-${size}` : "btn-sm"}`}
            onClick={(e) => setSum("+")}
          >
            +
          </button>
          <button
            className={`join-item btn border-primary/100 btn grow rounded-br-none ${
              sum === "-" ? "btn-primary" : ""
            } ${type && "rounded-tr-none"} ${size ? `btn-${size}` : "btn-sm"}`}
            onClick={(e) => setSum("-")}
            disabled={principalAmount === 0}
          >
            -
          </button>
        </div>
        <HoriJoinedPill
          data={stepData}
          selectedValue={sum}
          size={stepSize}
          updateSelectedValue={setSumValue}
          styleClass="rounded-tl-none rounded-tr-none border-t-0"
        />
      </div>
      <div className="label-text text-primary text-sm/3 mt-2">
        {convertToWords(sanctnum(principalAmount), locale)}
      </div>
    </div>
  );
};

export default PrincipalInput;

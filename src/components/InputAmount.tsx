import { useState } from "react";
import JoinedButtonGroup from "./JoinedButtonGroup";
import convertToWords from "../utilities/currency";
import { sanctnum } from "../utilities/numSanitity";
import { InputType } from "../types/types";

const InputAmount = ({
  inputAmount,
  setInputAmount,
  currencySymbol = "₹",
  typeSizePrefix = "sm",
  stepData,
  stepSizePrefix,
  type,
  setType,
  typeData,
  title = "Invested amount",
  className,
  locale = "en-IN",
}: InputType) => {
  const [sum, setSum] = useState("+");
  const setSumValue = (amnt: string): void => {
    const initialAmount = parseInt(amnt);
    let total = parseInt(inputAmount);
    if (sum === "+") total += initialAmount;
    if (sum === "-") {
      total -= initialAmount;
      if (total <= 0) {
        total = 0;
        setInputAmount(total.toString());
        setSum("+");
        return;
      }
    }
    setInputAmount(total.toString());
  };
  return (
    <div className={`form-control w-full ${className}`}>
      {!type && <h5>{title}</h5>}
      <div className="focus-within:outline-primary rounded-lg focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        {type && typeData && setType && (
          <JoinedButtonGroup
            data={typeData}
            selectedValue={type}
            updateSelectedValue={setType}
            sizePrefix={typeSizePrefix}
            btnClass="rounded-bl-none rounded-br-none border-b-0"
          />
        )}
        <div className="join mb-0 w-full">
          <div
            className={`join-item w-12 pt-2 bg-primary text-primary-content border border-primary text-center align-middle rounded-bl-none ${
              type ? "rounded-tl-none" : ""
            } ${typeSizePrefix ? `text-${typeSizePrefix}` : "text-sm"}`}
          >
            &nbsp;&nbsp;{currencySymbol || "₹"}&nbsp;&nbsp;
          </div>
          <input
            type="number"
            min="0"
            placeholder="Type here"
            className={`join-item grow input input-bordered input-primary w-full focus:outline-none ${
              typeSizePrefix ? `input-${typeSizePrefix}` : "input-sm"
            }`}
            value={inputAmount?.replace(/^0+/, "") || 0}
            onChange={(e) => setInputAmount(e.target?.value)}
          />
          <button
            className={`join-item input-bordered input-primary btn grow ${
              typeSizePrefix ? `btn-${typeSizePrefix}` : "btn-sm"
            }`}
            onClick={() => {
              setInputAmount("0");
              setSum("+");
            }}
          >
            C
          </button>
          <button
            className={`join-item btn border-primary btn grow ${
              sum === "+" ? "btn-primary" : ""
            } ${typeSizePrefix ? `btn-${typeSizePrefix}` : "btn-sm"}`}
            onClick={() => setSum("+")}
          >
            +
          </button>
          <button
            className={`join-item btn border-primary/100 btn grow rounded-br-none ${
              sum === "-" ? "btn-primary" : ""
            } ${type && "rounded-tr-none"} ${
              typeSizePrefix ? `btn-${typeSizePrefix}` : "btn-sm"
            }`}
            onClick={() => setSum("-")}
            disabled={inputAmount === "0"}
          >
            -
          </button>
        </div>
        <JoinedButtonGroup
          data={stepData}
          selectedValue={sum}
          sizePrefix={stepSizePrefix}
          updateSelectedValue={setSumValue}
          btnClass="rounded-tl-none rounded-tr-none border-t-0"
        />
      </div>
      <div className="label-text text-primary text-sm/3 mt-2">
        {convertToWords(sanctnum(inputAmount), locale)}
      </div>
    </div>
  );
};

export default InputAmount;

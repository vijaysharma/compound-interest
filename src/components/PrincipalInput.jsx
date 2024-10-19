import { useState } from "react";
import convertToWords from "../utilities/currency";
import { sanctnum } from "../utilities/numSanitity";

const PrincipalInput = ({ principalAmount, setPrincipalAmount }) => {
  const [sum, setSum] = useState("+");
  const setSumValue = (amnt) => {
    let total = parseInt(principalAmount);
    if (sum === "+") total += amnt;
    if (sum === "-") {
      total -= amnt;
      if (total < 0) {
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
            min="0"
            placeholder="Type here"
            className="join-item input input-bordered input-primary w-full focus:outline-none"
            value={principalAmount}
            onChange={(e) => setPrincipalAmount(Math.abs(e.target.value))}
          />
          <button
            className="join-item input-bordered input-primary btn"
            onClick={(e) => setPrincipalAmount(0)}
          >
            0
          </button>
          <input
            className="join-item input-bordered input-primary btn"
            type="radio"
            name="sum"
            aria-label="+ Add"
            value={"+"}
            checked={sum === "+"}
            onChange={(e) => setSum(e.target.value)}
          />
          <input
            className="join-item input-bordered input-primary btn"
            type="radio"
            name="sum"
            aria-label="- Subtract"
            value={"-"}
            disabled={principalAmount === 0}
            checked={sum === "-"}
            onChange={(e) => setSum(e.target.value)}
          />
        </div>
        <div className="join">
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(100000000)}
          >
            10Cr
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(20000000)}
          >
            2Cr
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(5000000)}
          >
            50L
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(2000000)}
          >
            20L
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(1000000)}
          >
            10L
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(200000)}
          >
            2L
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(100000)}
          >
            1L
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(50000)}
          >
            50K
          </button>
          <button
            className="join-item btn border-primary"
            onClick={() => setSumValue(10000)}
          >
            10K
          </button>
        </div>
      </div>
    </>
  );
};

export default PrincipalInput;

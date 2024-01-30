import { useEffect, useState } from "react";
import PrincipalInput from "./PrincipalInput";
import ROITenureInput from "./ROITenureInput";
import PaymentMode from "./PaymentMode";
import Interest from "./Interest";
import { sanctnum } from "../utilities/numSanitity";
import Compounded from "./Compounded";

const Inputs = () => {
  const [pa, setPa] = useState(100000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 24,
  });
  const [mode, setMode] = useState(1);
  const [frequency, setFrequency] = useState(4);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const calculateInterest = (p, r, m, f, t) => {
    m = m === 100 ? t : m;
    p = sanctnum(p);
    r = sanctnum(r);
    m = sanctnum(m);
    f = sanctnum(f);
    t = sanctnum(t);
    return sanctnum(p * (1 + r / f / 100) ** ((f * m) / 12) - p);
  };
  useEffect(() => {
    const interestAmount = calculateInterest(
      pa,
      rt.roi,
      mode,
      frequency,
      rt.tenure
    );
    console.log("aa==", interestAmount);
    setPayoutAmount(Math.round(interestAmount));
  }, [pa, rt, mode, frequency]);
  return (
    <>
      <h2 className="text-lg text-center p-4 bg-primary/15">
        <b>Compound Interest</b>
      </h2>
      <div className="p-4 w-full max-w-lg bg-primary/5 mx-auto">
        <PrincipalInput principalAmount={pa} setPrincipalAmount={setPa} />
        <ROITenureInput rt={rt} setRt={setRt} />
        <Compounded fr={frequency} setFr={setFrequency} />
        <br />
        <PaymentMode mode={mode} setMode={setMode} />
        <br />
        <Interest payoutAmount={payoutAmount} />
      </div>
    </>
  );
};

export default Inputs;

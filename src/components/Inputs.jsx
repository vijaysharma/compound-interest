import { useEffect, useState } from "react";
import PrincipalInput from "./PrincipalInput";
import ROITenureInput from "./ROITenureInput";
import PaymentMode from "./PaymentMode";
import Interest from "./Interest";

const Inputs = () => {
  const [pa, setPa] = useState(100000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 24,
  });
  const [mode, setMode] = useState(1);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const calculateInterest = (p, r, m, t) => {
    m = m === 100 ? t : m;
    return p * Math.pow(1 + r / (100 * 12), (12 * m) / 12) - p;
  };
  useEffect(() => {
    const interestAmount = calculateInterest(pa, rt.roi, mode, rt.tenure);
    setPayoutAmount(Math.round(interestAmount));
  }, [pa, rt, mode]);
  return (
    <>
      <h2 className="text-lg text-center p-4 bg-primary/15">
        <b>Compound Interest</b>
      </h2>
      <div className="p-4 w-full max-w-lg bg-primary/5">
        <PrincipalInput principalAmount={pa} setPrincipalAmount={setPa} />
        <ROITenureInput rt={rt} setRt={setRt} />
        <PaymentMode mode={mode} setMode={setMode} />
        <br />
        <Interest payoutAmount={payoutAmount} />
      </div>
    </>
  );
};

export default Inputs;

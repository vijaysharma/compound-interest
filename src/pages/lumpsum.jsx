import { useEffect, useState } from "react";
import Compounded from "../components/Compounded";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PaymentMode from "../components/PaymentMode";
import PrincipalInput from "../components/PrincipalInput";
import RateOfInterest from "../components/RateOfInterest";
import Tenure from "../components/Tenure";
import { sanctnum } from "../utilities/numSanitity";

const Lumpsum = () => {
  const [pa, setPa] = useState(100000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 24,
    tenureFormat: "m",
  });
  const [mode, setMode] = useState(1);
  const [frequency, setFrequency] = useState(4);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const calculateInterest = (p, r, m, f, t, tf) => {
    t = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    m = m === 100 ? t : m;
    p = sanctnum(p);
    r = sanctnum(r);
    m = sanctnum(m);
    f = sanctnum(f);

    return sanctnum(p * (1 + r / f / 100) ** ((f * m) / 12) - p);
  };
  useEffect(() => {
    const interestAmount = calculateInterest(
      pa,
      rt.roi,
      mode,
      frequency,
      rt.tenure,
      rt.tenureFormat
    );
    mode === 100
      ? setPayoutAmount(Math.round(interestAmount) + Math.round(pa))
      : setPayoutAmount(Math.round(interestAmount));
  }, [pa, rt, mode, frequency]);
  return (
    <>
      <PrincipalInput
        className="mb-3"
        principalAmount={pa}
        setPrincipalAmount={setPa}
      />
      <RateOfInterest className="mb-3" rt={rt} setRt={setRt} />
      <Tenure className="mb-3" rt={rt} setRt={setRt} />
      <Compounded className="mb-3" fr={frequency} setFr={setFrequency} />
      <PaymentMode className="mb-3" mode={mode} setMode={setMode} />
      <FinalPaymentCard finalAmount={payoutAmount} />
    </>
  );
};
export default Lumpsum;

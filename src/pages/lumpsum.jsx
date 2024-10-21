import { useEffect, useState } from "react";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PrincipalInput from "../components/PrincipalInput";
import RateOfInterest from "../components/RateOfInterest";
import Tenure from "../components/Tenure";
import { sanctnum } from "../utilities/numSanitity";
import HoriJoinedPill from "../components/HoriJoinedPill";

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
      <HoriJoinedPill
        className="mb-3"
        data={[
          { id: "fr1", value: 12, title: "Monthly" },
          { id: "fr2", value: 4, title: "Quarterly" },
          { id: "fr3", value: 1, title: "Yearly" },
        ]}
        selectedValue={frequency}
        updateSelectedValue={setFrequency}
        title="Compounded"
      />
      <HoriJoinedPill
        className="mb-3"
        data={[
          { id: "pm1", value: 1, title: "Monthly" },
          { id: "pm2", value: 3, title: "Quarterly" },
          { id: "pm3", value: 12, title: "Yearly" },
          { id: "pm4", value: 100, title: "Cumulative" },
        ]}
        selectedValue={mode}
        updateSelectedValue={setMode}
        title="Payout Mode"
      />
      <FinalPaymentCard finalAmount={payoutAmount} />
    </>
  );
};
export default Lumpsum;

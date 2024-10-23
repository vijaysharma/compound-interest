import { useEffect, useState } from "react";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PrincipalInput from "../components/PrincipalInput";
import RateOfInterest from "../components/RateOfInterest";
import Tenure from "../components/Tenure";
import { sanctnum } from "../utilities/numSanitity";
import HoriJoinedPill from "../components/HoriJoinedPill";

const Lumpsum = () => {
  const [pa, setPa] = useState(3000000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 2,
    tenureFormat: "y",
  });
  const [mode, setMode] = useState(1);
  const [frequency, setFrequency] = useState(4);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [invType, setInvType] = useState("inv");
  const stepData = [
    { id: "p1", value: 50000000, title: "5Cr" },
    { id: "p2", value: 5000000, title: "50L" },
    { id: "p3", value: 500000, title: "5L" },
    { id: "p4", value: 50000, title: "50K" },
    { id: "p5", value: 5000, title: "5K" },
    { id: "p6", value: 500, title: "500" },
    { id: "p7", value: 50, title: "50" },
  ];
  const calculateInterest = (p, r, m, f, t, tf) => {
    t = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    m = m === 100 ? t : m;
    p = sanctnum(p);
    r = sanctnum(r);
    m = sanctnum(m);
    f = sanctnum(f);
    return sanctnum(p * (1 + r / f / 100) ** ((f * m) / 12) - p);
  };

  const calculatePrincipal = (tgt, r, f, t, tf) => {
    t = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    tgt = sanctnum(tgt);
    r = sanctnum(r);
    f = sanctnum(f);
    return sanctnum(tgt / (1 + r / f / 100) ** ((f * t) / 12));
  };

  useEffect(() => {
    const finalAmount =
      invType === "tgt"
        ? calculatePrincipal(pa, rt.roi, frequency, rt.tenure, rt.tenureFormat)
        : calculateInterest(
            pa,
            rt.roi,
            mode,
            frequency,
            rt.tenure,
            rt.tenureFormat
          );
    mode === 100 && invType === "inv"
      ? setPayoutAmount(Math.round(finalAmount) + Math.round(pa))
      : setPayoutAmount(Math.round(finalAmount));
  }, [pa, rt, mode, invType, frequency]);
  return (
    <>
      <HoriJoinedPill
        className="mb-3"
        data={[
          { id: "ty1", value: "inv", title: "One time amount" },
          { id: "ty2", value: "tgt", title: "Target amount" },
        ]}
        selectedValue={invType}
        updateSelectedValue={setInvType}
      />
      <PrincipalInput
        className="mb-3"
        principalAmount={pa}
        setPrincipalAmount={setPa}
        stepData={stepData}
        stepSize={"sm"}
        title={invType === "tgt" && "Target amount"}
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
      {invType === "inv" && (
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
      )}
      <FinalPaymentCard
        finalAmount={payoutAmount}
        title={invType === "tgt" && "Lumpsum amount required"}
      />
    </>
  );
};
export default Lumpsum;

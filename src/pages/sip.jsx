import { useEffect, useState } from "react";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PrincipalInput from "../components/PrincipalInput";
import RateOfInterest from "../components/RateOfInterest";
import Tenure from "../components/Tenure";
import { sanctnum } from "../utilities/numSanitity";
import HoriJoinedPill from "../components/HoriJoinedPill";

const SIP = () => {
  const [pa, setPa] = useState(10000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 5,
    tenureFormat: "y",
  });
  const [type, setType] = useState("rd");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [invType, setInvType] = useState("my");
  const stepData = [
    { id: "p1", value: 50000000, title: "5Cr" },
    { id: "p2", value: 5000000, title: "50L" },
    { id: "p3", value: 500000, title: "5L" },
    { id: "p4", value: 50000, title: "50K" },
    { id: "p5", value: 5000, title: "5K" },
    { id: "p6", value: 500, title: "500" },
    { id: "p7", value: 50, title: "50" },
  ];
  const calculate = (p, r, t, tf, type, invType) => {
    t = tf === "y" ? sanctnum(t) : sanctnum(t) / 12;
    p = sanctnum(p);
    r = sanctnum(r / 100);
    let n = type === "sip" ? 12 : 4;
    let totalMonths = t * 12;
    let fa = 0;

    if (type === "sip") {
      // SIP
      if (invType === "my") {
        for (let i = 1; i <= t * n; i++) {
          fa += p * Math.pow(1 + r / n, n * (i / 12));
        }
      } else {
        let sum = 0;
        for (let i = 1; i <= t * n; i++) {
          sum += Math.pow(1 + r / n, n * (i / 12));
        }
        fa = p / sum;
      }
    } else {
      // RD
      if (invType === "my") {
        for (let i = 1; i <= totalMonths; i++) {
          const monthsLeft = totalMonths - i + 1;
          const yearsLeft = monthsLeft / 12;
          fa += p * Math.pow(1 + r / n, n * yearsLeft);
        }
      } else {
        let sum = 0;
        for (let i = 1; i <= totalMonths; i++) {
          const monthsLeft = totalMonths - i + 1;
          const yearsLeft = monthsLeft / 12;
          sum += Math.pow(1 + r / n, n * yearsLeft);
        }
        fa = p / sum;
      }
    }
    return sanctnum(fa);
  };
  useEffect(() => {
    const maturityAmount = calculate(
      pa,
      rt.roi,
      rt.tenure,
      rt.tenureFormat,
      type,
      invType
    );
    setPayoutAmount(Math.ceil(maturityAmount));
  }, [pa, rt, type, invType]);
  return (
    <>
      <HoriJoinedPill
        className="mb-3"
        data={[
          { id: "ty1", value: "my", title: "Monthly amount" },
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
        title={invType === "my" ? "Monthly Investment" : "Target amount"}
      />
      <RateOfInterest className="mb-3" rt={rt} setRt={setRt} />
      <Tenure className="mb-3" rt={rt} setRt={setRt} />
      <HoriJoinedPill
        className="mb-3"
        data={[
          { id: "t1", value: "rd", title: "RD" },
          { id: "t2", value: "sip", title: "SIP" },
        ]}
        selectedValue={type}
        updateSelectedValue={setType}
      />
      <FinalPaymentCard
        finalAmount={payoutAmount}
        title={
          invType === "tgt" ? "Monthly investment required" : "Maturity amount"
        }
      />
    </>
  );
};
export default SIP;

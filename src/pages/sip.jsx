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
  const calculate = (p, r, t, tf, type) => {
    t = tf === "y" ? sanctnum(t) : sanctnum(t) / 12;
    p = sanctnum(p);
    r = sanctnum(r / 100);
    let n = type === "sip" ? 12 : 4;
    let totalMonths = t * 12;
    let fa = 0;

    if (type === "sip") {
      // SIP
      for (let i = 1; i <= t * n; i++) {
        fa += p * Math.pow(1 + r / n, n * (i / 12));
      }
    } else {
      // RD
      for (let i = 1; i <= totalMonths; i++) {
        const monthsLeft = totalMonths - i + 1;
        const yearsLeft = monthsLeft / 12;
        fa += p * Math.pow(1 + r / n, n * yearsLeft);
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
      type
    );
    setPayoutAmount(Math.round(maturityAmount));
  }, [pa, rt, type]);
  return (
    <>
      <PrincipalInput
        className="mb-3"
        principalAmount={pa}
        title="Monthly Investment"
        setPrincipalAmount={setPa}
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
      <FinalPaymentCard finalAmount={payoutAmount} title="Maturity Amount" />
    </>
  );
};
export default SIP;

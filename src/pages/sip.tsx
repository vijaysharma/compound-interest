import { useEffect, useState } from "react";
import DisplayCard from "../components/DisplayCard.tsx";
import InputAmount from "../components/InputAmount.tsx";
import RateOfInterest from "../components/RateOfInterest.tsx";
import Tenure from "../components/Tenure.tsx";
import { sanctnum } from "../utilities/numSanitity.ts";
import JoinedButtonGroup from "../components/JoinedButtonGroup.tsx";
import { RT } from "../types/types.ts";

const SIP = ({ className, title }: { className?: string; title?: string }) => {
  const [pa, setPa] = useState("10000");
  const [rt, setRt] = useState<RT>({
    roi: "7.1",
    tenure: "5",
    tenureFormat: "y",
  });
  const [type, setType] = useState("rd");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [invType, setInvType] = useState("my");
  const stepData = [
    { id: "p1", value: "50000000", title: "5Cr" },
    { id: "p2", value: "5000000", title: "50L" },
    { id: "p3", value: "500000", title: "5L" },
    { id: "p4", value: "50000", title: "50K" },
    { id: "p5", value: "5000", title: "5K" },
    { id: "p6", value: "500", title: "500" },
    { id: "p7", value: "50", title: "50" },
  ];
  const calculate = (
    p: string,
    t: string,
    tf: string,
    type: string,
    invType: string,
    r?: string
  ) => {
    const tenure = tf === "y" ? sanctnum(t) : sanctnum(t) / 12;
    const principal = sanctnum(p);
    const rate = r ? sanctnum(r) / 100 : 0;
    const n = type === "sip" ? 12 : 4;
    const totalMonths = tenure * 12;
    let fa = 0;

    if (type === "sip") {
      // SIP
      if (invType === "my") {
        for (let i = 1; i <= tenure * n; i++) {
          fa += principal * Math.pow(1 + rate / n, n * (i / 12));
        }
      } else {
        let sum = 0;
        for (let i = 1; i <= tenure * n; i++) {
          sum += Math.pow(1 + rate / n, n * (i / 12));
        }
        fa = principal / sum;
      }
    } else {
      // RD
      if (invType === "my") {
        for (let i = 1; i <= totalMonths; i++) {
          const monthsLeft = totalMonths - i + 1;
          const yearsLeft = monthsLeft / 12;
          fa += principal * Math.pow(1 + rate / n, n * yearsLeft);
        }
      } else {
        let sum = 0;
        for (let i = 1; i <= totalMonths; i++) {
          const monthsLeft = totalMonths - i + 1;
          const yearsLeft = monthsLeft / 12;
          sum += Math.pow(1 + rate / n, n * yearsLeft);
        }
        fa = principal / sum;
      }
    }
    return sanctnum(fa);
  };
  useEffect(() => {
    const maturityAmount = calculate(
      pa,
      rt.tenure,
      rt.tenureFormat,
      type,
      invType,
      rt.roi
    );
    setPayoutAmount(Math.ceil(maturityAmount));
  }, [pa, rt, type, invType]);
  return (
    <div className={className}>
      {title && <h5>{title}</h5>}
      <InputAmount
        className="mb-3"
        inputAmount={pa}
        setInputAmount={setPa}
        type={invType}
        setType={setInvType}
        typeData={[
          { id: "ty1", value: "my", title: "Monthly amount" },
          { id: "ty2", value: "tgt", title: "Target amount" },
        ]}
        stepData={stepData}
        stepSizePrefix={"sm"}
        title={invType === "my" ? "Monthly Investment" : "Target amount"}
      />
      <RateOfInterest className="mb-3" rt={rt} setRt={setRt} />
      <Tenure className="mb-3" rt={rt} setRt={setRt} />
      <JoinedButtonGroup
        className="mb-3"
        data={[
          { id: "t1", value: "rd", title: "RD" },
          { id: "t2", value: "sip", title: "SIP" },
        ]}
        sizePrefix="sm"
        selectedValue={type}
        updateSelectedValue={setType}
      />
      <DisplayCard
        primaryAmount={payoutAmount}
        title={
          invType === "tgt" ? "Monthly investment required" : "Maturity amount"
        }
      />
    </div>
  );
};
export default SIP;

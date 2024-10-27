import { useEffect, useState } from "react";
import DisplayCard from "../components/DisplayCard.tsx";
import InputAmount from "../components/InputAmount.tsx";
import RateOfInterest from "../components/RateOfInterest.tsx";
import Tenure from "../components/Tenure.tsx";
import { sanctnum } from "../utilities/numSanitity.ts";
import JoinedButtonGroup from "../components/JoinedButtonGroup.tsx";
import { ButtonDataType, RT } from "../types/types.ts";

const Lumpsum = () => {
  const [pa, setPa] = useState("3000000");
  const [rt, setRt] = useState<RT>({
    roi: "7.1",
    tenure: "2",
    tenureFormat: "y",
  });
  const [mode, setMode] = useState("1");
  const [frequency, setFrequency] = useState("4");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [invType, setInvType] = useState("inv");
  const stepData: ButtonDataType[] = [
    { id: "p1", value: "50000000", title: "5Cr" },
    { id: "p2", value: "5000000", title: "50L" },
    { id: "p3", value: "500000", title: "5L" },
    { id: "p4", value: "50000", title: "50K" },
    { id: "p5", value: "5000", title: "5K" },
    { id: "p6", value: "500", title: "500" },
    { id: "p7", value: "50", title: "50" },
  ];
  const calculateInterest = (
    p: string,
    r: string,
    m: string | number,
    f: string,
    t: string,
    tf: "m" | "y"
  ) => {
    const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    let mode = m === 100 ? tenure : m;
    const principal = sanctnum(p);
    const rate = sanctnum(r);
    mode = sanctnum(m);
    const frequency = sanctnum(f);
    return sanctnum(
      principal * (1 + rate / frequency / 100) ** ((frequency * mode) / 12) -
        principal
    );
  };

  const calculatePrincipal = (
    tgt: string,
    r: string,
    f: string,
    t: string,
    tf: "m" | "y"
  ) => {
    const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    const targetAmount = sanctnum(tgt);
    const rate = sanctnum(r);
    const frequency = sanctnum(f);
    return sanctnum(
      targetAmount / (1 + rate / frequency / 100) ** ((frequency * tenure) / 12)
    );
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
    if (mode === "100" && invType === "inv") {
      setPayoutAmount(Math.round(finalAmount) + Math.round(parseFloat(pa)));
    } else {
      setPayoutAmount(Math.round(finalAmount));
    }
  }, [pa, rt, mode, invType, frequency]);
  return (
    <>
      <InputAmount
        className="mb-3"
        inputAmount={pa}
        setInputAmount={setPa}
        type={invType}
        setType={setInvType}
        typeData={[
          { id: "ty1", value: "inv", title: "One time amount" },
          { id: "ty2", value: "tgt", title: "Target amount" },
        ]}
        stepData={stepData}
        stepSizePrefix={"sm"}
        title={invType === "tgt" ? "Target amount" : ""}
      />
      <RateOfInterest className="mb-3" rt={rt} setRt={setRt} />
      <Tenure className="mb-3" rt={rt} setRt={setRt} />
      <JoinedButtonGroup
        className="mb-3"
        data={[
          { id: "fr1", value: "12", title: "Monthly" },
          { id: "fr2", value: "4", title: "Quarterly" },
          { id: "fr3", value: "1", title: "Yearly" },
        ]}
        sizePrefix="sm"
        selectedValue={frequency}
        updateSelectedValue={setFrequency}
        title="Compounded"
      />
      {invType === "inv" && (
        <JoinedButtonGroup
          className="mb-3"
          data={[
            { id: "pm1", value: "1", title: "Monthly" },
            { id: "pm2", value: "3", title: "Quarterly" },
            { id: "pm3", value: "12", title: "Yearly" },
            { id: "pm4", value: "100", title: "Cumulative" },
          ]}
          sizePrefix="sm"
          selectedValue={mode}
          updateSelectedValue={setMode}
          title="Payout Mode"
        />
      )}
      <DisplayCard
        primaryAmount={payoutAmount}
        title={invType === "tgt" ? "Lumpsum amount required" : ""}
      />
    </>
  );
};
export default Lumpsum;

import { useEffect, useState } from "react";
import ROI from "../components/ROI.tsx";
import Tenure from "../components/Tenure.tsx";
import DisplayCard from "../components/DisplayCard.tsx";
import InputAmount from "../components/InputAmount.tsx";
import { sanctnum } from "../utilities/numSanitity.ts";
import { RT } from "../types/types.ts";

const SWP = () => {
  const [pa, setPa] = useState("35000000");
  const [rt, setRt] = useState("10");
  const [irt, setIRt] = useState("7");
  const [t, setT] = useState<RT>({
    tenure: "40",
    tenureFormat: "y",
  });
  const [wa, setWa] = useState("120000");
  const [remainingAmount, setRAmount] = useState("0");
  const [lwa, setLwa] = useState("0");
  const invStepData = [
    { id: "ip1", value: "50000000", title: "5Cr" },
    { id: "ip2", value: "5000000", title: "50L" },
    { id: "ip3", value: "500000", title: "5L" },
    { id: "ip4", value: "50000", title: "50K" },
    { id: "ip5", value: "5000", title: "5K" },
    { id: "ip6", value: "500", title: "500" },
    { id: "ip7", value: "50", title: "50" },
  ];
  const wdStepData = [
    { id: "wp1", value: "1000000", title: "10L" },
    { id: "wp2", value: "100000", title: "1L" },
    { id: "wp3", value: "50000", title: "50K" },
    { id: "wp4", value: "10000", title: "10K" },
    { id: "wp5", value: "1000", title: "1K" },
    { id: "wp6", value: "100", title: "100" },
    { id: "wp7", value: "10", title: "10" },
  ];
  const calculateRemainingAmount = (
    p: string,
    r: string,
    ir: string,
    t: string,
    tf: string,
    w: string
  ) => {
    const tenure = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    const principal = sanctnum(p);
    const rate = sanctnum(r);
    const withdrawal = sanctnum(w);
    const inflationRate = sanctnum(ir);
    let fa = principal;
    let wa = withdrawal;
    if (tenure <= 0) setLwa("0");
    for (let i = 1; i <= tenure; i++) {
      wa =
        inflationRate && i > 12 && (i - 1) % 12 === 0
          ? wa * (1 + inflationRate / 100)
          : wa;
      fa = fa * (1 + rate / 100) ** (1 / 12) - wa;
    }
    return [`${wa}`, `${fa}`];
  };
  useEffect(() => {
    const [withdrawalAmount, remainingAmount] = calculateRemainingAmount(
      pa,
      rt,
      irt,
      t.tenure,
      t.tenureFormat,
      wa
    );
    setLwa(withdrawalAmount);
    setRAmount(remainingAmount);
  }, [pa, rt, irt, t, wa]);
  return (
    <>
      <InputAmount
        inputAmount={pa}
        setInputAmount={setPa}
        className="mb-3"
        stepData={invStepData}
        stepSizePrefix={"sm"}
      />
      <InputAmount
        className="mb-3"
        inputAmount={wa}
        setInputAmount={setWa}
        stepData={wdStepData}
        stepSizePrefix={"sm"}
        title="Withdrawal amount per month"
      />
      <ROI
        className="mb-3"
        rt={rt}
        setRt={setRt}
        title={"Expected return rate per annum (%)"}
      />
      <ROI
        className="mb-3"
        rt={irt}
        setRt={setIRt}
        title={"Inflation per annum (%)"}
      />
      <Tenure className="mb-3" rt={t} setRt={setT} />
      <DisplayCard
        colorClass={`${remainingAmount < pa ? "text-error" : "text-primary"}`}
        primaryAmount={parseFloat(remainingAmount)}
        secondaryInfo={{
          title: "Last monthly withdrawal",
          amount: parseFloat(lwa),
        }}
      />
    </>
  );
};

export default SWP;
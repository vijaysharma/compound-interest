import { useEffect, useState } from "react";
import ROI from "../components/ROI";
import Tenure from "../components/Tenure";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PrincipalInput from "../components/PrincipalInput";
import { sanctnum } from "../utilities/numSanitity";

const SWP = () => {
  const [pa, setPa] = useState(35000000);
  const [rt, setRt] = useState(10);
  const [irt, setIRt] = useState(7);
  const [t, setT] = useState({
    tenure: 40,
    tenureFormat: "y",
  });
  const [wa, setWa] = useState(120000);
  const [remainingAmount, setRAmount] = useState(0);
  const [lwa, setLwa] = useState(0);
  const invStepData = [
    { id: "ip1", value: 50000000, title: "5Cr" },
    { id: "ip2", value: 5000000, title: "50L" },
    { id: "ip3", value: 500000, title: "5L" },
    { id: "ip4", value: 50000, title: "50K" },
    { id: "ip5", value: 5000, title: "5K" },
    { id: "ip6", value: 500, title: "500" },
    { id: "ip7", value: 50, title: "50" },
  ];
  const wdStepData = [
    { id: "wp1", value: 1000000, title: "10L" },
    { id: "wp2", value: 100000, title: "1L" },
    { id: "wp3", value: 50000, title: "50K" },
    { id: "wp4", value: 10000, title: "10K" },
    { id: "wp5", value: 1000, title: "1K" },
    { id: "wp6", value: 100, title: "100" },
    { id: "wp7", value: 10, title: "10" },
  ];
  const calculateRemainingAmount = (p, r, ir, t, tf, w) => {
    t = tf === "y" ? sanctnum(t) * 12 : sanctnum(t);
    p = sanctnum(p);
    r = sanctnum(r);
    w = sanctnum(w);
    ir = sanctnum(ir);
    let fa = p;
    let wa = w;
    if (t <= 0) setLwa(Math.round(0));
    for (let i = 1; i <= t; i++) {
      wa = ir && i > 12 && (i - 1) % 12 === 0 ? wa * (1 + ir / 100) : wa;
      setLwa(Math.round(wa));
      fa = fa * (1 + r / 100) ** (1 / 12) - wa;
    }
    return sanctnum(fa);
  };
  useEffect(() => {
    const remainingAmount = calculateRemainingAmount(
      pa,
      rt,
      irt,
      t.tenure,
      t.tenureFormat,
      wa
    );
    setRAmount(Math.round(remainingAmount));
  }, [pa, rt, irt, t, wa]);
  return (
    <>
      <PrincipalInput
        principalAmount={pa}
        setPrincipalAmount={setPa}
        className="mb-3"
        stepData={invStepData}
        stepSize={"sm"}
      />
      <PrincipalInput
        className="mb-3"
        principalAmount={wa}
        setPrincipalAmount={setWa}
        stepData={wdStepData}
        stepSize={"sm"}
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
      <FinalPaymentCard
        color={`${remainingAmount < pa ? "text-error" : "text-primary"}`}
        finalAmount={remainingAmount}
        additonalAmount={{ title: "Last monthly withdrawal", amount: lwa }}
      />
    </>
  );
};

export default SWP;

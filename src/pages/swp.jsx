import { useEffect, useState } from "react";
import ROI from "../components/ROI";
import Tenure from "../components/Tenure";
import FinalPaymentCard from "../components/FinalPaymentCard";
import PrincipalInput from "../components/PrincipalInput";
import { sanctnum } from "../utilities/numSanitity";

const SWP = () => {
  const [pa, setPa] = useState(10000000);
  const [rt, setRt] = useState(12);
  const [irt, setIRt] = useState(7);
  const [t, setT] = useState({
    tenure: 20,
    tenureFormat: "y",
  });
  const [wa, setWa] = useState(50000);
  const [remainingAmount, setRAmount] = useState(0);
  const [lwa, setLwa] = useState(0);
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
      />
      <PrincipalInput
        className="mb-3"
        principalAmount={wa}
        setPrincipalAmount={setWa}
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
        finalAmount={remainingAmount}
        additonalAmount={{ title: "Last monthly withdrawal", amount: lwa }}
      />
    </>
  );
};

export default SWP;

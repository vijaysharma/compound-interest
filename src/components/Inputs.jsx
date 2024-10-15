import { useEffect, useState } from "react";
import PrincipalInput from "./PrincipalInput";
import ROITenureInput from "./ROITenureInput";
import PaymentMode from "./PaymentMode";
import Interest from "./Interest";
import { sanctnum } from "../utilities/numSanitity";
import Compounded from "./Compounded";
import Tabs from "./Tabs";
import Logo from "./Logo";

const Inputs = () => {
  const [pa, setPa] = useState(100000);
  const [rt, setRt] = useState({
    roi: 7.1,
    tenure: 24,
    tenureFormat: "m",
  });
  const [mode, setMode] = useState(1);
  const [frequency, setFrequency] = useState(4);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [wwidth, setWWidth] = useState(390);
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
    setWWidth(window.document.getElementById("container").clientWidth);
  }, [pa, rt, mode, frequency]);
  const wheight = window.document.documentElement.clientHeight;
  return (
    <>
      <Logo />
      <div
        id="container"
        className="w-full max-w-lg bg-primary/5 mx-auto"
        style={{ height: wheight - 88 }}
      >
        <Tabs name="tab" height={wheight - 127} width={wwidth}>
          <div id={1} title="Compound Interest">
            <PrincipalInput principalAmount={pa} setPrincipalAmount={setPa} />
            <ROITenureInput rt={rt} setRt={setRt} />
            <Compounded fr={frequency} setFr={setFrequency} />
            <br />
            <PaymentMode mode={mode} setMode={setMode} />
            <br />
            <Interest
              payoutAmount={payoutAmount}
              principalAmount={pa}
              mode={mode}
            />
          </div>
          {/* <div id={2} title="Date Calculator">
            Work in progress!!
          </div>
          <div id={3} title="Calculator">
            Work in progress!!
          </div> */}
        </Tabs>
      </div>
    </>
  );
};

export default Inputs;

import Tabs from "../components/Tabs";
import Logo from "../components/Logo";
import Lumpsum from "./lumpsum";
import SWP from "./swp";
import SIP from "./sip";
import Inflation from "./inflation";
import PPP from "./ppp";
import { useEffect, useState } from "react";

const Home = () => {
  const getStoredId = (): string => window.localStorage.getItem("aid") || "1";
  const [activeId, setActiveId] = useState(() => getStoredId());
  useEffect(() => {
    setActiveId(() => getStoredId());
  }, [activeId]);

  return (
    <>
      <div id="container" className="w-full max-w-lg bg-primary/5 mx-auto py-2">
        <Logo />
        <Tabs name="tab" className={"calc-tabs"} activeId={activeId}>
          <div id="1" title="Lumpsum">
            <Lumpsum />
          </div>
          <div id="2" title="SIP">
            <SIP />
          </div>
          <div id="3" title="SWP">
            <SWP />
          </div>
          <div id="4" title="Inflation">
            <Inflation />
          </div>
          <div id="5" title="PPP">
            <PPP />
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default Home;
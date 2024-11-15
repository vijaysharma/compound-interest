import Tabs from "../components/Tabs";
import Logo from "../components/Logo";
import Lumpsum from "./lumpsum";
import SWP from "./swp";
import SIP from "./sip";
import Inflation from "./inflation";
import PPP from "./ppp";
import { useEffect, useState } from "react";
import MF from "./mf";
import Login from "./login";

const Home = () => {
  const getStoredId = (): string => window.localStorage.getItem("aid") || "1";
  const [activeId, setActiveId] = useState(() => getStoredId());
  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    setActiveId(() => getStoredId());
    const a_t = localStorage.getItem("at");
    if (a_t && a_t?.length > 0) setAccessToken(a_t);
  }, [activeId, accessToken]);

  return (
    <>
      <div
        id="container"
        className="w-full max-w-lg lg:max-w-full bg-primary/5 mx-auto py-2"
      >
        <Logo />
        {accessToken === import.meta.env.VITE_ACCESS_TOKEN ? (
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
            <div id="6" title="MF">
              <MF />
            </div>
          </Tabs>
        ) : (
          <Tabs name="tab2">
            <Login action={setAccessToken} />
          </Tabs>
        )}
      </div>
    </>
  );
};

export default Home;

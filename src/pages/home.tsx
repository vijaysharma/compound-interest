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
  const [screenWidth, setSWidth] = useState(1024);

  useEffect(() => {
    setActiveId(() => getStoredId());

    const a_t = localStorage.getItem("at");
    if (a_t && a_t?.length > 0) setAccessToken(a_t);

    const sWidth = window.innerWidth;
    setSWidth(sWidth);
  }, [activeId]);

  return (
    <>
      <div
        id="container"
        className="w-full max-w-lg lg:max-w-full bg-primary/5 mx-auto py-2"
      >
        <Logo />
        {accessToken === import.meta.env.VITE_ACCESS_TOKEN ? (
          screenWidth >= 1024 ? (
            <Tabs
              name="tab"
              activeId={activeId}
              setActiveId={setActiveId}
              type="tabs-bordered"
            >
              <div id="1" data-label="Lumpsum">
                <div className="w-2/3 max-w-lg justify-self-center">
                  <Lumpsum />
                </div>
              </div>
              <div id="2" data-label="SIP & SWP">
                <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
                  <SIP
                    title="Systematic Investment Plan"
                    className="grow basis-1"
                  />
                  <SWP
                    title="Systematic Withdrwal Plan"
                    className="grow basis-1"
                  />
                </div>
              </div>
              <div id="3" data-label="Inflation & PPP">
                <div className="w-2/3 max-w-3xl gap-4 flex justify-self-center">
                  <Inflation title="Inflation" className="grow basis-1" />
                  <PPP
                    title="Purchasing Power Parity"
                    className="grow basis-1"
                  />
                </div>
              </div>
              <div id="4" data-label="MF">
                <div className="w-2/3 max-w-3xl justify-self-center">
                  <MF showDate={true} />
                </div>
              </div>
            </Tabs>
          ) : (
            <Tabs
              name="tab"
              className="calc-tabs"
              activeId={activeId}
              setActiveId={setActiveId}
            >
              <div id="1" data-label="Lumpsum">
                <Lumpsum />
              </div>
              <div id="2" data-label="SIP">
                <SIP />
              </div>
              <div id="3" data-label="SWP">
                <SWP />
              </div>
              <div id="4" data-label="Inflation">
                <Inflation />
              </div>
              <div id="5" data-label="PPP">
                <PPP />
              </div>
              <div id="6" data-label="MF">
                <MF />
              </div>
            </Tabs>
          )
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

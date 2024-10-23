import Tabs from "../components/Tabs";
import Logo from "../components/Logo";
import Lumpsum from "./lumpsum";
import SWP from "./swp";
import SIP from "./sip";

const Home = () => {
  const wheight = window.document.documentElement.clientHeight;
  const wwidth = window.document.documentElement.clientWidth;
  return (
    <>
      <Logo />
      <div
        id="container"
        className="w-full max-w-lg bg-primary/5 mx-auto py-2"
        style={{ height: wheight - 48 }}
      >
        <Tabs name="tab" height={wheight - 88} width={wwidth - 8}>
          <div id={1} title="FD / Lumpsum">
            <Lumpsum />
          </div>
          <div id={2} title="RD / SIP">
            <SIP />
          </div>
          <div id={3} title="SWP">
            <SWP />
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default Home;

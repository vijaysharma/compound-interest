import Tabs from "../components/Tabs";
import Logo from "../components/Logo";
import Lumpsum from "./lumpsum";
import SWP from "./swp";

const Home = () => {
  const wheight = window.document.documentElement.clientHeight;
  return (
    <>
      <Logo />
      <div
        id="container"
        className="w-full max-w-lg bg-primary/5 mx-auto"
        style={{ height: wheight - 60 }}
      >
        <Tabs name="tab" height={wheight - 127} width={390}>
          <div id={1} title="FD / Lumpsum">
            <Lumpsum />
          </div>
          <div id={2} title="SWP">
            <SWP />
          </div>
          {/* <div id={3} title="Calculator">
            Work in progress!!
          </div> */}
        </Tabs>
      </div>
    </>
  );
};

export default Home;

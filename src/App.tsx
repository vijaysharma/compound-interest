import "./App.css";
import { Outlet } from "react-router-dom";
import TopBar from "./components/TopBar";

function App() {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}
export default App;

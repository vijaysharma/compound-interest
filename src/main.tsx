import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import EmiCalculator from "./pages/emiCalculator.tsx";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/emi",
    element: <EmiCalculator />,
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const TopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const title = pathname === "/emi" ? "EMI Calculator" : "Investment Calculator";

  return (
    <>
      <div className="flex items-center gap-2 bg-primary text-primary-content font-semibold py-1 mb-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square text-primary-content"
          aria-label="Open navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="navigation-drawer"
          onClick={() => setIsMenuOpen(true)}
        >
          <span className="flex flex-col gap-1" aria-hidden="true">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
        <Logo /> {title}
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="navigation-drawer"
            className="relative h-full w-72 max-w-[85vw] bg-base-100 p-4 text-base-content shadow-xl"
            aria-label="Navigation menu"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Financial Calculator</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close navigation menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-2xl leading-none" aria-hidden="true">
                  &times;
                </span>
              </button>
            </div>
            <nav aria-label="Calculator pages">
              <Link
                to="/"
                className="btn btn-ghost w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                Investment Calculator
              </Link>
              <Link
                to="/emi"
                className="btn btn-ghost w-full justify-start"
                onClick={() => setIsMenuOpen(false)}
              >
                EMI Calculator
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default TopBar;

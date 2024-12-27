import { SetStateAction, useEffect, useState } from "react";
import { NavType } from "../types/types";
import { getDateAsISO, getNearest } from "../utilities/utility";

const StartEndDate = ({
  data,
  startNav,
  endNav,
  setStartNav,
  setEndNav,
}: {
  data: NavType[];
  startNav: NavType | undefined;
  endNav: NavType | undefined;
  setStartNav: React.Dispatch<SetStateAction<NavType | undefined>>;
  setEndNav: React.Dispatch<SetStateAction<NavType | undefined>>;
}) => {
  const [sDate, setSDate] = useState<string>(() => (startNav ? startNav.date.split("-").reverse().join("-") : ""));
  const [eDate, setEDate] = useState<string>(() => (endNav ? endNav.date.split("-").reverse().join("-") : ""));

  useEffect(() => {
    if (sDate.length > 0 && eDate.length > 0) {
      const s = getNearest(sDate, data);
      const e = getNearest(eDate, data);
      setStartNav(s);
      setEndNav(e);
    }
  }, [sDate, eDate, data, setStartNav, setEndNav]);
  return (
    <div className="join mb-3 w-full">
      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">Start</div>
      <div className="grow ">
        <input
          type="date"
          min="1990-01-01"
          max={eDate}
          value={sDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(e) => setSDate(getDateAsISO(0, new Date(e.target.value)))}
        />
      </div>
      <div className="grow ">
        <input
          type="date"
          min={sDate}
          max={getDateAsISO()}
          value={eDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(e) => setEDate(getDateAsISO(0, new Date(e.target.value)))}
        />
      </div>
      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">End</div>
    </div>
  );
};

export default StartEndDate;

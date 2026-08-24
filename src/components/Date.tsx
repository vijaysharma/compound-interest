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
  // Internal state for date input values
  const [sDate, setSDate] = useState<string>("");
  const [eDate, setEDate] = useState<string>("");

  // Sync internal state with props - this is critical for persistence
  useEffect(() => {
    if (startNav) {
      const formatted = startNav.date.split("-").reverse().join("-");
      if (sDate !== formatted) {
        setSDate(formatted);
      }
    }
  }, [startNav]);

  useEffect(() => {
    if (endNav) {
      const formatted = endNav.date.split("-").reverse().join("-");
      if (eDate !== formatted) {
        setEDate(formatted);
      }
    }
  }, [endNav]);

  // When user changes date inputs, find nearest NAV and update parent
  useEffect(() => {
    if (sDate.length > 0 && eDate.length > 0 && data.length > 0) {
      const s = getNearest(sDate, data);
      const e = getNearest(eDate, data);
      
      // Only update if we found valid NAVs
      if (s && e) {
        // Check if they're different from current to avoid loops
        const startDateChanged = startNav?.date !== s.date;
        const endDateChanged = endNav?.date !== e.date;
        
        if (startDateChanged) {
          setStartNav(s);  // Pass NavType directly, not a function
        }
        if (endDateChanged) {
          setEndNav(e);    // Pass NavType directly, not a function
        }
      }
    }
  }, [sDate, eDate, data]);

  return (
    <div className="join mb-3 w-full">
      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">
        Start
      </div>
      <div className="grow">
        <input
          type="date"
          min="1990-01-01"
          max={eDate || undefined}
          value={sDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(e) => setSDate(getDateAsISO(0, new Date(e.target.value)))}
        />
      </div>
      <div className="grow">
        <input
          type="date"
          min={sDate || undefined}
          max={getDateAsISO()}
          value={eDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(e) => setEDate(getDateAsISO(0, new Date(e.target.value)))}
        />
      </div>
      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">
        End
      </div>
    </div>
  );
};

export default StartEndDate;
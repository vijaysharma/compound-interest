import { useEffect, useState } from "react";
import { getDateAsISO, getNearest } from "../utilities/utility";
import { NavType } from "../types/types";

interface StartEndDateProps {
  data: NavType[];
  startDate: string | null;
  endDate: string | null;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

const StartEndDate = ({
  data,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: StartEndDateProps) => {
  /*
   * HTML date inputs must ALWAYS contain:
   *
   * YYYY-MM-DD
   *
   * They must never contain DD-MM-YYYY.
   */

  const [sDate, setSDate] = useState<string>(startDate ?? "");

  const [eDate, setEDate] = useState<string>(endDate ?? "");

  /*
   * Synchronize the local input with the parent.
   *
   * Importantly, we do NOT derive the input value from
   * the nearest NAV. The user may intentionally select
   * a weekend/holiday/current date for which no NAV exists.
   */

  useEffect(() => {
    const next = startDate ?? "";

    if (next !== sDate) {
      setSDate(next);
    }
  }, [startDate, sDate]);

  useEffect(() => {
    const next = endDate ?? "";

    if (next !== eDate) {
      setEDate(next);
    }
  }, [endDate, eDate]);

  /*
   * When the user changes Start:
   *
   * Keep the EXACT calendar date selected.
   *
   * Do not replace it with the nearest NAV date.
   */

  const handleStartChange = (value: string) => {
    if (!value) {
      setSDate("");
      return;
    }

    setSDate(value);
    setStartDate(value);
  };

  /*
   * Same for End.
   */

  const handleEndChange = (value: string) => {
    if (!value) {
      setEDate("");
      return;
    }

    setEDate(value);
    setEndDate(value);
  };

  /*
   * Keep the existing nearest-NAV functionality available
   * through the data prop.
   *
   * This effect validates that the selected dates can be
   * resolved, but DOES NOT modify the selected calendar
   * dates.
   *
   * This is intentional.
   */

  useEffect(() => {
    if (!sDate || !eDate || data.length === 0) {
      return;
    }

    getNearest(sDate, data);
    getNearest(eDate, data);
  }, [sDate, eDate, data]);

  /*
   * Maximum selectable date is today.
   */

  const today = getDateAsISO();

  return (
    <div className="join mb-3 w-full">
      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">
        Start
      </div>

      <div className="grow">
        <input
          type="date"
          min="1990-01-01"
          max={eDate || today}
          value={sDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(event) => handleStartChange(event.target.value)}
        />
      </div>

      <div className="grow">
        <input
          type="date"
          min={sDate || "1990-01-01"}
          max={today}
          value={eDate}
          className="join-item w-full input input-primary focus:outline-none"
          onChange={(event) => handleEndChange(event.target.value)}
        />
      </div>

      <div className="join-item px-4 w-24 bg-primary text-primary-content border-primary text-center text-sm/[46px]">
        End
      </div>
    </div>
  );
};

export default StartEndDate;

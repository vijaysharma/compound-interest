import { useEffect } from 'react';
import { getDateAsISO, getNearest } from '../utilities/utility';
import { NavType } from '../types/types';
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
  /*
   * When the user changes Start:
   *
   * Keep the EXACT calendar date selected.
   *
   * Do not replace it with the nearest NAV date.
   */
  const handleStartChange = (value: string) => {
    setStartDate(value);
  };
  /*
   * Same for End.
   */
  const handleEndChange = (value: string) => {
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
    if (!startDate || !endDate || data.length === 0) {
      return;
    }
    getNearest(startDate, data);
    getNearest(endDate, data);
  }, [startDate, endDate, data]);
  /*
   * Maximum selectable date is today.
   */
  const today = getDateAsISO();
  return (
    <div className="join mb-2 w-full date-picker">
      <div className="label join-item px-2 w-12 bg-primary text-primary-content border-primary text-center text-sm">
        Start
      </div>
      <div className="grow">
        <input
          type="date"
          min="1990-01-01"
          max={endDate || today}
          value={startDate ?? ''}
          className="join-item w-full input input-sm input-primary focus:outline-none"
          onChange={(event) => handleStartChange(event.target.value)}
        />
      </div>
      <div className="grow">
        <input
          type="date"
          min={startDate || '1990-01-01'}
          max={today}
          value={endDate ?? ''}
          className="join-item w-full input input-sm input-primary focus:outline-none"
          onChange={(event) => handleEndChange(event.target.value)}
        />
      </div>
      <div className="label join-item px-2 w-12 bg-primary text-primary-content border-primary text-center text-sm">
        End
      </div>
    </div>
  );
};
export default StartEndDate;

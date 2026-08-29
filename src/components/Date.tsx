import { useEffect } from 'react';
import { getDateAsISO, getNearest } from '../utilities/utility';
import { NavType } from '../types/types';
interface StartEndDateProps {
  data?: NavType[];
  startDate: string | null;
  endDate: string | null;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  mode?: 'date' | 'year';
  startOptions?: string[];
  endOptions?: string[];
}
const StartEndDate = ({
  data,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  mode = 'date',
  startOptions = [],
  endOptions = [],
}: StartEndDateProps) => {
  useEffect(() => {
    if (mode !== 'date' || !startDate || !endDate || !data || data.length === 0) {
      return;
    }
    getNearest(startDate, data);
    getNearest(endDate, data);
  }, [startDate, endDate, data, mode]);
  if (mode === 'year') {
    return (
      <div className="join mb-2 w-full date-picker">
        <div className="label join-item px-2 w-20 bg-primary text-primary-content border-primary text-center text-sm">
          Start Year
        </div>
        <select
          className="join-item grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={startDate ?? ''}
          onChange={(event) => setStartDate(event.target.value)}
        >
          {startOptions.map((year) => (
            <option key={`s-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          className="join-item grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={endDate ?? ''}
          onChange={(event) => setEndDate(event.target.value)}
        >
          {endOptions.map((year) => (
            <option key={`e-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="label join-item px-2 w-20 bg-primary text-primary-content border-primary text-center text-sm">
          End Year
        </div>
      </div>
    );
  }
  const handleStartChange = (value: string) => {
    setStartDate(value);
  };
  const handleEndChange = (value: string) => {
    setEndDate(value);
  };
  const today = getDateAsISO();
  return (
    <div className="join mb-2 w-full date-picker">
      <div className="label join-item px-2 w-12 bg-primary text-primary-content border-primary text-center text-sm">
        Start
      </div>
      <div className="grow">
        <input
          type="date"
          max={endDate || today}
          value={startDate ?? ''}
          className="join-item w-full input input-sm input-primary focus:outline-none"
          onChange={(event) => handleStartChange(event.target.value)}
        />
      </div>
      <div className="grow">
        <input
          type="date"
          min={startDate || undefined}
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

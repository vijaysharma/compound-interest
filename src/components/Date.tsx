import { useEffect } from 'react';
import { getDateAsISO, getNearest } from '../utilities/utility';
import { NavType } from '../types/types';
interface StartEndDateProps {
  data?: NavType[];
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  mode?: 'date' | 'year';
  startOptions?: string[];
  endOptions?: string[];
  startTitle?: string;
  endTitle?: string;
  startMinDate?: string;
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
  startTitle = 'Start',
  endTitle = 'End',
  startMinDate,
}: StartEndDateProps) => {
  useEffect(() => {
    if (mode !== 'date' || !data || data.length === 0) {
      return;
    }
    if (startDate) getNearest(startDate, data);
    if (endDate) getNearest(endDate, data);
  }, [startDate, endDate, data, mode]);
  const handleStartYearChange = (value: string) => {
    setStartDate?.(value);
    if (endDate && Number(value) > Number(endDate)) {
      setEndDate?.(value);
    }
  };
  const handleEndYearChange = (value: string) => {
    if (startDate && Number(value) < Number(startDate)) {
      setEndDate?.(startDate);
      return;
    }
    setEndDate?.(value);
  };
  if (mode === 'year') {
    const availableEndOptions = endOptions.filter(
      (year) => !startDate || Number(year) >= Number(startDate)
    );
    return (
      <div className="join mb-2 w-full date-picker">
        <div className="label join-item px-2 w-20 bg-primary text-primary-content border-primary text-center text-sm">
          {startTitle} Year
        </div>
        <select
          className="join-item grow select border-primary focus:border-primary focus:outline-none shadow-none"
          value={startDate ?? ''}
          onChange={(event) => handleStartYearChange(event.target.value)}
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
          onChange={(event) => handleEndYearChange(event.target.value)}
        >
          {availableEndOptions.map((year) => (
            <option key={`e-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>
        <div className="label join-item px-2 w-20 bg-primary text-primary-content border-primary text-center text-sm">
          {endTitle} Year
        </div>
      </div>
    );
  }
  const handleStartChange = (value: string) => {
    setStartDate?.(value);
    if (endDate && value && value > endDate) {
      setEndDate?.(value);
    }
  };
  const handleEndChange = (value: string) => {
    if (startDate && value && value < startDate) {
      setEndDate?.(startDate);
      return;
    }
    setEndDate?.(value);
  };
  const today = getDateAsISO();
  return (
    <div className="join mb-2 w-full date-picker">
      {setStartDate && (
        <>
          <div className="label join-item px-2 bg-primary text-primary-content border-primary text-center text-sm">
            {startTitle}
          </div>
          <div className="grow">
            <input
              type="date"
              min={startMinDate || undefined}
              max={endDate || today}
              value={startDate ?? ''}
              className="join-item w-full input input-sm input-primary focus:outline-none"
              onChange={(event) => handleStartChange(event.target.value)}
            />
          </div>
        </>
      )}
      {setEndDate && (
        <>
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
          <div className="label join-item px-2 bg-primary text-primary-content border-primary text-center text-sm">
            {endTitle}
          </div>
        </>
      )}
    </div>
  );
};
export default StartEndDate;

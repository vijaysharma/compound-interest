import { NavType } from '../types/types';
import ValuePicker from './ValuePicker';
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
}: StartEndDateProps) => (
  <ValuePicker.DateRange
    data={data}
    startDate={startDate}
    endDate={endDate}
    setStartDate={setStartDate}
    setEndDate={setEndDate}
    dateMode={mode}
    startOptions={startOptions}
    endOptions={endOptions}
    startTitle={startTitle}
    endTitle={endTitle}
    startMinDate={startMinDate}
  />
);
export default StartEndDate;

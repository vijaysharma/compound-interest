import { RateOfInterestType } from '../types/types';
import ValuePicker from './ValuePicker';
const RateOfInterest = ({
  rt,
  setRt,
  title,
  className = '',
}: RateOfInterestType) => (
  <ValuePicker.ROI
    rt={rt}
    setRt={setRt}
    title={title}
    className={className}
  />
);
export default RateOfInterest;

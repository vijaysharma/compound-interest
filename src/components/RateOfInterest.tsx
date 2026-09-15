import { RateOfInterestType } from '../types/types';
import ValuePicker from './ValuePicker';
const RateOfInterest = ({
  rt,
  setRt,
  title,
  className = '',
}: RateOfInterestType) => (
  <ValuePicker
    variant="roi"
    rt={rt}
    setRt={setRt}
    title={title}
    className={className}
  />
);
export default RateOfInterest;

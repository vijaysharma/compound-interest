import { TenureType } from '../types/types';
import ValuePicker from './ValuePicker';
const Tenure = ({ rt, setRt, className = '' }: TenureType) => (
  <ValuePicker
    variant="tenure"
    rt={rt}
    setRt={setRt}
    className={className}
  />
);
export default Tenure;

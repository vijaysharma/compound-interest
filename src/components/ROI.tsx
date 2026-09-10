import { ROIType } from "../types/types";
import ValuePicker from "./ValuePicker";
const ROI = ({ rt, setRt, title, className = "" }: ROIType) => (
  <ValuePicker.ROI
    value={rt}
    onChange={setRt}
    title={title}
    className={className}
  />
);
export default ROI;

import { sanctnum } from "../utilities/numSanitity";
import { ROIType } from "../types/types";
import styles from "./ROI.module.scss";
const ROI = ({ rt, setRt, title, className = "" }: ROIType) => {
  const setROI = (n: number) => {
    let roi = parseFloat(rt);
    roi += n;
    if (roi <= 0) {
      setRt("0");
      return;
    }
    setRt(`${Math.round((roi + Number.EPSILON) * 100) / 100}`);
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <h5 className={styles.title}>{title || "Rate of Interest (%)"}</h5>
      <div className={styles.controlGroup}>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setROI(-0.1)}
        >
          -0.1
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setROI(-1)}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className={styles.inputField}
          value={rt.toString().replace(/^0+/, "") || 0}
          onChange={(e) => {
            const iv = e.target.value;
            if (sanctnum(iv) < 0) return;
            setRt(iv);
          }}
        />
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setROI(1)}
        >
          +1
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setROI(0.1)}
        >
          +0.1
        </button>
      </div>
    </div>
  );
};
export default ROI;

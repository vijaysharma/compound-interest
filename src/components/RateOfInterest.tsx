import { useState } from 'react';
import { sanctnum } from '../utilities/numSanitity';
import { RateOfInterestType } from '../types/types';
import styles from './RateOfInterest.module.scss';
const RateOfInterest = ({
  rt,
  setRt,
  title,
  className = '',
}: RateOfInterestType) => {
  const [expROI, setExpROI] = useState('+');
  const setROI = (n: number) => {
    let roi = rt.roi ? parseFloat(rt.roi) : 0;
    if (expROI === '+') {
      roi += n;
    }
    if (expROI === '-') {
      roi -= n;
      if (roi <= 0) {
        setRt({ ...rt, roi: '0' });
        setExpROI('+');
        return;
      }
    }
    setRt({ ...rt, roi: `${Math.round((roi + Number.EPSILON) * 100) / 100}` });
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <h5 className={styles.title}>{title || 'Rate of Interest (%)'}</h5>
      <div className={`join ${styles.joinGroup}`}>
        <button
          type="button"
          className={`join-item ${styles.stepBtn}`}
          onClick={() => setROI(0.01)}
        >
          0.01
        </button>
        <button
          type="button"
          className={`join-item ${styles.stepBtn}`}
          onClick={() => setROI(0.1)}
        >
          0.1
        </button>
        <button
          type="button"
          className={`join-item ${styles.stepBtn}`}
          onClick={() => setROI(1)}
        >
          1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className={`join-item ${styles.input}`}
          value={rt.roi ? rt.roi.toString().replace(/^0+/, '') : '0'}
          onChange={(e) => {
            const iv = e.target.value;
            if (sanctnum(iv) < 0) {
              setExpROI('+');
              return;
            }
            setRt({ ...rt, roi: iv });
          }}
        />
        <button
          type="button"
          className={`join-item ${styles.actionBtn} ${expROI === '+' ? styles.active : ''}`}
          onClick={() => setExpROI('+')}
        >
          +
        </button>
        <button
          type="button"
          className={`join-item ${styles.actionBtn} ${expROI === '-' ? styles.active : ''}`}
          onClick={() => setExpROI('-')}
          disabled={rt.roi === '0'}
        >
          -
        </button>
      </div>
    </div>
  );
};
export default RateOfInterest;

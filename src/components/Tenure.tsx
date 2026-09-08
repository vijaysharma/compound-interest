import { TenureType } from '../types/types';
import styles from './Tenure.module.scss';
const Tenure = ({ rt, setRt, className = '' }: TenureType) => {
  const setTenure = (n: string) => {
    let tenure = parseInt(rt.tenure, 10);
    tenure += parseInt(n, 10);
    if (tenure <= 0) {
      setRt({ ...rt, tenure: '0' });
      return;
    }
    setRt({ ...rt, tenure: `${tenure}` });
  };
  return (
    <div className={`${styles.container} ${className}`.trim()}>
      <h5 className={styles.title}>Tenure</h5>
      <div className={styles.controlGroup}>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setTenure('-10')}
        >
          -10
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setTenure('-1')}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          className={styles.inputField}
          value={rt.tenure.toString().replace(/^0+/, '') || 0}
          onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
        />
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setTenure('+1')}
        >
          +1
        </button>
        <button
          type="button"
          className={styles.stepBtn}
          onClick={() => setTenure('+10')}
        >
          +10
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${
            rt.tenureFormat === 'm' ? styles.active : ''
          }`}
          onClick={() => {
            setRt({
              ...rt,
              tenure:
                rt.tenureFormat === 'y'
                  ? `${parseInt(rt.tenure, 10) * 12}`
                  : rt.tenure,
              tenureFormat: 'm',
            });
          }}
        >
          M
        </button>
        <button
          type="button"
          className={`${styles.unitBtn} ${
            rt.tenureFormat === 'y' ? styles.active : ''
          }`}
          onClick={() =>
            setRt({
              ...rt,
              tenure:
                rt.tenureFormat === 'm'
                  ? `${parseInt(rt.tenure, 10) / 12}`
                  : rt.tenure,
              tenureFormat: 'y',
            })
          }
        >
          Y
        </button>
      </div>
    </div>
  );
};
export default Tenure;

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
      <div className="join focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline w-full">
        <button
          type="button"
          className="join-item grow btn btn-sm border-primary"
          onClick={() => setTenure('-10')}
        >
          -10
        </button>
        <button
          type="button"
          className="join-item grow btn btn-sm border-primary"
          onClick={() => setTenure('-1')}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          className="input input-sm input-primary focus:outline-none join-item w-24 text-center"
          value={rt.tenure.toString().replace(/^0+/, '') || 0}
          onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
        />
        <button
          type="button"
          className="join-item grow btn btn-sm border-primary"
          onClick={() => setTenure('+1')}
        >
          +1
        </button>
        <button
          type="button"
          className="join-item grow btn btn-sm border-primary"
          onClick={() => setTenure('+10')}
        >
          +10
        </button>
        <button
          type="button"
          className={`join-item grow btn btn-sm border-primary ${
            rt.tenureFormat === 'm' ? 'btn-primary' : ''
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
          className={`join-item grow btn btn-sm border-primary ${
            rt.tenureFormat === 'y' ? 'btn-primary' : ''
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

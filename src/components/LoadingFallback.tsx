import Spinner from './Spinner';
import styles from './LoadingFallback.module.scss';
const LoadingFallback = () => {
  return (
    <div className={styles.container}>
      <div className={styles.topProgressBar}>
        <div className={styles.progressIndicator} />
      </div>
      <div className={styles.content}>
        <Spinner size="xl" label="Loading..." />
      </div>
    </div>
  );
};
export default LoadingFallback;

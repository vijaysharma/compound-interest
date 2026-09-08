import styles from './LoadingFallback.module.scss';
const LoadingFallback = () => {
  return (
    <div className={styles.container}>
      <div className={styles.topProgressBar}>
        <div className={styles.progressIndicator} />
      </div>
      <div className={styles.content}>
        <span className="loading loading-spinner loading-lg text-primary" />
        <span className={styles.label}>Loading...</span>
      </div>
    </div>
  );
};
export default LoadingFallback;

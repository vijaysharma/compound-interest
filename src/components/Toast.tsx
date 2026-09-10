import styles from './Toast.module.scss';
const Toast = ({
  message,
  type = 'alert',
}: {
  message: string;
  type: 'info' | 'alert' | 'success';
}) => {
  return (
    <div className={styles.toastContainer} role="status" aria-live="polite">
      <div className={`${styles.toastAlert} ${styles[type] || styles.alert}`}>
        <span>{message}</span>
      </div>
    </div>
  );
};
export default Toast;

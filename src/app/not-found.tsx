import Link from '@/navigation';
import styles from './not-found.module.scss';
export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.title}>Page Not Found</h2>
      <p className={styles.desc}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className={styles.homeBtn}>
        Return to Home
      </Link>
    </div>
  );
}

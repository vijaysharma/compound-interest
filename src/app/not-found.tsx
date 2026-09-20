import Link from '@/navigation';
import styles from './NotFound.module.scss';
const POPULAR_CALCULATORS = [
  { href: '/mutual-funds/lumpsum', label: '• Mutual Fund Lumpsum' },
  { href: '/sip-calculator', label: '• SIP Calculator' },
  { href: '/emi-calculator', label: '• EMI Calculator' },
  { href: '/income-tax-calculator', label: '• Income Tax Calculator' },
];
export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brandIcon}>
          <span className={styles.brandSymbol}>₹</span>
        </div>
        <div className={styles.badge}>404 Not Found</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page or calculator you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeBtn}>
            Return to Home
          </Link>
        </div>
        <div className={styles.exploreSection}>
          <span className={styles.exploreLabel}>Explore Financial Calculators</span>
          <div className={styles.linksGrid}>
            {POPULAR_CALCULATORS.map((calc) => (
              <Link key={calc.href} href={calc.href} className={styles.calcLink}>
                {calc.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

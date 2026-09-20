import React from 'react';
import { Link } from '@/navigation';
import { AVAILABLE_TOOLS } from '../../data/seo/aboutData';
import styles from '../StaticDocPage.module.scss';
export const AboutToolsSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Available Financial Calculators</h2>
      <p className={styles.paragraph}>
        Rupee Calculator provides 8+ institutional-grade tools covering all major personal finance
        scenarios for Indian investors:
      </p>
      <ul className={styles.toolsGrid}>
        {AVAILABLE_TOOLS.map((tool) => (
          <li key={tool.href}>
            <Link to={tool.href} className={styles.toolCard}>
              <span className={styles.toolName}>{tool.name}</span>
              <span className={styles.toolDesc}>{tool.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

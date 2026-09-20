import React from 'react';
import { homeFaqs } from '../../data/seo/homeData';
import styles from '../Home.module.scss';
export const HomeFaqSection: React.FC = () => {
  return (
    <section className={styles.faqSection}>
      <div className={styles.faqInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to know about Rupee Calculator and financial modeling.
          </p>
        </div>
        <div className={styles.faqList}>
          {homeFaqs.map((faq, idx) => (
            <details key={idx} className={styles.faqItem}>
              <summary className={styles.faqSummary}>
                <span>{faq.question}</span>
                <span className={styles.faqArrow}>&darr;</span>
              </summary>
              <p className={styles.faqAnswer}>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

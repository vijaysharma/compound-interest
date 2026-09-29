'use client';
import React, { useState } from 'react';
import { FII_DII_EXPLANATIONS, type FiiDiiSectionExplanation } from './fiiDiiExplanations';
import styles from './FiiDiiTracker.module.scss';
export const FiiDiiExplanationSection: React.FC = () => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['fii-vs-dii']));
  const toggleSection = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  return (
    <section className={styles.explanationsContainer} aria-label="FII and DII concepts explained">
      <div className={styles.explanationsHeader}>
        <div className={styles.explanationsHeaderTop}>
          <span className={styles.infoBadge}>💡 Layman Guides & Formulas</span>
          <span className={styles.infoSubText}>Tap any section to expand breakdown</span>
        </div>
        <h3 className={styles.explanationsMainTitle}>Understanding Market Movements & Adjustments</h3>
      </div>
      <div className={styles.explanationsGrid}>
        {FII_DII_EXPLANATIONS.map((item: FiiDiiSectionExplanation) => {
          const isOpen = openIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`${styles.explanationCard} ${isOpen ? styles.explanationCardOpen : ''}`}
            >
              <button
                type="button"
                className={styles.explanationSummary}
                onClick={() => toggleSection(item.id)}
                aria-expanded={isOpen}
              >
                <div className={styles.explanationTitleRow}>
                  <span className={styles.explanationBadge}>{item.badge}</span>
                  <span className={styles.explanationTitle}>{item.title}</span>
                </div>
                <span className={`${styles.accordionChevron} ${isOpen ? styles.chevronOpen : ''}`}>
                  ▼
                </span>
              </button>
              {isOpen && (
                <div className={styles.explanationBody}>
                  <p className={styles.explanationText}>{item.explanation}</p>
                  {item.formula && (
                    <div className={styles.formulaBox}>
                      <span className={styles.formulaLabel}>Calculation Formula:</span>
                      <code className={styles.formulaCode}>{item.formula}</code>
                    </div>
                  )}
                  {item.steps && item.steps.length > 0 && (
                    <div className={styles.stepsList}>
                      {item.steps.map((st, sIdx) => (
                        <div key={sIdx} className={styles.stepItem}>
                          {st}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles.explanationTakeaway}>
                    <span className={styles.takeawayTag}>Key Takeaway:</span> {item.keyTakeaway}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

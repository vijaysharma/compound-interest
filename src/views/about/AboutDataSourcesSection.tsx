import React from 'react';
import { FiDatabase, FiGlobe } from 'react-icons/fi';
import { DATA_SOURCES } from '../../data/seo/aboutData';
import styles from '../StaticDocPage.module.scss';
export const AboutDataSourcesSection: React.FC = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Data Sources &amp; Methodology</h2>
      <div className={styles.section}>
        {DATA_SOURCES.map((src) => (
          <div key={src.name} className={styles.card}>
            <div className={styles.sourceItem}>
              <div className={styles.sourceIcon}>
                {src.iconType === 'database' ? <FiDatabase /> : <FiGlobe />}
              </div>
              <div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  {src.name} ↗
                </a>
                <p className={styles.sourceUsage}>{src.usage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import Link from '../../components/PrefetchLink';
import {
  FiBarChart2,
  FiCalendar,
  FiClock,
  FiFileText,
  FiGlobe,
  FiLayers,
  FiPercent,
  FiRepeat,
  FiShield,
  FiTool,
  FiTrendingUp,
} from 'react-icons/fi';
import { PILLARS_DATA, PillarItem } from './pillarsData';
import styles from '../Home.module.scss';
const renderPillarIcon = (type: PillarItem['iconType']) => {
  switch (type) {
    case 'tax':
      return <FiFileText className={styles.pillarIcon} />;
    case 'shield':
      return <FiShield className={styles.pillarIcon} />;
    case 'clock':
      return <FiClock className={styles.pillarIcon} />;
    case 'trending':
      return <FiTrendingUp className={styles.pillarIcon} />;
    case 'layers':
      return <FiLayers className={styles.pillarIcon} />;
    case 'globe':
      return <FiGlobe className={styles.pillarIcon} />;
    case 'chart':
      return <FiBarChart2 className={styles.pillarIcon} />;
    case 'percent':
      return <FiPercent className={styles.pillarIcon} />;
    case 'tool':
      return <FiTool className={styles.pillarIcon} />;
    case 'calendar':
      return <FiCalendar className={styles.pillarIcon} />;
    case 'repeat':
      return <FiRepeat className={styles.pillarIcon} />;
    default:
      return null;
  }
};
export const HomePillarsSection: React.FC = () => {
  return (
    <section className={styles.pillarsSection}>
      <div className={styles.pillarsInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Explore Financial Calculators</h2>
          <p className={styles.sectionSubtitle}>
            Engineered for precision, clarity, and comprehensive financial decision-making.
          </p>
        </div>
        <div className={styles.pillarsGrid}>
          {PILLARS_DATA.map((pillar) => (
            <div key={pillar.href} className={styles.pillarCard}>
              <div>
                <h3 className={styles.pillarHeading}>
                  {renderPillarIcon(pillar.iconType)} {pillar.title}
                </h3>
                <p className={styles.pillarDesc}>{pillar.description}</p>
              </div>
              <Link to={pillar.href} className={styles.pillarLink}>
                {pillar.linkText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

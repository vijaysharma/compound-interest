import React from 'react';
import {
  FiBriefcase,
  FiTrendingUp,
  FiHome,
  FiPieChart,
  FiShield,
  FiAward,
} from 'react-icons/fi';
import styles from '../IncomeTaxCalculator.module.scss';
export type TaxInputTab =
  | 'salary'
  | 'business'
  | 'house'
  | 'capital_gains'
  | 'interest'
  | 'deductions';
interface TabsNavProps {
  activeTab: TaxInputTab;
  setActiveTab: (tab: TaxInputTab) => void;
}
export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabsNav}>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'salary' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('salary')}
      >
        <FiBriefcase size={14} />
        <span>Salary &amp; HRA</span>
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'business' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('business')}
      >
        <FiTrendingUp size={14} />
        <span>2nd Business / Freelance</span>
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'house' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('house')}
      >
        <FiHome size={14} />
        <span>House Property &amp; Rent</span>
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'capital_gains' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('capital_gains')}
      >
        <FiPieChart size={14} />
        <span>Mutual Funds &amp; Stocks</span>
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'interest' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('interest')}
      >
        <FiShield size={14} />
        <span>PPF &amp; Interest</span>
      </button>
      <button
        type="button"
        className={`${styles.tabBtn} ${activeTab === 'deductions' ? styles.tabBtnActive : ''}`}
        onClick={() => setActiveTab('deductions')}
      >
        <FiAward size={14} />
        <span>Deductions (80C/80D/NPS)</span>
      </button>
    </div>
  );
};

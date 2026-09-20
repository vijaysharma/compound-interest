import React from 'react';
import { TbDeviceMobile, TbDeviceTablet, TbDeviceDesktop } from 'react-icons/tb';
import styles from '../tempValuePickerPage.module.scss';
export type ViewportMode = 'mobile' | 'tablet' | 'desktop';
interface DemoHeaderProps {
  viewport: ViewportMode;
  setViewport: (v: ViewportMode) => void;
}
export const DemoHeader: React.FC<DemoHeaderProps> = ({ viewport, setViewport }) => {
  return (
    <header className={styles.demoHeader}>
      <span className={styles.badge}>Component Preview</span>
      <h1 className={styles.pageTitle}>ValuePicker Component</h1>
      <p className={styles.pageSubtitle}>
        Mobile-first, fully responsive numeric selector styled with modular SCSS. Recreated from
        the reference design with dual-mode tabs, quick-step grid, and real-time words formatting.
      </p>
      <div className={styles.viewportSwitcher} role="group" aria-label="Viewport Preview Mode">
        <button
          type="button"
          className={`${styles.viewportBtn} ${viewport === 'mobile' ? styles.active : ''}`}
          onClick={() => setViewport('mobile')}
        >
          <TbDeviceMobile size={18} />
          Mobile (375px)
        </button>
        <button
          type="button"
          className={`${styles.viewportBtn} ${viewport === 'tablet' ? styles.active : ''}`}
          onClick={() => setViewport('tablet')}
        >
          <TbDeviceTablet size={18} />
          Tablet (640px)
        </button>
        <button
          type="button"
          className={`${styles.viewportBtn} ${viewport === 'desktop' ? styles.active : ''}`}
          onClick={() => setViewport('desktop')}
        >
          <TbDeviceDesktop size={18} />
          Desktop / Full Web
        </button>
      </div>
    </header>
  );
};

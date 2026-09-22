import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
} from '../../data/valuePickerData';
import { sanctnum } from '../../utilities/numSanitity';
import { ViewportMode } from './DemoHeader';
import styles from '../tempValuePickerPage.module.scss';
interface InteractiveModelPreviewProps {
  viewport: ViewportMode;
  mainValue: string;
  setMainValue: (v: string) => void;
  mainTab: string;
  setMainTab: (v: string) => void;
}
export const InteractiveModelPreview: React.FC<InteractiveModelPreviewProps> = ({
  viewport,
  mainValue,
  setMainValue,
  mainTab,
  setMainTab,
}) => {
  const frameClass =
    viewport === 'mobile'
      ? styles.mobileFrame
      : viewport === 'tablet'
        ? styles.tabletFrame
        : styles.desktopFrame;
  // The frame imitates a viewport the picker is not really in, so the scale has
  // to be pinned rather than measured.
  const scale = viewport === 'mobile' ? 'mobile' : viewport === 'desktop' ? 'desktop' : 'auto';
  return (
    <section>
      <div className={styles.previewArea}>
        <div className={`${styles.frameWrapper} ${frameClass}`}>
          <ValuePicker
            value={mainValue}
            onChange={setMainValue}
            tabs={DEFAULT_VALUE_PICKER_TABS}
            activeTab={mainTab}
            onTabChange={setMainTab}
            stepRows={DEFAULT_VALUE_PICKER_ROWS}
            symbol="₹"
            locale="en-IN"
            showWords={true}
            scale={scale}
            tabSize="sm"
          />
          <div className={styles.inspectorCard}>
            <h4>Live State Inspector</h4>
            <div className={styles.stateGrid}>
              <div className={styles.stateItem}>
                <span className={styles.label}>Active Mode</span>
                <span className={styles.val}>
                  {mainTab === 'one-time' ? 'One time amount' : 'Target amount'}
                </span>
              </div>
              <div className={styles.stateItem}>
                <span className={styles.label}>Formatted Value</span>
                <span className={styles.val}>
                  ₹{sanctnum(mainValue).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.stateItem}>
                <span className={styles.label}>Raw Numeric String</span>
                <span className={styles.val}>{mainValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

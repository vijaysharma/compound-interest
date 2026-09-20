import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface ChapterViaHealthNpsProps {
  section80Ccd1b: string;
  setSection80Ccd1b: (v: string) => void;
  section80Ccd2: string;
  setSection80Ccd2: (v: string) => void;
  section80DSelf: string;
  setSection80DSelf: (v: string) => void;
  seniorSelf80D: boolean;
  setSeniorSelf80D: (v: boolean) => void;
  section80DParents: string;
  setSection80DParents: (v: string) => void;
  seniorParents80D: boolean;
  setSeniorParents80D: (v: boolean) => void;
}
export const ChapterViaHealthNps: React.FC<ChapterViaHealthNpsProps> = ({
  section80Ccd1b,
  setSection80Ccd1b,
  section80Ccd2,
  setSection80Ccd2,
  section80DSelf,
  setSection80DSelf,
  seniorSelf80D,
  setSeniorSelf80D,
  section80DParents,
  setSection80DParents,
  seniorParents80D,
  setSeniorParents80D,
}) => {
  return (
    <>
      <div className={styles.formField}>
        <label htmlFor="tax-deduction-80ccd1b" className={styles.label}>
          Section 80CCD(1B) — NPS Tier 1 Self Contribution
          <span className={styles.fieldBadgeGreen}>(Max ₹50,000)</span>
        </label>
        <input
          id="tax-deduction-80ccd1b"
          type="text"
          value={section80Ccd1b}
          onChange={(e) => setSection80Ccd1b(e.target.value)}
          placeholder="Up to ₹50,000 extra beyond 80C"
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-deduction-80ccd2" className={styles.label}>
          Section 80CCD(2) — Employer NPS Contribution
          <span className={styles.fieldBadgeIndigo}>(Both Regimes)</span>
        </label>
        <input
          id="tax-deduction-80ccd2"
          type="text"
          value={section80Ccd2}
          onChange={(e) => setSection80Ccd2(e.target.value)}
          placeholder="Up to 10% of Basic salary"
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <div className={styles.flexBetweenCenter}>
          <label htmlFor="tax-deduction-80d-self" className={styles.label}>
            Section 80D — Health Insurance (Self &amp; Family)
          </label>
          <label className={`${styles.checkboxToggle} ${styles.smallToggle}`}>
            <input
              type="checkbox"
              checked={seniorSelf80D}
              onChange={(e) => setSeniorSelf80D(e.target.checked)}
              className={styles.primaryCheckbox}
            />
            <span>Senior (Limit ₹50k)</span>
          </label>
        </div>
        <input
          id="tax-deduction-80d-self"
          type="text"
          value={section80DSelf}
          onChange={(e) => setSection80DSelf(e.target.value)}
          placeholder={seniorSelf80D ? 'Max ₹50,000 for Senior Citizen' : 'Max ₹25,000'}
          className={styles.input}
        />
      </div>
      <div className={styles.formField}>
        <div className={styles.flexBetweenCenter}>
          <label htmlFor="tax-deduction-80d-parents" className={styles.label}>
            Section 80D — Health Insurance (Parents)
          </label>
          <label className={`${styles.checkboxToggle} ${styles.smallToggle}`}>
            <input
              type="checkbox"
              checked={seniorParents80D}
              onChange={(e) => setSeniorParents80D(e.target.checked)}
              className={styles.primaryCheckbox}
            />
            <span>Senior Parents (Limit ₹50k)</span>
          </label>
        </div>
        <input
          id="tax-deduction-80d-parents"
          type="text"
          value={section80DParents}
          onChange={(e) => setSection80DParents(e.target.value)}
          placeholder={seniorParents80D ? 'Max ₹50,000 for Senior Parents' : 'Max ₹25,000'}
          className={styles.input}
        />
      </div>
    </>
  );
};

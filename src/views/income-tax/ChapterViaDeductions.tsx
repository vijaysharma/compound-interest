import React from 'react';
import { ChapterViaHealthNps } from './ChapterViaHealthNps';
import { ChapterViaLoansDonations } from './ChapterViaLoansDonations';
import styles from '../IncomeTaxCalculator.module.scss';
interface ChapterViaDeductionsProps {
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
  section80E: string;
  setSection80E: (v: string) => void;
  section80G: string;
  setSection80G: (v: string) => void;
  section80Tta: string;
  setSection80Tta: (v: string) => void;
  section80Gg: string;
  setSection80Gg: (v: string) => void;
  section80Ddb: string;
  setSection80Ddb: (v: string) => void;
  section80U: string;
  setSection80U: (v: string) => void;
  section80Eea: string;
  setSection80Eea: (v: string) => void;
  section80Eeb: string;
  setSection80Eeb: (v: string) => void;
  section80Dd: string;
  setSection80Dd: (v: string) => void;
  section80Ggc: string;
  setSection80Ggc: (v: string) => void;
  otherDeductions: string;
  setOtherDeductions: (v: string) => void;
}
export const ChapterViaDeductions: React.FC<ChapterViaDeductionsProps> = ({
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
  ...loansDonationsProps
}) => {
  return (
    <div className={`${styles.formGrid2} ${styles.marginTop1}`}>
      <ChapterViaHealthNps
        section80Ccd1b={section80Ccd1b}
        setSection80Ccd1b={setSection80Ccd1b}
        section80Ccd2={section80Ccd2}
        setSection80Ccd2={setSection80Ccd2}
        section80DSelf={section80DSelf}
        setSection80DSelf={setSection80DSelf}
        seniorSelf80D={seniorSelf80D}
        setSeniorSelf80D={setSeniorSelf80D}
        section80DParents={section80DParents}
        setSection80DParents={setSection80DParents}
        seniorParents80D={seniorParents80D}
        setSeniorParents80D={setSeniorParents80D}
      />
      <ChapterViaLoansDonations {...loansDonationsProps} />
    </div>
  );
};

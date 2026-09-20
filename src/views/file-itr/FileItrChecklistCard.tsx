import React from 'react';
import { FiCheckCircle, FiDownload, FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { Link } from '@/navigation';
import { Form16ExtractedData } from './types';
import { TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import styles from '../FileItr.module.scss';
interface FileItrChecklistCardProps {
  formData: Form16ExtractedData;
  taxComparison: TaxComparisonResult;
  handleDownloadSummary: () => void;
}
export const FileItrChecklistCard: React.FC<FileItrChecklistCardProps> = ({
  formData,
  taxComparison,
  handleDownloadSummary,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            <FiCheckCircle /> Ready to File ITR-1 (Sahaj)
          </h3>
          <p className={styles.cardSub}>
            Follow these 4 verified steps to complete your e-filing on the government portal.
          </p>
        </div>
      </div>
      <div className={styles.checklist}>
        <div className={styles.checklistItem}>
          <FiCheckCircle className={styles.checkIcon} size={18} />
          <div>
            <strong>1. Verify Form 26AS &amp; AIS/TIS</strong>
            <br />
            Login to incometax.gov.in, go to &quot;Services &gt; Annual Information Statement (AIS)&quot;
            and verify that your employer has deposited ₹{formData.tdsDeducted.toLocaleString('en-IN')} TDS
            under Section 192.
          </div>
        </div>
        <div className={styles.checklistItem}>
          <FiCheckCircle className={styles.checkIcon} size={18} />
          <div>
            <strong>2. Select ITR Form: ITR-1 (Sahaj)</strong>
            <br />
            Since your income is from salary, one house property, and other sources (interest)
            totaling under ₹50 Lakhs, select <strong>ITR-1</strong> on the portal.
          </div>
        </div>
        <div className={styles.checklistItem}>
          <FiCheckCircle className={styles.checkIcon} size={18} />
          <div>
            <strong>3. Opt for {taxComparison.recommendedRegime.toUpperCase()} Tax Regime</strong>
            <br />
            The {taxComparison.recommendedRegime.toUpperCase()} Regime saves you ₹
            {Math.round(taxComparison.taxSavings).toLocaleString('en-IN')} in tax. Select this
            regime when prompted in Part A of the ITR.
          </div>
        </div>
        <div className={styles.checklistItem}>
          <FiCheckCircle className={styles.checkIcon} size={18} />
          <div>
            <strong>4. E-Verify with Aadhaar OTP for Instant Refund</strong>
            <br />
            Ensure your bank account is pre-validated for direct ECS refund credit. E-verify
            immediately using Aadhaar OTP to get refunds credited in 10-15 business days.
          </div>
        </div>
      </div>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtnPrimary}
          onClick={handleDownloadSummary}
        >
          <FiDownload /> Download ITR Computation (JSON)
        </button>
        <a
          href="https://eportal.incometax.gov.in/iec/foservices/#/login"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionBtnSecondary}
        >
          Go to Income Tax Portal <FiExternalLink />
        </a>
        <Link href="/income-tax-calculator" className={styles.actionBtnSecondary}>
          Full Tax Calculator <FiArrowRight />
        </Link>
      </div>
    </div>
  );
};

import React from 'react';
import { Form16ExtractedData } from './types';
import { RegimeTaxResult, TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import styles from '../FileItr.module.scss';
interface FileItrHeroBannerProps {
  formData: Form16ExtractedData;
  taxComparison: TaxComparisonResult;
  recommendedResult: RegimeTaxResult;
  refundDifference: number;
  isRefundDue: boolean;
  isBalanceTaxPayable: boolean;
}
export const FileItrHeroBanner: React.FC<FileItrHeroBannerProps> = ({
  formData,
  taxComparison,
  recommendedResult,
  refundDifference,
  isRefundDue,
  isBalanceTaxPayable,
}) => {
  return (
    <section
      className={`${styles.heroBanner} ${
        isRefundDue ? styles.heroRefund : isBalanceTaxPayable ? styles.heroPayable : styles.heroNil
      }`}
    >
      <div className={styles.heroContent}>
        <div
          className={`${styles.heroTag} ${
            isRefundDue ? styles.tagRefund : isBalanceTaxPayable ? styles.tagPayable : styles.tagPrimary
          }`}
        >
          {isRefundDue
            ? '🟢 Income Tax Refund Due'
            : isBalanceTaxPayable
              ? '🔴 Balance Tax Payable'
              : '⚪ Nil Return / Zero Balance'}
        </div>
        <h2 className={styles.heroTitle}>
          ₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}
        </h2>
        <p className={styles.heroSub}>
          {isRefundDue ? (
            <>
              You are entitled to a refund of{' '}
              <strong>₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}</strong> because
              your employer deducted ₹{formData.tdsDeducted.toLocaleString('en-IN')} TDS, but your total tax
              liability under the {taxComparison.recommendedRegime.toUpperCase()} Regime is only ₹
              {Math.round(recommendedResult.totalTaxPayable).toLocaleString('en-IN')}.
            </>
          ) : isBalanceTaxPayable ? (
            <>
              You have a pending tax liability of{' '}
              <strong>₹{Math.abs(Math.round(refundDifference)).toLocaleString('en-IN')}</strong> to pay
              before filing your return.
            </>
          ) : (
            <>Your TDS matches your tax liability exactly. No additional payment or refund is due.</>
          )}
        </p>
      </div>
      <div className={styles.heroMetrics}>
        <div className={styles.heroMetricItem}>
          <span className={styles.heroMetricLabel}>TDS Deducted (Form 16)</span>
          <span className={styles.heroMetricValue}>₹{formData.tdsDeducted.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.heroMetricItem}>
          <span className={styles.heroMetricLabel}>Optimal Tax Liability</span>
          <span
            className={`${styles.heroMetricValue} ${
              isRefundDue ? styles.metricRefund : styles.metricPayable
            }`}
          >
            ₹{Math.round(recommendedResult.totalTaxPayable).toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.heroMetricItem}>
          <span className={styles.heroMetricLabel}>Recommended Regime</span>
          <span className={`${styles.heroMetricValue} ${styles.textCapitalize}`}>
            {taxComparison.recommendedRegime} Regime
          </span>
        </div>
        <div className={styles.heroMetricItem}>
          <span className={styles.heroMetricLabel}>Regime Tax Savings</span>
          <span className={`${styles.heroMetricValue} ${styles.metricSuccess}`}>
            ₹{Math.round(taxComparison.taxSavings).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </section>
  );
};

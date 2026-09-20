import React from 'react';
import DisplayCard from '../../components/DisplayCard';
import { PieSlices } from './emiPieChart';
import { EmiPieSvg } from './EmiPieSvg';
import styles from '../EmiCalculator.module.scss';
interface EmiLoanAnalyticsProps {
  principalAmount: number;
  totalInterest: number;
  totalPayable: number;
  principalPercent: number;
  interestPercent: number;
  tenureMonths: number;
  regularEmisCount: number;
  partPaymentsCount: number;
  totalPaymentsCount: number;
  pieSlices: PieSlices;
  scheduleLength: number;
  hasEmiAdjustment: boolean;
  currentEmi: number;
  baseMonthlyEmi: number;
}
export const EmiLoanAnalytics: React.FC<EmiLoanAnalyticsProps> = ({
  principalAmount,
  totalInterest,
  totalPayable,
  principalPercent,
  interestPercent,
  tenureMonths,
  regularEmisCount,
  partPaymentsCount,
  totalPaymentsCount,
  pieSlices,
  scheduleLength,
  hasEmiAdjustment,
  currentEmi,
  baseMonthlyEmi,
}) => {
  const isEmiRevised =
    hasEmiAdjustment &&
    currentEmi > 0 &&
    Math.round(currentEmi) !== Math.round(baseMonthlyEmi);
  return (
    <div className={styles.resultsCol}>
      {principalAmount > 0 && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <p className={styles.cardEyebrow}>Breakdown &amp; Analytics</p>
              <h2 className={styles.cardHeading}>Loan Statistics &amp; Payment Proportion</h2>
            </div>
          </div>
          <div className={styles.analyticsGrid}>
            <EmiPieSvg
              pieSlices={pieSlices}
              principalAmount={principalAmount}
              principalPercent={principalPercent}
              totalInterest={totalInterest}
              interestPercent={interestPercent}
            />
            <div className={styles.metricsStack}>
              <div className={`${styles.metricPill} ${styles.metricPillPrimary}`}>
                <div className={styles.metricIndicatorGroup}>
                  <div className={`${styles.metricDot} ${styles.metricDotPrimary}`} />
                  <div>
                    <span className={styles.metricLabel}>Principal Loan Amount</span>
                    <span className={styles.metricSub}>{principalPercent.toFixed(1)}% of total</span>
                  </div>
                </div>
                <span className={`${styles.metricValue} ${styles.metricValuePrimary}`}>
                  ₹{Math.round(principalAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`${styles.metricPill} ${styles.metricPillError}`}>
                <div className={styles.metricIndicatorGroup}>
                  <div className={`${styles.metricDot} ${styles.metricDotError}`} />
                  <div>
                    <span className={styles.metricLabel}>Total Interest Payable</span>
                    <span className={styles.metricSub}>{interestPercent.toFixed(1)}% of total</span>
                  </div>
                </div>
                <span className={`${styles.metricValue} ${styles.metricValueError}`}>
                  ₹{Math.round(totalInterest).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`${styles.metricPill} ${styles.metricPillNeutral}`}>
                <span className={styles.metricLabel}>Total Loan Cost (P + I)</span>
                <span className={`${styles.metricValue} ${styles.metricValueTotal}`}>
                  ₹{Math.round(totalPayable).toLocaleString('en-IN')}
                </span>
              </div>
              <div className={`${styles.metricPill} ${styles.metricPillNeutral}`}>
                <div>
                  <span className={styles.metricLabel}>Repayment Duration</span>
                  <span className={styles.metricSub}>
                    {regularEmisCount} EMIs
                    {partPaymentsCount > 0 ? ` + ${partPaymentsCount} Prepayments` : ''}
                    {regularEmisCount < tenureMonths
                      ? ` (Saved ${tenureMonths - regularEmisCount} mos)`
                      : regularEmisCount > tenureMonths
                        ? ` (+${regularEmisCount - tenureMonths} mos)`
                        : ''}
                  </span>
                </div>
                <span className={styles.metricValue}>{(regularEmisCount / 12).toFixed(1)} yrs</span>
              </div>
            </div>
          </div>
          {scheduleLength > 0 && (
            <span className={styles.countBadge}>
              {totalPaymentsCount} Total Payments
              {partPaymentsCount > 0
                ? ` (${regularEmisCount} EMIs + ${partPaymentsCount} Prepayment${partPaymentsCount === 1 ? '' : 's'})`
                : ` (${regularEmisCount} EMIs)`}
            </span>
          )}
        </section>
      )}
      <DisplayCard
        primaryAmount={Math.round(isEmiRevised ? currentEmi : baseMonthlyEmi)}
        title={isEmiRevised ? 'Revised Monthly EMI' : 'Monthly EMI Amount'}
        secondaryInfo={
          isEmiRevised
            ? {
                title: 'Original EMI',
                amount: Math.round(baseMonthlyEmi),
              }
            : undefined
        }
      />
    </div>
  );
};

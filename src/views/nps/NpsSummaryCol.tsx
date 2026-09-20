import React from 'react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import convertToWords, { getCurrencySymbol } from '../../utilities/currency';
import type { NPSCalculationResult } from '../../utilities/npsCalculations';
import styles from '../NpsCalculator.module.scss';
interface NpsSummaryColProps {
  npsResult: NPSCalculationResult;
  retirementAge: number;
}
export function NpsSummaryCol({ npsResult, retirementAge }: NpsSummaryColProps) {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <div className={styles.summaryCol}>
      {npsResult.isSmallCorpus && (
        <div className={styles.smallCorpusNotice}>
          <FiCheckCircle className={styles.smallCorpusIcon} />
          <span>
            <strong>PFRDA Small Corpus Exemption:</strong> Since total corpus is ≤ ₹{(npsResult.smallCorpusThreshold / 100000).toFixed(1)} Lakhs, you can withdraw <strong>100% tax-free lump sum</strong> without purchasing any mandatory annuity.
          </span>
        </div>
      )}
      {npsResult.isPremature && !npsResult.isSmallCorpus && (
        <div className={styles.prematureNotice}>
          <strong>⚠️ Premature Exit (Retirement before Age 60):</strong> Under PFRDA regulations, exit prior to age 60 mandates a minimum <strong>80% annuity investment</strong> and a maximum 20% lump sum withdrawal.
        </div>
      )}
      <div className={styles.heroPensionCard}>
        <div className={styles.heroPensionLabel}>Estimated Monthly Pension</div>
        <div className={styles.heroPensionAmount}>
          {currencySymbol}
          {npsResult.monthlyPension.toLocaleString('en-IN')}
          <span className={styles.perMonth}>/mo</span>
        </div>
        <div className={styles.heroPensionWords}>
          {npsResult.annuityPercent > 0
            ? `${convertToWords(npsResult.monthlyPension, 'en-IN')} per month for life`
            : '100% Lump Sum opted — No monthly annuity pension'}
        </div>
      </div>
      <div className={styles.statsGrid}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Pension Corpus</div>
          <div className={`${styles.statValue} ${styles.statValueCorpus}`}>
            {currencySymbol}{npsResult.totalCorpus.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Tax-Free Lump Sum ({npsResult.lumpSumPercent}%)</div>
          <div className={styles.statValue}>
            {currencySymbol}{npsResult.lumpSumAmount.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Total Invested</div>
          <div className={styles.statValue}>
            {currencySymbol}{npsResult.totalInvested.toLocaleString('en-IN')}
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Wealth Gained</div>
          <div className={`${styles.statValue} ${styles.statValueGain}`}>
            +{currencySymbol}{npsResult.interestEarned.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      <div className={styles.corpusSplitCard}>
        <div className={styles.corpusSplitTitle}>
          Corpus Utilization at Age {retirementAge} {npsResult.isPremature ? '(Premature Exit)' : '(Superannuation)'}
        </div>
        <div className={styles.splitBar}>
          <div
            className={styles.splitLumpSum}
            ref={(el) => { if (el) el.style.width = `${npsResult.lumpSumPercent}%`; }}
            title={`Lump Sum: ${npsResult.lumpSumPercent}%`}
          />
          <div
            className={styles.splitAnnuity}
            ref={(el) => { if (el) el.style.width = `${npsResult.annuityPercent}%`; }}
            title={`Annuity: ${npsResult.annuityPercent}%`}
          />
        </div>
        <div className={styles.splitLegend}>
          <div className={styles.splitItem}>
            <span className={styles.splitDotLumpSum} />
            <div>
              <div className={styles.splitTitle}>Lump Sum ({npsResult.lumpSumPercent}%)</div>
              <div className={styles.splitAmountLumpSum}>
                {currencySymbol}{npsResult.lumpSumAmount.toLocaleString('en-IN')}
              </div>
              <div className={styles.splitDesc}>100% Tax-Free (Sec 10(12A))</div>
            </div>
          </div>
          <div className={styles.splitItem}>
            <span className={styles.splitDotAnnuity} />
            <div>
              <div className={styles.splitTitle}>Annuity ({npsResult.annuityPercent}%)</div>
              <div className={styles.splitAmountAnnuity}>
                {currencySymbol}{npsResult.annuityCorpus.toLocaleString('en-IN')}
              </div>
              <div className={styles.splitDesc}>
                {npsResult.annuityPercent > 0
                  ? 'Lifelong Monthly Pension (Taxable at slab)'
                  : '0% Annuity allocated'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <section>
        <div className={styles.taxBenefitsHeader}>
          <FiAward className={styles.taxBenefitsAwardIcon} />
          <span>NPS Exclusive Tax Advantages</span>
        </div>
        <div className={styles.taxBenefitsList}>
          <div className={styles.taxBenefitItem}>
            <FiCheckCircle className={styles.taxBenefitIcon} />
            <div>
              <strong>Section 80CCD(1B):</strong> Exclusive additional ₹50,000 deduction over and above Section 80C limit.
            </div>
          </div>
          <div className={styles.taxBenefitItem}>
            <FiCheckCircle className={styles.taxBenefitIcon} />
            <div>
              <strong>Section 80CCD(2):</strong> Employer contribution up to 10% of Basic+DA is tax-free in both regimes without any ₹1.5L cap.
            </div>
          </div>
          <div className={styles.taxBenefitItem}>
            <FiCheckCircle className={styles.taxBenefitIcon} />
            <div>
              <strong>Section 10(12A):</strong> The 60% lump sum withdrawal at maturity is 100% tax-free.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import Link from '../../components/PrefetchLink';
import ValuePicker from '../../components/ValuePicker';
import { DEFAULT_RATE_STEPS } from '../../data/valuePickerData';
import convertToWords, { getCurrencySymbol } from '../../utilities/currency';
import { trackCalculatorEvent } from '../../utilities/analytics';
import { TENURE_STEPS, SIP_STEP_ROWS } from './simulatorData';
import styles from '../Home.module.scss';
export const HomeWealthSimulator: React.FC = () => {
  const [monthlySip, setMonthlySip] = useState(15000);
  const [expectedRoi, setExpectedRoi] = useState(12);
  const [tenureYears, setTenureYears] = useState(10);
  const quickCalc = useMemo(() => {
    const months = tenureYears * 12;
    const monthlyRate = expectedRoi / 100 / 12;
    const totalInvested = monthlySip * months;
    let maturityAmount = 0;
    for (let i = 1; i <= months; i++) {
      maturityAmount += monthlySip * Math.pow(1 + monthlyRate, months - i + 1);
    }
    const estimatedReturns = Math.max(0, maturityAmount - totalInvested);
    const wealthMultiple = (maturityAmount / (totalInvested || 1)).toFixed(1);
    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      maturityAmount: Math.round(maturityAmount),
      wealthMultiple,
    };
  }, [monthlySip, expectedRoi, tenureYears]);
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <section className={styles.simulatorSection}>
      <div className={styles.simulatorInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Interactive Wealth Growth Simulator</h2>
          <p className={styles.sectionSubtitle}>
            See the mathematical magic of compound interest and systematic compounding in action.
          </p>
        </div>
        <div className={styles.simulatorGrid}>
          <div className={styles.inputsCard}>
            <ValuePicker
              title="Monthly Investment"
              value={monthlySip.toString()}
              onChange={(v) => {
                const num = Math.max(0, parseInt(v, 10) || 0);
                setMonthlySip(num);
                trackCalculatorEvent('home_quick_sip', 'slider_changed', 'monthly_sip', num);
              }}
              symbol={currencySymbol}
              locale="en-IN"
              stepRows={SIP_STEP_ROWS}
            />
            <ValuePicker
              title="Expected Annual Return"
              symbol="%"
              value={expectedRoi}
              min={1}
              max={30}
              defaultStep={1}
              stepData={DEFAULT_RATE_STEPS}
              singleRow={true}
              showWords={false}
              onChange={(v) => {
                const num = Math.max(0, parseFloat(v) || 0);
                setExpectedRoi(num);
                trackCalculatorEvent('home_quick_sip', 'slider_changed', 'roi', num);
              }}
            />
            <ValuePicker
              title="Investment Horizon"
              symbol="Yr"
              symbolPosition="right"
              value={tenureYears}
              min={1}
              max={40}
              defaultStep={1}
              stepData={TENURE_STEPS}
              singleRow={true}
              showWords={false}
              onChange={(v) => {
                const num = Math.max(1, parseInt(v, 10) || 1);
                setTenureYears(num);
                trackCalculatorEvent('home_quick_sip', 'slider_changed', 'tenure_years', num);
              }}
            />
          </div>
          <div className={styles.resultCard}>
            <div className={styles.resultTag}>Projected Maturity Value</div>
            <div className={styles.resultAmount}>
              {currencySymbol}
              {quickCalc.maturityAmount.toLocaleString('en-IN')}
            </div>
            <div className={styles.resultWords}>
              {convertToWords(quickCalc.maturityAmount, 'en-IN')}
            </div>
            <div className={styles.resultBreakdown}>
              <div>
                <div className={styles.resultSubLabel}>Total Invested</div>
                <div className={styles.resultSubValue}>
                  {currencySymbol}
                  {quickCalc.totalInvested.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className={styles.resultSubLabel}>Estimated Wealth Gained</div>
                <div className={styles.gainValue}>
                  +{currencySymbol}
                  {quickCalc.estimatedReturns.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className={styles.multiplierRow}>
              <span>Wealth Multiplier:</span>
              <span className={styles.badgePrimary}>{quickCalc.wealthMultiple}x Capital</span>
            </div>
            <div className={styles.resultCardActions}>
              <Link to="/sip-calculator" className={styles.btnPrimary}>
                Open SIP Calculator &rarr;
              </Link>
              <Link to="/mutual-funds/sip" className={styles.btnOutline}>
                Mutual Fund SIP &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

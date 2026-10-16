'use client';
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { FiInfo } from 'react-icons/fi';
import Spinner from './Spinner';
import { useScrollLock } from '../utilities/useScrollLock';
import styles from './MutualFundDetailModal.module.scss';
import type { MutualFundDetailModalProps, DetailedFundItem } from './mutual-fund-modal/types';
import { useFundDetailState } from './mutual-fund-modal/useFundDetailState';
import { useFundDetailPerformance } from './mutual-fund-modal/useFundDetailPerformance';
import { FundModalHeader } from './mutual-fund-modal/FundModalHeader';
import { FundModalControls } from './mutual-fund-modal/FundModalControls';
import { FundModalStatsGrid } from './mutual-fund-modal/FundModalStatsGrid';
import { FundModalTaxSection } from './mutual-fund-modal/FundModalTaxSection';
import { FundModalPortfolioSection } from './mutual-fund-modal/FundModalPortfolioSection';
import { getConstituentProfile } from './mutual-fund-modal/utils';
export type { DetailedFundItem };
const Chart = dynamic(() => import('./Chart'), {
  ssr: false,
  loading: () => (
    <div className={styles.chartLoadingFallback}>
      <Spinner size="lg" label="Loading interactive chart..." />
    </div>
  ),
});
export default function MutualFundDetailModal({ fund, onClose }: MutualFundDetailModalProps) {
  useScrollLock(!!fund);
  const state = useFundDetailState(fund);
  const { performance, taxCalculations } = useFundDetailPerformance(
    fund,
    state.navData,
    state.investmentType,
    state.investmentValue,
    state.startDateISO,
    state.endDateISO,
    state.currentNavStartDate,
    state.currentNavEndDate,
    state.minNavDateISO,
    state.maxNavDateISO,
    state.holdingDays,
    state.holdingYears,
    state.isLongTerm,
    state.taxMode,
    state.fundCategory
  );
  const constituentProfile = useMemo(
    () => getConstituentProfile(state.meta, fund?.schemeName),
    [state.meta, fund?.schemeName]
  );
  if (!fund) return null;
  return (
    <div className={styles.dialogOverlay} role="dialog" aria-modal="true">
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close modal"
        onClick={onClose}
      />
      <section className={styles.modalContent}>
        {/* Header & Overview Stats Card */}
        <FundModalHeader
          fund={fund}
          meta={state.meta}
          performance={performance}
          holdingDays={state.holdingDays}
          startDateISO={state.startDateISO}
          endDateISO={state.endDateISO}
          onClose={onClose}
        />
        <div className={styles.modalBody}>
          {/* Main Middle Row: Chart on Left, Investment Controls on Right */}
          <div className={styles.chartAndControlsRow}>
            {/* Chart Card */}
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div className={styles.chartTitleLeft}>
                  <span className={styles.chartTitleText}>
                    Historical NAV &amp; Portfolio Trajectory
                  </span>
                  <FiInfo
                    className={styles.chartInfoIcon}
                    title="Historical NAV and portfolio trajectory"
                  />
                </div>
              </div>
              <div className={styles.chartInnerWrap}>
                <Chart
                  className={styles.chart}
                  datasets={performance.datasets}
                  investmentAmount={performance.invested}
                  dataMode="value"
                  autoHeight={true}
                  minHeight={280}
                  enableZoom={true}
                  showPresets={true}
                  startDate={state.currentNavStartDate}
                  endDate={state.currentNavEndDate}
                  onPresetChange={state.handleSelectPreset}
                />
              </div>
            </div>
            {/* Investment Controls Card */}
            <div className={styles.controlsSideCol}>
              <FundModalControls
                investmentType={state.investmentType}
                setInvestmentType={state.setInvestmentType}
                investmentValue={state.investmentValue}
                setInvestmentValue={state.setInvestmentValue}
                startDateISO={state.startDateISO}
                endDateISO={state.endDateISO}
                minNavDateISO={state.minNavDateISO}
                maxNavDateISO={state.maxNavDateISO}
                onStartDateChange={state.setStartDateISO}
                onEndDateChange={state.setEndDateISO}
              />
            </div>
          </div>
          {/* Investment Results Section */}
          <FundModalStatsGrid
            performance={performance}
            investmentType={state.investmentType}
            holdingDays={state.holdingDays}
            holdingYears={state.holdingYears}
          />
          {/* Post-Tax In-Hand Returns Section */}
          <FundModalTaxSection
            taxMode={state.taxMode}
            setTaxMode={state.setTaxMode}
            taxCalculations={taxCalculations}
            performance={performance}
            holdingDays={state.holdingDays}
            holdingYears={state.holdingYears}
            fundCategory={state.fundCategory}
            isLongTerm={state.isLongTerm}
          />
          {/* Scheme Portfolio & Structural Profile */}
          <FundModalPortfolioSection meta={state.meta} constituentProfile={constituentProfile} />
        </div>
        {/* Modal Footer with Done button */}
        <div className={styles.footer}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </section>
    </div>
  );
}

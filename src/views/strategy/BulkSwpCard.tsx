'use client';
import React, { useId, useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { formatRupees } from './money';
import {
  CASCADE_INTERVAL_MONTHS,
  CASCADE_INTERVAL_OPTIONS,
  cascadeDate,
  isFundOverridden,
} from './configMutators';
import { FREQUENCY_LABEL, FREQUENCY_OPTIONS } from './schedule';
import type { StrategyConfigApi } from './useStrategyConfig';
import type {
  BulkSwpConfig,
  CascadeInterval,
  Frequency,
  StrategyConfig,
} from './types';
import styles from './StrategyCalculator.module.scss';
export interface BulkSwpCardProps {
  config: StrategyConfig;
  api: StrategyConfigApi;
}
const BaseBulkSwpCard = ({ config, api }: BulkSwpCardProps) => {
  const contentId = useId();
  const [isOpen, setIsOpen] = useState(true);
  const funds = config.column2;
  const fundsCount = funds.length;
  const firstFund = funds[0];
  const initialSwpAmount =
    firstFund?.swp.enabled && firstFund.swp.amount > 0 ? firstFund.swp.amount : 20000;
  const initialReinvestment =
    firstFund?.swp.enabled ? firstFund.swp.toColumn3 : initialSwpAmount;
  const initialStart =
    firstFund?.swp.startDate ||
    firstFund?.sipStartDate ||
    config.column1.withdrawals[0]?.startDate ||
    config.column1.investmentDate ||
    '2023-01-01';
  const initialEnd =
    firstFund?.swp.endDate ||
    config.asOfDate ||
    '2025-01-01';
  const initialFreq = firstFund?.swp.frequency || 'monthly';
  const [swpAmount, setSwpAmount] = useState<number>(initialSwpAmount);
  const [reinvestmentAmount, setReinvestmentAmount] = useState<number>(initialReinvestment);
  const [isReinvestmentSynced, setIsReinvestmentSynced] = useState<boolean>(
    initialReinvestment === initialSwpAmount
  );
  const [frequency, setFrequency] = useState<Frequency>(initialFreq);
  const [startDate, setStartDate] = useState<string>(initialStart);
  const [endDate, setEndDate] = useState<string>(initialEnd);
  const [cascadeInterval, setCascadeInterval] = useState<CascadeInterval>('1 Quarter');
  const [autoSync, setAutoSync] = useState<boolean>(false);
  const currentParams: BulkSwpConfig = {
    swpAmount,
    reinvestmentAmount,
    frequency,
    startDate,
    endDate,
    cascadeInterval,
  };
  const handleSwpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = raw === '' ? 0 : Math.max(0, Number(raw));
    setSwpAmount(num);
    let nextReinvest = reinvestmentAmount;
    if (isReinvestmentSynced) {
      nextReinvest = num;
      setReinvestmentAmount(num);
    } else if (reinvestmentAmount > num) {
      nextReinvest = num;
      setReinvestmentAmount(num);
    }
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        swpAmount: num,
        reinvestmentAmount: nextReinvest,
      });
    }
  };
  const handleReinvestmentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = raw === '' ? 0 : Math.max(0, Number(raw));
    const capped = swpAmount > 0 ? Math.min(num, swpAmount) : num;
    setReinvestmentAmount(capped);
    setIsReinvestmentSynced(capped === swpAmount);
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        reinvestmentAmount: capped,
      });
    }
  };
  const handleResyncReinvestment = () => {
    setReinvestmentAmount(swpAmount);
    setIsReinvestmentSynced(true);
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        reinvestmentAmount: swpAmount,
      });
    }
  };
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextFreq = e.target.value as Frequency;
    setFrequency(nextFreq);
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        frequency: nextFreq,
      });
    }
  };
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStart = e.target.value;
    setStartDate(nextStart);
    let nextEnd = endDate;
    if (endDate && nextStart && nextStart > endDate) {
      nextEnd = nextStart;
      setEndDate(nextStart);
    }
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        startDate: nextStart,
        endDate: nextEnd,
      });
    }
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEnd = e.target.value;
    setEndDate(nextEnd);
    let nextStart = startDate;
    if (startDate && nextEnd && nextEnd < startDate) {
      nextStart = nextEnd;
      setStartDate(nextEnd);
    }
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        startDate: nextStart,
        endDate: nextEnd,
      });
    }
  };
  const handleCascadeIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextInterval = e.target.value as CascadeInterval;
    setCascadeInterval(nextInterval);
    if (autoSync && fundsCount > 0) {
      api.applyBulkSwp({
        ...currentParams,
        cascadeInterval: nextInterval,
      });
    }
  };
  const handleApply = () => {
    api.applyBulkSwp(currentParams);
  };
  const anySwpEnabled = funds.some((entry) => entry.swp.enabled);
  const monthsPerInterval = CASCADE_INTERVAL_MONTHS[cascadeInterval] ?? 3;
  const modifiedCount = funds.filter((entry, idx) =>
    isFundOverridden(entry, idx, currentParams)
  ).length;
  const freqLabel =
    frequency === 'monthly' ? 'mo' : frequency === 'quarterly' ? 'qtr' : 'yr';
  const summaryMeta = `${formatRupees(swpAmount)}/${freqLabel} · ${cascadeInterval} cascade`;
  return (
    <div className={styles.bulkCard} aria-labelledby="bulk-swp-heading">
      <div className={styles.bulkCardHeader}>
        <button
          type="button"
          id="bulk-swp-heading"
          className={styles.bulkTitleToggle}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          {isOpen ? <FiChevronDown aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
          <span>Global SWP controls</span>
        </button>
        {!isOpen && <span className={styles.badge}>{summaryMeta}</span>}
        {fundsCount > 0 && (
          <span className={styles.badge}>
            {fundsCount} {fundsCount === 1 ? 'fund' : 'funds'}
          </span>
        )}
      </div>
      <div id={contentId} className={styles.bulkFormGrid} hidden={!isOpen}>
        <p className={styles.bulkSubtitle}>
          Apply consistent SWP rules across all growth funds and cascade their start and end dates.
        </p>
        <div className={styles.bulkRowTwoCol}>
          <div className={styles.bulkField}>
            <label htmlFor="bulk-swp-amount" className={styles.bulkLabel}>
              SWP per month
            </label>
            <div className={styles.bulkInputWrapper}>
              <span className={styles.bulkCurrency} aria-hidden="true">₹</span>
              <input
                id="bulk-swp-amount"
                type="number"
                min={0}
                step={1000}
                value={swpAmount === 0 ? '' : swpAmount}
                onChange={handleSwpAmountChange}
                placeholder="e.g. 20000"
                className={styles.bulkNumericInput}
                aria-label="SWP per month"
              />
            </div>
          </div>
          <div className={styles.bulkField}>
            <div className={styles.bulkLabelRow}>
              <label htmlFor="bulk-reinvestment-amount" className={styles.bulkLabel}>
                Of which to reinvestment loop
              </label>
              {isReinvestmentSynced ? (
                <span className={styles.syncBadge} title="Automatically syncing with SWP amount">
                  Synced
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResyncReinvestment}
                  className={styles.syncButton}
                  title="Click to mirror SWP amount"
                >
                  Re-sync
                </button>
              )}
            </div>
            <div className={styles.bulkInputWrapper}>
              <span className={styles.bulkCurrency} aria-hidden="true">₹</span>
              <input
                id="bulk-reinvestment-amount"
                type="number"
                min={0}
                max={swpAmount > 0 ? swpAmount : undefined}
                step={1000}
                value={reinvestmentAmount === 0 ? '' : reinvestmentAmount}
                onChange={handleReinvestmentAmountChange}
                placeholder="e.g. 20000"
                className={styles.bulkNumericInput}
                aria-label="Of which to reinvestment loop"
              />
            </div>
          </div>
        </div>
        <div className={styles.bulkRowTwoCol}>
          <div className={styles.bulkField}>
            <label htmlFor="bulk-frequency" className={styles.bulkLabel}>
              Frequency
            </label>
            <div className={styles.selectRow}>
              <select
                id="bulk-frequency"
                className={styles.selectInput}
                value={frequency}
                onChange={handleFrequencyChange}
                aria-label="SWP frequency"
              >
                {FREQUENCY_OPTIONS.map((freq) => (
                  <option key={freq} value={freq}>
                    {FREQUENCY_LABEL[freq]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.bulkField}>
            <label htmlFor="bulk-cascade-interval" className={styles.bulkLabel}>
              Cascade interval
            </label>
            <div className={styles.selectRow}>
              <select
                id="bulk-cascade-interval"
                className={styles.selectInput}
                value={cascadeInterval}
                onChange={handleCascadeIntervalChange}
                aria-label="Cascade interval"
              >
                {CASCADE_INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className={styles.bulkRowTwoCol}>
          <div className={styles.bulkField}>
            <label htmlFor="bulk-start-date" className={styles.bulkLabel}>
              Baseline start (Fund 1)
            </label>
            <input
              id="bulk-start-date"
              type="date"
              className={styles.bulkDateInput}
              value={startDate}
              onChange={handleStartDateChange}
              aria-label="Baseline SWP start date for Fund 1"
            />
          </div>
          <div className={styles.bulkField}>
            <label htmlFor="bulk-end-date" className={styles.bulkLabel}>
              Baseline end (Fund 1)
            </label>
            <input
              id="bulk-end-date"
              type="date"
              className={styles.bulkDateInput}
              value={endDate}
              onChange={handleEndDateChange}
              aria-label="Baseline SWP end date for Fund 1"
            />
          </div>
        </div>
        {fundsCount > 0 && (
          <div className={styles.previewSchedule}>
            <div className={styles.previewScheduleHeader}>
              <span>Cascaded dates preview</span>
              {modifiedCount > 0 ? (
                <span className={styles.modifiedPill}>
                  {modifiedCount} {modifiedCount === 1 ? 'fund' : 'funds'} modified
                </span>
              ) : (
                <span className={styles.offsetPill}>All funds in sync</span>
              )}
            </div>
            {funds.map((entry, index) => {
              const offset = index * monthsPerInterval;
              const cascadedStart = cascadeDate(startDate, offset);
              const cascadedEnd = cascadeDate(endDate, offset);
              const isOverridden = isFundOverridden(entry, index, currentParams);
              return (
                <div key={entry.id} className={styles.previewRow}>
                  <div className={styles.previewFundName} title={entry.fund.schemeName}>
                    <span
                      className={styles.fundDot}
                      ref={(el) => {
                        if (el) el.style.backgroundColor = entry.fund.color;
                      }}
                      aria-hidden="true"
                    />
                    <span>{entry.fund.schemeName}</span>
                  </div>
                  <div className={styles.previewDates}>
                    {cascadedStart} → {cascadedEnd}
                    {offset > 0 ? (
                      <span className={styles.offsetPill}>+{offset}m</span>
                    ) : (
                      <span className={styles.offsetPill}>Base</span>
                    )}
                    {isOverridden && <span className={styles.modifiedPill}>Custom</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className={styles.bulkActionsRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleApply}
            disabled={fundsCount === 0}
          >
            {fundsCount > 0
              ? `Apply SWP to all ${fundsCount} ${fundsCount === 1 ? 'fund' : 'funds'}`
              : 'Select funds first to apply SWP'}
          </button>
          {anySwpEnabled && (
            <button
              type="button"
              className={styles.bulkSecondaryButton}
              onClick={api.disableBulkSwp}
              title="Turn off SWP across all growth funds"
            >
              Disable all SWP
            </button>
          )}
        </div>
        {fundsCount > 0 && (
          <div className={styles.checkboxRow}>
            <input
              id="bulk-auto-sync"
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
            />
            <label htmlFor="bulk-auto-sync" className={styles.bulkLabel}>
              Auto-sync changes to all funds live
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
export const BulkSwpCard = React.memo(BaseBulkSwpCard);

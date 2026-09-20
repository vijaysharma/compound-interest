import React, { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { TopUpEvent } from './types';
import styles from './StrategyCalculator.module.scss';
interface StepCTopUpsSectionProps {
  topUps: TopUpEvent[];
  onAddTopUp: (date: string, amount: number, note?: string) => void;
  onRemoveTopUp: (id: string) => void;
  durationYears: number;
  onDurationChange: (years: number) => void;
}
export const StepCTopUpsSection: React.FC<StepCTopUpsSectionProps> = ({
  topUps,
  onAddTopUp,
  onRemoveTopUp,
  durationYears,
  onDurationChange,
}) => {
  const [topUpDate, setTopUpDate] = useState('2026-06-01');
  const [topUpAmount, setTopUpAmount] = useState('500000');
  const [topUpNote, setTopUpNote] = useState('');
  const handleAdd = () => {
    const amt = parseFloat(topUpAmount);
    if (!topUpDate || isNaN(amt) || amt <= 0) return;
    onAddTopUp(topUpDate, amt, topUpNote.trim() || undefined);
    setTopUpNote('');
  };
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>Step C</div>
        <div className={styles.stageTitleGroup}>
          <h2 className={styles.stageTitle}>Dynamic Top-Ups &amp; Continuous Horizon</h2>
          <span className={styles.stageSubtitle}>&ldquo;This Continues&rdquo; &mdash; Injection events along the timeline</span>
        </div>
      </div>
      <div className={styles.topUpsControls}>
        <div className={styles.timelineDurationRow}>
          <span className={styles.durationLabel}>Simulation Horizon:</span>
          <div className={styles.durationButtons}>
            {[5, 10, 15, 20].map((yr) => (
              <button
                key={yr}
                type="button"
                className={`${styles.durationBtn} ${durationYears === yr ? styles.activeDuration : ''}`}
                onClick={() => onDurationChange(yr)}
              >
                {yr} Years
              </button>
            ))}
          </div>
        </div>
        <div className={styles.addTopUpRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="topup-date">Top-Up Date</label>
            <input
              id="topup-date"
              type="date"
              className={styles.dateInput}
              value={topUpDate}
              onChange={(e) => setTopUpDate(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="topup-amount">Top-Up Amount (₹)</label>
            <input
              id="topup-amount"
              type="number"
              className={styles.numInput}
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="topup-note">Event Note (Optional)</label>
            <input
              id="topup-note"
              type="text"
              className={styles.textInput}
              placeholder="e.g. Annual Bonus / Asset Sale"
              value={topUpNote}
              onChange={(e) => setTopUpNote(e.target.value)}
            />
          </div>
          <button type="button" className={styles.addTopUpBtn} onClick={handleAdd}>
            <FiPlus /> Add Top-Up
          </button>
        </div>
        {topUps.length > 0 && (
          <div className={styles.topUpsList}>
            {topUps.map((tu) => (
              <div key={tu.id} className={styles.topUpChip}>
                <span className={styles.topUpDate}>{tu.date}</span>
                <span className={styles.topUpAmount}>+₹{tu.amount.toLocaleString('en-IN')}</span>
                {tu.note && <span className={styles.topUpNote}>({tu.note})</span>}
                <button
                  type="button"
                  className={styles.deleteTopUpBtn}
                  onClick={() => onRemoveTopUp(tu.id)}
                  aria-label="Remove top up"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

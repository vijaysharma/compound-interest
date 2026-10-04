'use client';
import React, { useState } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiUploadCloud,
  FiCheck,
  FiX,
  FiCloud,
  FiDatabase,
  FiTrendingUp,
} from 'react-icons/fi';
import { getCurrencySymbol } from '../../utilities/currency';
import type {
  PPFCalculationResult,
  PpfInvestmentRecord,
  PPFFutureMode,
} from '../../utilities/ppfCalculations';
import styles from '../PpfCalculator.module.scss';
interface PpfHistoryManagerProps {
  investments: PpfInvestmentRecord[];
  ppfResult: PPFCalculationResult;
  futureContributionMode: PPFFutureMode;
  setFutureContributionMode: React.Dispatch<React.SetStateAction<PPFFutureMode>>;
  addInvestment: (entry: {
    investmentDate: string;
    amount: number;
    notes?: string;
  }) => Promise<void>;
  editInvestment: (entry: {
    id: string;
    investmentDate: string;
    amount: number;
    notes?: string;
  }) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  importInvestments: (
    entries: Array<{ investmentDate: string; amount: number; notes?: string }>
  ) => Promise<void>;
  clearAllInvestments: () => Promise<void>;
  isSaving: boolean;
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  statusMessage?: string;
  isModal?: boolean;
  onSwitchToMf?: () => void;
}
export const PpfHistoryManager: React.FC<PpfHistoryManagerProps> = ({
  investments,
  ppfResult,
  futureContributionMode,
  setFutureContributionMode,
  addInvestment,
  editInvestment,
  deleteInvestment,
  importInvestments,
  clearAllInvestments,
  isSaving,
  syncStatus,
  statusMessage,
  isModal = false,
  onSwitchToMf,
}) => {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayStr);
  const [amount, setAmount] = useState<string>('150000');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  // Bulk import state
  const [showImport, setShowImport] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const numAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) {
      setFormError('Please enter a valid deposit amount');
      return;
    }
    if (!date) {
      setFormError('Please select a valid date');
      return;
    }
    try {
      await addInvestment({
        investmentDate: date,
        amount: numAmount,
        notes: notes.trim(),
      });
      setNotes('');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  };
  const startEditing = (record: PpfInvestmentRecord) => {
    setEditingId(record.id);
    setEditDate(record.investmentDate);
    setEditAmount(String(record.amount));
    setEditNotes(record.notes || '');
  };
  const handleEditSave = async (id: string) => {
    const numAmount = Number(editAmount.replace(/[^0-9]/g, ''));
    if (!numAmount || numAmount <= 0) return;
    try {
      await editInvestment({
        id,
        investmentDate: editDate,
        amount: numAmount,
        notes: editNotes.trim(),
      });
      setEditingId(null);
    } catch {
      // Handled in hook
    }
  };
  const handleBulkImport = async () => {
    setImportFeedback(null);
    if (!importText.trim()) return;
    const lines = importText.split('\n');
    const parsed: Array<{ investmentDate: string; amount: number; notes?: string }> = [];
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // Format: YYYY-MM-DD, amount, notes
      const parts = line.split(/[,\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const invDate = parts[0];
        const invAmount = Number(parts[1].replace(/[^0-9.]/g, ''));
        const invNotes = parts[2] || '';
        if (invDate && invAmount > 0) {
          parsed.push({
            investmentDate: invDate,
            amount: invAmount,
            notes: invNotes,
          });
        }
      }
    }
    if (parsed.length === 0) {
      setImportFeedback(
        'No valid lines parsed. Expected format: YYYY-MM-DD, amount, optional notes'
      );
      return;
    }
    await importInvestments(parsed);
    setImportText('');
    setShowImport(false);
    setImportFeedback(`Imported ${parsed.length} entries successfully`);
  };
  return (
    <section className={isModal ? `${styles.historySection} ${styles.historySectionModal}` : styles.historySection}>
      <div className={styles.historyTopBar}>
        <div>
          {!isModal ? (
            <>
              <h2 className={styles.historyTitle}>
                <FiDatabase /> Actual PPF Investment History &amp; Passbook
                {investments.length > 0 && (
                  <span className={styles.historyBadge}>{investments.length} Deposits</span>
                )}
              </h2>
              <p className={styles.historySub}>
                Record real past deposits to calculate official interest using 5th-of-the-month rules
                and real historical rates.
              </p>
            </>
          ) : (
            <p className={styles.historySub} style={{ margin: 0 }}>
              Record real past deposits to compute exact interest under RBI 5th-of-the-month rules
              and declared historical rates.
            </p>
          )}
        </div>
        <div className={styles.historyHeaderActions}>
          {onSwitchToMf && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSwitchToMf}
              title="Compare same deposits with mutual fund real outcome"
            >
              <FiTrendingUp /> Compare with Mutual Funds
            </button>
          )}
          {!isModal && (
            <span
              className={styles.syncBadge}
              title={statusMessage || 'All changes saved to database'}
            >
              <FiCloud />
              {syncStatus === 'saving'
                ? 'Saving to DB...'
                : syncStatus === 'synced'
                  ? 'Synced to Database'
                  : 'Local Offline Cache'}
            </span>
          )}
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setShowImport(!showImport)}
          >
            <FiUploadCloud /> {showImport ? 'Close Import' : 'Import / CSV'}
          </button>
        </div>
      </div>
      {/* Summary stats for actual historical portfolio */}
      {investments.length > 0 && (
        <div className={styles.historyStatsGrid}>
          <div className={styles.historyStatBox}>
            <div className={styles.historyStatLabel}>Current PPF Balance</div>
            <div className={styles.historyStatVal}>
              {currencySymbol}
              {ppfResult.currentBalance.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={styles.historyStatBox}>
            <div className={styles.historyStatLabel}>Total Invested To Date</div>
            <div className={styles.historyStatVal}>
              {currencySymbol}
              {ppfResult.investedToDate.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={styles.historyStatBox}>
            <div className={styles.historyStatLabel}>Total Interest Credited</div>
            <div className={`${styles.historyStatVal} ${styles.interestCell}`}>
              +{currencySymbol}
              {ppfResult.interestEarnedToDate.toLocaleString('en-IN')}
            </div>
          </div>
          <div className={styles.historyStatBox}>
            <div className={styles.historyStatLabel}>Opening Financial Year</div>
            <div className={styles.historyStatVal}>
              FY {ppfResult.openingFyStart}-
              {String((ppfResult.openingFyStart + 1) % 100).padStart(2, '0')}
            </div>
          </div>
        </div>
      )}
      {/* Bulk CSV / Text Import */}
      {showImport && (
        <div className={styles.importBox}>
          <div className={styles.importTitle}>
            Paste Investment Records (One deposit per line)
          </div>
          <div className={styles.importSubtitle}>
            Format: <code>YYYY-MM-DD, Amount, Notes</code> (e.g.{' '}
            <code>2022-04-03, 150000, SBI NetBanking</code>)
          </div>
          <textarea
            className={styles.importTextarea}
            placeholder={`2021-04-04, 150000, SBI deposit\n2022-04-02, 150000, Netbanking\n2023-04-05, 100000\n2023-09-12, 50000`}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          {importFeedback && (
            <div className={styles.importFeedback}>
              {importFeedback}
            </div>
          )}
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleBulkImport}
              disabled={isSaving}
            >
              Parse &amp; Import Entries
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setShowImport(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Add New Investment Record Form */}
      <form className={styles.historyForm} onSubmit={handleAddSubmit}>
        <div className={styles.formFieldsRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="ppf-date-input">
              Investment Date
            </label>
            <input
              id="ppf-date-input"
              type="date"
              className={styles.historyInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="ppf-amount-input">
              Deposit Amount (₹)
            </label>
            <input
              id="ppf-amount-input"
              type="text"
              className={styles.historyInput}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 150000"
              required
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="ppf-notes-input">
              Notes / Bank (Optional)
            </label>
            <input
              id="ppf-notes-input"
              type="text"
              className={styles.historyInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Post Office, SBI transfer"
            />
          </div>
          <div>
            <button type="submit" className={styles.addBtn} disabled={isSaving}>
              <FiPlus /> Add Record
            </button>
          </div>
        </div>
        {formError && (
          <div className={styles.formErrorMessage}>
            {formError}
          </div>
        )}
      </form>
      {/* Future Projections Selector */}
      {investments.length > 0 && (
        <div className={styles.projectionToggleSection}>
          <div>
            <strong>Future Contributions After History:</strong>
            <div className={styles.projectionDesc}>
              Choose whether forward projections assume ongoing deposits or let the current balance
              compound on its own.
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.secondaryBtn} ${
                futureContributionMode === 'continue' ? styles.addBtn : ''
              }`}
              onClick={() => setFutureContributionMode('continue')}
            >
              Continue Contributing
            </button>
            <button
              type="button"
              className={`${styles.secondaryBtn} ${
                futureContributionMode === 'stop' ? styles.addBtn : ''
              }`}
              onClick={() => setFutureContributionMode('stop')}
            >
              Stop New Deposits
            </button>
          </div>
        </div>
      )}
      {/* Investment Records Table */}
      {investments.length > 0 && (
        <div className={styles.historyTableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount (₹)</th>
                <th>Interest Eligibility</th>
                <th>Notes</th>
                <th className={styles.thActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((entry) => {
                const isEditing = editingId === entry.id;
                const dayNum = parseInt(entry.investmentDate.slice(8, 10), 10);
                const isEarly = dayNum <= 5;
                if (isEditing) {
                  return (
                    <tr key={entry.id}>
                      <td>
                        <input
                          type="date"
                          className={`${styles.historyInput} ${styles.editInputCompact}`}
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={`${styles.historyInput} ${styles.editInputAmount}`}
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      </td>
                      <td>
                        <span className={styles.editEligibilityText}>
                          {parseInt(editDate.slice(8, 10), 10) <= 5
                            ? 'Earns Month Interest'
                            : 'Next Month'}
                        </span>
                      </td>
                      <td>
                        <input
                          type="text"
                          className={`${styles.historyInput} ${styles.editInputCompact}`}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </td>
                      <td className={styles.tdActions}>
                        <div
                          className={`${styles.actionBtnGroup} ${styles.actionBtnGroupRight}`}
                        >
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => handleEditSave(entry.id)}
                            title="Save changes"
                          >
                            <FiCheck />
                          </button>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            onClick={() => setEditingId(null)}
                            title="Cancel"
                          >
                            <FiX />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.investmentDate}</strong>
                    </td>
                    <td>
                      {currencySymbol}
                      {entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span
                        className={`${styles.rateBadge} ${
                          isEarly ? styles.rateBadgeEarly : styles.rateBadgeLate
                        }`}
                      >
                        {isEarly ? 'On/Before 5th (Full Month)' : 'After 5th (Next Month)'}
                      </span>
                    </td>
                    <td>{entry.notes || '-'}</td>
                    <td className={styles.tdActions}>
                      <div className={`${styles.actionBtnGroup} ${styles.actionBtnGroupRight}`}>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          onClick={() => startEditing(entry)}
                          title="Edit record"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnDanger}`}
                          onClick={() => deleteInvestment(entry.id)}
                          title="Delete record"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {investments.length > 0 && (
        <div className={styles.clearAllRow}>
          <button
            type="button"
            className={`${styles.secondaryBtn} ${styles.dangerBtn}`}
            onClick={() => {
              if (
                window.confirm('Are you sure you want to clear all historical investment records?')
              ) {
                void clearAllInvestments();
              }
            }}
          >
            <FiTrash2 /> Clear All Investment Records
          </button>
        </div>
      )}
    </section>
  );
};

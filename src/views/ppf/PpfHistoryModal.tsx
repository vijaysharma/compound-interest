'use client';
import React, { useState, useEffect } from 'react';
import { FiDatabase, FiTrendingUp, FiX, FiCloud } from 'react-icons/fi';
import { useScrollLock } from '../../utilities/useScrollLock';
import type {
  PPFCalculationResult,
  PpfInvestmentRecord,
  PPFFutureMode,
} from '../../utilities/ppfCalculations';
import { PpfHistoryManager } from './PpfHistoryManager';
import { PpfMutualFundComparison } from './PpfMutualFundComparison';
import styles from './PpfHistoryModal.module.scss';
export interface PpfHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'passbook' | 'mf-compare';
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
}
export const PpfHistoryModal: React.FC<PpfHistoryModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'passbook',
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
}) => {
  const [activeTab, setActiveTab] = useState<'passbook' | 'mf-compare'>(initialTab);
  useScrollLock(isOpen);
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ppf-history-modal-title"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close modal"
        onClick={onClose}
      />
      <div className={styles.modalCard}>
        {/* Modal Top Header */}
        <div data-dialog-header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h3 id="ppf-history-modal-title" data-dialog-title className={styles.modalTitle}>
              <FiDatabase /> Actual PPF Investment History &amp; Passbook
            </h3>
            {investments.length > 0 && (
              <span className={styles.countBadge}>{investments.length} Deposits</span>
            )}
            <span className={styles.syncIndicator} title={statusMessage || 'Synced to database'}>
              <FiCloud />
              {syncStatus === 'saving'
                ? 'Saving...'
                : syncStatus === 'synced'
                  ? 'Synced'
                  : 'Offline Cache'}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Close passbook modal"
            onClick={onClose}
          >
            <FiX style={{ fontSize: '1.25rem' }} />
          </button>
        </div>
        {/* Modal Navigation Tabs */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'passbook' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('passbook')}
          >
            <FiDatabase />
            <span>Passbook &amp; Records</span>
            {investments.length > 0 && (
              <span className={styles.tabBadge}>{investments.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'mf-compare' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('mf-compare')}
          >
            <FiTrendingUp />
            <span>Mutual Fund Real Outcome</span>
            <span className={`${styles.tabBadge} ${styles.tabBadgeCompare}`}>Real NAV</span>
          </button>
        </div>
        {/* Modal Body with Tab Content */}
        <div className={styles.modalBody}>
          {activeTab === 'passbook' ? (
            <PpfHistoryManager
              investments={investments}
              ppfResult={ppfResult}
              futureContributionMode={futureContributionMode}
              setFutureContributionMode={setFutureContributionMode}
              addInvestment={addInvestment}
              editInvestment={editInvestment}
              deleteInvestment={deleteInvestment}
              importInvestments={importInvestments}
              clearAllInvestments={clearAllInvestments}
              isSaving={isSaving}
              syncStatus={syncStatus}
              statusMessage={statusMessage}
              isModal={true}
              onSwitchToMf={() => setActiveTab('mf-compare')}
            />
          ) : (
            <PpfMutualFundComparison
              investments={investments}
              ppfResult={ppfResult}
              onSwitchToPassbook={() => setActiveTab('passbook')}
              importInvestments={importInvestments}
            />
          )}
        </div>
      </div>
    </div>
  );
};

'use client';
import React from 'react';
import { FiShield } from 'react-icons/fi';
import SEOHead from '../components/SEOHead';
import { ppfSchema } from '../data/seo/ppfData';
import { usePpfState } from './ppf/usePpfState';
import { PpfInputs } from './ppf/PpfInputs';
import { PpfSummaryCol } from './ppf/PpfSummaryCol';
import { PpfHistoryModal } from './ppf/PpfHistoryModal';
import { PpfScheduleTable } from './ppf/PpfScheduleTable';
import { PpfContent } from './ppf/PpfContent';
import styles from './PpfCalculator.module.scss';
const PpfCalculator: React.FC = () => {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState<boolean>(false);
  const [historyModalTab, setHistoryModalTab] = React.useState<'passbook' | 'mf-compare'>('passbook');

  const handleOpenPassbookModal = () => {
    setHistoryModalTab('passbook');
    setIsHistoryModalOpen(true);
  };

  const handleOpenMfComparison = () => {
    setHistoryModalTab('mf-compare');
    setIsHistoryModalOpen(true);
  };

  const {
    frequency,
    setFrequency,
    depositAmount,
    setDepositAmount,
    depositTiming,
    setDepositTiming,
    startYear,
    setStartYear,
    extensionBlocks,
    setExtensionBlocks,
    extensionMode,
    setExtensionMode,
    projectedRate,
    setProjectedRate,
    expandedYear,
    setExpandedYear,
    ppfResult,
    investedPercent,
    gainsPercent,
    wealthMultiplier,
    investments,
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
  } = usePpfState();
  return (
    <main className={styles.container}>
      <SEOHead
        title="PPF Calculator India — Historical & Projected Public Provident Fund Returns"
        description="Official PPF Calculator following RBI 5th-of-the-month rules, real historical interest rates, 5-year extension blocks, and EEE tax-exempt maturity value."
        keywords="PPF calculator, public provident fund calculator, PPF interest rate, 5th of month rule PPF, PPF extension calculator, PPF maturity calculator, tax free savings India, Section 80C PPF, PPF rules RBI"
        canonicalPath="/ppf-calculator"
        schema={ppfSchema}
      />
      <header className={styles.header}>
        <div className={styles.badge}>
          <FiShield className={styles.badgeIcon} />
          Government of India &bull; RBI Rules &bull; EEE Tax-Free
        </div>
        <h1 className={styles.title}>PPF Calculator (Public Provident Fund)</h1>
        <p className={styles.subtitle}>
          Calculate PPF compounding using real historical interest rates declared each year by the
          Ministry of Finance, 5th-of-the-month interest rules, and 5-year extension blocks.
        </p>
      </header>
      <div className={styles.formGrid}>
        <PpfInputs
          frequency={frequency}
          setFrequency={setFrequency}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          depositTiming={depositTiming}
          setDepositTiming={setDepositTiming}
          startYear={startYear}
          setStartYear={setStartYear}
          extensionBlocks={extensionBlocks}
          setExtensionBlocks={setExtensionBlocks}
          extensionMode={extensionMode}
          setExtensionMode={setExtensionMode}
          projectedRate={projectedRate}
          setProjectedRate={setProjectedRate}
        />
        <PpfSummaryCol
          ppfResult={ppfResult}
          investedPercent={investedPercent}
          gainsPercent={gainsPercent}
          wealthMultiplier={wealthMultiplier}
        />
      </div>
      <PpfScheduleTable
        yearlyBreakdown={ppfResult.yearlyBreakdown}
        expandedYear={expandedYear}
        setExpandedYear={setExpandedYear}
        onOpenPassbookModal={handleOpenPassbookModal}
        onOpenMfComparison={handleOpenMfComparison}
        investmentsCount={investments.length}
      />
      {isHistoryModalOpen && (
        <PpfHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          initialTab={historyModalTab}
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
        />
      )}
      <PpfContent />
    </main>
  );
};
export default PpfCalculator;

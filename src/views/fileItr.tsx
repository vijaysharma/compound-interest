'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import {
  getAssessmentYear,
  getLatestRunningFinancialYear,
} from '../utilities/incomeTaxCalculations';
import { useFileItrState } from './file-itr/useFileItrState';
import { FileItrHeader } from './file-itr/FileItrHeader';
import { FileItrUploadDropzone } from './file-itr/FileItrUploadDropzone';
import { FileItrHeroBanner } from './file-itr/FileItrHeroBanner';
import { FileItrDetailsCard } from './file-itr/FileItrDetailsCard';
import { FileItrRegimeComparisonCard } from './file-itr/FileItrRegimeComparisonCard';
import { FileItrChecklistCard } from './file-itr/FileItrChecklistCard';
import styles from './FileItr.module.scss';
const FileItr: React.FC = () => {
  const {
    formData,
    fileName,
    isDragOver,
    setIsDragOver,
    isSampleLoaded,
    fileInputRef,
    handleFileUpload,
    handleDrop,
    loadSampleForm16,
    resetForm,
    updateField,
    taxComparison,
    recommendedResult,
    refundDifference,
    isRefundDue,
    isBalanceTaxPayable,
    handleDownload,
  } = useFileItrState();
  const currentFy = getLatestRunningFinancialYear();
  const currentAy = getAssessmentYear(currentFy);
  return (
    <main className={styles.container}>
      <SEOHead
        title={`Upload Form 16 & Prepare Income Tax Return (ITR) India — FY ${currentFy} (${currentAy})`}
        description="Auto-extract salary from Form 16, verify TDS deducted, compare New vs Old Tax Regime, compute refund or balance tax payable, and prepare your ITR filing summary."
        keywords="Form 16 upload, prepare ITR 1, tax refund check, compare old new regime, Form 16 parser India, file income tax return"
        canonicalPath="/file-itr"
      />
      <FileItrHeader />
      <FileItrUploadDropzone
        fileInputRef={fileInputRef}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        handleDrop={handleDrop}
        handleFileUpload={handleFileUpload}
        loadSampleForm16={loadSampleForm16}
        fileName={fileName}
        isSampleLoaded={isSampleLoaded}
        onClear={resetForm}
      />
      <FileItrHeroBanner
        formData={formData}
        taxComparison={taxComparison}
        recommendedResult={recommendedResult}
        refundDifference={refundDifference}
        isRefundDue={isRefundDue}
        isBalanceTaxPayable={isBalanceTaxPayable}
      />
      <div className={styles.mainGrid}>
        <FileItrDetailsCard
          formData={formData}
          updateField={updateField}
        />
        <div className={styles.columnGap15}>
          <FileItrRegimeComparisonCard
            formData={formData}
            taxComparison={taxComparison}
          />
          <FileItrChecklistCard
            formData={formData}
            taxComparison={taxComparison}
            handleDownloadSummary={handleDownload}
          />
        </div>
      </div>
    </main>
  );
};
export default FileItr;

'use client';
import React from 'react';
import { FiDownload, FiShare2, FiExternalLink } from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';
import styles from '../NotesModal.module.scss';
interface BackupCloudButtonsProps {
  onDumpGoogleDrive: () => void;
  onDumpOneDrive: () => void;
  onNativeShare: () => void;
  onDownloadBackup: () => void;
}
export const BackupCloudButtons: React.FC<BackupCloudButtonsProps> = ({
  onDumpGoogleDrive,
  onDumpOneDrive,
  onNativeShare,
  onDownloadBackup,
}) => {
  return (
    <div>
      <label className={styles.sectionLabel}>
        Dump to Cloud Storage
      </label>
      <button onClick={onDumpGoogleDrive} className={styles.cloudOptionBtn}>
        <div className={styles.cloudBtnLeft}>
          <div className={styles.driveIconBox}>
            <SiGoogledrive size={20} />
          </div>
          <div>
            <h4 className={styles.cloudBtnTitle}>Dump to Google Drive</h4>
            <p className={styles.cloudBtnDesc}>Save directly into your Google Drive folders</p>
          </div>
        </div>
        <FiExternalLink size={16} className={styles.linkIconDim} />
      </button>
      <button onClick={onDumpOneDrive} className={styles.cloudOptionBtn}>
        <div className={styles.cloudBtnLeft}>
          <div className={styles.oneDriveIconBox}>
            <svg className={styles.svgIcon20} viewBox="0 0 24 24">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
            </svg>
          </div>
          <div>
            <h4 className={styles.cloudBtnTitle}>Dump to Microsoft OneDrive</h4>
            <p className={styles.cloudBtnDesc}>Save directly into your OneDrive personal or work vault</p>
          </div>
        </div>
        <FiExternalLink size={16} className={styles.linkIconDim} />
      </button>
      <button onClick={onNativeShare} className={styles.cloudOptionBtn}>
        <div className={styles.cloudBtnLeft}>
          <div className={styles.shareIconBox}>
            <FiShare2 size={20} />
          </div>
          <div>
            <h4 className={styles.cloudBtnTitle}>Share to Drive / Files App</h4>
            <p className={styles.cloudBtnDesc}>Open device share sheet (Drive, OneDrive, Files)</p>
          </div>
        </div>
        <FiShare2 size={16} className={styles.linkIconDim} />
      </button>
      <button onClick={onDownloadBackup} className={styles.cloudOptionBtn}>
        <div className={styles.cloudBtnLeft}>
          <div className={styles.downloadIconBox}>
            <FiDownload size={20} />
          </div>
          <div>
            <h4 className={styles.cloudBtnTitle}>Download JSON File</h4>
            <p className={styles.cloudBtnDesc}>Save standard backup file to device or external storage</p>
          </div>
        </div>
        <FiDownload size={16} className={styles.linkIconDim} />
      </button>
    </div>
  );
};

import React from 'react';
import { FiFileText, FiUploadCloud, FiCheckCircle } from 'react-icons/fi';
import styles from '../FileItr.module.scss';
interface FileItrUploadDropzoneProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loadSampleForm16: () => void;
  fileName: string;
  isSampleLoaded: boolean;
  onClear: () => void;
}
export const FileItrUploadDropzone: React.FC<FileItrUploadDropzoneProps> = ({
  fileInputRef,
  isDragOver,
  setIsDragOver,
  handleDrop,
  handleFileUpload,
  loadSampleForm16,
  fileName,
  isSampleLoaded,
  onClear,
}) => {
  return (
    <section className={styles.uploadCard}>
      <div
        className={`${styles.dropzone} ${isDragOver ? styles.dropzoneActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.json,.csv"
          className={styles.fileInputHidden}
          onChange={handleFileUpload}
        />
        <div className={styles.dropzoneIcon}>
          <FiUploadCloud size={28} />
        </div>
        <h3 className={styles.dropzoneTitle}>Upload Form 16 (PDF, Text, or JSON)</h3>
        <p className={styles.dropzoneSubtitle}>
          Drag and drop your Form 16 Part B here, or click to browse from your device.
          <br />
          100% private: All data stays in your browser and is never stored on a server.
        </p>
        <div className={styles.dropzoneActions} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <FiFileText /> Browse File
          </button>
          <button
            type="button"
            className={styles.sampleBtn}
            onClick={loadSampleForm16}
          >
            <FiCheckCircle /> Load Sample Form 16
          </button>
        </div>
      </div>
      {fileName && (
        <div className={styles.fileSuccessBanner}>
          <div className={styles.fileSuccessInfo}>
            <FiCheckCircle size={18} />
            <span>
              Loaded: <strong>{fileName}</strong> {isSampleLoaded && '(Pre-filled with Sample Data)'}
            </span>
          </div>
          <button
            type="button"
            className={styles.clearFileBtn}
            onClick={onClear}
          >
            Clear &amp; Reset
          </button>
        </div>
      )}
    </section>
  );
};

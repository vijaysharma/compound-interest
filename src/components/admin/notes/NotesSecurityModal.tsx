import React from 'react';
import { FiShield, FiLock, FiCheckCircle, FiX, FiKey, FiServer, FiSmartphone, FiCloud } from 'react-icons/fi';
import styles from './NotesModal.module.scss';
interface NotesSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageProvider?: 'vercel_blob' | 'database_fallback' | null;
}
export const NotesSecurityModal: React.FC<NotesSecurityModalProps> = ({
  isOpen,
  onClose,
  storageProvider,
}) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div
        className={`${styles.modalBox} ${styles.modalBoxLg}`}
        style={{ padding: '1.5rem', position: 'relative' }}
        role="dialog"
        aria-labelledby="security-modal-title"
      >
        <button
          onClick={onClose}
          className={styles.closeBtn}
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          aria-label="Close modal"
        >
          <FiX size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', paddingRight: '2.5rem' }}>
          <div className={styles.modalIconSuccess}>
            <FiShield size={24} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
              <h3 id="security-modal-title" className={styles.modalTitle} style={{ fontSize: '1.125rem' }}>
                End-to-End Encrypted
              </h3>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                AES-256-GCM
              </span>
            </div>
            <p className={styles.modalSubtitle} style={{ marginTop: '0.25rem' }}>Zero-Knowledge Client-Side Protection</p>
          </div>
        </div>
        <div className={styles.alertSuccess} style={{ marginBottom: '1rem', lineHeight: 1.4 }}>
          <FiCheckCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Your notes and titles are encrypted in your browser before they are synced to the cloud.
            Only your device holds the keys to decrypt and view them.
          </span>
        </div>
        {storageProvider && (
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              background: storageProvider === 'vercel_blob' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCloud size={16} style={{ flexShrink: 0 }} />
              <span>
                Storage Engine:{' '}
                <strong>
                  {storageProvider === 'vercel_blob'
                    ? 'Vercel Blob (S3 Object Storage)'
                    : 'PostgreSQL Database (Fallback)'}
                </strong>
              </span>
            </div>
            <span
              className={`${styles.badge} ${storageProvider === 'vercel_blob' ? styles.badgeInfo : styles.badgeWarning}`}
            >
              {storageProvider === 'vercel_blob' ? 'DB Offloaded' : 'Token Needed'}
            </span>
          </div>
        )}
        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FiKey size={16} />
            </div>
            <div>
              <h4 className={styles.featureHeading}>AES-GCM 256-Bit Cryptography</h4>
              <p className={styles.featureDesc}>
                Utilizes the native Web Crypto API with Galois/Counter Mode (GCM) for authenticated encryption
                and tamper detection. Every encryption generates a unique 96-bit cryptographic IV.
              </p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FiServer size={16} />
            </div>
            <div>
              <h4 className={styles.featureHeading}>Zero-Knowledge Cloud Sync</h4>
              <p className={styles.featureDesc}>
                The database server only ever receives and stores ciphertext (scrambled characters).
                Even in the event of a server inspection or database export, your note content cannot be read.
              </p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FiSmartphone size={16} />
            </div>
            <div>
              <h4 className={styles.featureHeading}>Cross-Device Key Derivation</h4>
              <p className={styles.featureDesc}>
                Derived on device using PBKDF2 with 100,000 rounds of SHA-256 tied to your authenticated account session,
                enabling seamless sync across your mobile phone, tablet, and desktop without tedious key exports.
              </p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FiCloud size={16} />
            </div>
            <div>
              <h4 className={styles.featureHeading}>Persistent Object Storage (Vercel Blob / S3)</h4>
              <p className={styles.featureDesc}>
                Note bodies and media are offloaded directly to persistent S3-compatible cloud object storage
                (Vercel Blob), freeing up relational database storage while keeping database queries fast and scalable.
              </p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <FiLock size={16} />
            </div>
            <div>
              <h4 className={styles.featureHeading}>Optional Passcode Lock</h4>
              <p className={styles.featureDesc}>
                In addition to end-to-end encryption, you can lock individual sensitive notes with a private
                passcode for on-screen privacy.
              </p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className={styles.btnPrimary}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

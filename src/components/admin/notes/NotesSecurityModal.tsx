import React from 'react';
import { FiShield, FiLock, FiCheckCircle, FiX, FiKey, FiServer, FiSmartphone, FiCloud } from 'react-icons/fi';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="card bg-base-100 border border-base-300 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative rounded-2xl animate-scaleUp"
        role="dialog"
        aria-labelledby="security-modal-title"
      >
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm btn-square absolute top-4 right-4 text-base-content/50 hover:text-base-content"
          aria-label="Close modal"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
            <FiShield className="h-6 w-6" />
          </div>
          <div>
            <h3 id="security-modal-title" className="text-lg font-bold flex items-center gap-2">
              End-to-End Encrypted
              <span className="badge badge-success badge-sm font-semibold text-[10px] uppercase tracking-wider">
                AES-256-GCM
              </span>
            </h3>
            <p className="text-xs text-base-content/60">Zero-Knowledge Client-Side Protection</p>
          </div>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-xl p-3 mb-3 text-xs text-success-content/90 flex items-start gap-2.5">
          <FiCheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <span>
            Your notes and titles are encrypted in your browser before they are synced to the cloud.
            Only your device holds the keys to decrypt and view them.
          </span>
        </div>
        {storageProvider && (
          <div
            className={`border rounded-xl p-3 mb-5 text-xs flex items-center justify-between gap-2 ${
              storageProvider === 'vercel_blob'
                ? 'bg-info/10 border-info/20 text-info-content'
                : 'bg-warning/10 border-warning/20 text-warning-content'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiCloud className="w-4 h-4 flex-shrink-0" />
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
              className={`badge badge-xs font-semibold py-2 px-2.5 ${
                storageProvider === 'vercel_blob' ? 'badge-info' : 'badge-warning'
              }`}
            >
              {storageProvider === 'vercel_blob' ? 'DB Offloaded' : 'Token Needed'}
            </span>
          </div>
        )}
        <div className="space-y-3.5 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-base-200/80 text-primary flex-shrink-0 mt-0.5">
              <FiKey className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-base-content">AES-GCM 256-Bit Cryptography</h4>
              <p className="text-base-content/65 mt-0.5 leading-relaxed">
                Utilizes the native Web Crypto API with Galois/Counter Mode (GCM) for authenticated encryption
                and tamper detection. Every encryption generates a unique 96-bit cryptographic IV.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-base-200/80 text-primary flex-shrink-0 mt-0.5">
              <FiServer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-base-content">Zero-Knowledge Cloud Sync</h4>
              <p className="text-base-content/65 mt-0.5 leading-relaxed">
                The database server only ever receives and stores ciphertext (scrambled characters).
                Even in the event of a server inspection or database export, your note content cannot be read.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-base-200/80 text-primary flex-shrink-0 mt-0.5">
              <FiSmartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-base-content">Cross-Device Key Derivation</h4>
              <p className="text-base-content/65 mt-0.5 leading-relaxed">
                Derived on device using PBKDF2 with 100,000 rounds of SHA-256 tied to your authenticated account session,
                enabling seamless sync across your mobile phone, tablet, and desktop without tedious key exports.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-base-200/80 text-primary flex-shrink-0 mt-0.5">
              <FiCloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-base-content">Persistent Object Storage (Vercel Blob / S3)</h4>
              <p className="text-base-content/65 mt-0.5 leading-relaxed">
                Note bodies and media are offloaded directly to persistent S3-compatible cloud object storage
                (Vercel Blob), freeing up relational database storage while keeping database queries fast and scalable.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-base-200/80 text-primary flex-shrink-0 mt-0.5">
              <FiLock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-base-content">Optional Passcode Lock</h4>
              <p className="text-base-content/65 mt-0.5 leading-relaxed">
                In addition to end-to-end encryption, you can lock individual sensitive notes with a private
                passcode for on-screen privacy.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-base-200 flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-sm rounded-xl px-5 font-semibold">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

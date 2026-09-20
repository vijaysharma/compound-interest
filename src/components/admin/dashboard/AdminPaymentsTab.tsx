'use client';
import React, { ChangeEvent, FormEvent } from 'react';
import styles from '../../../views/Admin.module.scss';
export interface AdminPaymentsTabProps {
  payTitle: string;
  payUpiId: string;
  payAmount: number;
  payQrUrl: string;
  payInstructions: string;
  busy: string | null;
  onTitleChange: (val: string) => void;
  onUpiIdChange: (val: string) => void;
  onAmountChange: (val: number) => void;
  onQrUrlChange: (val: string) => void;
  onInstructionsChange: (val: string) => void;
  onQrFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}
export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = React.memo(
  ({
    payTitle,
    payUpiId,
    payAmount,
    payQrUrl,
    payInstructions,
    busy,
    onTitleChange,
    onUpiIdChange,
    onAmountChange,
    onQrUrlChange,
    onInstructionsChange,
    onQrFileUpload,
    onSubmit,
  }) => (
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>UPI Payment &amp; QR Code Configuration</h2>
      <p className={styles.sectionDesc}>
        Customize the ₹54 paywall payment details, UPI ID, QR code image, and instructions shown
        to users.
      </p>
      <form onSubmit={onSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.label}>
              Payment Title
            </label>
            <input
              type="text"
              required
              value={payTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>
              UPI ID / VPA
            </label>
            <input
              type="text"
              required
              value={payUpiId}
              onChange={(e) => onUpiIdChange(e.target.value)}
              placeholder="e.g. yourname@okhdfcbank or merchant@upi"
              className={`${styles.input} ${styles.inputMono}`}
            />
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label className={styles.label}>
              Subscription Fee (₹)
            </label>
            <input
              type="number"
              min="1"
              required
              value={payAmount}
              onChange={(e) => onAmountChange(Number(e.target.value))}
              className={styles.input}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.label}>
              Upload QR Code Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onQrFileUpload}
              className={styles.fileInput}
            />
          </div>
        </div>
        <div className={styles.formField}>
          <label className={styles.label}>
            QR Code Image URL or Base64 Data URL
          </label>
          <input
            type="text"
            value={payQrUrl}
            onChange={(e) => onQrUrlChange(e.target.value)}
            placeholder="https://example.com/upi-qr.png or data:image/png;base64,..."
            className={`${styles.input} ${styles.inputMono}`}
          />
        </div>
        {payQrUrl && (
          <div className={styles.qrPreview}>
            <span className={styles.qrPreviewTitle}>
              Live QR Preview in User Paywall
            </span>
            <img
              src={payQrUrl}
              alt="QR Preview"
              className={styles.qrImage}
            />
          </div>
        )}
        <div className={styles.formField}>
          <label className={styles.label}>
            Instructions Text for Users
          </label>
          <textarea
            rows={2}
            value={payInstructions}
            onChange={(e) => onInstructionsChange(e.target.value)}
            className={styles.textarea}
          />
        </div>
        <button
          type="submit"
          disabled={busy === 'saving_settings'}
          className={styles.btnPrimary}
        >
          {busy === 'saving_settings' ? (
            <>
              <span className={styles.spinner} />
              <span>Saving Settings...</span>
            </>
          ) : (
            <span>Save Payment Settings &amp; QR Code</span>
          )}
        </button>
      </form>
    </section>
  )
);
AdminPaymentsTab.displayName = 'AdminPaymentsTab';

'use client';
import React from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import type { PaymentSubmission } from '../../../types/auth';
import styles from '../../../views/Admin.module.scss';
export interface AdminSubmissionsTabProps {
  submissions: PaymentSubmission[];
  busy: string | null;
  onRefresh: () => void;
  onProcessPayment: (submissionId: string, action: 'approve' | 'reject') => void;
}
export const AdminSubmissionsTab: React.FC<AdminSubmissionsTabProps> = React.memo(
  ({ submissions, busy, onRefresh, onProcessPayment }) => (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.sectionTitle}>UPI Payment Submissions</h2>
          <p className={styles.subtitle}>
            Review submitted UPI UTR numbers and approve 30-day Pro access.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={styles.btnOutline}
        >
          Refresh
        </button>
      </div>
      {submissions.length === 0 ? (
        <p className={styles.emptyPlaceholder}>
          No payment submissions recorded yet.
        </p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User Email</th>
                <th>UTR / Ref Number</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th className={styles.tableRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id}>
                  <td className={styles.cellUserEmail}>{sub.user_email}</td>
                  <td className={styles.cellUtrRef}>
                    {sub.utr_ref}
                  </td>
                  <td>₹{sub.amount}</td>
                  <td className={styles.cellDate}>
                    {new Date(sub.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        sub.status === 'approved'
                          ? styles.badgeSuccess
                          : sub.status === 'rejected'
                            ? styles.badgeError
                            : styles.badgeWarning
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className={styles.tableRight}>
                    {sub.status === 'pending' ? (
                      <div className={styles.actionsGroup}>
                        <button
                          type="button"
                          disabled={busy === `sub_${sub.id}`}
                          onClick={() => onProcessPayment(sub.id, 'approve')}
                          className={styles.btnSuccess}
                        >
                          <FiCheck />
                          <span>Approve (+30d)</span>
                        </button>
                        <button
                          type="button"
                          disabled={busy === `sub_${sub.id}`}
                          onClick={() => onProcessPayment(sub.id, 'reject')}
                          className={`${styles.btnGhost} ${styles.btnDanger}`}
                        >
                          <FiX />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className={styles.processedSpan}>Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
);
AdminSubmissionsTab.displayName = 'AdminSubmissionsTab';

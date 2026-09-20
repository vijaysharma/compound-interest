import React from 'react';
import { FiLock } from 'react-icons/fi';
import styles from '../PaywallModal.module.scss';
interface PaywallActionsProps {
  isProcessing: boolean;
  planAmount: number;
  handleRazorpayPayment: () => Promise<void>;
  onTaxProClick: () => void;
}
export function PaywallActions({
  isProcessing,
  planAmount,
  handleRazorpayPayment,
  onTaxProClick,
}: PaywallActionsProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => void handleRazorpayPayment()}
        className={styles.payBtn}
      >
        {isProcessing ? (
          <>
            <span className={styles.spinner} />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <FiLock className={styles.iconMedium} />
            <span>Pay ₹{planAmount} &amp; Unlock Pro Access</span>
          </>
        )}
      </button>
      <div className={styles.taxProContainer}>
        <button
          type="button"
          onClick={onTaxProClick}
          className={styles.taxProLink}
        >
          Looking for Tax Advisory? View Tax Pro Plans (₹129/mo) &rarr;
        </button>
      </div>
      <p className={styles.securityInfo}>
        Secure checkout via Razorpay • UPI (GPay, PhonePe, Paytm), Cards &amp; NetBanking
      </p>
    </div>
  );
}

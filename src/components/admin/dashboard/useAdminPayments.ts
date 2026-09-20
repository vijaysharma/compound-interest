import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import type { PaymentSubmission } from '../../../types/auth';
import type { AlertMessage } from './types';
import {
  getAdminPaymentSubmissionsAction,
  processAdminPaymentSubmissionAction,
  getPaymentSettingsAction,
  updatePaymentSettingsAction,
} from '../../../actions/payments';
export function useAdminPayments(
  effectiveToken: string,
  setBusy: (val: string | null) => void,
  setMessage: (msg: AlertMessage | null) => void,
  onPaymentProcessed?: () => void
) {
  const [payTitle, setPayTitle] = useState('Rupee Calculator Pro Subscription');
  const [payUpiId, setPayUpiId] = useState('');
  const [payQrUrl, setPayQrUrl] = useState('');
  const [payAmount, setPayAmount] = useState(54);
  const [payInstructions, setPayInstructions] = useState(
    'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
  );
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const fetchSubmissions = useCallback(async () => {
    if (!effectiveToken) return;
    try {
      const res = await getAdminPaymentSubmissionsAction(effectiveToken);
      if (res.submissions) setSubmissions(res.submissions);
    } catch (err) {
      console.warn('Failed to fetch payment submissions:', err);
    }
  }, [effectiveToken]);
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const res = await getPaymentSettingsAction();
        if (res.settings && !cancelled) {
          setPayTitle(res.settings.title || '');
          setPayUpiId(res.settings.upi_id || '');
          setPayQrUrl(res.settings.upi_qr_code_url || '');
          setPayAmount(res.settings.amount || 54);
          setPayInstructions(res.settings.instructions || '');
        }
      } catch (err) {
        console.warn('Failed to load payment settings:', err);
      }
      if (effectiveToken && !cancelled) {
        try {
          const subRes = await getAdminPaymentSubmissionsAction(effectiveToken);
          if (subRes.submissions && !cancelled) setSubmissions(subRes.submissions);
        } catch (err) {
          console.warn('Failed to fetch payment submissions:', err);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [effectiveToken]);
  const handleSavePaymentSettings = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('saving_settings');
    setMessage(null);
    try {
      const res = await updatePaymentSettingsAction(
        {
          title: payTitle,
          upi_id: payUpiId.trim(),
          upi_qr_code_url: payQrUrl.trim(),
          amount: Number(payAmount),
          instructions: payInstructions,
        },
        effectiveToken
      );
      if (!res.success) throw new Error('Failed to save settings');
      setMessage({ type: 'success', text: 'UPI payment settings & QR code updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setBusy(null);
    }
  };
  const handleQrFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WebP, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image file size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && result.startsWith('data:image/')) setPayQrUrl(result);
    };
    reader.readAsDataURL(file);
  };
  const handleProcessPayment = async (submissionId: string, action: 'approve' | 'reject') => {
    setBusy(`sub_${submissionId}`);
    setMessage(null);
    try {
      const res = await processAdminPaymentSubmissionAction(
        { submission_id: submissionId, action },
        effectiveToken
      );
      if (!res.success) throw new Error(res.message || 'Action failed');
      setMessage({ type: 'success', text: res.message || `Payment ${action}d.` });
      void fetchSubmissions();
      onPaymentProcessed?.();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(null);
    }
  };
  return {
    payTitle,
    setPayTitle,
    payUpiId,
    setPayUpiId,
    payQrUrl,
    setPayQrUrl,
    payAmount,
    setPayAmount,
    payInstructions,
    setPayInstructions,
    submissions,
    fetchSubmissions,
    handleSavePaymentSettings,
    handleQrFileUpload,
    handleProcessPayment,
  };
}

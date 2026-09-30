'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FiServer,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
  FiBriefcase,
  FiUser,
  FiPhone,
  FiMail,
  FiKey,
  FiArrowLeft,
  FiCheck,
  FiUsers,
} from 'react-icons/fi';
import {
  listShiprocketAccountsAction,
  saveShiprocketAccountAction,
  updateShiprocketAccountAction,
  deleteShiprocketAccountAction,
  switchActiveShiprocketAccountAction,
} from '@/actions/admin';
import type { ShiprocketAccountProfile } from '@/types/shiprocket';
import styles from './ShiprocketAccounts.module.scss';
interface Props {
  token: string;
}
export const ShiprocketAccountsManagerView: React.FC<Props> = ({ token }) => {
  const [accounts, setAccounts] = useState<ShiprocketAccountProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [apiEmail, setApiEmail] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listShiprocketAccountsAction(token);
      if (res.success && res.accounts) {
        setAccounts(res.accounts);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load accounts';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);
  const resetForm = () => {
    setEditId(null);
    setLabel('');
    setCompanyName('');
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setApiEmail('');
    setApiPassword('');
    setShowForm(false);
  };
  const handleEditClick = (acc: ShiprocketAccountProfile) => {
    setEditId(acc.id);
    setLabel(acc.account_label);
    setCompanyName(acc.company_name);
    setContactName(acc.contact_name);
    setContactPhone(acc.contact_phone);
    setContactEmail(acc.contact_email);
    setApiEmail(acc.api_email);
    setApiPassword('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !companyName.trim() || !apiEmail.trim()) {
      setAlert({ type: 'error', text: 'Account label, company name, and API email are required' });
      return;
    }
    if (!editId && !apiPassword.trim()) {
      setAlert({ type: 'error', text: 'API password is required to verify new account' });
      return;
    }
    setSubmitting(true);
    setAlert(null);
    try {
      if (editId) {
        const res = await updateShiprocketAccountAction(
          {
            id: editId,
            account_label: label,
            company_name: companyName,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            api_email: apiEmail,
            ...(apiPassword.trim() ? { api_password: apiPassword } : {}),
          },
          token
        );
        if (res.success) {
          setAlert({ type: 'success', text: res.message });
          resetForm();
          fetchAccounts();
        }
      } else {
        const res = await saveShiprocketAccountAction(
          {
            account_label: label,
            company_name: companyName,
            contact_name: contactName,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            api_email: apiEmail,
            api_password: apiPassword,
          },
          token
        );
        if (res.success) {
          setAlert({ type: 'success', text: res.message });
          resetForm();
          fetchAccounts();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setAlert({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };
  const handleSwitch = async (id: string) => {
    try {
      const res = await switchActiveShiprocketAccountAction(id, token);
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        fetchAccounts();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch active account';
      setAlert({ type: 'error', text: msg });
    }
  };
  const handleDelete = async (acc: ShiprocketAccountProfile) => {
    if (!confirm(`Are you sure you want to delete '${acc.account_label}'?`)) return;
    try {
      const res = await deleteShiprocketAccountAction(acc.id, token);
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        fetchAccounts();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account';
      setAlert({ type: 'error', text: msg });
    }
  };
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <FiServer className={styles.titleIcon} /> Shiprocket Accounts
            </h1>
          </div>
          <p className={styles.subtitle}>
            Manage multiple Shiprocket API users, company profiles, contact details, and token credentials.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/shiprocket-customers" className={styles.outlineBtn}>
            <FiUsers /> Customers Directory
          </Link>
          <Link href="/admin/shiprocket" className={styles.outlineBtn}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              if (showForm && !editId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
          >
            <FiPlus /> {showForm && !editId ? 'Close Form' : 'Add API Account'}
          </button>
        </div>
      </header>
      {alert && (
        <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{alert.text}</span>
        </div>
      )}
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formSectionTitle}>
            <FiBriefcase /> {editId ? 'Edit Account Details' : 'Register New Shiprocket API User Account'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid3}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Account Label *</label>
                <input
                  className={styles.fieldInput}
                  placeholder="e.g. Acme Mumbai Hub"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Company Legal Name *</label>
                <input
                  className={styles.fieldInput}
                  placeholder="e.g. Acme Retail Pvt Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Contact / User Name</label>
                <input
                  className={styles.fieldInput}
                  placeholder="e.g. Rahul Sharma"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Contact Phone</label>
                <input
                  className={styles.fieldInput}
                  placeholder="e.g. +91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Contact Email</label>
                <input
                  className={styles.fieldInput}
                  type="email"
                  placeholder="e.g. contact@acmeretail.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Shiprocket API User Email *</label>
                <input
                  className={styles.fieldInput}
                  type="email"
                  placeholder="apiuser@acme.com"
                  value={apiEmail}
                  onChange={(e) => setApiEmail(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  {editId ? 'API Password (leave blank to keep unchanged)' : 'Shiprocket API Password *'}
                </label>
                <input
                  className={styles.fieldInput}
                  type="password"
                  placeholder="API User Password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  required={!editId}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                {submitting ? 'Verifying & Saving...' : editId ? 'Update Account' : 'Verify & Save Account'}
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {loading && accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Loading Shiprocket accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className={styles.emptyBox}>
          <FiServer size={36} style={{ color: 'var(--color-primary)' }} />
          <div className={styles.emptyTitle}>No Shiprocket Accounts Configured in Database</div>
          <p className={styles.emptyDesc}>
            Add your first API user account above. The credentials will be verified against Shiprocket, and the
            active 10-day token will be generated and auto-rotated in your database.
          </p>
          <button type="button" className={styles.primaryBtn} onClick={() => setShowForm(true)}>
            <FiPlus /> Add First Account
          </button>
        </div>
      ) : (
        <div className={styles.accountsGrid}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`${styles.accountCard} ${acc.is_active ? styles.accountCardActive : ''}`}
            >
              <div className={styles.accountCardTop}>
                <div>
                  <h3 className={styles.accountLabel}>{acc.account_label}</h3>
                  <div style={{ marginTop: '0.35rem' }}>
                    <span className={styles.balanceBadge}>
                      Balance: ₹{Number(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                {acc.is_active ? (
                  <span className={`${styles.statusBadge} ${styles.statusGreen}`}>
                    <FiCheck /> Active
                  </span>
                ) : (
                  <span className={`${styles.statusBadge} ${styles.statusGray}`}>Inactive</span>
                )}
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <FiBriefcase />
                  <strong>Company:</strong> {acc.company_name}
                </div>
                {acc.contact_name && (
                  <div className={styles.detailItem}>
                    <FiUser />
                    <strong>Owner / User:</strong> {acc.contact_name}
                  </div>
                )}
                {acc.contact_phone && (
                  <div className={styles.detailItem}>
                    <FiPhone />
                    <strong>Phone:</strong> {acc.contact_phone}
                  </div>
                )}
                {acc.contact_email && (
                  <div className={styles.detailItem}>
                    <FiMail />
                    <strong>Email:</strong> {acc.contact_email}
                  </div>
                )}
                <div className={styles.detailItem}>
                  <FiKey />
                  <strong>API Email:</strong> {acc.api_email}
                </div>
                {acc.sr_company_id && (
                  <div className={styles.detailItem}>
                    <strong>Shiprocket Co. ID:</strong> #{acc.sr_company_id}
                  </div>
                )}
                {acc.token_expires_at && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-text-secondary)' }}>
                    Token Expires: {new Date(acc.token_expires_at).toLocaleDateString()} (Auto-renews)
                  </div>
                )}
              </div>
              <div className={styles.accountCardFooter}>
                <div>
                  {!acc.is_active ? (
                    <button
                      type="button"
                      className={styles.activateBtnSmall}
                      onClick={() => handleSwitch(acc.id)}
                    >
                      Set Active
                    </button>
                  ) : (
                    <span className={styles.activeIndicator}>
                      <FiCheckCircle /> Current Active
                    </span>
                  )}
                </div>
                <div className={styles.cardActionBtns}>
                  <button
                    type="button"
                    className={styles.editBtnSmall}
                    onClick={() => handleEditClick(acc)}
                    title="Edit account details"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    className={styles.dangerBtnSmall}
                    onClick={() => handleDelete(acc)}
                    title="Remove account"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

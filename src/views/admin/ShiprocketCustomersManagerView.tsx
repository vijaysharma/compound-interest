'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from '@/navigation';
import {
  FiUsers,
  FiRefreshCw,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiChevronDown,
  FiPackage,
  FiCalendar,
  FiX,
  FiGitMerge,
} from 'react-icons/fi';
import {
  listShiprocketCustomersAction,
  saveShiprocketCustomerAction,
  deleteShiprocketCustomerAction,
  syncHistoricalCustomersAction,
  mergeShiprocketCustomersAction,
} from '@/actions/admin';
import type { ShiprocketCustomer } from '@/types/shiprocket';
import styles from './ShiprocketCustomers.module.scss';
interface Props {
  token: string;
}
export const ShiprocketCustomersManagerView: React.FC<Props> = ({ token }) => {
  const [customers, setCustomers] = useState<ShiprocketCustomer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // Sync state: default to 2023-01-01 till today
  const [syncing, setSyncing] = useState(false);
  const [syncFrom, setSyncFrom] = useState('2023-01-01');
  const [syncTo, setSyncTo] = useState(() => new Date().toISOString().slice(0, 10));
  // Filter & pagination state
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<
    'name' | 'phone' | 'city' | 'state' | 'pincode' | 'orders' | 'updated_at' | 'created_at'
  >('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 25;
  // Form CRUD state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Merge state
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [sourceCustomer, setSourceCustomer] = useState<ShiprocketCustomer | null>(null);
  const [targetCustomerId, setTargetCustomerId] = useState<string>('');
  const [mergeName, setMergeName] = useState('');
  const [mergePhone, setMergePhone] = useState('');
  const [mergePhone2, setMergePhone2] = useState('');
  const [mergeEmail, setMergeEmail] = useState('');
  const [mergeAddress, setMergeAddress] = useState('');
  const [mergeAddress2, setMergeAddress2] = useState('');
  const [mergeCity, setMergeCity] = useState('');
  const [mergeState, setMergeState] = useState('');
  const [mergePincode, setMergePincode] = useState('');
  const [merging, setMerging] = useState(false);
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listShiprocketCustomersAction(
        {
          search,
          sortBy,
          sortOrder,
          page,
          perPage,
        },
        token
      );
      if (res.success) {
        setCustomers(res.customers);
        setTotalCount(res.total);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers';
      setAlert({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }, [token, search, sortBy, sortOrder, page]);
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  const resetForm = () => {
    setEditId(null);
    setName('');
    setPhone('');
    setPhone2('');
    setEmail('');
    setAddress('');
    setAddress2('');
    setCity('');
    setState('');
    setPincode('');
    setShowForm(false);
  };
  const handleEdit = (cust: ShiprocketCustomer) => {
    setEditId(cust.id);
    setName(cust.customer_name);
    setPhone(cust.customer_phone);
    setPhone2(cust.customer_phone_2 || '');
    setEmail(cust.customer_email || '');
    setAddress(cust.customer_address);
    setAddress2(cust.customer_address_2 || '');
    setCity(cust.customer_city);
    setState(cust.customer_state);
    setPincode(cust.customer_pincode);
    setShowForm(true);
  };

  const handleOpenMerge = (cust: ShiprocketCustomer) => {
    setSourceCustomer(cust);
    // Find a candidate target customer (e.g. first different customer)
    const otherCust = customers.find((c) => c.id !== cust.id);
    const targetId = otherCust ? otherCust.id : '';
    setTargetCustomerId(targetId);

    // Initial merged values: default to source or candidate target
    const target = otherCust || null;
    setMergeName(target?.customer_name || cust.customer_name);
    setMergePhone(target?.customer_phone || cust.customer_phone || '');
    setMergePhone2(target?.customer_phone_2 || cust.customer_phone_2 || '');
    setMergeEmail(target?.customer_email || cust.customer_email || '');
    setMergeAddress(target?.customer_address || cust.customer_address);
    setMergeAddress2(target?.customer_address_2 || cust.customer_address_2 || '');
    setMergeCity(target?.customer_city || cust.customer_city);
    setMergeState(target?.customer_state || cust.customer_state);
    setMergePincode(target?.customer_pincode || cust.customer_pincode);
    setShowMergeModal(true);
  };

  const handleSelectMergeTarget = (chosenTargetId: string) => {
    setTargetCustomerId(chosenTargetId);
    const target = customers.find((c) => c.id === chosenTargetId);
    if (target && sourceCustomer) {
      setMergeName(target.customer_name || sourceCustomer.customer_name);
      setMergePhone(target.customer_phone || sourceCustomer.customer_phone || '');
      setMergePhone2(target.customer_phone_2 || sourceCustomer.customer_phone_2 || '');
      setMergeEmail(target.customer_email || sourceCustomer.customer_email || '');
      setMergeAddress(target.customer_address || sourceCustomer.customer_address);
      setMergeAddress2(target.customer_address_2 || sourceCustomer.customer_address_2 || '');
      setMergeCity(target.customer_city || sourceCustomer.customer_city);
      setMergeState(target.customer_state || sourceCustomer.customer_state);
      setMergePincode(target.customer_pincode || sourceCustomer.customer_pincode);
    }
  };

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceCustomer || !targetCustomerId) {
      setAlert({ type: 'error', text: 'Both source and target customers must be selected' });
      return;
    }
    if (!mergeName.trim() || !mergeAddress.trim() || !mergePincode.trim()) {
      setAlert({ type: 'error', text: 'Name, Address, and Pincode are required for final merged customer' });
      return;
    }
    setMerging(true);
    setAlert(null);
    try {
      const res = await mergeShiprocketCustomersAction(
        {
          sourceCustomerId: sourceCustomer.id,
          targetCustomerId,
          finalCustomer: {
            customer_name: mergeName,
            customer_phone: mergePhone,
            customer_phone_2: mergePhone2,
            customer_email: mergeEmail,
            customer_address: mergeAddress,
            customer_address_2: mergeAddress2,
            customer_city: mergeCity,
            customer_state: mergeState,
            customer_pincode: mergePincode,
          },
        },
        token
      );
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        setShowMergeModal(false);
        setSourceCustomer(null);
        setTargetCustomerId('');
        fetchCustomers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to merge customers';
      setAlert({ type: 'error', text: msg });
    } finally {
      setMerging(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !pincode.trim()) {
      setAlert({ type: 'error', text: 'Name, Address, and Pincode are required' });
      return;
    }
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await saveShiprocketCustomerAction(
        {
          id: editId || undefined,
          customer_name: name,
          customer_phone: phone,
          customer_phone_2: phone2,
          customer_email: email,
          customer_address: address,
          customer_address_2: address2,
          customer_city: city,
          customer_state: state,
          customer_pincode: pincode,
        },
        token
      );
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        resetForm();
        fetchCustomers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setAlert({ type: 'error', text: msg });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (cust: ShiprocketCustomer) => {
    if (
      !confirm(
        `Are you sure you want to delete customer '${cust.customer_name}' (${cust.customer_phone || cust.customer_pincode})?`
      )
    )
      return;
    try {
      const res = await deleteShiprocketCustomerAction(cust.id, token);
      if (res.success) {
        setAlert({ type: 'success', text: res.message });
        fetchCustomers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete customer';
      setAlert({ type: 'error', text: msg });
    }
  };
  const handleSyncHistorical = async () => {
    setSyncing(true);
    setAlert(null);
    try {
      const res = await syncHistoricalCustomersAction(
        {
          from: syncFrom || undefined,
          to: syncTo || undefined,
        },
        token
      );
      if (res.success) {
        const errorText =
          res.errors && res.errors.length > 0 ? ` (Warnings: ${res.errors.join('; ')})` : '';
        setAlert({
          type:
            res.totalSynced > 0
              ? 'success'
              : res.errors && res.errors.length > 0
                ? 'error'
                : 'success',
          text: `${res.message}${errorText}`,
        });
        fetchCustomers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setAlert({ type: 'error', text: msg });
    } finally {
      setSyncing(false);
    }
  };
  const handleSyncAll = async () => {
    setSyncing(true);
    setAlert(null);
    try {
      const res = await syncHistoricalCustomersAction({}, token);
      if (res.success) {
        const errorText =
          res.errors && res.errors.length > 0 ? ` (Warnings: ${res.errors.join('; ')})` : '';
        setAlert({
          type:
            res.totalSynced > 0
              ? 'success'
              : res.errors && res.errors.length > 0
                ? 'error'
                : 'success',
          text: `${res.message}${errorText}`,
        });
        fetchCustomers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setAlert({ type: 'error', text: msg });
    } finally {
      setSyncing(false);
    }
  };
  const handleSortToggle = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };
  const totalPages = Math.ceil(totalCount / perPage) || 1;
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>
              <FiUsers className={styles.titleIcon} /> Shiprocket Customers
            </h1>
          </div>
          <p className={styles.subtitle}>
            Historical customer directory consolidated across all Shiprocket accounts. Deduplicated
            by Name & Pincode.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/shiprocket" className={styles.outlineBtn}>
            <FiArrowLeft /> Back to Dashboard
          </Link>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <FiPlus /> Add Customer
          </button>
        </div>
      </header>
      {alert && (
        <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {alert.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{alert.text}</span>
        </div>
      )}
      {/* Sync Across Accounts Section */}
      <div className={styles.syncCard}>
        <div className={styles.syncHeaderRow}>
          <div className={styles.syncTitle}>
            <FiRefreshCw className={syncing ? styles.spinner : ''} />
            <span>Sync Historical Customers Across Accounts</span>
          </div>
          <div className={styles.syncControls}>
            <div className={styles.syncDatesGroup}>
              <div className={styles.syncDateItem}>
                <span className={styles.syncDateLabel}>
                  <FiCalendar className={styles.calendarIcon} />
                  From:
                </span>
                <input
                  type="date"
                  className={styles.syncDateInput}
                  value={syncFrom}
                  onChange={(e) => setSyncFrom(e.target.value)}
                  disabled={syncing}
                />
              </div>
              <div className={styles.syncDateItem}>
                <span className={styles.syncDateLabel}>To:</span>
                <input
                  type="date"
                  className={styles.syncDateInput}
                  value={syncTo}
                  onChange={(e) => setSyncTo(e.target.value)}
                  disabled={syncing}
                />
              </div>
            </div>
            <div className={styles.syncBtnsGroup}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={handleSyncHistorical}
                disabled={syncing}
                title="Sync orders matching the selected date range"
              >
                <FiRefreshCw className={syncing ? styles.spinner : ''} />
                {syncing ? 'Syncing...' : 'Sync Range'}
              </button>
              <button
                type="button"
                className={styles.outlineBtn}
                onClick={handleSyncAll}
                disabled={syncing}
                title="Fetch all available historical orders without date boundaries"
              >
                <FiRefreshCw className={syncing ? styles.spinner : ''} />
                Sync All
              </button>
            </div>
          </div>
        </div>
      </div>
      {showForm && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) {
              resetForm();
            }
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div
                className={`${styles.formSectionTitle} ${styles.formSectionFlat}`}
              >
                <FiUsers /> {editId ? 'Edit Customer Details' : 'Add New Customer Record'}
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={resetForm}
                disabled={submitting}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Customer Name *</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Phone Number</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Not provided by Shiprocket - add manually if known"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Alternate Phone Number</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Optional second contact number"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input
                    className={styles.fieldInput}
                    type="email"
                    placeholder="e.g. ramesh@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Full Street Address *</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Flat / Building, Street, Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Address Line 2 / Landmark</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Near Metro Station"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formGrid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>City *</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>State *</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Pincode *</label>
                  <input
                    className={styles.fieldInput}
                    placeholder="400001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editId ? 'Update Customer' : 'Save Customer'}
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
        </div>
      )}
      {/* Merge Customer Modal Dialog */}
      {showMergeModal && sourceCustomer && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !merging) {
              setShowMergeModal(false);
              setSourceCustomer(null);
            }
          }}
        >
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={`${styles.formSectionTitle} ${styles.formSectionFlat}`}>
                <FiGitMerge /> Merge Customer: {sourceCustomer.customer_name}
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => {
                  setShowMergeModal(false);
                  setSourceCustomer(null);
                }}
                disabled={merging}
                aria-label="Close merge modal"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleMergeSubmit}>
              <div className={styles.mergeNotice}>
                Merging will transfer all order history from <strong>{sourceCustomer.customer_name}</strong> to the target record below, delete the duplicate customer, and update the target customer with these final values.
              </div>

              <div className={styles.mergeSelectBox}>
                <label className={styles.fieldLabel}>Merge into Target Customer *</label>
                <select
                  className={styles.fieldInput}
                  value={targetCustomerId}
                  onChange={(e) => handleSelectMergeTarget(e.target.value)}
                  disabled={merging}
                  required
                >
                  <option value="">-- Select Target Customer to Merge With --</option>
                  {customers
                    .filter((c) => c.id !== sourceCustomer.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name} ({c.customer_phone || 'No phone'}) - {c.customer_city}, {c.customer_pincode} ({c.total_orders} orders)
                      </option>
                    ))}
                </select>
              </div>

              {/* Side-by-side comparison */}
              <div className={styles.mergeComparisonGrid}>
                <div className={styles.mergeCustCard}>
                  <div className={styles.mergeCustCardTitle}>
                    <span>Source (Will be deleted)</span>
                    <span className={styles.ordersCountBadge}>
                      <FiPackage size={12} /> {sourceCustomer.total_orders} orders
                    </span>
                  </div>
                  <div><strong>Name:</strong> {sourceCustomer.customer_name}</div>
                  <div><strong>Phone:</strong> {sourceCustomer.customer_phone || 'None'}</div>
                  {sourceCustomer.customer_phone_2 && (
                    <div><strong>Alt Phone:</strong> {sourceCustomer.customer_phone_2}</div>
                  )}
                  {sourceCustomer.customer_email && (
                    <div><strong>Email:</strong> {sourceCustomer.customer_email}</div>
                  )}
                  <div>
                    <strong>Address:</strong> {sourceCustomer.customer_address}
                    {sourceCustomer.customer_address_2 ? `, ${sourceCustomer.customer_address_2}` : ''}
                  </div>
                  <div>
                    <strong>Location:</strong> {sourceCustomer.customer_city}, {sourceCustomer.customer_state} - {sourceCustomer.customer_pincode}
                  </div>
                </div>

                {targetCustomerId && customers.find((c) => c.id === targetCustomerId) && (
                  (() => {
                    const target = customers.find((c) => c.id === targetCustomerId)!;
                    return (
                      <div className={styles.mergeCustCard}>
                        <div className={styles.mergeCustCardTitle}>
                          <span>Target (Will be kept & updated)</span>
                          <span className={styles.ordersCountBadge}>
                            <FiPackage size={12} /> {target.total_orders} orders
                          </span>
                        </div>
                        <div><strong>Name:</strong> {target.customer_name}</div>
                        <div><strong>Phone:</strong> {target.customer_phone || 'None'}</div>
                        {target.customer_phone_2 && (
                          <div><strong>Alt Phone:</strong> {target.customer_phone_2}</div>
                        )}
                        {target.customer_email && (
                          <div><strong>Email:</strong> {target.customer_email}</div>
                        )}
                        <div>
                          <strong>Address:</strong> {target.customer_address}
                          {target.customer_address_2 ? `, ${target.customer_address_2}` : ''}
                        </div>
                        <div>
                          <strong>Location:</strong> {target.customer_city}, {target.customer_state} - {target.customer_pincode}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              <div className={styles.colTitle} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                Final Customer Details (Verify / Edit before merging)
              </div>
              <div className={styles.formGrid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Final Name *</label>
                  <input
                    className={styles.fieldInput}
                    value={mergeName}
                    onChange={(e) => setMergeName(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Primary Phone</label>
                  <input
                    className={styles.fieldInput}
                    value={mergePhone}
                    onChange={(e) => setMergePhone(e.target.value)}
                    placeholder="10-digit mobile"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Alternate Phone</label>
                  <input
                    className={styles.fieldInput}
                    value={mergePhone2}
                    onChange={(e) => setMergePhone2(e.target.value)}
                    placeholder="Secondary phone"
                  />
                </div>
              </div>

              <div className={styles.formGrid2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.fieldInput}
                    value={mergeEmail}
                    onChange={(e) => setMergeEmail(e.target.value)}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Address Line 2 / Landmark</label>
                  <input
                    className={styles.fieldInput}
                    value={mergeAddress2}
                    onChange={(e) => setMergeAddress2(e.target.value)}
                    placeholder="Landmark or flat/block"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Street Address *</label>
                <input
                  className={styles.fieldInput}
                  value={mergeAddress}
                  onChange={(e) => setMergeAddress(e.target.value)}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className={styles.formGrid3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>City *</label>
                  <input
                    className={styles.fieldInput}
                    value={mergeCity}
                    onChange={(e) => setMergeCity(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>State *</label>
                  <input
                    className={styles.fieldInput}
                    value={mergeState}
                    onChange={(e) => setMergeState(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Pincode *</label>
                  <input
                    className={styles.fieldInput}
                    value={mergePincode}
                    onChange={(e) => setMergePincode(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={merging || !targetCustomerId}
                >
                  {merging ? 'Merging Customers...' : 'Confirm & Merge Customer'}
                </button>
                <button
                  type="button"
                  className={styles.outlineBtn}
                  onClick={() => {
                    setShowMergeModal(false);
                    setSourceCustomer(null);
                  }}
                  disabled={merging}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, phone, alt. phone, email, address, city, pincode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filterControlsRight}>
          <select
            className={styles.sortSelect}
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [col, ord] = e.target.value.split('-');
              setSortBy(col as typeof sortBy);
              setSortOrder(ord as 'asc' | 'desc');
            }}
            aria-label="Sort Customers"
          >
            <option value="updated_at-desc">Recently Updated</option>
            <option value="created_at-desc">Recently Added</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="orders-desc">Most Orders</option>
            <option value="city-asc">City (A-Z)</option>
            <option value="pincode-asc">Pincode (Asc)</option>
          </select>
        </div>
      </div>
      {loading && customers.length === 0 ? (
        <div className={styles.emptyBox}>
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className={styles.emptyBox}>
          <FiUsers size={36} className={styles.primaryIcon} />
          <div className={styles.emptyTitle}>No Customers Found</div>
          <p className={styles.emptyDesc}>
            {search
              ? 'No customer records match your search criteria.'
              : 'No customer data has been stored yet. Click "Sync Now" above to pull historical orders across all accounts, or add records manually.'}
          </p>
          <button type="button" className={styles.primaryBtn} onClick={() => setShowForm(true)}>
            <FiPlus /> Add First Customer
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.desktopTableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('name')}>
                    Customer Name {sortBy === 'name' && (sortOrder === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />)}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('phone')}>
                    Phone & Email {sortBy === 'phone' && (sortOrder === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />)}
                  </th>
                  <th>Alt. Phone</th>
                  <th>Full Address</th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('city')}>
                    City & State {sortBy === 'city' && (sortOrder === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />)}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('pincode')}>
                    Pincode {sortBy === 'pincode' && (sortOrder === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />)}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('orders')}>
                    Orders {sortBy === 'orders' && (sortOrder === 'asc' ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />)}
                  </th>
                  <th className={styles.tableThRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div className={styles.custName}>{cust.customer_name}</div>
                      {cust.last_order_id && (
                        <div className={styles.contactSecondary}>
                          Last Order: #{cust.last_order_id}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.phoneBadge}>
                        <FiPhone size={13} className={styles.primaryIcon} />
                        <span>{cust.customer_phone || '—'}</span>
                      </div>
                      {cust.customer_email && (
                        <div className={styles.contactSecondary}>
                          <FiMail size={12} className={styles.emailIcon} />
                          {cust.customer_email}
                        </div>
                      )}
                    </td>
                    <td>
                      {cust.customer_phone_2 ? (
                        <div className={styles.phoneBadge}>
                          <FiPhone size={13} className={styles.secondaryIcon} />
                          <span>{cust.customer_phone_2}</span>
                        </div>
                      ) : (
                        <span className={styles.emptyDash}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.addressText}>
                        {cust.customer_address}
                        {cust.customer_address_2 ? `, ${cust.customer_address_2}` : ''}
                      </div>
                    </td>
                    <td>
                      <div className={styles.cityStatePincode}>
                        <FiMapPin size={12} />
                        <span>
                          {cust.customer_city}, {cust.customer_state}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.cityStatePincode}>{cust.customer_pincode}</span>
                    </td>
                    <td>
                      <span className={styles.ordersCountBadge}>
                        <FiPackage size={12} />
                        <span>{cust.total_orders}</span>
                      </span>
                    </td>
                    <td className={styles.tableTdRight}>
                      <div className={`${styles.actionBtnsRow} ${styles.actionBtnsRowEnd}`}>
                        <button
                          type="button"
                          className={styles.mergeBtnSmall}
                          onClick={() => handleOpenMerge(cust)}
                          title="Merge Customer"
                        >
                          <FiGitMerge /> Merge
                        </button>
                        <button
                          type="button"
                          className={styles.editBtnSmall}
                          onClick={() => handleEdit(cust)}
                          title="Edit Customer"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          type="button"
                          className={styles.dangerBtnSmall}
                          onClick={() => handleDelete(cust)}
                          title="Delete Customer"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards View */}
          <div className={styles.mobileCardsList}>
            {customers.map((cust) => (
              <div key={cust.id} className={styles.customerCard}>
                <div className={styles.customerHeader}>
                  <div className={styles.customerMeta}>
                    <span className={styles.customerName}>{cust.customer_name}</span>
                    {cust.last_order_id && (
                      <span className={styles.orderIdBadge}>#{cust.last_order_id}</span>
                    )}
                  </div>
                  <span className={styles.ordersCountBadge}>
                    <FiPackage size={12} />
                    <span>
                      {cust.total_orders} {cust.total_orders === 1 ? 'Order' : 'Orders'}
                    </span>
                  </span>
                </div>
                <div className={styles.customerBody}>
                  <div>
                    <div className={styles.colTitle}>Contact Information</div>
                    <div className={styles.contactRow}>
                      <FiPhone size={13} className={styles.contactIcon} />
                      {cust.customer_phone ? (
                        <a href={`tel:${cust.customer_phone}`} className={styles.contactLink}>
                          {cust.customer_phone}
                        </a>
                      ) : (
                        <span className={styles.mutedText}>No phone registered</span>
                      )}
                    </div>
                    {cust.customer_phone_2 && (
                      <div className={styles.contactRow}>
                        <FiPhone size={13} className={styles.contactIconMuted} />
                        <a href={`tel:${cust.customer_phone_2}`} className={styles.contactLink}>
                          {cust.customer_phone_2} <span className={styles.altBadge}>Alt</span>
                        </a>
                      </div>
                    )}
                    {cust.customer_email && (
                      <div className={styles.contactRow}>
                        <FiMail size={13} className={styles.contactIcon} />
                        <a href={`mailto:${cust.customer_email}`} className={styles.contactLink}>
                          {cust.customer_email}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={styles.colTitle}>Address & Location</div>
                    <div className={styles.customerAddress}>
                      {cust.customer_address}
                      {cust.customer_address_2 ? `, ${cust.customer_address_2}` : ''}
                    </div>
                    <div className={styles.locationBadgeRow}>
                      <span className={styles.cityStatePincode}>
                        <FiMapPin size={12} />
                        <span>
                          {cust.customer_city}, {cust.customer_state} - {cust.customer_pincode}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.customerFooter}>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleOpenMerge(cust)}
                    title="Merge Customer"
                  >
                    <FiGitMerge /> Merge
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleEdit(cust)}
                    title="Edit Customer"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionDanger}`}
                    onClick={() => handleDelete(cust)}
                    title="Delete Customer"
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          <div className={styles.paginationRow}>
            <div>
              Showing {customers.length > 0 ? (page - 1) * perPage + 1 : 0} to{' '}
              {Math.min(page * perPage, totalCount)} of {totalCount} customer entries
            </div>
            <div className={styles.paginationBtns}>
              <button
                type="button"
                className={styles.outlineBtn}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft /> Previous
              </button>
              <span className={styles.paginationCurrentPage}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.outlineBtn}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ShiprocketCustomersManagerView;

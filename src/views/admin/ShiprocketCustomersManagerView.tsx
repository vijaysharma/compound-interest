'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  FiPackage,
  FiCalendar,
} from 'react-icons/fi';
import {
  listShiprocketCustomersAction,
  saveShiprocketCustomerAction,
  deleteShiprocketCustomerAction,
  syncHistoricalCustomersAction,
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
  const [sortBy, setSortBy] = useState<'name' | 'phone' | 'city' | 'state' | 'pincode' | 'orders' | 'updated_at' | 'created_at'>('updated_at');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!confirm(`Are you sure you want to delete customer '${cust.customer_name}' (${cust.customer_phone || cust.customer_pincode})?`)) return;
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
        const errorText = res.errors && res.errors.length > 0 ? ` (Warnings: ${res.errors.join('; ')})` : '';
        setAlert({
          type: res.totalSynced > 0 ? 'success' : res.errors && res.errors.length > 0 ? 'error' : 'success',
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
        const errorText = res.errors && res.errors.length > 0 ? ` (Warnings: ${res.errors.join('; ')})` : '';
        setAlert({
          type: res.totalSynced > 0 ? 'success' : res.errors && res.errors.length > 0 ? 'error' : 'success',
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
            Historical customer directory consolidated across all Shiprocket accounts. Deduplicated by Name & Pincode.
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
              if (showForm && !editId) {
                setShowForm(false);
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
          >
            <FiPlus /> {showForm && !editId ? 'Close Form' : 'Add Customer'}
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
            <span className={styles.syncDateLabel}>
              <FiCalendar style={{ marginRight: 4 }} />
              From:
            </span>
            <input
              type="date"
              className={styles.syncDateInput}
              value={syncFrom}
              onChange={(e) => setSyncFrom(e.target.value)}
              disabled={syncing}
            />
            <span className={styles.syncDateLabel}>To:</span>
            <input
              type="date"
              className={styles.syncDateInput}
              value={syncTo}
              onChange={(e) => setSyncTo(e.target.value)}
              disabled={syncing}
            />
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
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formSectionTitle}>
            <FiUsers /> {editId ? 'Edit Customer Details' : 'Add New Customer Record'}
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
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className={styles.emptyBox}>
          <FiUsers size={36} style={{ color: 'var(--color-primary)' }} />
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
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('name')}>
                    Customer Name {sortBy === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('phone')}>
                    Phone & Email {sortBy === 'phone' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th>Alt. Phone</th>
                  <th>Full Address</th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('city')}>
                    City & State {sortBy === 'city' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('pincode')}>
                    Pincode {sortBy === 'pincode' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className={styles.thSortable} onClick={() => handleSortToggle('orders')}>
                    Orders {sortBy === 'orders' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div className={styles.custName}>{cust.customer_name}</div>
                      {cust.last_order_id && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                          Last Order: #{cust.last_order_id}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.phoneBadge}>
                        <FiPhone size={13} style={{ color: 'var(--color-primary)' }} />
                        <span>{cust.customer_phone || '—'}</span>
                      </div>
                      {cust.customer_email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                          <FiMail size={12} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                          {cust.customer_email}
                        </div>
                      )}
                    </td>
                    <td>
                      {cust.customer_phone_2 ? (
                        <div className={styles.phoneBadge}>
                          <FiPhone size={13} style={{ color: 'var(--color-text-secondary)' }} />
                          <span>{cust.customer_phone_2}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)' }}>—</span>
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
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.actionBtnsRow} style={{ justifyContent: 'flex-end' }}>
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
              <span style={{ fontWeight: 600, padding: '0 0.5rem' }}>
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

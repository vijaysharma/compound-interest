'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  getShiprocketAccountAction,
  getShiprocketOrdersAction,
  getShiprocketStatementAction,
  listShiprocketAccountsAction,
  switchActiveShiprocketAccountAction,
  saveShiprocketAccountAction,
  deleteShiprocketAccountAction,
} from '../../../actions/admin';
import type {
  ShiprocketAccountData,
  ShiprocketAccountProfile,
  ShiprocketOrder,
  ShiprocketStatementItem,
  AlertMessage,
} from './types';
import { useShiprocketActions } from './useShiprocketActions';
const SR_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function parseOrderDateToIso(raw?: unknown): string {
  if (!raw) return '';
  const str = String(raw).trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (isoMatch) return isoMatch[0];
  const srMatch = /^(\d{1,2})[- \s]+([A-Za-z]{3})[- \s]+(\d{4})/.exec(str);
  if (srMatch) {
    const idx = SR_MONTHS.findIndex((mo) => mo.toLowerCase() === srMatch[2].toLowerCase());
    if (idx >= 0) {
      return `${srMatch[3]}-${String(idx + 1).padStart(2, '0')}-${srMatch[1].padStart(2, '0')}`;
    }
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function useShiprocketData(token: string) {
  const [account, setAccount] = useState<ShiprocketAccountData | null>(null);
  const [accountsList, setAccountsList] = useState<ShiprocketAccountProfile[]>([]);
  const [orders, setOrders] = useState<ShiprocketOrder[]>([]);
  const [statement, setStatement] = useState<ShiprocketStatementItem[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [alertMsg, setAlertMsg] = useState<AlertMessage | null>(null);
  const fetchAccountsList = useCallback(async () => {
    try {
      const res = await listShiprocketAccountsAction(token);
      if (res.success && res.accounts) {
        setAccountsList(res.accounts);
      }
    } catch (err: unknown) {
      console.warn('Failed to load accounts list:', err);
    }
  }, [token]);
  const fetchAccount = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const res = await getShiprocketAccountAction(token);
      if (res.success && res.account) {
        setAccount(res.account);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket account details';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingAccount(false);
    }
  }, [token]);
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const fetchOrders = useCallback(async (customFrom?: string, customTo?: string) => {
    setLoadingOrders(true);
    try {
      const fromParam = customFrom !== undefined ? customFrom : orderDateFrom;
      const toParam = customTo !== undefined ? customTo : orderDateTo;
      if (customFrom !== undefined) setOrderDateFrom(customFrom);
      if (customTo !== undefined) setOrderDateTo(customTo);
      const res = await getShiprocketOrdersAction(
        {
          per_page: 50,
          ...(fromParam ? { from: fromParam } : {}),
          ...(toParam ? { to: toParam } : {}),
        },
        token
      );
      if (res.success && res.orders) {
        setOrders(res.orders);
        if (customFrom === undefined && customTo === undefined && !orderDateFrom && !orderDateTo && res.orders.length > 0) {
          const dates = res.orders
            .map((o) => parseOrderDateToIso(o.created_at))
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
            .sort();
          if (dates.length > 0) {
            setOrderDateFrom(dates[0]);
            setOrderDateTo(dates[dates.length - 1]);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket orders';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingOrders(false);
    }
  }, [token, orderDateFrom, orderDateTo]);
  const fetchStatement = useCallback(async () => {
    setLoadingStatement(true);
    try {
      const res = await getShiprocketStatementAction({ per_page: 50 }, token);
      if (res.success && res.data) {
        setStatement(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallet ledger statement';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingStatement(false);
    }
  }, [token]);
  const fetchAll = useCallback(() => {
    fetchAccountsList();
    fetchAccount();
    fetchOrders();
    fetchStatement();
  }, [fetchAccountsList, fetchAccount, fetchOrders, fetchStatement]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);
  const handleSwitchAccount = useCallback(
    async (accountId: string) => {
      setLoadingAccount(true);
      try {
        const res = await switchActiveShiprocketAccountAction(accountId, token);
        if (res.success) {
          setAlertMsg({ type: 'success', text: res.message });
          fetchAll();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to switch active account';
        setAlertMsg({ type: 'error', text: msg });
      } finally {
        setLoadingAccount(false);
      }
    },
    [token, fetchAll]
  );
  const handleAddAccount = useCallback(
    async (input: {
      account_label: string;
      company_name: string;
      contact_name: string;
      contact_phone: string;
      contact_email: string;
      api_email: string;
      api_password: string;
      auth_token?: string;
    }) => {
      const res = await saveShiprocketAccountAction(input, token);
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message });
        fetchAll();
      }
    },
    [token, fetchAll]
  );
  const handleDeleteAccount = useCallback(
    async (accountId: string) => {
      try {
        const res = await deleteShiprocketAccountAction(accountId, token);
        if (res.success) {
          setAlertMsg({ type: 'success', text: res.message });
          fetchAll();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete account';
        setAlertMsg({ type: 'error', text: msg });
      }
    },
    [token, fetchAll]
  );
  const actions = useShiprocketActions(token, fetchOrders, setAlertMsg);
  return {
    account,
    accountsList,
    orders,
    statement,
    loadingAccount,
    loadingOrders,
    loadingStatement,
    alertMsg,
    setAlertMsg,
    orderDateFrom,
    setOrderDateFrom,
    orderDateTo,
    setOrderDateTo,
    fetchAccount,
    fetchAccountsList,
    fetchOrders,
    fetchStatement,
    fetchAll,
    handleSwitchAccount,
    handleAddAccount,
    handleDeleteAccount,
    ...actions,
  };
}

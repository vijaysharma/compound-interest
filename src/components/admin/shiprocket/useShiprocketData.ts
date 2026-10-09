'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
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
  // Each fetch kind numbers its requests; a response that isn't the latest is dropped, so a slow
  // request for the previous account can never overwrite the new account's data.
  const seq = useRef({ list: 0, account: 0, orders: 0, statement: 0 });
  const fetchAccountsList = useCallback(async () => {
    const id = ++seq.current.list;
    try {
      const res = await listShiprocketAccountsAction(token);
      if (id === seq.current.list && res.success && res.accounts) {
        setAccountsList(res.accounts);
      }
    } catch (err: unknown) {
      console.warn('Failed to load accounts list:', err);
    }
  }, [token]);
  const fetchAccount = useCallback(async () => {
    const id = ++seq.current.account;
    setLoadingAccount(true);
    try {
      const res = await getShiprocketAccountAction(token);
      if (id === seq.current.account && res.success && res.account) {
        setAccount(res.account);
      }
    } catch (err: unknown) {
      if (id !== seq.current.account) return;
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket account details';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      if (id === seq.current.account) setLoadingAccount(false);
    }
  }, [token]);
  // The order date range. Read through a ref so fetchOrders (and fetchAll) keep the same identity
  // when it changes: depending on the dates re-ran the page's load effect on every change, and an
  // account switch cascaded through 4–5 full reloads. `userSet` separates a range the user picked
  // (kept across account switches and sent as the filter) from one filled in from the loaded
  // orders (display only, never sent).
  const [orderDateFrom, setOrderDateFromState] = useState('');
  const [orderDateTo, setOrderDateToState] = useState('');
  const range = useRef({ from: '', to: '', userSet: false });
  const setOrderDateFrom = useCallback((value: string) => {
    range.current = { ...range.current, from: value, userSet: true };
    setOrderDateFromState(value);
  }, []);
  const setOrderDateTo = useCallback((value: string) => {
    range.current = { ...range.current, to: value, userSet: true };
    setOrderDateToState(value);
  }, []);
  const fetchOrders = useCallback(async (customFrom?: string, customTo?: string) => {
    if (customFrom !== undefined || customTo !== undefined) {
      const from = customFrom ?? range.current.from;
      const to = customTo ?? range.current.to;
      range.current = { from, to, userSet: Boolean(from || to) };
      setOrderDateFromState(from);
      setOrderDateToState(to);
    }
    const { from, to, userSet } = range.current;
    const id = ++seq.current.orders;
    setLoadingOrders(true);
    try {
      const res = await getShiprocketOrdersAction(
        {
          per_page: 50,
          ...(userSet && from ? { from } : {}),
          ...(userSet && to ? { to } : {}),
        },
        token
      );
      if (id !== seq.current.orders) return;
      if (res.success && res.orders) {
        setOrders(res.orders);
        if (!range.current.userSet) {
          // Show the span the loaded orders cover; it stays a label, not a filter.
          const dates = res.orders
            .map((o) => parseOrderDateToIso(o.created_at))
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
            .sort();
          setOrderDateFromState(dates[0] ?? '');
          setOrderDateToState(dates[dates.length - 1] ?? '');
          range.current = { from: dates[0] ?? '', to: dates[dates.length - 1] ?? '', userSet: false };
        }
      }
    } catch (err: unknown) {
      if (id !== seq.current.orders) return;
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket orders';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      if (id === seq.current.orders) setLoadingOrders(false);
    }
  }, [token]);
  const fetchStatement = useCallback(async () => {
    const id = ++seq.current.statement;
    setLoadingStatement(true);
    try {
      const res = await getShiprocketStatementAction({ per_page: 50 }, token);
      if (id === seq.current.statement && res.success && res.data) {
        setStatement(res.data);
      }
    } catch (err: unknown) {
      if (id !== seq.current.statement) return;
      const msg = err instanceof Error ? err.message : 'Failed to load wallet ledger statement';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      if (id === seq.current.statement) setLoadingStatement(false);
    }
  }, [token]);
  const fetchAll = useCallback(() => {
    void fetchAccountsList();
    void fetchAccount();
    void fetchOrders();
    void fetchStatement();
  }, [fetchAccountsList, fetchAccount, fetchOrders, fetchStatement]);
  // Once per token: the fetchers above only change with it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);
  const handleSwitchAccount = useCallback(
    async (accountId: string) => {
      // Clear the previous account's data at once; a user-chosen date range is kept and applied
      // to the new account, a derived one is recomputed from the new account's orders.
      setAccount(null);
      setOrders([]);
      setStatement([]);
      if (!range.current.userSet) {
        range.current = { from: '', to: '', userSet: false };
        setOrderDateFromState('');
        setOrderDateToState('');
      }
      // Invalidate anything still in flight for the old account.
      seq.current.account++;
      seq.current.orders++;
      seq.current.statement++;
      setLoadingAccount(true);
      setLoadingOrders(true);
      setLoadingStatement(true);
      try {
        const res = await switchActiveShiprocketAccountAction(accountId, token);
        if (res.success) {
          setAlertMsg({ type: 'success', text: res.message });
          await Promise.all([fetchAccountsList(), fetchAccount(), fetchOrders(), fetchStatement()]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to switch active account';
        setAlertMsg({ type: 'error', text: msg });
        setLoadingAccount(false);
        setLoadingOrders(false);
        setLoadingStatement(false);
      }
    },
    [token, fetchAccountsList, fetchAccount, fetchOrders, fetchStatement]
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

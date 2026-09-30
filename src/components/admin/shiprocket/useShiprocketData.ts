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

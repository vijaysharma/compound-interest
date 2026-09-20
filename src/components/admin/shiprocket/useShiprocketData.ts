'use client';
import { useState, useCallback, useEffect } from 'react';
import {
  getShiprocketAccountAction,
  getShiprocketOrdersAction,
  getShiprocketStatementAction,
} from '../../../actions/admin';
import type {
  ShiprocketAccountData,
  ShiprocketOrder,
  ShiprocketStatementItem,
  AlertMessage,
} from './types';
import { useShiprocketActions } from './useShiprocketActions';
export function useShiprocketData(token: string) {
  const [account, setAccount] = useState<ShiprocketAccountData | null>(null);
  const [orders, setOrders] = useState<ShiprocketOrder[]>([]);
  const [statement, setStatement] = useState<ShiprocketStatementItem[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [alertMsg, setAlertMsg] = useState<AlertMessage | null>(null);
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
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await getShiprocketOrdersAction({ per_page: 50 }, token);
      if (res.success && res.orders) {
        setOrders(res.orders);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load Shiprocket orders';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);
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
    fetchAccount();
    fetchOrders();
    fetchStatement();
  }, [fetchAccount, fetchOrders, fetchStatement]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);
  const actions = useShiprocketActions(token, fetchOrders, setAlertMsg);
  return {
    account,
    orders,
    statement,
    loadingAccount,
    loadingOrders,
    loadingStatement,
    alertMsg,
    setAlertMsg,
    fetchAccount,
    fetchOrders,
    fetchStatement,
    fetchAll,
    ...actions,
  };
}

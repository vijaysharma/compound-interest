import { useState, useEffect, useCallback } from 'react';
import type { AdminUser, AlertMessage } from './types';
import { getAdminUsersAction, updateAdminUserAction } from '../../../actions/admin';
export function useAdminUsers(
  effectiveToken: string,
  setBusy: (val: string | null) => void,
  setMessage: (msg: AlertMessage | null) => void
) {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [limitModalUser, setLimitModalUser] = useState<AdminUser | null>(null);
  const [customLimitInput, setCustomLimitInput] = useState<number>(15);
  const [now] = useState(() => Date.now());
  const fetchUsers = useCallback(async () => {
    if (!effectiveToken) return;
    try {
      const res = await getAdminUsersAction(effectiveToken);
      if (res.users) {
        setUsersList(
          res.users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name ?? null,
            role: (u.role as 'admin' | 'user') ?? 'user',
            api_usage_count: u.api_usage_count ?? 0,
            free_limit: u.free_limit ?? 15,
            subscription_status: u.subscription_status ?? 'free_trial',
            subscription_expires_at: u.subscription_expires_at ?? null,
            first_used_at: u.first_used_at ?? null,
            trial_expires_at: u.trial_expires_at ?? null,
            created_at: u.created_at ?? new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    }
  }, [effectiveToken]);
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (effectiveToken && !cancelled) {
        try {
          const userRes = await getAdminUsersAction(effectiveToken);
          if (userRes.users && !cancelled) {
            setUsersList(
              userRes.users.map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name ?? null,
                role: (u.role as 'admin' | 'user') ?? 'user',
                api_usage_count: u.api_usage_count ?? 0,
                free_limit: u.free_limit ?? 15,
                subscription_status: u.subscription_status ?? 'free_trial',
                subscription_expires_at: u.subscription_expires_at ?? null,
                first_used_at: u.first_used_at ?? null,
                trial_expires_at: u.trial_expires_at ?? null,
                created_at: u.created_at ?? new Date().toISOString(),
              }))
            );
          }
        } catch (err) {
          console.warn('Failed to fetch users:', err);
        }
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [effectiveToken]);
  const handleUserAction = async (
    userId: string,
    action: 'grant_access' | 'reset_usage' | 'reset_trial' | 'set_limit' | 'extend_trial_time',
    extra?: { free_limit?: number; hours?: number }
  ) => {
    setBusy(`user_${userId}`);
    setMessage(null);
    try {
      const res = await updateAdminUserAction(
        { user_id: userId, action, ...extra },
        effectiveToken
      );
      if (!res.success) throw new Error(res.message || 'Action failed');
      setMessage({ type: 'success', text: res.message || 'User updated.' });
      void fetchUsers();
      setLimitModalUser(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(null);
    }
  };
  return {
    usersList,
    limitModalUser,
    setLimitModalUser,
    customLimitInput,
    setCustomLimitInput,
    now,
    fetchUsers,
    handleUserAction,
  };
}

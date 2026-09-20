import { Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { AuthUser } from '@/types/auth';
import { trackUsageAction } from '@/actions/auth';
interface UseAuthUsageParams {
  token: string | null;
  user: AuthUser | null;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  setShowPaywall: Dispatch<SetStateAction<boolean>>;
}
export function useAuthUsage({
  token,
  user,
  setUser,
  setShowPaywall,
}: UseAuthUsageParams) {
  const isTrackingRef = useRef(false);
  const trackUsage = useCallback(
    async (initOnly = false): Promise<boolean> => {
      if (user?.isBlocked) {
        setShowPaywall(true);
        return false;
      }
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      if (!currentToken || isTrackingRef.current) return true;
      isTrackingRef.current = true;
      try {
        const data = await trackUsageAction(currentToken, initOnly ? 'init' : 'api');
        if (typeof data.api_usage_count === 'number') {
          setUser((prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              api_usage_count: data.api_usage_count!,
              freeLimit: data.freeLimit ?? prev.freeLimit,
              isBlocked: Boolean(data.isBlocked),
              first_used_at: data.first_used_at ?? prev.first_used_at,
              trial_expires_at: data.trial_expires_at ?? prev.trial_expires_at,
            };
            localStorage.setItem('auth_user', JSON.stringify(updated));
            return updated;
          });
        }
        if (data.isBlocked) {
          setShowPaywall(true);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Track usage error:', err);
        return true;
      } finally {
        isTrackingRef.current = false;
      }
    },
    [token, user?.isBlocked, setUser, setShowPaywall]
  );
  return { trackUsage };
}

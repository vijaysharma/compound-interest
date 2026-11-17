const GUEST_STORAGE_KEY = 'rupee_guest_session_id';
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_default';
  try {
    let id = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!id) {
      id = `guest_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      window.localStorage.setItem(GUEST_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'guest_fallback';
  }
}
/**
 * Retrieves the authentication token.
 * Note: Session authentication is primarily managed server-side via HttpOnly cookies (auth_token).
 * This client helper provides a fallback for client components during transition.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

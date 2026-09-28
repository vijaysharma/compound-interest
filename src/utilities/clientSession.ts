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
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

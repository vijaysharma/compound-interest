import { cookies } from 'next/headers';
const AUTH_COOKIE_NAME = 'auth_token';
/**
 * Sets an HttpOnly, Secure, SameSite=Lax authentication cookie.
 * Mitigates XSS-based token theft by keeping the token inaccessible to client JavaScript.
 */
export async function setAuthCookie(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch {
    // Gracefully ignore in non-request environments (e.g., node CLI or unit tests)
  }
}
/**
 * Clears the authentication cookie on logout.
 */
export async function clearAuthCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  } catch {
    // Gracefully ignore in non-request environments
  }
}
/**
 * Retrieves the authentication token from the request cookie if present.
 */
export async function getAuthCookie(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

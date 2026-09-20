'use server';
let cachedShiprocketToken: { token: string; expiresAt: number } | null = null;
let cachedShiprocketUser: Record<string, unknown> | null = null;
export async function getShiprocketAuth(
  forceRefresh = false
): Promise<{ token: string; user: Record<string, unknown> | null }> {
  const email = process.env.SHIPROCKET_EMAIL;
  const rawPassword = process.env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_API_TOKEN;
  const password = rawPassword ? rawPassword.replace(/\\(\$)/g, '$1') : undefined;
  const tokenEnv = process.env.SHIPROCKET_TOKEN;
  if (!email || !password) {
    throw new Error(
      'Shiprocket API credentials not configured in environment (SHIPROCKET_EMAIL, SHIPROCKET_API_TOKEN).'
    );
  }
  let authToken = tokenEnv;
  if (!authToken && password && password.startsWith('eyJ')) {
    authToken = password;
  }
  if (!forceRefresh && !authToken && cachedShiprocketToken && cachedShiprocketToken.expiresAt > Date.now()) {
    return { token: cachedShiprocketToken.token, user: cachedShiprocketUser };
  }
  if (forceRefresh || !authToken) {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const authData = (await authRes.json()) as { token?: string; message?: string; [key: string]: unknown };
    if (!authRes.ok || !authData.token) {
      const errorMsg = authData?.message || `HTTP ${authRes.status}`;
      console.error('Shiprocket authentication failed:', authRes.status, authData);
      throw new Error(`Shiprocket authentication failed: ${errorMsg}`);
    }
    authToken = authData.token;
    const { token: _unused, ...restUser } = authData;
    cachedShiprocketUser = restUser;
    cachedShiprocketToken = {
      token: authData.token,
      expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000,
    };
  }
  return { token: authToken, user: cachedShiprocketUser };
}
export async function shiprocketFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const { token } = await getShiprocketAuth();
  let res = await fetch(`https://apiv2.shiprocket.in/v1/external/${endpoint.replace(/^\//, '')}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    cachedShiprocketToken = null;
    const refreshed = await getShiprocketAuth(true);
    res = await fetch(`https://apiv2.shiprocket.in/v1/external/${endpoint.replace(/^\//, '')}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${refreshed.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  }
  return res;
}

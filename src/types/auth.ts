export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'admin' | 'user';
}
export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (
    authData: string | { credential?: string; email?: string; name?: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

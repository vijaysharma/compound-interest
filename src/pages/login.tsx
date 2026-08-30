import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Logo from '../components/Logo';
const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/investment-details', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  return (
    <div className="flex min-h-[75vh] items-center justify-center p-4">
      <div className="card bg-base-100 border border-base-300 w-full max-w-md p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold">Welcome to Rupee Calculator</h1>
          <p className="mt-2 text-sm opacity-70">
            Sign in with your Google account to access all investment, compounding, inflation, and mutual fund calculators.
          </p>
        </div>
        <div className="flex flex-col items-center">
          <GoogleSignInButton
            text="continue_with"
            onSuccess={() => navigate('/investment-details', { replace: true })}
            className="w-full"
          />
        </div>
        <div className="mt-8 border-t border-base-200 pt-6 text-center text-xs opacity-60">
          <p>Institutional-grade financial precision. Fast, private, and free.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;

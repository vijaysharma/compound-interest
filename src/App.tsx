import './App.css';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './components/TopBar';
import LoadingFallback from './components/LoadingFallback';
import PaywallModal from './components/PaywallModal';
import { AuthProvider } from './context/AuthContext';
import RouteTracker from './components/RouteTracker';
function App() {
  return (
    <AuthProvider>
      <RouteTracker />
      <TopBar className="sticky top-0 z-50" />
      <div className="container mx-auto">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <PaywallModal />
    </AuthProvider>
  );
}
export default App;

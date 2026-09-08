import './App.css';
import { Suspense } from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import TopBar from './components/TopBar';
import LoadingFallback from './components/LoadingFallback';
import PaywallModal from './components/PaywallModal';
import { AuthProvider } from './context/AuthContext';
import RouteTracker from './components/RouteTracker';
function App() {
  const navigation = useNavigation();
  const isNavigating = navigation.state === 'loading';
  return (
    <AuthProvider>
      <RouteTracker />
      {isNavigating && (
        <div className="nav-progress-bar">
          <div className="nav-progress-bar-inner" />
        </div>
      )}
      <TopBar className="app-topbar-sticky" />
      <div className={`container app-container ${isNavigating ? 'opacity-60 pointer-events-none' : ''}`}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <PaywallModal />
    </AuthProvider>
  );
}
export default App;

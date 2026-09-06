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
        <div className="fixed top-0 left-0 right-0 h-1 z-[100] overflow-hidden bg-primary/20 pointer-events-none">
          <div className="h-full bg-primary animate-pulse w-full" />
        </div>
      )}
      <TopBar className="sticky top-0 z-50" />
      <div className={`container mx-auto ${isNavigating ? 'opacity-60 pointer-events-none transition-opacity duration-150' : 'transition-opacity duration-150'}`}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <PaywallModal />
    </AuthProvider>
  );
}
export default App;

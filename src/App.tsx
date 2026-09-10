import styles from './App.module.scss';
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
        <div className={styles.navProgressBar}>
          <div className={styles.navProgressBarInner} />
        </div>
      )}
      <TopBar className={styles.appTopbarSticky} />
      <div className={`${styles.appContainer} ${isNavigating ? styles.navigating : ''}`}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <PaywallModal />
    </AuthProvider>
  );
}
export default App;

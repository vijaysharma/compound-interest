import './App.css';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './components/TopBar';
import LoadingFallback from './components/LoadingFallback';
function App() {
  return (
    <>
      <TopBar className="sticky top-0 z-50" />
      <div className="container">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </>
  );
}
export default App;

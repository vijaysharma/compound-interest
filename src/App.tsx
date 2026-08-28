import './App.css';
import { Outlet } from 'react-router-dom';
import TopBar from './components/TopBar';
function App() {
  return (
    <>
      <TopBar className="sticky top-0 z-50" />
      <div className="container">
        <Outlet />
      </div>
    </>
  );
}
export default App;

import React, { lazy, Suspense } from 'react';
import useAppViewModel from './viewmodels/useAppViewModel';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

// Lazy load components
const LoginView = lazy(() => import('./components/LoginView'));
const HomeView = lazy(() => import('./components/HomeView'));

function App() {
  const isLoggedIn = useAppViewModel((state) => state.isLoggedIn);

  return (
    <div className="min-h-screen w-full bg-white">
      <Suspense fallback={<LoadingSpinner />}>
        {isLoggedIn ? <HomeView /> : <LoginView />}
      </Suspense>
    </div>
  );
}

export default App;

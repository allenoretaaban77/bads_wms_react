import React from 'react';
import SidebarMenu from './SidebarMenu';
import HomeContent from './HomeContent';
import useAppViewModel from '../viewmodels/useAppViewModel';

function HomeView() {
  const username = useAppViewModel((state) => state.username);
  const logout = useAppViewModel((state) => state.logout);

  return (
    <div className="flex">
      <SidebarMenu />
      <main className="flex-1 min-h-screen bg-white">
        <header className="bg-header shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-white text-sm">Badong's Hardware Inventory System</p>
              <h1 className="text-white text-xl font-semibold">Home</h1>
            </div>
            <div className="flex items-center text-white text-sm">
              <span>Welcome, <strong>{username}</strong></span>
              <span className="mx-3">|</span>
              <button
                onClick={logout}
                className="hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-custom transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="w-full py-4 px-3">
          <HomeContent />
        </div>
      </main>
    </div>
  );
}

export default HomeView;

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
            <button
              onClick={logout}
              className="text-white hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-custom transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="w-full py-6 px-5">
          <div className="bg-green-50 border border-green-200 p-3 mb-6 rounded-custom">
            <p className="text-gray-700">
              Welcome, <strong>{username}</strong>. Use the left navigation to open each section.
            </p>
          </div>

          <HomeContent />
        </div>
      </main>
    </div>
  );
}

export default HomeView;

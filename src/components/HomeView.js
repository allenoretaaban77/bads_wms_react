import React from 'react';
import SidebarMenu from './SidebarMenu';
import HomeContent from './HomeContent';
import useAppViewModel from '../viewmodels/useAppViewModel.tsx';

function HomeView() {
  const userData = useAppViewModel((state) => state.userData);
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
              <span>Welcome, <strong>{userData?.firstname} {userData?.middlename} {userData?.lastname} [{userData?.employee_number}]</strong> | {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}</span>
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

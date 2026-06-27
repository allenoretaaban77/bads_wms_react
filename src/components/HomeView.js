import React from 'react';
import SidebarMenu from './SidebarMenu';
import HomeContent from './HomeContent';
import useAppViewModel from '../viewmodels/useAppViewModel.tsx';

function HomeView() {
  const userData = useAppViewModel((state) => state.userData);
  const logout = useAppViewModel((state) => state.logout);
  const menuItems = useAppViewModel((state) => state.menuItems);
  const activeTitle = useAppViewModel((state) => state.activeTitle);
  const activeLabel = useAppViewModel((state) => state.activeLabel);

  return (
    <div className="flex h-full">
      <SidebarMenu />
      <main className="flex-1 flex-col bg-white h-full">

        <header className="bg-header shadow-sm h-14">
          <div className="flex items-center justify-between px-2 py-1">
            <div>
              <p className="text-white text-sm">Badong's Hardware Inventory System</p>
              <h1 className="text-white text-xl font-semibold capitalize">{activeTitle || 'Inventory Management'} {activeTitle === 'Inventory Management - ' ? activeLabel : ''} </h1>
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

        <div className="flex-1 px-3 py-4 h-[calc(100vh-3.5rem)]">
          <HomeContent />
        </div>

      </main>
    </div>
  );
}

export default HomeView;

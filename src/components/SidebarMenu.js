import React from 'react';
import useAppViewModel from '../viewmodels/useAppViewModel';

const drawerWidth = 240;

// Icon mapping for menu items
const menuIcons = {
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  inventory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  stocks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  sales: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

function SidebarMenu() {
  const menuItems = useAppViewModel((state) => state.menuItems);
  const activeMenu = useAppViewModel((state) => state.activeMenu);
  const sidebarCollapsed = useAppViewModel((state) => state.sidebarCollapsed);
  const selectMenu = useAppViewModel((state) => state.selectMenu);
  const toggleSidebar = useAppViewModel((state) => state.toggleSidebar);

  return (
    <aside
      className={`bg-sidebar text-white transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'w-15' : 'w-60'
      } flex-shrink-0`}
    >
      <div className="flex items-center justify-between p-2 h-16">
        {!sidebarCollapsed && <div className="flex-1" />}
        <button
          onClick={toggleSidebar}
          className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-custom transition-colors duration-200"
        >
          {sidebarCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      <nav className="overflow-auto">
        <ul>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => selectMenu(item.key)}
                className={`w-full flex items-center py-3 px-2 text-white transition-colors duration-200 ${
                  activeMenu === item.key
                    ? 'bg-white bg-opacity-10 hover:bg-opacity-15'
                    : 'hover:bg-white hover:bg-opacity-5'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <div className={`text-white ${!sidebarCollapsed ? 'mr-3' : ''}`}>
                  {menuIcons[item.key] || (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-white">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default SidebarMenu;

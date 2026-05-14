import React from 'react';
import useAppViewModel from '../viewmodels/useAppViewModel';
import InventoryTable from './inventory/InventoryTable';
import ReplenishmentTable from './replenishment/ReplenishmentTable';

const descriptions = {
  profile: 'View your account details, role, and recent activity.',
  inventory: 'Monitor inventory levels for the warehouse.',
  stocks: 'Review stock status and replenishment alerts.',
  sales: 'Track recent sales activity and order performance.',
  users: 'Manage user accounts and access permissions.',
};

function HomeContent() {
  const activeMenu = useAppViewModel((state) => state.activeMenu);
  const userData = useAppViewModel((state) => state.userData);

  const title = activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1);
  const description = descriptions[activeMenu] || 'Select a menu item to begin.';

  // Render InventoryTable for inventory menu
  if (activeMenu === 'inventory') {
    return <InventoryTable />;
  }

  // Render ReplenishmentTable for stocks menu
  if (activeMenu === 'stocks') {
    return <ReplenishmentTable />;
  }

  // Render placeholder content for other menus
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-custom shadow-sm p-8">
        <div className="text-center text-gray-500">
          {activeMenu === 'profile' && userData && (
            <div>
              <h3 className="text-xl font-semibold mb-4">User Profile</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                <div><strong>Name:</strong> {userData.firstname} {userData.lastname}</div>
                <div><strong>Username:</strong> {userData.username}</div>
                <div><strong>Position:</strong> {userData.position_name}</div>
                <div><strong>Status:</strong> {userData.status}</div>
                <div><strong>Employee ID:</strong> {userData.employee_number}</div>
                <div><strong>Joined:</strong> {userData.date_created}</div>
              </div>
            </div>
          )}
          {activeMenu !== 'profile' && (
            <div>
              <h3 className="text-xl font-semibold mb-2">{title} Module</h3>
              <p>This module is under development.</p>
              <p className="mt-2">Please check back later for updates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeContent;

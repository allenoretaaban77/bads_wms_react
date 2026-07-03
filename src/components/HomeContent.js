import React from 'react';
import useAppViewModel from '../viewmodels/useAppViewModel.tsx';
import InventoryTable from './inventory/InventoryTable';
import ReplenishmentTable from './replenishment/ReplenishmentTable';
import SalesTable from './sales/SalesTable';
import ReturnsTable from './returns/ReturnsTable.js';
import EmployeesTable from './employees/EmployeesTable.tsx';
import DailySalesReport from './reports/DailySalesReport.js';
import SuppliersTable from './suppliers/SuppliersTable.js';
import StockInPurchasesLog from './reports/StockInPurchasesLog.js';
import MonthlySalesReport from './reports/MonthlySalesReport.js';
import DailyBusinessLedger from './reports/DailyBusinessLedger.js';

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

  const menuParts = activeMenu.split('|'); 
  const menuParent = menuParts[0];
  const menuChild = menuParts[1] ?? null; 
  
  switch(menuParent) {
    case 'employees':
      return <EmployeesTable />;
      break;
    case 'stocks':
    case 'replenishment':
    case 'replenishment_management':
      return <ReplenishmentTable page_type={menuChild}/>;
    case 'sales':
      return <SalesTable />;
    case 'returns':
      return <ReturnsTable />;
    case 'inventory':
      return <InventoryTable page_type={menuChild} />;
    case 'suppliers':
      return <SuppliersTable page_type={menuChild} />;
    case 'reports':
      return <DailySalesReport page_type={menuChild} />;
    case 'stockin':
      return <StockInPurchasesLog page_type={menuChild} />;
    case 'monthly':
      return <MonthlySalesReport page_type={menuChild} />;
    case 'ledger':
      return <DailyBusinessLedger page_type={menuChild} />;
    default:
      // return <DailySalesReport page_type={menuChild} />;
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

import React, { useState, useEffect } from 'react';
import '../App.css';

// Sample inventory data (this would come from API)
const sampleInventoryData = [
  {
    id: 1,
    product_name: 'Laptop Computer',
    sku: 'LAP-001',
    cost_per_unit: 450.00,
    price_per_unit: 899.99,
    initial_qty: 50,
    reorder_level: 10,
    current_qty: 23,
    status: 'Available',
    total_inventory_cost: 10350.00,
    total_inventory_value: 20699.77,
    total_sold: 27,
    date_created: '2026-01-15',
    date_updated: '2026-05-01'
  },
  {
    id: 2,
    product_name: 'Wireless Mouse',
    sku: 'MOU-002',
    cost_per_unit: 15.50,
    price_per_unit: 29.99,
    initial_qty: 100,
    reorder_level: 20,
    current_qty: 8,
    status: 'Low Stock',
    total_inventory_cost: 124.00,
    total_inventory_value: 239.92,
    total_sold: 92,
    date_created: '2026-01-20',
    date_updated: '2026-05-01'
  },
  {
    id: 3,
    product_name: 'USB-C Cable',
    sku: 'CAB-003',
    cost_per_unit: 8.25,
    price_per_unit: 15.99,
    initial_qty: 200,
    reorder_level: 50,
    current_qty: 156,
    status: 'Available',
    total_inventory_cost: 1287.00,
    total_inventory_value: 2494.44,
    total_sold: 44,
    date_created: '2026-02-01',
    date_updated: '2026-04-28'
  },
  {
    id: 4,
    product_name: 'Monitor Stand',
    sku: 'STN-004',
    cost_per_unit: 35.00,
    price_per_unit: 59.99,
    initial_qty: 30,
    reorder_level: 5,
    current_qty: 0,
    status: 'Out of Stock',
    total_inventory_cost: 0.00,
    total_inventory_value: 0.00,
    total_sold: 30,
    date_created: '2026-02-10',
    date_updated: '2026-05-02'
  },
  {
    id: 5,
    product_name: 'Keyboard Mechanical',
    sku: 'KEY-005',
    cost_per_unit: 75.00,
    price_per_unit: 149.99,
    initial_qty: 40,
    reorder_level: 8,
    current_qty: 12,
    status: 'Available',
    total_inventory_cost: 900.00,
    total_inventory_value: 1799.88,
    total_sold: 28,
    date_created: '2026-02-15',
    date_updated: '2026-04-30'
  }
];

function InventoryTable() {
  const [inventoryData, setInventoryData] = useState(sampleInventoryData);
  const [filteredData, setFilteredData] = useState(sampleInventoryData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter and search functionality
  useEffect(() => {
    let filtered = inventoryData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Quantity filter
    if (quantityFilter !== 'all') {
      switch (quantityFilter) {
        case 'out-of-stock':
          filtered = filtered.filter(item => item.current_qty === 0);
          break;
        case 'low-stock':
          filtered = filtered.filter(item => item.current_qty > 0 && item.current_qty <= item.reorder_level);
          break;
        case 'in-stock':
          filtered = filtered.filter(item => item.current_qty > item.reorder_level);
          break;
        default:
          break;
      }
    }

    setFilteredData(filtered);
  }, [inventoryData, searchTerm, statusFilter, quantityFilter]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventoryData(inventoryData.filter(item => item.id !== id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'Low Stock':
        return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getQuantityStatus = (current, reorder) => {
    if (current === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (current <= reorder) return { text: 'Low Stock', color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div>
      {/* Inventory Summary Statistics */}
      <div className="mb-6 bg-white p-6 rounded-custom border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">1,817</div>
            <div className="text-sm text-gray-600">No. of Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₱1,950,918.73</div>
            <div className="text-sm text-gray-600">Current Inventory Value</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₱1,193,482.74</div>
            <div className="text-sm text-gray-600">Current Inventory Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1,444</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">224</div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">149</div>
            <div className="text-sm text-gray-600">No Stock</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white p-4 rounded-custom border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Management</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Item
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Quantity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <select
              value={quantityFilter}
              onChange={(e) => setQuantityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
            >
              <option value="all">All Quantities</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Results count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredData.length} of {inventoryData.length} items
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-header">
                <th className="px-4 py-3 text-left text-white font-semibold border-0">Product Name</th>
                <th className="px-4 py-3 text-left text-white font-semibold border-0">SKU</th>
                <th className="px-4 py-3 text-right text-white font-semibold border-0">Cost/Unit</th>
                <th className="px-4 py-3 text-right text-white font-semibold border-0">Price/Unit</th>
                <th className="px-4 py-3 text-left text-white font-semibold border-0">Current Qty</th>
                <th className="px-4 py-3 text-left text-white font-semibold border-0">Reorder Level</th>
                <th className="px-4 py-3 text-right text-white font-semibold border-0">Total Inventory Cost</th>
                <th className="px-4 py-3 text-right text-white font-semibold border-0">Total Inventory Value</th>
                <th className="px-4 py-3 text-left text-white font-semibold border-0">Total Sold</th>
                <th className="px-4 py-3 text-left text-white font-semibold border-0">Status</th>
                <th className="px-4 py-3 text-center text-white font-semibold border-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                const quantityStatus = getQuantityStatus(item.current_qty, item.reorder_level);
                return (
                  <tr 
                    key={item.id}
                    className={`border-0 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                    }`}
                  >
                    <td className="px-4 py-3 border-0 font-medium">{item.product_name}</td>
                    <td className="px-4 py-3 border-0">{item.sku}</td>
                    <td className="px-4 py-3 border-0 text-right">₱{item.cost_per_unit.toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-right">₱{item.price_per_unit.toFixed(2)}</td>
                    <td className="px-4 py-3 border-0">
                      <span className={`font-medium ${quantityStatus.color}`}>
                        {item.current_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-0">{item.reorder_level}</td>
                    <td className="px-4 py-3 border-0 text-right text-blue-600 font-medium">₱{item.total_inventory_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-right text-green-600 font-medium">₱{item.total_inventory_value.toFixed(2)}</td>
                    <td className="px-4 py-3 border-0">{item.total_sold}</td>
                    <td className="px-4 py-3 border-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-0">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No inventory items found matching your criteria.
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Inventory Item Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Product Name:</strong> {selectedItem.product_name}
              </div>
              <div>
                <strong>SKU:</strong> {selectedItem.sku}
              </div>
              <div>
                <strong>Cost per Unit:</strong> ${selectedItem.cost_per_unit.toFixed(2)}
              </div>
              <div>
                <strong>Price per Unit:</strong> ${selectedItem.price_per_unit.toFixed(2)}
              </div>
              <div>
                <strong>Initial Quantity:</strong> {selectedItem.initial_qty}
              </div>
              <div>
                <strong>Current Quantity:</strong> {selectedItem.current_qty}
              </div>
              <div>
                <strong>Reorder Level:</strong> {selectedItem.reorder_level}
              </div>
              <div>
                <strong>Status:</strong> {selectedItem.status}
              </div>
              <div>
                <strong>Date Created:</strong> {selectedItem.date_created}
              </div>
              <div>
                <strong>Date Updated:</strong> {selectedItem.date_updated}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Inventory Item</h3>
            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  defaultValue={selectedItem.product_name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  defaultValue={selectedItem.sku}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selectedItem.cost_per_unit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={selectedItem.price_per_unit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                <input
                  type="number"
                  defaultValue={selectedItem.current_qty}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                <input
                  type="number"
                  defaultValue={selectedItem.reorder_level}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  defaultValue={selectedItem.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </form>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-custom hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Item Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Create New Inventory Item</h3>
            <form className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  placeholder="Enter SKU"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </form>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-custom hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors"
              >
                Create Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryTable;

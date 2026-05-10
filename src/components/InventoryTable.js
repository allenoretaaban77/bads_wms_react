import React, { useState, useEffect } from 'react';
import { getInventoryList, createInventoryItem, updateInventoryItem } from '../api/inventoryService';
import { APP_CONFIG } from '../config/constants';
import ViewInventoryModal from './inventory/ViewInventoryModal';
import EditInventoryModal from './inventory/EditInventoryModal';
import CreateInventoryModal from './inventory/CreateInventoryModal';

function InventoryTable() {
  // Data and loading states
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Sorting states
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState('all');
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Refresh function to trigger data reload
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch inventory data from API
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          pageSize: pageSize,
          search: searchTerm,
          sort: sortField,
          order: sortOrder,
          status: statusFilter !== 'all' ? statusFilter : '',
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : ''
        };

        const result = await getInventoryList(params);
        
        console.log('API Response:', result);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          setInventoryData(data);
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
        } else {
          // Handle API error response
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load inventory data');
          
          // Set empty data on error
          setInventoryData([]);
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(`Failed to load inventory data: ${err.message}`);
        
        // Set empty data on error
        setInventoryData([]);
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryData();
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey]);

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

  const handleCreateItem = async (itemData) => {
    try {
      const result = await createInventoryItem(itemData);
      if (result.success) {
        // Close modal immediately
        setShowCreateModal(false);
        
        // Show success alert
        setAlert({
          show: true,
          message: 'Inventory item created successfully!',
          type: 'success'
        });
        
        // Hide alert after 3 seconds
        setTimeout(() => {
          setAlert({ show: false, message: '', type: '' });
        }, 3000);
        
        // Refresh data to show the new item
        setCurrentPage(1); // Go to first page to see the new item
        // Trigger data refresh by incrementing refresh key
        setRefreshKey(prev => prev + 1);
      } else {
        setError(result.error || 'Failed to create item');
      }
      // Return the result so CreateInventoryModal can handle success/error states
      return result;
    } catch (err) {
      setError('Failed to create inventory item');
      // Return error result
      return {
        success: false,
        error: 'Failed to create inventory item'
      };
    }
  };

  const handleEditItem = async (id, itemData) => {
    try {
      const result = await updateInventoryItem(id, itemData);
      if (result.success) {
        // Refresh the data to show the updated item
        setSearchTerm(prev => prev); // This will trigger the useEffect
      } else {
        setError(result.error || 'Failed to update item');
      }
    } catch (err) {
      setError('Failed to update inventory item');
    }
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
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
    <div className="flex flex-col h-screen">
      {/* Alert Component */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-sm w-full ${
          alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {alert.type === 'success' ? (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">
                {alert.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setAlert({ show: false, message: '', type: '' })}
                className="-mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-500 rounded-md p-1.5 inline-flex h-8 w-8 transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fixed Header Sections */}
      <div className="flex-shrink-0 space-y-0">
        {/* Inventory Statistics */}
        <div className="bg-white p-2 rounded-custom border border-gray-200 mb-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 mb-1">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">1,817</div>
              <div className="text-xs text-gray-600">No. of Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">₱1,950,918.73</div>
              <div className="text-xs text-gray-600">Current Inventory Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">₱1,193,482.74</div>
              <div className="text-xs text-gray-600">Current Inventory Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">1,444</div>
              <div className="text-xs text-gray-600">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">224</div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">149</div>
              <div className="text-xs text-gray-600">No Stock</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800">Inventory Management</h3>
            <div className="flex space-x-2 pb-2">
              <button
                onClick={handleRefresh}
                className="mt-3 px-3 py-1.5 bg-gray-500 text-white rounded-custom hover:bg-gray-600 transition-colors duration-200 flex items-center text-sm"
                title="Refresh table"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors duration-200 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Search Bar */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Quantity</label>
              <select
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All Quantities</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Record Status</label>
              <select
                value={recordStatusFilter}
                onChange={(e) => setRecordStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {filteredData.length} of {totalItems} items
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 overflow-auto mt-2">
        {/* Inventory Table */}
        <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
            <span className="ml-2 text-gray-600">Loading inventory data...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {!loading && !error && (
          <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-header text-white">
                <tr>
                  <th 
                    onClick={() => handleSort('product_name')}
                    className="px-3 py-2 text-left text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      Product Name
                      {sortField === 'product_name' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('sku')}
                    className="px-3 py-2 text-left text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      SKU
                      {sortField === 'sku' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('cost_per_unit')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Cost per Unit
                      {sortField === 'cost_per_unit' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('price_per_unit')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Price per Unit
                      {sortField === 'price_per_unit' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('current_qty')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Current Qty
                      {sortField === 'current_qty' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('reorder_level')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Reorder Level
                      {sortField === 'reorder_level' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total_inventory_cost')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Total Cost
                      {sortField === 'total_inventory_cost' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total_inventory_value')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Total Value
                      {sortField === 'total_inventory_value' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('total_sold')}
                    className="px-3 py-2 text-right text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Total Sold
                      {sortField === 'total_sold' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-3 py-2 text-left text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center text-white font-semibold border-0">Actions</th>
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
                    <td className="px-3 py-2 border-0 text-sm font-semibold text-green-900">{item.product_name}</td>
                    <td className="px-3 py-2 border-0 text-sm">{item.sku}</td>
                    <td className="px-4 py-3 border-0 text-sm">₱{Number(item.cost_per_unit).toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-sm">₱{Number(item.price_per_unit).toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-sm">
                      <span className={`font-medium ${quantityStatus.color}`}>
                        {item.current_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-0 text-sm">{item.reorder_level}</td>
                    <td className="px-4 py-3 border-0 text-sm text-blue-600 font-medium">₱{Number(item.total_inventory_cost).toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-sm text-green-600 font-medium">₱{Number(item.total_inventory_value).toFixed(2)}</td>
                    <td className="px-4 py-3 border-0 text-sm">{item.total_sold}</td>
                    <td className="px-3 py-2 border-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 border-0">
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
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No inventory items found matching your criteria.
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-custom text-sm focus:outline-none focus:ring-2 focus:ring-button"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-custom text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded-custom text-sm ${
                          currentPage === pageNum
                            ? 'bg-button text-white border-button'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-custom text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* New Modal Components */}
        <ViewInventoryModal 
          selectedItem={selectedItem}
          showViewModal={showViewModal}
          setShowViewModal={setShowViewModal}
        />
        
        <EditInventoryModal 
          selectedItem={selectedItem}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          onSave={handleEditItem}
        />
        
        <CreateInventoryModal 
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          onSave={handleCreateItem}
        />
      </div>
    </div>
  );
}

export default InventoryTable;

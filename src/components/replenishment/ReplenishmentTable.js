import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api/inventoryService';
import { APP_CONFIG } from '../../config/constants';
import { 
  getReplenishmentList, 
  createRelenishmentTransaction,
  deleteRelenishmentTransaction
} from '../../api/replenishmentService';
import Alert from '../../utils/alert';
import ViewReplenishmentModal from './ViewReplenishmentModal';
import CreateReplenishmentModal from './CreateReplenishmentModal';
import EditReplenishmentModal from './EditReplenishmentModal';

function ReplenishmentTable() {
  // Data and loading states
  const [replenishmentData, setReplenishmentData] = useState([]);
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
    const loadreplenishmentData = async () => {
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

        const result = await getReplenishmentList(params);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          setReplenishmentData(data);
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
        } else {
          // Handle API error response
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load inventory data');
          
          // Set empty data on error
          setReplenishmentData([]);
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(`Failed to load inventory data: ${err.message}`);
        
        // Set empty data on error
        setReplenishmentData([]);
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadreplenishmentData();
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setAlert({ show: true, message: 'Edit functionality not implemented yet', type: 'warning' });
    setTimeout(() => { setAlert({ show: false, message: '', type: '' }); }, 1000);
    // window.alert('Edit functionality not implemented yet');
    // setSelectedItem(item);
    // setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const result = await deleteRelenishmentTransaction(id);
        if (result.success) {
          // Show success alert
          setAlert({
            show: true,
            message: 'Item successfully deleted',
            type: 'success'
          });
          
          // Hide alert after 3 seconds
          setTimeout(() => {
            setAlert({ show: false, message: '', type: '' });
          }, 3000);
          
          // Refresh data to show updated list
          setRefreshKey(prev => prev + 1);
        } else {
          setError(result.error || 'Failed to delete item');
        }
      } catch (err) {
        setError('Failed to delete inventory item');
      }
    }
  };

  const handleCreateReplenishment = async (itemData) => {
    try {
      const result = await createRelenishmentTransaction(itemData);
      
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
        return result;
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

  const handleEditItem = async (itemData) => {
    try {
      const result = await updateInventoryItem(itemData);
      if (result.success) {
        setShowEditModal(false);
        
        setAlert({
          show: true,
          message: 'Inventory item updated successfully!',
          type: 'success'
        });
        setTimeout(() => {
          setAlert({ show: false, message: '', type: '' });
        }, 3000);

        setCurrentPage(1);
        setRefreshKey(prev => prev + 1); // Trigger data refresh
      } else {
        setError(result.error || 'Failed to update item');
      }
    } catch (err) {
      setError('Failed to update inventory item');

      return {
        success: false,
        error: 'Failed to update inventory item'
      };
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

  
  const getQuantityStatus = (current, reorder) => {
    if (current === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (current <= reorder) return { text: 'Low Stock', color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Alert Component */}
      <Alert 
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onDismiss={() => setAlert({ show: false, message: '', type: '' })}
      />
      
      {/* Fixed Header Sections */}
      <div className="flex-shrink-0 space-y-0">

        {/* Search and Filters */}
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800">Replenishment</h3>
            <div className="flex space-x-2 pb-2">
              <button
                onClick={handleRefresh}
                className="mt-3 px-3 py-1.5 bg-gray-500 text-white rounded-custom hover:bg-green-600 transition-colors duration-200 flex items-center text-sm"
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
            <div className="lg:col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search supplier or reference number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
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
          <div className="bg-white border-gray-200 rounded-custom shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-header text-white">
                <tr>
                  <th 
                    onClick={() => handleSort('id')}
                    className="border-r px-3 py-2 text-left cursor-pointer hover:bg-green-700 text-white text-sm"
                  >
                    <div className="flex items-center">
                      ID
                      {sortField === 'id' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('reference_no')}
                    className="border-r px-3 py-2 text-left text-white text-sm font-semibold cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      Reference Number
                      {sortField === 'reference_no' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('date_received')}
                    className="border-r px-3 py-2 text-left text-white text-sm font-semibold cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      Date Received
                      {sortField === 'date_received' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('amount')}
                    className="border-r px-3 py-2 text-right text-white text-sm font-semibold cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center justify-end">
                      Amount
                      {sortField === 'amount' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('supplier')}
                    className="border-r px-3 py-2 text-left text-white text-sm font-semibold border-0 cursor-pointer hover:bg-green-700"
                  >
                    <div className="flex items-center">
                      Supplier
                      {sortField === 'supplier' && (
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
                    <td className="px-3 py-2 border-r text-sm font-semibold text-green-900">{item.id}</td>
                    <td className="px-3 py-2 border-r text-sm">{item.reference_no}</td>
                    <td className="px-3 py-2 border-r text-sm">{item.date_received}</td>
                    <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.amount)}</td>
                    <td className="px-3 py-2 border-r text-sm">{item.supplier}</td>
                    <td className="px-3 py-2 border-r">
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
                        {/* <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button> */}
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
        <ViewReplenishmentModal
          show={showViewModal}
          onClose={() => setShowViewModal(false)}
          id={selectedItem?.id}
        />
        
        <CreateReplenishmentModal 
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          onSave={handleCreateReplenishment}
        />
        
        <EditReplenishmentModal 
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowEditModal}
          onSave={handleCreateReplenishment}
        />

      </div>
    </div>
  );
}

export default ReplenishmentTable;


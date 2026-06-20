import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate, getTableStatusColor } from '../../utils/formatters';
import { createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api/inventoryService';
import { APP_CONFIG } from '../../config/constants';
import { 
  getReplenishmentList, 
  createReplenishmentTransaction,
  updateReplenishmentTransaction,
  approveReplenishmentTransaction,
  deleteReplenishmentTransaction
} from '../../api/replenishmentService';
import Alert from '../../utils/alert';
import ViewReplenishmentModal from './ViewReplenishmentModal';
import CreateReplenishmentModal from './CreateReplenishmentModal';
import UpdateReplenishmentModal from './UpdateReplenishmentModal';
import { FormButton, FormPagination, FormThead } from '../../utils/themes.js';

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
    // setAlert({ show: true, message: 'Edit functionality not implemented yet', type: 'warning' });
    // setTimeout(() => { setAlert({ show: false, message: '', type: '' }); }, 1000);

    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleShowUpdateFromView = (item) => {
    setShowViewModal(false);
    setSelectedItem(item);
    setShowEditModal(true);
  } 

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to DELETE this transaction?')) {
      setShowViewModal(false);

      try {
        const result = await deleteReplenishmentTransaction(id);
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
          setError(result.error || 'Failed to replenishment transaction.');
        }
      } catch (err) {
        setError('Failed to delete replenishment transaction.');
      }
    }
  };

  const handleCreateReplenishment = async (itemData) => {
    try {
      const result = await createReplenishmentTransaction(itemData);
      
      if (result.success) {
        // Close modal immediately
        setShowCreateModal(false);
        
        // Show success alert
        setAlert({
          show: true,
          message: 'Replenishment transaction created successfully!',
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
      setError('Failed to create replenishment transaction.');
      // Return error result
      return {
        success: false,
        error: 'Failed to create replenishment transaction.'
      };
    }
  };

  const handleEditReplenishment = async (itemData) => {
    try {
      const result = await updateReplenishmentTransaction(itemData);
      if (result.success) {
        setShowEditModal(false);
        
        setAlert({
          show: true,
          message: 'Replenishment transaction updated successfully!',
          type: 'success'
        });
        setTimeout(() => {
          setAlert({ show: false, message: '', type: '' });
        }, 3000);

        setCurrentPage(1);
        setRefreshKey(prev => prev + 1); // Trigger data refresh
      } else {
        return result;
      }
    } catch (err) {
      setError('Failed to update replenishment transaction.');

      return {
        success: false,
        error: 'Failed to update replenishment transaction.'
      };
    }
  };

  const handleApproveReplenishment = async (itemData) => {
    try {
      const result = await approveReplenishmentTransaction(itemData);
      if (result.success) {
        setShowViewModal(false);
        
        setAlert({
          show: true,
          message: 'Replenishment transaction approved successfully!',
          type: 'success'
        });
        setTimeout(() => {
          setAlert({ show: false, message: '', type: '' });
        }, 3000);

        setCurrentPage(1);
        setRefreshKey(prev => prev + 1); // Trigger data refresh
      } else {      
        return result;
      }
    } catch (err) {
      setError('Failed to approve replenishment transaction.');

      return {
        success: false,
        error: 'Failed to approve replenishment transaction.'
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
            <h3 className="text-base font-semibold text-gray-800">Replenishment Management</h3>
            <div className="flex space-x-2 pb-2">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={handleRefresh} 
                className="mt-3"
              />
              <FormButton
                btnType="success"
                btnLabel="Create"
                btnIcon="plus"
                onClick={() => setShowCreateModal(true)} 
                className="mt-3"
              />
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
            {/* Search Bar */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search reference number, supplier, amount, remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

            <div className="text-xs">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
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
            <div className="bg-white border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={[
                  {"title":"ID", "name":"id", "align":"center"},
                  {"title":"Reference Number", "name":"reference_no", "align":"left"},
                  {"title":"Date Received", "name":"date_received", "align":"left"},
                  {"title":"Amount", "name":"amount", "align":"right"},
                  {"title":"Supplier", "name":"supplier", "align":"left"},
                  {"title":"Remarks", "name":"remarks", "align":"left"},
                  {"title":"Status", "name":"status", "align":"center"},
                  {"title":"Actions", "name":"status", "default":1},
                ]} />
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
                      <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.date_received)}</td>
                      <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.amount)}</td>
                      <td className="px-3 py-2 border-r text-sm">{item.supplier}</td>
                      <td className="px-3 py-2 border-r text-sm">{item.remarks}</td>
                      <td className="px-3 py-2 border-r text-sm capitalize"><span className={getTableStatusColor(item.status)}>{item.status}</span></td>
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
                          {item.status == "draft" && (
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button> 
                          )}
                          {item.status == "draft" && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          )}

          {filteredData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No record/s found.
            </div>
          )}
          
          {/* Pagination Controls */}
          <FormPagination 
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            handlePageSizeChange={handlePageSizeChange}
            handlePageChange={handlePageChange}
          />
        </div>

        {/* New Modal Components */}
        <ViewReplenishmentModal
          show={showViewModal}
          onClose={() => setShowViewModal(false)}
          onUpdate={handleShowUpdateFromView}
          onDelete={handleDelete}
          onApprove={handleApproveReplenishment}
          id={selectedItem?.id}
        />
        
        <CreateReplenishmentModal 
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          onSave={handleCreateReplenishment}
        />
        
        <UpdateReplenishmentModal 
          selectedItem={selectedItem}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          onSave={handleEditReplenishment}
        />

      </div>
    </div>
  );
}

export default ReplenishmentTable;


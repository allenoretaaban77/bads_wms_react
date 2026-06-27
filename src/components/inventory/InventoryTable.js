import React, { useState, useEffect } from 'react';
import { getStatusColor } from '../../utils/statusColors';
import { getInventoryList, createInventoryItem, updateInventoryItem, deleteInventoryItem, getInventoryTableListSearch } from '../../api/inventoryService';
import { APP_CONFIG } from '../../config/constants';
import ViewInventoryModal from './ViewInventoryModal';
import UpdateInventoryModal from './UpdateInventoryModal';
import CreateInventoryModal from './CreateInventoryModal';
import { formatCurrency } from '../../utils/formatters';
import Alert from '../../utils/alert';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { FormButton, FormThSort, FormTh, FormThead } from '../../utils/themes.js';
import { FormPagination, usePaginationStore } from '../../utils/pagination.js';

function InventoryTable({ page_type }) {
  const userData = useAppViewModel((state) => state.userData);

  const { 
    sortField, setSortField,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalItems, setTotalItems,
    totalPages, setTotalPages,
    handlePageChange,
    handlePageSizeChange
  } = usePaginationStore();

  // Data and loading states
  const [inventoryData, setInventoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Summary states
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [totalInventoryCost, setTotalInventoryCost] = useState(0);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [totalNoStock, setTotalNoStock] = useState(0);
  const [totalInStock, setTotalInStock] = useState(0);
  const [totalLowStock, setTotalLowStock] = useState(0);
  
  // Alert state
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  // Refresh function to trigger data reload
  const handleRefresh = () => {
    setLoadingSummary(true);
    setRefreshKey(prev => prev + 1);
  };

  // Fetch inventory data from API
  useEffect(() => {
    const loadInventoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          type: page_type?.replace(/_/g, " "),
          page: currentPage,
          pageSize: pageSize,
          search: searchTerm,
          sort: sortField,
          order: sortOrder,
          status: statusFilter !== 'all' ? statusFilter : '',
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : ''
        };

        const result = await getInventoryList(params);
        
        // console.log('API Response:', result);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          setTotalProductCount(result.data?.totalProductCount || 0);
          setTotalInventoryCost(result.data?.totalInventoryCost || 0);
          setTotalInventoryValue(result.data?.totalInventoryValue || 0);
          setTotalNoStock(result.data?.totalNoStock || 0);
          setTotalLowStock(result.data?.totalLowStock || 0);
          setTotalInStock(result.data?.totalInStock || 0);
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
        setLoadingSummary(false);
      }
    };

    loadInventoryData();
  }, [page_type, currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to DELETE this item?')) {
      try {
        const result = await deleteInventoryItem(id, userData.employee_id);
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
        // setError(result.error || 'Failed to update item');
        return result;
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

  // const handlePageChange = (page) => {
  //   setCurrentPage(page);
  // };

  // const handlePageSizeChange = (newPageSize) => {
  //   setPageSize(newPageSize);
  //   setCurrentPage(1);
  // };
  
  const getQuantityStatus = (current, reorder) => {
    if (current === 0) return { text: 'Out of Stock', color: 'text-red-600' };
    if (current <= reorder) return { text: 'Low Stock', color: 'text-yellow-600' };
    return { text: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div className="flex flex-col h-screen">

      <Alert 
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onDismiss={() => setAlert({ show: false, message: '', type: '' })}
      />
      
      <div className="flex-shrink-0 space-y-0 mb-2">
        {/* Inventory Statistics */}
        <div className="bg-white p-2 rounded-custom border border-gray-200 mb-2">
          {loadingSummary && (
            <div className="flex justify-center items-center py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
              <span className="ml-2 text-gray-600">Loading summary data...</span>
            </div>
          )}
          {!loadingSummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-0.5">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalProductCount.toLocaleString()}</div>
              <div className="text-xs text-gray-600">No. of Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalInventoryValue)}</div>
              <div className="text-xs text-gray-600">Current Inventory Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalInventoryCost)}</div>
              <div className="text-xs text-gray-600">Current Inventory Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalInStock.toLocaleString()}</div>
              <div className="text-xs text-gray-600">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalLowStock.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalNoStock.toLocaleString()}</div>
              <div className="text-xs text-gray-600">No Stock</div>
            </div>
          </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">

            <div className="lg:col-span-9 text-xs">
              <label className="block font-semibold text-gray-600 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 tex-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

            <div className="text-xs">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Stock Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="No Stock">No Stock</option>
              </select>
            </div>

            <div className="text-xs lg:col-span-1 mt-1.5">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={handleRefresh} 
                className="mt-3 w-full"
              />
            </div>

            <div className="text-xs lg:col-span-1 mt-1.5">
              <FormButton
                btnType="success"
                btnLabel="Create"
                btnIcon="plus"
                onClick={() => setShowCreateModal(true)} 
                className="mt-3 w-full"
              />
            </div>
            
            {/* <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Record Status</label>
              <select
                value={recordStatusFilter}
                onChange={(e) => setRecordStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div> */}
          </div>
          
          {/* Results count */}
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {filteredData.length} of {totalItems} items
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-auto flex flex-col h-[calc(100vh-18.2rem)]">
        
        <table className="w-full table-auto border-collapse">
          <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={[
            {"title":"#", "name":"id", "align":"center"},
            {"title":"Product Name", "name":"product_name", "align":"left"},
            {"title":"SKU", "name":"sku", "align":"left"},
            {"title":"Cost per Unit", "name":"cost_per_unit", "align":"right"},
            {"title":"Price per Unit", "name":"price_per_unit", "align":"right"},
            {"title":"Current Quantity", "name":"current_qty", "align":"right"},
            {"title":"Reorder Level", "name":"reorder_level", "align":"right"},
            {"title":"Total Inventory Cost", "name":"total_inventory_cost", "align":"right"},
            {"title":"Total Inventory Value", "name":"total_inventory_value", "align":"right"},
            {"title":"Total Sold", "name":"total_sold", "align":"right"},
            {"title":"Status", "name":"status", "align":"center"},
            {"title":"Actions", "name":"status", "default":1},
          ]} />
          {!loading && !error && (
            <tbody className="divide-y">
              {filteredData.map((item, index) => {
                const quantityStatus = getQuantityStatus(item.current_qty, item.reorder_level);
                return (
                  <tr 
                    key={item.id}
                    className={`border-0 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                    }`}
                  >
                    <td className="px-3 py-2 border-r text-xs font-semibold text-green-900">{item.id}</td>
                    <td className="px-3 py-2 border-r text-xs font-semibold text-green-900">{item.product_name}</td>
                    <td className="px-3 py-2 border-r text-xs">{item.sku}</td>
                    {item && item.tracking_method === APP_CONFIG.TRACKING_METHOD.BATCH && (
                      <td className="px-4 border-r text-sxsm text-center">
                        <button
                          onClick={() => handleView(item)}
                          className="text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded hover:bg-yellow-50 transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    )}
                    {item && item.tracking_method === APP_CONFIG.TRACKING_METHOD.STANDARD && (
                      <td className="px-4 py-3 border-r text-sm text-right">{formatCurrency(item.cost_per_unit)}</td>
                    )}
                    <td className="px-4 py-3 border-r text-sm text-right">{formatCurrency(item.price_per_unit)}</td>
                    <td className="px-4 py-3 border-r text-sm text-right">
                      <span className={`font-medium ${quantityStatus.color}`}>
                        {item.current_qty}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-r text-sm text-right">{item.reorder_level}</td>
                    <td className="px-4 py-3 border-r text-sm text-blue-600 font-medium text-right">{formatCurrency(item.total_inventory_cost)}</td>
                    <td className="px-4 py-3 border-r text-sm text-green-600 font-medium text-right">{formatCurrency(item.total_inventory_value)}</td>
                    <td className="px-4 py-3 border-r text-sm text-right">{item.total_sold}</td>
                    <td className="px-3 py-2 border-r text-right justify-center">
                      <span className={`py-1 text-xs font-medium text-center ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-0 py-2 border-0">
                      <div className="flex justify-center space-x-1">
                        <button
                          onClick={() => handleView(item)}
                          className="text-blue-600 hover:text-blue-800 px-0 py-1 rounded hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-800 px-0 py-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 px-0 py-1 rounded hover:bg-red-50 transition-colors"
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
          )}
        
        </table>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
            <span className="ml-2 text-gray-600">Loading inventory data...</span>
          </div>
        )}

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No record/s found.
          </div>
        )}
        
      </div>

      <FormPagination 
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        handlePageSizeChange={handlePageSizeChange}
        handlePageChange={handlePageChange}
      />
        
      <ViewInventoryModal 
        selectedItem={selectedItem}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
      />
      
      <CreateInventoryModal 
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        onSave={handleCreateItem}
      />
      
      <UpdateInventoryModal 
        selectedItem={selectedItem}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        onSave={handleEditItem}
      />

    </div>
  );
}

export default InventoryTable;

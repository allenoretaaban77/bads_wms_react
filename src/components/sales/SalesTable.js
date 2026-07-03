import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate, getTablePaidStatus, getTableStatus, getTablePaymentStatus } from '../../utils/formatters';
import { APP_CONFIG } from '../../config/constants';
import {
  getSalesList,
  createSalesTransaction,
  updateSalesTransaction,
  approveSalesTransaction,
  voidSalesTransaction,
  deleteSalesTransaction,
} from '../../api/salesService';
import Alert from '../../utils/alert';
import ViewSalesModal from './ViewSalesModal';
import CreateSalesModal from './CreateSalesModal';
import UpdateSalesModal from './UpdateSalesModal';
import { FormButton, FormThead, FormHeaderLoader } from '../../utils/themes.js';
import { FormPagination } from '../../utils/pagination.js';

function SalesTable() {
  // Data and loading states
  const [saleDate, satSalesData] = useState([]);
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
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [isPaidFilter, setIsPaidFilter] = useState('all');
  
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
    const loadsatSalesData = async () => {
      console.log([currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey, paymentStatusFilter, isPaidFilter]);

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
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : '',
          payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : '',
          is_paid: isPaidFilter !== 'all' ? isPaidFilter : '',
        };

        const result = await getSalesList(params);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          satSalesData(data);
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
        } else {
          // Handle API error response
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load inventory data');
          
          // Set empty data on error
          satSalesData([]);
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(`Failed to load inventory data: ${err.message}`);
        
        // Set empty data on error
        satSalesData([]);
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadsatSalesData();
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey, paymentStatusFilter, isPaidFilter]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleShowUpdateFromView = (item) => {
    setShowViewModal(false);
    setSelectedItem(item);
    setShowEditModal(true);
  } 

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleVoid = async (id) => {
    if (window.confirm('Are you sure you want to VOID this transaction?')) {
      try {
        const result = await voidSalesTransaction(id);
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
          setError(result.error || 'Failed to void sales transaction.');
        }
      } catch (err) {
        setError('Failed to void sales transaction.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to DELETE this transaction?')) {
      setShowViewModal(false);

      try {
        const result = await deleteSalesTransaction(id);
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
          setError(result.error || 'Failed to delete sales transaction.');
        }
      } catch (err) {
        setError('Failed to void delete transaction.');
      }
    }
  };

  const handleApproveSales = async (itemData) => {
    try {
      const result = await approveSalesTransaction(itemData);
      if (result.success) {
        setShowViewModal(false);
        
        setAlert({
          show: true,
          message: 'Sales transaction approved successfully!',
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
      setError('Failed to approve sales transaction.');

      return {
        success: false,
        error: 'Failed to approve sales transaction.'
      };
    }
  };

  const handleCreateSales = async (itemData) => {
    try {
      const result = await createSalesTransaction(itemData);
      
      if (result.success) {
        // Close modal immediately
        setShowCreateModal(false);
        
        // Show success alert
        setAlert({
          show: true,
          message: 'Sales transaction created successfully!',
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

        handleView(result.data);
      } else {
        return result;
      }
      // Return the result so CreateInventoryModal can handle success/error states
      return result;
    } catch (err) {
      setError('Failed to create sales transaction.');
      // Return error result
      return {
        success: false,
        error: 'Failed to create sales transaction.'
      };
    }
  };

  const handleEditSales = async (itemData) => {
    try {
      const result = await updateSalesTransaction(itemData);
      if (result.success) {
        setShowEditModal(false);
        
        setAlert({
          show: true,
          message: 'Sales transaction updated successfully!',
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
      setError('Failed to update sales transaction.');

      return {
        success: false,
        error: 'Failed to update sales transaction.'
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
  
  const getRecordStatus = (status) => {
    if (status === 'inactive') return { text: 'Voided', color: 'text-red-600' };
    return { text: 'Active', color: 'text-green-600' };
  };

  return (
    <div className="flex flex-col h-screen">
      
      <div className="flex-shrink-0 space-y-0 mb-2">

        {/* Search and Filters */}
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">
            {/* Search Bar */}
            <div className="lg:col-span-7">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search transaction number, customer name, amount, payment type, remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

            <div className="text-xs lg:col-span-1">
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

            <div className="text-xs lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div className="text-xs lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Paid Status</label>
              <select
                value={isPaidFilter}
                onChange={(e) => setIsPaidFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="yes">Paid</option>
                <option value="no">Not Paid</option>
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
          </div>
          
          {/* Results count */}
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {filteredData.length} of {totalItems} items
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-0 mb-1.5 rounded text-left">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-auto flex flex-col h-[calc(100vh-13.5rem)]">

        <table className="w-full text-sm border-collapse">

          <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={
            [
              {"title":"ID", "name":"id", "align":"center"},
              {"title":"Invoice Number", "name":"invoice_no", "align":"left"},
              {"title":"Date Sold", "name":"date_sold", "align":"left"},
              {"title":"Amount", "name":"amount", "align":"right"},
              {"title":"Customer Name", "name":"customer_name", "align":"left"},
              {"title":"Payment Status", "name":"payment_status", "align":"center"},
              {"title":"Paid?", "name":"is_paid", "align":"center"},
              {"title":"Status", "name":"status", "align":"center"},
              {"title":"Remarks", "name":"remarks", "align":"center"},
              {"title":"Actions", "name":"status", "default":1},
            ]
          } />

          <tbody>
            {filteredData.map((item, index) => {
              return (
                <tr 
                  key={item.id}
                  className={`border-0 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                  }`}
                >
                  <td className="px-3 py-2 border-r text-sm font-semibold text-green-900">{item.id}</td>
                  <td className="px-3 py-2 border-r text-sm">{item.invoice_no}</td>
                  <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.date_sold)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-2 border-r text-sm">{item.customer_name}</td>
                  <td className="px-3 py-2 border-r text-sm text-center capitalize"><span className={getTablePaymentStatus(item.payment_status).color}>{getTablePaymentStatus(item.payment_status).text}</span></td>
                  <td className="px-3 py-2 border-r text-sm text-center capitalize"><span className={getTablePaidStatus(item.is_paid).color}> {getTablePaidStatus(item.is_paid).text}</span></td>
                  <td className="px-3 py-2 border-r text-sm text-center capitalize"><span className={getTableStatus(item.status).color}> {getTableStatus(item.status).text}</span></td>
                  <td className="px-3 py-2 border-r text-sm">{item.remarks}</td>
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
                      {item.status == "draft" && (
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-green-600 hover:text-green-800 px-0 py-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {item.status != "draft" && (
                        <button
                          onClick={() => handleVoid(item.id)}
                          className="text-red-600 hover:text-red-800 px-0 py-1 rounded hover:bg-red-50 transition-colors"
                          title="Void"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth={2} />
                            <line x1="5" y1="5" x2="19" y2="19" strokeWidth={2} />
                          </svg>
                        </button>
                      )}
                      {item.status == "draft" && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 px-0 py-1 rounded hover:bg-red-50 transition-colors"
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
        loading={loading}
      />

      <ViewSalesModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        onUpdate={handleShowUpdateFromView}
        onDelete={handleDelete}
        onApprove={handleApproveSales}
        onUpdateTable={() => handleRefresh()}
        id={selectedItem?.id}
      />

      <CreateSalesModal 
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        onSave={handleCreateSales}
      />
      
      <UpdateSalesModal 
        selectedItem={selectedItem}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        onSave={handleEditSales}
      />

      <Alert 
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onDismiss={() => setAlert({ show: false, message: '', type: '' })}
      />

    </div>
  );
}

export default SalesTable;


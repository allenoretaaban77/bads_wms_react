import React, { useState, useEffect } from 'react';
import { formatLongDate } from '../../utils/formatters';
import { APP_CONFIG } from '../../config/constants';
import Alert from '../../utils/alert';
import { FormButton, FormPagination, FormThead } from '../../utils/themes.js';
import { getSuppliersList } from '../../api/suppliersService.js';

function SuppliersTable({ page_type }) {
  // Data and loading states
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
  const [quantityFilter, setQuantityFilter] = useState('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState('all');
  const [isPaidFilter, setIsPaidFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
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
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          pageSize: pageSize,
          search: searchTerm,
          sort: sortField,
          order: sortOrder,
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : '',
          is_paid: isPaidFilter !== 'all' ? isPaidFilter : '',
        };

        const result = await getSuppliersList(params);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
        } else {
          // Handle API error response
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load inventory data');
          
          // Set empty data on error
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(`Failed to load inventory data: ${err.message}`);
        
        // Set empty data on error
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadsatSalesData();
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, quantityFilter, recordStatusFilter, refreshKey, isPaidFilter]);

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
      {/* Alert Component */}
      <Alert 
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onDismiss={() => setAlert({ show: false, message: '', type: '' })}
      />

      <div className="flex-shrink-0 space-y-0">
        {/* Search and Filters */}
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          <div className="flex justify-between items-center">
            {/* <h3 className="text-base font-semibold text-gray-800">Sales Management</h3> */}
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
              <span className="ml-2 text-gray-600">Loading suppliers data...</span>
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
                <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={
                  [
                    {"title":"ID", "name":"id", "align":"center"},
                    {"title":"Name", "name":"name", "date":"left"},
                    {"title":"Date Created", "name":"date_created", "date":"left"},
                    {"title":"Action", "name":"action", "default":1},
                  ]
                } />
                <tbody>
                  {filteredData.map((item, index) => {
                    return (
                      <tr 
                        key={index}
                        className={`border-0 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                        }`}
                      >
                        <td className="px-3 py-2 border-r text-sm font-semibold text-green-900">{index + 1}</td>
                        <td className="px-3 py-2 border-r text-sm">{item.name}</td>
                        <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.date_created)}</td>
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

      </div>
    </div>
  );
}

export default SuppliersTable;


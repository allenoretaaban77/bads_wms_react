import React, { useState, useEffect, use } from 'react';
import { formatLongDate } from '../../utils/formatters';
import Alert, { useAlert } from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getSuppliersList, deleteSupplier } from '../../api/suppliersService.js';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { FormPagination, usePaginationStore, usePagination } from '../../utils/pagination.js';
import { useHandlers } from '../../utils/handlers.js';
import { useAlertStore } from '../../utils/alert';

function SuppliersTable() {
  const userData = useAppViewModel((state) => state.userData);
  const alertObj = useAlertStore();
  const pagination = usePagination();
  const handlers = useHandlers();
  
  // Filter states
  const [filteredData, setFilteredData] = useState([]);
  const [recordStatusFilter] = useState('all'); 
  const [isPaidFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [, setSelectedItem] = useState(null);
  const [, setShowViewModal] = useState(false);
  const [, setShowEditModal] = useState(false);
  const [, setShowCreateModal] = useState(false);

  // Fetch suppliers data from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        pagination.setLoading(true);
        pagination.setError(null);
        
        const params = {
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          search: searchTerm,
          sort: pagination.sortField,
          order: pagination.sortOrder,
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : '',
          is_paid: isPaidFilter !== 'all' ? isPaidFilter : '',
        };

        const result = await getSuppliersList(params);
        
        if (result.success && result.data) {
          const data = result.data.data || result.data; 
          const total = result.data.total !== undefined ? result.data.total : data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pagination.pageSize);
          
          setFilteredData(data);
          pagination.setTotalItems(total);
          pagination.setTotalPages(totalPages);
        } else {
          console.warn('API returned error:', result.error);
          pagination.setError(result.error || 'Failed to load suppliers data');
          setFilteredData([]);
          pagination.setTotalItems(0);
          pagination.setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching suppliers:', err);
        pagination.setError(`Failed to load suppliers data: ${err.message}`);
        setFilteredData([]);
        pagination.setTotalItems(0);
        pagination.setTotalPages(0);
      } finally {
        pagination.setLoading(false);
      }
    };

    fetchSuppliers();
  }, [pagination.currentPage, pagination.pageSize, searchTerm, pagination.sortField, pagination.sortOrder, recordStatusFilter, isPaidFilter, alertObj.refreshSupplier]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleSort = (field) => {
    const newOrder = pagination.sortField === field && pagination.sortOrder === 'asc' ? 'desc' : 'asc';
    pagination.setSortField(field);
    pagination.setSortOrder(newOrder);
  };

  return (
    <div className="flex flex-col h-screen">
      <Alert 
        show={alertObj.alert.show}
        message={alertObj.alert.message}
        type={alertObj.alert.type}
        onDismiss={() => alertObj.setAlert({ show: false, message: '', type: '' })}
      />

      <div className="flex-shrink-0 space-y-0 mb-2">
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">
            <div className="lg:col-span-10 text-xs">
              <label className="block font-semibold text-gray-600 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>
            
            <div className="text-xs lg:col-span-1 mt-1.5">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={() => handlers.handleRefreshSupplier()} 
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
            
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {filteredData.length} of {pagination.totalItems} items
            </div>
          </div>
        </div>
      </div>
      
      {pagination.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 my-2 rounded text-center">
          <strong>Error:</strong> {pagination.error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-auto flex flex-col h-[calc(100vh-13.5rem)]">
        <table className="w-full text-sm border-collapse">
          <FormThead sortOrder={pagination.sortOrder} sortField={pagination.sortField} handleSort={handleSort} data={
            [
              {"title":"ID", "name":"id", "align":"center"},
              {"title":"Name", "name":"name", "date":"left"},
              {"title":"Date Created", "name":"date_created", "date":"left"},
              {"title":"Action", "name":"action", "default":1},
            ]
          } />
          {!pagination.loading && (
            <tbody>
              {filteredData.map((item, index) => {
                const sequentialRowNumber = ((pagination.currentPage - 1) * pagination.pageSize) + index + 1;
                
                return (
                  <tr 
                    key={item.id || index}
                    className={`border-0 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                    }`}
                  >
                    <td className="px-3 py-2 border-r text-sm font-semibold text-green-900">
                      {sequentialRowNumber}
                    </td>
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
                        <button
                          onClick={() => handlers.handleDelete(item.id, 'supplier')}
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

        {pagination.loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
            <span className="ml-2 text-gray-600">Loading suppliers data...</span>
          </div>
        )}

        {filteredData.length === 0 && !pagination.loading && (
          <div className="text-center py-8 text-gray-500">
            No record/s found.
          </div>
        )}
      </div>
      
      <FormPagination 
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        handlePageSizeChange={pagination.handlePageSizeChange}
        handlePageChange={pagination.handlePageChange}
      />
    </div>
  );
}

export default SuppliersTable;
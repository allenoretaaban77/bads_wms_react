import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate, getTablePaidStatus, getTableStatus, getTablePaymentStatus } from '../../utils/formatters';
import { APP_CONFIG } from '../../config/constants';
import Alert from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getDailyStockIns, updateReport } from '../../api/reportsService.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerDailySalesReport } from '../../utils/handlers.js';
import ViewStockInPurchasesLogItemsModal from './ViewStockInPurchasesLogItemsModal.js';

function StockInPurchasesLog({ page_type }) {
  const alertStore = useAlertStore();
  const { currentPage, setCurrentPage, pageSize, setPageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, setSortField, sortOrder, setSortOrder, loading, setLoading, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, showViewModal, setShowViewModal, showCreateModal, setShowCreateModal, showEditModal, setShowEditModal, handleRefresh, handleDelete, handleView } = useHandlerDailySalesReport();
  const [saleDate, satSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [tableHeader, setTableHeader] = useState([]);
  
  useEffect(() => { if (alertStore.alert.show == true) { setTimeout(() => { alertStore.setAlert({ show: false, message: '', type: '' })}, 3000); }}, [alertStore.alert]);

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
        };

        const result = await getDailyStockIns(params);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          const header = JSON.parse(result.data?.headers);
          
          satSalesData(data);
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
          setTableHeader(header);
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
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, alertStore.refreshDailySalesReport]);

  const hanldeUpdate = async (date) => {
    if (window.confirm('Are you sure you want to UPDATE this report?')) {
      try {
        const result = await updateReport(date);
        if (result.success) {
          alertStore.setAlert({
            show: true,
            message: formatLongDate(date) + ' report successfully updated.',
            type: 'success'
          });
          
          handleRefresh();
        } else {
          alertStore.setAlert({
            show: true,
            message: 'Failed to update report.',
            type: 'error'
          });
        }
      } catch (err) {
        alertStore.setAlert({
          show: true,
          message: 'Error on updating report.',
          type: 'error'
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">

      <div className="flex-shrink-0 space-y-0 mb-2">

        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">
            
            <div className="lg:col-span-11 text-xs mt-2">
              Showing {filteredData.length} of {totalItems} items
            </div>
                        
            <div className="text-xs lg:col-span-1">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={() => handleRefresh()} 
                className="w-full"
              />
            </div>

          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 mb-1.5 rounded text-center">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-auto flex flex-col h-[calc(100vh-10.7rem)]">
        
        <table className="w-full text-sm border-collapse">
          <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={tableHeader} />
          <tbody>
            {filteredData.map((item, index) => {
              return (
                <tr 
                  key={index}
                  className={`border-0 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                  }`}
                >
                  <td className="px-3 py-2 border-r text-sm font-semibold text-green-900 text-right">{index + 1}</td>
                  <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.date)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_purchase_cost) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{item.record_count.toLocaleString()}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{item.total_quantity.toLocaleString()}</td>
                  <td className="px-0 py-2 border-0">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleView(item)}
                        className="text-blue-600 hover:text-blue-800 px-0 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="Stock In (Purchases) Log Items"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16M4 6h.01M4 12h.01M4 18h.01" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleView(item)}
                        className="text-orange-600 hover:text-orange-800 px-0 py-1 rounded hover:bg-orange-50 transition-colors"
                        title="Stock In (Purchases) Log Deliveries"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2zM9 14h6" />
                        </svg>
                      </button>
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

      <ViewStockInPurchasesLogItemsModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        onDelete={handleDelete}
        onUpdateTable={() => handleRefresh()}
        item={selectedItem}
      />

      <Alert 
        show={alertStore.alert.show}
        message={alertStore.alert.message}
        type={alertStore.alert.type}
        onDismiss={() => alertStore.setAlert({ show: false, message: '', type: '' })}
      />
    </div>
  );
}

export default StockInPurchasesLog;


import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate, getTablePaidStatus, getTableStatus, getTablePaymentStatus } from '../../utils/formatters';
import { APP_CONFIG } from '../../config/constants';
import Alert from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getDailyReports, updateReport } from '../../api/reportsService.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert';

function DailySalesReport({ page_type }) {
  const alertStore = useAlertStore();

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

  const [tableHeader, setTableHeader] = useState([]);
  
  useEffect(() => { if (alertStore.alert.show == true) { setTimeout(() => { alertStore.setAlert({ show: false, message: '', type: '' })}, 3000); }}, [alertStore.alert]);

  // Refresh function to trigger data reload
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
          status: statusFilter !== 'all' ? statusFilter : '',
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : '',
          payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : '',
          is_paid: isPaidFilter !== 'all' ? isPaidFilter : '',
        };

        const result = await getDailyReports(params);
        
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
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, quantityFilter, recordStatusFilter, refreshKey, paymentStatusFilter, isPaidFilter]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
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

  const hanldeUpdate = async (date) => {
    if (window.confirm('Are you sure you want to UPDATE this report?')) {
      try {
        const result = await updateReport(date);
        if (result.success) {
          alertStore.setAlert({
            show: true,
            message: 'Report successfully updated.',
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
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.puhunan) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.tubo)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_sales)}</td>
                  {/* <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.cogs)}</td> */}
                  {/* <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.net_profit)}</td> */}
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
                        onClick={() => hanldeUpdate(item.date)}
                        className="text-orange-600 hover:text-orange-800 px-0 py-1 rounded hover:bg-orange-50 transition-colors"
                        title="View"
                      >
                        <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
            <span className="ml-2 text-gray-600">Loading reports data...</span>
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

      <Alert 
        show={alertStore.alert.show}
        message={alertStore.alert.message}
        type={alertStore.alert.type}
        onDismiss={() => alertStore.setAlert({ show: false, message: '', type: '' })}
      />
    </div>
  );
}

export default DailySalesReport;


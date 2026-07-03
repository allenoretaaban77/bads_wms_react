import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import Alert from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getDailyBusinessLedger, updateReport, updateLedgerValue } from '../../api/reportsService.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerDailyBusinessLedger } from '../../utils/handlers.js';
import ViewDailySalesItemsModal from './ViewDailySalesItemsModal.js';
import UpdateLedgerValueModal from './UpdateLedgerValueModal.js';

function DailyBusinessLedger({ page_type }) {
  const alertStore = useAlertStore();
  const { currentPage, setCurrentPage, pageSize, setPageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, setSortField, sortOrder, setSortOrder, loading, setLoading, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, showViewModal, setShowViewModal, showCreateModal, setShowCreateModal, showEditModal, setShowEditModal, showHardwareModal, setShowHardwareModal, showBahayModal, setShowBahayModal, showLedgerValueModal, setShowLedgerValueModal, handleRefresh, handleDelete, handleView } = useHandlerDailyBusinessLedger();
  const [saleDate, satSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableHeader, setTableHeader] = useState([]);
  const [monitoredItems, setMonitoredItems] = useState([]);
  const [monitoredIds, setMonitoredIds] = useState([]);
  
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

        const result = await getDailyBusinessLedger(params);
        
        // Check if API call was successful and returned data
        if (result.success && result.data) {
          // Handle different response structures
          const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          const header = JSON.parse(result.data?.headers);
          const monitored_items = result.data.monitored_items || [];
          const mids = result.data.mids || [];
          
          satSalesData(data);
          setMonitoredItems(monitored_items);
          setMonitoredIds(mids);
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

  const hanldeUpdate = (date) => {
    if (window.confirm('Are you sure you want to UPDATE this report?')) {
      triggerUpdate(date);
    }
  };

  const triggerUpdate = async (date) => {
    try {
      const result = await updateReport(date);
      if (result.success) {
        alertStore.setAlert({
          show: true,
          message: formatLongDate(date) + ' report successfully updated.',
          type: 'success'
        });
        
        handleRefresh();
        setTimeout(() => {handleRefresh()}, 1000);
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

  const handleUpdateValue = (item, valueType) => {
    setSelectedItem({
      ...item,
      ledgerValueToUpdate: valueType
    });
    setShowLedgerValueModal(true);
  }

  const handleSaveLedgerValue = async (data) => {
    console.log("handleSaveLedgerValue", data);
    try {
      const result = await updateLedgerValue(data);
      if (result.success) {
        alertStore.setAlert({
          show: true,
          message: 'Report successfully updated.',
          type: 'success'
        });
        
        handleRefresh();
        setTimeout(() => {handleRefresh()}, 1000);
      } else {
        alertStore.setAlert({
          show: true,
          message: 'Failed to update report.',
          type: 'error'
        });
      }

      setShowLedgerValueModal(false);
    } catch (err) {
      alertStore.setAlert({
        show: true,
        message: 'Error on updating report.',
        type: 'error'
      });

      setShowLedgerValueModal(false);
    }
  }

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

      <div className="block bg-white border border-gray-200 rounded-custom shadow-sm h-[calc(100vh-10.7rem)] w-[calc(100vw-13.5rem)] overflow-auto scrollbar-thin flex-shrink-0">

        <table className="text-sm border-collapse min-w-[3000px] w-full">
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
                  
                  {monitoredIds.map((value) => {
                    return (
                      <>
                        <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item[`p_${value.id}`] || 0)}</td>
                        <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item[`t_${value.id}`] || 0)}</td>
                        <td 
                          title={`Expenses for ${value.product_name} (${value.date_created.slice(0, 10)})`}
                          onClick={() => handleUpdateValue(value.id, value.product_name)}
                          className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500"
                        >
                          {formatCurrency(item[`ex_${value.id}`] || 0)}
                        </td>
                      </>
                    )
                  })}

                  <td 
                    title={item.hardware_details}
                    onClick={() => handleUpdateValue(item, "hardware")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500"
                  >
                    {formatCurrency(item.hardware || 0)}
                  </td>
                  <td 
                    title={item.bahay_details}
                    onClick={() => handleUpdateValue(item, "bahay")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500"
                  >
                    {formatCurrency(item.bahay || 0)}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_amount || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.money_on_hand || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_puhunan || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_tubo || 0)}</td>
                  <td className="px-0 py-2 border-0">
                    <div className="flex justify-center space-x-1">
                      {/* <button
                        onClick={() => handleView(item)}
                        className="text-blue-600 hover:text-blue-800 px-0 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button> */}
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
        
        {filteredData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500 min-w-[1700px] w-full">
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

      <ViewDailySalesItemsModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        onDelete={handleDelete}
        onUpdateTable={() => handleRefresh()}
        item={selectedItem}
      />
      
      <UpdateLedgerValueModal 
        selectedItem={selectedItem}
        showLedgerValueModal={showLedgerValueModal}
        setShowLedgerValueModal={setShowLedgerValueModal}
        onUpdate={handleSaveLedgerValue}
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

export default DailyBusinessLedger;


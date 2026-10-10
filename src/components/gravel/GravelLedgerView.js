import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate } from '../../utils/formatters.js';
import Alert from '../../utils/alert.js';
import { FormButton, FormThead } from '../../utils/themes.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert.js';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerDailyBusinessLedger } from '../../utils/handlers.js';
import ViewDailySalesItemsModal from '../reports/ViewDailySalesItemsModal.js';
import DatePicker from 'react-datepicker';
import { getDailyGravelLedger, updateGravelReportMonthly } from '../../api/gravelReportService.js';
import GenerateGravelLedgerModal from './GenerateGravelLedgerModal.js';

function GravelLedgerView({ selectedDate }) {
  const alertStore = useAlertStore();
  const { currentPage, setCurrentPage, pageSize, setPageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, setSortField, sortOrder, setSortOrder, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, showViewModal, setShowViewModal, showLedgerValueModal, setShowLedgerValueModal, handleRefresh, handleDelete, handleView, loading, setLoading } = useHandlerDailyBusinessLedger();
  const [saleDate, satSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableHeader, setTableHeader] = useState([]);
  const [monitoredItems, setMonitoredItems] = useState([]);
  const [monitoredIds, setMonitoredIds] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState([]);
  
  // Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [initialGravel, setInitialGravel] = useState(0);
  const [finalGravel, setFinalGravel] = useState(0);
  const [reportId, setReportId] = useState(0);
  
  useEffect(() => { if (alertStore.alert.show == true) { setTimeout(() => { alertStore.setAlert({ show: false, message: '', type: '' })}, 3000); }}, [alertStore.alert]);

  useEffect(() => {
    refreshSalesData();
  }, [selectedDate]);

  const refreshSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        pageSize: pageSize,
        search: searchTerm,
        sort: sortField,
        order: sortOrder,
        date: selectedDate
      };

      const result = await getDailyGravelLedger(params);
      
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
        // setMonitoredItems(monitored_items);
        // setMonitoredIds(mids);
        setFilteredData(data);
        setTotalItems(total);
        setTotalPages(totalPages);
        setTableHeader(header);

        setInitialGravel(result.data?.initialGravel || 0);
        setFinalGravel(result.data?.finalGravel || 0);
        setReportId(result.data?.id || 0);
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

  const handleShowGenerateModal = () => {
    setGenerateData({
      ...generateData,
      date_value: selectedDate,
      i_1898: initialGravel,
    });
    setShowGenerateModal(true);
  };

  const handleGenerateLedger = async (selectedMonth, selectedYear, runningGravel) => {
    try {
      setShowGenerateModal(false);
      setLoading(true);
      
      // Add your generation API call logic here, e.g.:
      // await generateMonthlyLedgerApi({ month: selectedMonth, year: selectedYear });
      const result = await updateGravelReportMonthly(selectedMonth + ', ' + selectedYear, runningGravel);

      alertStore.setAlert({
        show: true,
        message: `Monthly ledger for ${selectedMonth}/${selectedYear} updated successfully.`,
        type: 'success'
      });

      refreshSalesData();
    } catch (err) {
      alertStore.setAlert({
        show: true,
        message: 'Failed to generate monthly ledger.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExpensesValue = (item, valueType) => {
    if(item[`ex_${valueType}`] == null) {
      alertStore.setAlert({
        show: true,
        message: 'No reference amount.',
        type: 'error'
      });
      return;
    }

    setSelectedItem({
      ...item,
      ledgerValueToUpdate: valueType
    });
    setShowLedgerValueModal(true);
  }

  const handleUpdateValue = (item, valueType) => {
    console.log(valueType, item);

    if(item.id == null) {
      alertStore.setAlert({
        show: true,
        message: 'Record not found. Update to generate records.',
        type: 'error'
      });
      return;
    }

    setSelectedItem({
      ...item,
      ledgerValueToUpdate: valueType
    });

    setShowLedgerValueModal(true);
  }

  return (
    <div className="flex flex-col h-screen">

      <div className="flex-shrink-0 space-y-0 mb-2">

        <div className="bg-white p-1 rounded-custom border border-gray-200 mb-2">
          {loadingSummary && (
            <div className="flex justify-center items-center py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
              <span className="ml-2 text-gray-600">Loading summary data...</span>
            </div>
          )}
          {!loadingSummary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2 mr-3">
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial Gravel: <font className="font-bold">{formatCurrency(initialGravel)}</font></div>
                <div className="text-sm text-green-400">Final Gravel: <font className="font-bold">{formatCurrency(finalGravel)}</font></div>
              </div>
            </div>
          </>
          )}
        </div>

        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">
            
            <div className="lg:col-span-10 text-xs mt-2">
              Showing {filteredData.length} of {totalItems} items
            </div>
                        
            <div className="text-xs lg:col-span-1">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={() => refreshSalesData()} 
                className="w-full"
              />
            </div>
                                    
            <div className="text-xs lg:col-span-1">
              <FormButton
                btnType="primary"
                btnLabel="Update"
                btnIcon="refresh"
                onClick={() => handleShowGenerateModal()} 
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

      <div className="block bg-white border border-gray-200 rounded-custom shadow-sm h-[calc(100vh-14.2rem)] w-[calc(100vw-13.5rem)] overflow-auto scrollbar-thin flex-shrink-0">

        <table className="text-sm border-collapse w-full">
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
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1898) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1898)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1898)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1898)}</td>
                  
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

      <GenerateGravelLedgerModal
        show={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateLedger}
        selectedItem={generateData}
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

export default GravelLedgerView;


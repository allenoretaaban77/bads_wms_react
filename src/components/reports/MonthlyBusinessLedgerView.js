import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import Alert from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { updateReport, updateLedgerValue } from '../../api/reportsService.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerDailyBusinessLedger } from '../../utils/handlers.js';
import ViewDailySalesItemsModal from './ViewDailySalesItemsModal.js';
import UpdateLedgerValueModal from './UpdateLedgerValueModal.js';
import MonthlyBusinessLedger from './MonthlyBusinessLedger';
import DatePicker from 'react-datepicker';
import { getDailyBusinessLedger, updateReportMonthly } from '../../api/monthlyReportService.js';
import GenerateMonthlyLedgerModal from './GenerateMonthlyLedgerModal.js';

function MonthlyBusinessLedgerView({ selectedDate }) {
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
  const [totalPuhunan, setTotalPuhunan] = useState(0);
  const [totalTubo, setTotalTubo] = useState(0);
  const [totalPuhunanCement, setTotalPuhunanCement] = useState(0);
  const [totalTuboCement, setTotalTuboCement] = useState(0);
  const [totalPuhunanRSB, setTotalPuhunanRSB] = useState(0);
  const [totalTuboRSB, setTotalTuboRSB] = useState(0);
  const [totalPuhunanAll, setTotalPuhunanAll] = useState(0);
  const [totalTuboAll, setTotalTuboAll] = useState(0);
  const [initialMoneyOnHand, setInitialMoneyOnHand] = useState(0);
  const [initialPuhunan, setInitialPuhunan] = useState(0);
  const [initialTubo, setInitialTubo] = useState(0);
  const [finalMoneyOnHand, setFinalMoneyOnHand] = useState(0);
  const [finalPuhunan, setFinalPuhunan] = useState(0);
  const [finalTubo, setFinalTubo] = useState(0);
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

        setTotalPuhunan(result.data?.totalPuhunan || 0);
        setTotalTubo(result.data?.totalTubo || 0);
        setTotalSales(result.data?.totalSales || 0);
        setTotalPuhunanCement(result.data?.totalPuhunanCement || 0);
        setTotalTuboCement(result.data?.totalTuboCement || 0);
        setTotalPuhunanRSB(result.data?.totalPuhunanRSB || 0);
        setTotalTuboRSB(result.data?.totalTuboRSB || 0);
        setTotalPuhunanAll(result.data?.totalPuhunanAll || 0);
        setTotalTuboAll(result.data?.totalTuboAll || 0);
        setInitialMoneyOnHand(result.data?.initialMoneyOnHand || 0);
        setInitialPuhunan(result.data?.initialPuhunan || 0);
        setInitialTubo(result.data?.initialTubo || 0);
        setFinalMoneyOnHand(result.data?.finalMoneyOnHand || 0);
        setFinalPuhunan(result.data?.finalPuhunan || 0);
        setFinalTubo(result.data?.finalTubo || 0);
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
      initial_money_on_hand: initialMoneyOnHand,
      initial_puhunan: initialPuhunan, 
      initial_tubo: initialTubo
    });
    setShowGenerateModal(true);
  };

  const handleGenerateLedger = async (selectedMonth, selectedYear, runningMoneyOnHand, runningTubo, runningPuhunan) => {
    try {
      setShowGenerateModal(false);
      setLoading(true);
      
      // Add your generation API call logic here, e.g.:
      // await generateMonthlyLedgerApi({ month: selectedMonth, year: selectedYear });
      const result = await updateReportMonthly(selectedMonth + ', ' + selectedYear, runningMoneyOnHand, runningTubo, runningPuhunan);

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

  const handleSaveLedgerValue = async (data) => {
    data.initialMoneyOnHand = initialMoneyOnHand;
    data.initialPuhunan = initialPuhunan;
    data.initialTubo = initialTubo;
    data.date = selectedDate;
    
    try {
      const result = await updateLedgerValue(data);
      if (result.success) {
        alertStore.setAlert({
          show: true,
          message: 'Report successfully updated.',
          type: 'success'
        });
        
        refreshSalesData();
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

        <div className="bg-white p-1 rounded-custom border border-gray-200 mb-2">
          {loadingSummary && (
            <div className="flex justify-center items-center py-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
              <span className="ml-2 text-gray-600">Loading summary data...</span>
            </div>
          )}
          {!loadingSummary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mr-3">
              <div className="text-right">
                <div className="text-sm text-red-400">Puhunan: <font className="font-bold">{formatCurrency(totalPuhunan)}</font></div>
                <div className="text-sm text-orange-400">Tubo: <font className="font-bold">{formatCurrency(totalTubo)}</font></div>
                <div className="text-sm text-yellow-400">Total Sales: <font className="font-bold">{formatCurrency(totalSales)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-400">Puhunan Cement: <font className="font-bold">{formatCurrency(totalPuhunanCement)}</font></div>
                <div className="text-sm text-blue-400">Tubo Cement: <font className="font-bold">{formatCurrency(totalTuboCement)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-violet-400">Puhunan RSB: <font className="font-bold">{formatCurrency(totalPuhunanRSB)}</font></div>
                <div className="text-sm text-pink-400">Tubo RSB: <font className="font-bold">{formatCurrency(totalTuboRSB)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Starting Money On Hand: <font className="font-bold">{formatCurrency(initialMoneyOnHand)}</font></div>
                <div className="text-sm text-gray-600">Starting Puhunan: <font className="font-bold">{formatCurrency(initialPuhunan)}</font></div>
                <div className="text-sm text-gray-800">Starting Tubo: <font className="font-bold">{formatCurrency(initialTubo)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-emerald-700">Final Money On Hand: <font className="font-bold">{formatCurrency(finalMoneyOnHand)}</font></div>
                <div className="text-sm text-rose-700">Final Puhunan: <font className="font-bold">{formatCurrency(finalPuhunan)}</font></div>
                <div className="text-sm text-sky-700">Final Tubo: <font className="font-bold">{formatCurrency(finalTubo)}</font></div>
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

      <div className="block bg-white border border-gray-200 rounded-custom shadow-sm h-[calc(100vh-15.7rem)] w-[calc(100vw-13.5rem)] overflow-auto scrollbar-thin flex-shrink-0">

        <table className="text-sm border-collapse min-w-[4000px] w-full">
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
                  <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.report_date)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.puhunan) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.tubo)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_sales)}</td>
                  
                  {monitoredIds.map((value, vid) => {
                    return (
                      <>
                        <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item[`p_${value.id}`] || 0)}</td>
                        <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item[`t_${value.id}`] || 0)}</td>
                        <td 
                          onClick={() => handleUpdateValue(item, value.id)}
                          className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                        >
                          {formatCurrency(item[`ex_${value.id}`] || 0)}
                          <span className="invisible group-hover:visible absolute top-0 left-full ml-1.5 mt-1.5 w-max max-w-[350px] z-50 bg-green-900 text-white text-xs p-2 rounded shadow-lg pointer-events-none whitespace-pre-line text-left">   
                            {`Date: ${item.date}
                            Amount: ${formatCurrency(item[`ex_${value.id}`] || 0)}
                            
                            ${item[`ex_${value.id}_details`] || ''}`}
                          </span>
                        </td>
                      </>
                    )
                  })}

                  <td 
                    onClick={() => handleUpdateValue(item, "hardware")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                    {formatCurrency(item.hardware || 0)}
                    <span className="invisible group-hover:visible absolute top-0 left-full ml-1.5 mt-1.5 w-max max-w-[350px] z-50 bg-green-900 text-white text-xs p-2 rounded shadow-lg pointer-events-none whitespace-pre-line text-left">   
                      {`Date: ${item.date}
                      Amount: ${formatCurrency(item.hardware || 0)}
                      
                      ${item.hardware_details || ''}`}
                    </span>
                  </td>
                  <td 
                    onClick={() => handleUpdateValue(item, "bahay")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                    {formatCurrency(item.bahay || 0)}
                    <span className="invisible group-hover:visible absolute top-0 left-full ml-1.5 mt-1.5 w-max max-w-[350px] z-50 bg-green-900 text-white text-xs p-2 rounded shadow-lg pointer-events-none whitespace-pre-line text-left">   
                      {`Date: ${item.date}
                      Amount: ${formatCurrency(item.bahay || 0)}
                      
                      ${item.bahay_details || ''}`}
                    </span>
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_amount || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.money_on_hand || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_puhunan || 0)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.total_tubo || 0)}</td>
                  {/* <td className="px-0 py-2 border-0">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => hanldeUpdate(item.date)}
                        className="text-orange-600 hover:text-orange-800 px-0 py-1 rounded hover:bg-orange-50 transition-colors"
                        title="Update Ledger Records"
                      >
                        <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </td> */}
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

      <GenerateMonthlyLedgerModal
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

export default MonthlyBusinessLedgerView;


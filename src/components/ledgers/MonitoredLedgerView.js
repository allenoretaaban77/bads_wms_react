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
import MonthlyBusinessLedger from './MonthlyBusinessLedger.js';
import DatePicker from 'react-datepicker';
import { getDailyMonitoredLedger, updateMonitoredReportMonthly } from '../../api/monitoredReportService.js';
import GenerateMonitoredLedgerModal from '../ledgers/GenerateMonitoredLedgerModal.js';

function MonitoredLedgerView({ selectedDate }) {
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
  const [initialCement, setInitialCement] = useState(0);
  const [initialRSB10, setInitialRSB10] = useState(0);
  const [initialRSB12, setInitialRSB12] = useState(0);
  const [initialRSB16, setInitialRSB16] = useState(0);
  const [finalCement, setFinalCement] = useState(0);
  const [finalRSB10, setFinalRSB10] = useState(0);
  const [finalRSB12, setFinalRSB12] = useState(0);
  const [finalRSB16, setFinalRSB16] = useState(0);
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

      const result = await getDailyMonitoredLedger(params);
      
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

        setInitialCement(result.data?.initialCement || 0);
        setInitialRSB10(result.data?.initialRSB10 || 0);
        setInitialRSB12(result.data?.initialRSB12 || 0);
        setInitialRSB16(result.data?.initialRSB16 || 0);
        setFinalCement(result.data?.finalCement || 0);
        setFinalRSB10(result.data?.finalRSB10 || 0);
        setFinalRSB12(result.data?.finalRSB12 || 0);
        setFinalRSB16(result.data?.finalRSB16 || 0);
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
      i_21: initialCement,
      i_1421: initialRSB10, 
      i_1422: initialRSB12, 
      i_1423: initialRSB16
    });
    setShowGenerateModal(true);
  };

  const handleGenerateLedger = async (selectedMonth, selectedYear, runningCement, runningRSB10, runningRSB12, runningRSB16) => {
    try {
      setShowGenerateModal(false);
      setLoading(true);
      
      // Add your generation API call logic here, e.g.:
      // await generateMonthlyLedgerApi({ month: selectedMonth, year: selectedYear });
      const result = await updateMonitoredReportMonthly(selectedMonth + ', ' + selectedYear, runningCement, runningRSB10, runningRSB12, runningRSB16);

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mr-3">
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial Cement: <font className="font-bold">{formatCurrency(initialCement)}</font></div>
                <div className="text-sm text-green-400">Final Cement: <font className="font-bold">{formatCurrency(finalCement)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-600">Initial RSB 10: <font className="font-bold">{formatCurrency(initialRSB10)}</font></div>
                <div className="text-sm text-green-600">Final RSB 10: <font className="font-bold">{formatCurrency(finalRSB10)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-800">Initial RSB 12: <font className="font-bold">{formatCurrency(initialRSB12)}</font></div>
                <div className="text-sm text-green-800">Final RSB 12: <font className="font-bold">{formatCurrency(finalRSB12)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-900">Initial RSB 16: <font className="font-bold">{formatCurrency(initialRSB16)}</font></div>
                <div className="text-sm text-green-900">Final RSB 16: <font className="font-bold">{formatCurrency(finalRSB16)}</font></div>
              </div>
              {/* div className="text-right">
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
              </div> */}
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

        <table className="text-sm border-collapse min-w-[2000px] w-full">
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
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_21) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_21)}</td>
                  {Number(item.e_21) > 0 ? (
                    <td 
                      onClick={() => console.log(item)}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer"
                    >{formatCurrency(item.e_21)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_21)}</td>
                  )}
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_21)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1421) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1421)}</td>
                  {Number(item.e_1421) > 0 ? (
                    <td 
                      onClick={() => console.log(item)}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer"
                    >{formatCurrency(item.e_1421)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1421)}</td>
                  )}
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1421)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1422) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1422)}</td>
                  {Number(item.e_1422) > 0 ? (
                    <td 
                      onClick={() => console.log(item)}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer"
                    >{formatCurrency(item.e_1422)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1422)}</td>
                  )}
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1422)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1423) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1423)}</td>
                  {Number(item.e_1423) > 0 ? (
                    <td 
                      onClick={() => console.log(item)}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer"
                    >{formatCurrency(item.e_1423)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1422)}</td>
                  )}
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1423)}</td>
                  
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

      <GenerateMonitoredLedgerModal
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

export default MonitoredLedgerView;


import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate } from '../../utils/formatters.js';
import Alert from '../../utils/alert.js';
import { FormButton, FormThead } from '../../utils/themes.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert.js';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerDailyBusinessLedger } from '../../utils/handlers.js';
import ViewReplenishmentRecordsModal from './ViewReplenishmentRecords.js';
import { getDailySandLedger, updateSandReportMonthly, updateLedgerValue } from '../../api/sandReportService.js';
import GenerateSandLedgerModal from './GenerateSandLedgerModal.js';
import UpdateSandLedgerValueModal from './UpdateSandLedgerValueModal.js';

function SandLedgerView({ selectedDate }) {
  const alertStore = useAlertStore();
  const { currentPage, pageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, sortOrder, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, showViewModal, setShowViewModal, showLedgerValueModal, setShowLedgerValueModal, handleRefresh, handleDelete, handleView, loading, setLoading } = useHandlerDailyBusinessLedger();
  const [filteredData, setFilteredData] = useState([]);
  const [tableHeader, setTableHeader] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState([]);
  const [selectedItemdId, setSelectedItemId] = useState('');
  
  // Summary states
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [initialGravel, setInitialGravel] = useState(0);
  const [finalGravel, setFinalGravel] = useState(0);
  const [initialSand, setInitialSand] = useState(0);
  const [finalSand, setFinalSand] = useState(0);
  const [initialSandB, setInitialSandB] = useState(0);
  const [finalSandB, setFinalSandB] = useState(0);
  const [initialSandH, setInitialSandH] = useState(0);
  const [finalSandH, setFinalSandH] = useState(0);
  const [total, setTotal] = useState(0);
  
  useEffect(() => { if (alertStore.alert.show === true) { setTimeout(() => { alertStore.setAlert({ show: false, message: '', type: '' })}, 3000); }}, [alertStore.alert]);

  useEffect(() => {
    refreshSalesData();
  }, [selectedDate]);

  const refreshSalesData = async () => {
    try {
      setLoadingSummary(true);
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        pageSize: pageSize,
        search: '',
        sort: sortField,
        order: sortOrder,
        date: selectedDate
      };

      const result = await getDailySandLedger(params);
      
      // Check if API call was successful and returned data
      if (result.success && result.data) {
        // Handle different response structures
        const data = result.data.data || result.data; // Some APIs return {data: [...]}, others return [...]
        const total = result.data.count || data.length;
        const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
        const header = JSON.parse(result.data?.headers);
        
        setFilteredData(data);
        setTotalItems(total);
        setTotalPages(totalPages);
        setTableHeader(header);

        setInitialGravel(result.data?.initialGravel || 0);
        setFinalGravel(result.data?.finalGravel || 0);
        setInitialSand(result.data?.initialSand || 0);
        setFinalSand(result.data?.finalSand || 0);
        setInitialSandB(result.data?.initialSandB || 0);
        setFinalSandB(result.data?.finalSandB || 0);
        setInitialSandH(result.data?.initialSandH || 0);
        setFinalSandH(result.data?.finalSandH || 0);
        setTotal(result.data?.total || 0)
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
      setLoadingSummary(false);
    }
  };

  const handleShowGenerateModal = () => {
    setGenerateData({
      ...generateData,
      date_value: selectedDate,
      i_1898: initialGravel,
      i_1897: initialSand,
      i_1906: initialSandB,
      i_1907: initialSandH,
    });
    setShowGenerateModal(true);
  };

  const handleGenerateLedger = async (selectedMonth, selectedYear, runningGravel, runningSand, runningSandB, runningSandH) => {
    try {
      setShowGenerateModal(false);
      setLoading(true);
      
      // Add your generation API call logic here, e.g.:
      // await generateMonthlyLedgerApi({ month: selectedMonth, year: selectedYear });
      const result = await updateSandReportMonthly(selectedMonth + ', ' + selectedYear, runningGravel, runningSand, runningSandB, runningSandH);
      console.log('handleGenerateLedger', result);

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

  const handleExpensesValue = (item, valueType, itemName) => {
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
      ledgerValueToUpdate: valueType,
      [`pn_${valueType}`]: `${itemName} Expenses`
    });
    setShowLedgerValueModal(true);
  }

  const handleSaveLedgerValue = async (data) => {
    data.initialGravel = initialGravel;
    data.initialSand = initialSand;
    data.initialSandB = initialSandB;
    data.initialSandH = initialSandH;
    data.date = selectedDate;
    
    try {
      const result = await updateLedgerValue(data);
      console.log('handleSaveLedgerValue', result);
      if (result.success) {
        alertStore.setAlert({
          show: true,
          message: 'Report successfully updated.',
          type: 'success'
        });

        setTimeout(() => {refreshSalesData()}, 1000);
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
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-900"></div>
              <span className="ml-2 text-orange-700 ">Loading summary data...</span>
            </div>
          )}
          {!loadingSummary && (
          <>
            <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-5 gap-2 mr-3">
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial Gravel: <font className="font-bold">{formatCurrency(initialGravel)}</font></div>
                <div className="text-sm text-green-400">Final Gravel: <font className="font-bold">{formatCurrency(finalGravel)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial White Sand: <font className="font-bold">{formatCurrency(initialSand)}</font></div>
                <div className="text-sm text-green-400">Final White Sand: <font className="font-bold">{formatCurrency(finalSand)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial Sand Bistay: <font className="font-bold">{formatCurrency(initialSandB)}</font></div>
                <div className="text-sm text-green-400">Final Sand Bistay: <font className="font-bold">{formatCurrency(finalSandB)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-400">Initial Sand Hindi Bistay: <font className="font-bold">{formatCurrency(initialSandH)}</font></div>
                <div className="text-sm text-green-400">Final Sand Hindi Bistay: <font className="font-bold">{formatCurrency(finalSandH)}</font></div>
              </div>
              <div className="text-right">
                <div className="text-sm text-pink-400">Total Initial: <font className="font-bold">{formatCurrency(total.initialTotal)}</font></div>
                <div className="text-sm text-green-400">Total Final: <font className="font-bold">{formatCurrency(total.finalTotal)}</font></div>
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

        <table className="text-sm border-collapse min-w-[2500px] w-full">
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
                  {Number(item.e_1898) > 0 ? (
                    <td 
                      onClick={() => { setSelectedItemId('1898'); handleView(item, '1898'); }}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer hover:bg-yellow-200"
                    >{formatCurrency(item.e_1898)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1898)}</td>
                  )}
                  <td 
                    onClick={() => handleExpensesValue(item, "1898", "Gravel")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                      {formatCurrency(item.ex_1898)}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1898)}</td>

                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1897) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1897)}</td>
                  {Number(item.e_1897) > 0 ? (
                    <td 
                      onClick={() => { setSelectedItemId('1897'); handleView(item, '1897'); }}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer hover:bg-yellow-200"
                    >{formatCurrency(item.e_1897)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1897)}</td>
                  )}
                  <td 
                    onClick={() => handleExpensesValue(item, "1897", "White Sand")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                      {formatCurrency(item.ex_1897)}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1897)}</td>
                  
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1906) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1906)}</td>
                  {Number(item.e_1906) > 0 ? (
                    <td 
                      onClick={() => { setSelectedItemId('1906'); handleView(item, '1906'); }}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer hover:bg-yellow-200"
                    >{formatCurrency(item.e_1906)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1906)}</td>
                  )}
                  <td 
                    onClick={() => handleExpensesValue(item, "1906", "Sand Bistay")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                      {formatCurrency(item.ex_1906)}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1906)}</td>
                  
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.t_1907) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.p_1907)}</td>
                  {Number(item.e_1907) > 0 ? (
                    <td 
                      onClick={() => { setSelectedItemId('1907'); handleView(item, '1907'); }}
                      className="px-3 py-2 border-r text-sm text-right text-red-500 font-bold hover:text-orange-700 cursor-pointer hover:bg-yellow-200"
                    >{formatCurrency(item.e_1907)}
                    </td>
                  ) : (
                    <td className="px-3 py-2 border-r text-sm text-right text-red-500">{formatCurrency(item.e_1907)}</td>
                  )}
                  <td 
                    onClick={() => handleExpensesValue(item, "1907", "Sand Hindi Bistay")}
                    className="px-3 py-2 border-r text-sm text-right font-bold cursor-pointer hover:text-orange-100 hover:bg-green-500 relative overflow-visible group"
                  >
                      {formatCurrency(item.ex_1907)}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1907)}</td>

                  
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

      <ViewReplenishmentRecordsModal
        show={showViewModal}
        onClose={() => setShowViewModal(false)}
        onDelete={handleDelete}
        onUpdateTable={() => handleRefresh()}
        itemId={selectedItemdId}
        item={selectedItem}
      />
            
      <UpdateSandLedgerValueModal 
        selectedItem={selectedItem}
        showLedgerValueModal={showLedgerValueModal}
        setShowLedgerValueModal={setShowLedgerValueModal}
        onUpdate={handleSaveLedgerValue}
      />

      <GenerateSandLedgerModal
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

export default SandLedgerView;


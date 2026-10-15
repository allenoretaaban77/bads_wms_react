import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters.js';
import Alert from '../../utils/alert.js';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getSubstratesLedger, updateSubstratesReportMonthly } from '../../api/substratesReportService.js';
import { FormPagination } from '../../utils/pagination.js';
import { useAlertStore } from '../../utils/alert.js';
import { usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useHandlerMonthlyBusinessLedger } from '../../utils/handlers.js';
import GenerateSubstratesLedgerModal from './GenerateSubstratesLedgerModal.js';

function SubstratesLedger() {
  const alertStore = useAlertStore();
  const { currentPage, pageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, sortOrder, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, handleRefresh, handleDelete, loading, setLoading } = useHandlerMonthlyBusinessLedger();
  
  // State for Generate Ledger Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [filteredData, setFilteredData] = useState([]);
  const [tableHeader, setTableHeader] = useState([]);
  const { alert, setAlert, refreshDailySalesReport } = useAlertStore();
  
  useEffect(() => { 
    if (alert.show === true) { 
      const timer = setTimeout(() => { 
        setAlert({ show: false, message: '', type: '' });
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [alert.show, setAlert]);

  useEffect(() => {
    const loadsatSalesData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          pageSize: pageSize,
          search: "",
          sort: sortField,
          order: sortOrder,
        };

        const result = await getSubstratesLedger(params);
        
        if (result.success && result.data) {
          const data = result.data.data || result.data;
          const total = result.data.total || data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          const header = JSON.parse(result.data?.headers);
          
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
          setTableHeader(header);
        } else {
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load inventory data');
          
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError(`Failed to load inventory data: ${err.message}`);
        
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadsatSalesData();
  }, [currentPage, pageSize, sortField, sortOrder, setError, setLoading, setTotalItems, setTotalPages, refreshDailySalesReport]);
  
  const handleRegenerateReport = (item) => {
    if(item.id == null) {
      alertStore.setAlert({
        show: true,
        message: 'Record not found. Update to generate records.',
        type: 'error'
      });
      return;
    }

    setSelectedItem({
      ...item
    });

    setShowGenerateModal(true);
  };

  // Handler for Generating Monthly Ledger from Modal
  const handleGenerateLedger = async (selectedMonth, selectedYear, runningCement, runningRSB10, runningRSB12, runningRSB16) => {
    try {
      setShowGenerateModal(false);
      setLoading(true);
      
      const result = await updateSubstratesReportMonthly(selectedMonth + ', ' + selectedYear, runningCement, runningRSB10, runningRSB12, runningRSB16);

      alertStore.setAlert({
        show: true,
        message: `Monthly ledger for ${selectedMonth}/${selectedYear} generated successfully.`,
        type: 'success'
      });
      handleRefresh();
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

  const handleViewReport = (item) => {
    const targetMenuKey = 'substrates_ledger_view|' + item.date_value + '|' + item.date;

    const newTabUrl = `${window.location.origin}${window.location.pathname}?menu=${encodeURIComponent(targetMenuKey)}`;

    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 space-y-0 mb-2">
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
                onClick={() => handleRefresh()} 
                className="w-full"
              />
            </div>
                        
            <div className="text-xs lg:col-span-1">
              <FormButton
                btnType="primary"
                btnLabel="Generate"
                btnIcon="refresh"
                onClick={() => { setSelectedItem(null); setShowGenerateModal(true); }} 
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
        <table className="text-sm border-collapse min-w-[1000px] w-full">
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
                  <td className="px-3 py-2 border-r text-sm">{item.date}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.i_1898) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_1898)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.i_309) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_310)}</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.i_309) }</td>
                  <td className="px-3 py-2 border-r text-sm text-right">{formatCurrency(item.r_310)}</td>
                  <td className="px-0 py-2 border-0">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleViewReport(item)}
                        className="text-blue-600 hover:text-blue-800 px-0 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRegenerateReport(item)}
                        className="text-orange-600 hover:text-orange-800 px-0 py-1 rounded hover:bg-orange-50 transition-colors"
                        title="Update Ledger Records"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-800 px-0 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Generate Monthly Ledger Modal */}
      <GenerateSubstratesLedgerModal
        show={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateLedger}
        selectedItem={selectedItem}
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

export default SubstratesLedger;
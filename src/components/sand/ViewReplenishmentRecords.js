import React, { useState, useEffect } from 'react';
import { formatCurrency, formatLongDate } from '../../utils/formatters.js';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';
import { getSendReplenishmentView } from '../../api/sandReportService.js';

function ViewReplenishmentRecordsModal({ show, onClose, onDelete, onUpdateTable, item, itemId }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && item && itemId) {
      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getSendReplenishmentView({
          date: item.date,
          item_id: itemId
        });

        if (result.success) {
          setData(result.data.data || result.data);
          setSummary(result.data.summary || result.summary);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, item, itemId]);

  const handleClose = () => {
    setData([]);
    setSummary([]);
    setError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-screen-xl w-full mx-2 flex flex-col max-h-[85vh]">

        <FormHeader headerTitle={`View Replenishment Records - ` + formatLongDate(item?.date)} onClick={handleClose} />

        <div className="p-3 flex-1 flex flex-col min-h-0 space-y-4 text-xs">
          {loading && (
            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium animate-pulse flex-shrink-0">
              Loading...
            </div>
          )}
          {error && (
            <div className="w-full text-center py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium flex-shrink-0">
              {error}
            </div>
          )}
          
          {data && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">

              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Product Name</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{summary.product_name}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Replenishment Date</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{formatLongDate(summary.date)}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Total</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{formatCurrency(summary.total)}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Record Count</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{summary.count}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner scrollbar-thin">
                  <table className="w-full text-left table-auto border-collapse">
                    <FormModalTheadDefault data={[
                      {"title":"#", "class":"py-2 text-center w-10"},
                      {"title":"Reference No.", "class":"py-2 text-left w-28"},
                      {"title":"Quantity", "class":"py-2 text-right w-30"},
                      {"title":"Price", "class":"py-2 text-right w-30"},
                      {"title":"Total Sales", "class":"py-2 pl-5 text-right w-30"},
                      {"title":"Supplier", "class":"py-2 text-left w-30"},
                      {"title":"Remarks", "class":"py-2 text-left w-30"},
                    ]} />
                    <tbody className="divide-y divide-gray-100">
                      {data && data.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3 py-2 font-mono text-gray-700 text-right">
                            {item.id}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700 ">
                            {item.reference_no}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium text-right">
                            {Number(item.qty_added)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.cost_per_unit)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700 text-left">
                            {item.supplier}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700 text-left">
                            {item.remarks}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex-shrink-0 rounded bg-gray-50 text-right text-sm font-bold text-emerald-800 shadow-sm flex justify-end items-center gap-2 px-3 pb-3">
            <FormButton
              btnType="outline"
              btnLabel="Close"
              btnIcon="cross" 
              onClick={handleClose}
              form="create-inventory-form"
            />
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewReplenishmentRecordsModal;
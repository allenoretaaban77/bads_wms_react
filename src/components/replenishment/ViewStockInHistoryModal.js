import React, { useState, useEffect } from 'react';
import { getStockInTransactions } from '../../api/replenishmentService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';

function ViewStockInHistoryModal({ show, onClose, id, item }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (show && id) {
      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getStockInTransactions(item.inventory_id, item.cost);
        if (result.success) {
          console.log('getStockInTransactions', result.data);
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, id, item]);

  const handleClose = () => {
    setData(null);
    setError(null);
    setLoading(false);
    onClose();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-3xl w-full mx-4 flex flex-col max-h-[85vh]">
  
        {/* Header Container */}
        <FormHeader headerTitle="View Stock-In History" onClick={handleClose} />

        {/* Content Body Container */}
        <div className="p-3 flex-1 flex flex-col min-h-0 space-y-4 text-xs">
          
          {/* Global Messaging Status Bars */}
          {loading && (
            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium animate-pulse">
              Loading transaction history matrix...
            </div>
          )}
          {error && (
            <div className="w-full text-center py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium">
              {error}
            </div>
          )}

          {data && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">     
              {/* Product Metadata Info Board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block">Product Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.product_name}</span>
                </div>
                {data.sku && (
                  <div className="text-center">
                    <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block pb-1">Stock Keeping Unit</span>
                    <span className="font-mono bg-white border border-gray-300 px-2 py-0.5 rounded text-gray-700 font-bold">{data.sku}</span>
                  </div>
                )}
              </div>

              {/* Scrollable Data Table Frame */}
              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner">
                <table className="w-full text-left table-auto border-collapse">
                  <FormModalTheadDefault data={[
                    {"title":"Date Received", "class":"py-2 text-left"},
                    {"title":"Reference No.", "class":"py-2 text-left"},
                    {"title":"Quantity", "class":"py-2 text-right"},
                    {"title":"Unit Cost", "class":"py-2 text-right"},
                    {"title":"Total", "class":"py-2 pl-5 text-right"},
                  ]} />
                  <tbody className="divide-y divide-gray-100">
                    {data.items && data.items.map((itemRow) => (
                      <tr key={itemRow.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2 text-gray-600 align-middle">
                          {formatLongDate(itemRow.date_received)}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-800 align-middle">
                          {itemRow.reference_no}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 align-middle">
                          {Number(itemRow.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 align-middle">
                          {formatCurrency(itemRow.cost)}
                        </td>
                        <td className="px-3 py-2 text-right pr-4 font-bold text-gray-900 align-middle">
                          {formatCurrency(itemRow.total)}
                        </td>
                      </tr>
                    ))}
                    {(!data.items || data.items.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 italic bg-gray-50/30">
                          No logging tracks detected for this pricing baseline.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dialog Action Footprint */}
          <div className="flex justify-end space-x-2 flex-shrink-0  border-t border-gray-100">
            <FormButton
              btnType="outline"
              btnLabel="Close"
              btnIcon="cross"
              onClick={handleClose} 
            />
          </div>

        </div>

      </div>
    </div>
  );
}

export default ViewStockInHistoryModal;
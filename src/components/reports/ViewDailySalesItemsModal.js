import React, { useState, useEffect } from 'react';
import { getDailyReportItems } from '../../api/reportsService.js';
import { formatCurrency, formatLongDate } from '../../utils/formatters.js';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';

function ViewDailySalesItemsModal({ show, onClose, onDelete, onUpdateTable, item }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && item) {
      console.log(item);

      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getDailyReportItems(item);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, item]);

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-screen-xl w-full mx-2 flex flex-col max-h-[85vh]">

        <FormHeader headerStatus={data?.status} headerPaymentStatus={data?.payment_status} headerIsPaidStatus={data?.is_paid} headerTitle={`Daily Sales Report Items - ` + formatLongDate(data?.report_date)} onClick={handleClose} />

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

              {/* <div className="grid grid-cols-1 md:grid-cols-5 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Report Date</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{formatLongDate(data.report_date)}</span>
                </div>
              </div> */}

              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner scrollbar-thin">
                  <table className="w-full text-left table-auto border-collapse">
                    <FormModalTheadDefault data={[
                      {"title":"#", "class":"py-2 text-right w-10"},
                      {"title":"SKU", "class":"py-2 text-left w-28"},
                      {"title":"Sales Reference No", "class":"py-2 text-left"},
                      {"title":"Product Name", "class":"py-2 text-left"},
                      {"title":"Quantity", "class":"py-2 text-right w-30"},
                      // {"title":"Cost", "class":"py-2 text-right w-30"},
                      {"title":"Price", "class":"py-2 text-right w-30"},
                      {"title":"Total Sales", "class":"py-2 pl-5 text-right w-30"},
                      {"title":"Puhunan", "class":"py-2 text-right w-30"},
                      {"title":"Tubo", "class":"py-2 text-right w-30"},
                    ]} />
                    <tbody className="divide-y divide-gray-100">
                      {data.items && data.items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3 py-2 font-mono text-gray-700 font-semibold text-right">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700 font-semibold">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium align-middle">
                            {item.invoice_no}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium align-middle">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium text-right">
                            {item.qty_sold}
                          </td>
                          {/* <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.cost_per_unit)}
                          </td> */}
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.price_per_unit)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.total_sales)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.puhunan)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.tubo)}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-800">
                        <tr>
                          <td colSpan="4" className="px-3 py-2.5 text-left uppercase tracking-wider text-[10px] text-gray-500 align-middle">
                            Grand Total
                          </td>
                          <td className="py-2 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            {data.total_quantity}
                          </td>
                          <td className="py-2 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            
                          </td>
                          <td className="py-2 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            {formatCurrency(data.total_sales)}
                          </td>
                          <td className="py-2 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            {formatCurrency(data.total_puhunan)}
                          </td>
                          <td className="py-2 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            {formatCurrency(data.total_tubo)}
                          </td>
                        </tr>
                      </tfoot>
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

export default ViewDailySalesItemsModal;
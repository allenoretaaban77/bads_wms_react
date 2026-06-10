import React, { useState, useEffect } from 'react';
import { getStockInTransactions } from '../../api/replenishmentService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';

function ViewStockInHistoryModal({ show, onClose, id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (show && id) {
      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getStockInTransactions(id);
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
  }, [show, id]);

  const handleClose = () => {
    setData(null);
    setError(null);
    setLoading(false);
    onClose();
  }

  const getStatus = (current) => {
    if (current == "draft") return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Approved', color: 'text-green-600' };
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
      {/* <div className="bg-white rounded-custom p-4 max-w-screen-xl w-full mx-2 max-h-screen overflow-y-auto"> */}
  
        <div className="mb-2 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            View Stock-In History
          </h2 >
          {loading && <div className='w-full text-center'><span className='text-green-700'>Loading...</span></div>}
          {error && <div className='w-full text-center'><span className='text-red-500'>{error}</span></div>}
        </div>

        {data && (
          <div>
            <div className="grid grid-cols-2 gap-0 mb-2 text-sm">
              <div><span>Product Name:</span> <span className="font-semibold text-red-400">{data.product_name} ({data.sku})</span></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <div className="bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-header text-white">
                    <tr className="border-0">
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Date Received</th>
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Transaction #</th>
                      <th className="border-r p-2 text-right">Quantity</th>
                      <th className="border-r p-2 text-right">Cost per Unit</th>
                      <th className="border-r p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border-r border-b p-2">{formatLongDate(item.date_received)}</td>
                        <td className="border-r border-b border-l p-2">{item.reference_no}</td>
                        <td className="border-r border-b p-2 text-right">{item.quantity}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.cost)}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewStockInHistoryModal;
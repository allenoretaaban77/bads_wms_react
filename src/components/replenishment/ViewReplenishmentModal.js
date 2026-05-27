import React, { useState, useEffect } from 'react';
import { getReplenishmentView } from '../../api/replenishmentService';
import { formatCurrency } from '../../utils/formatters';

function ViewReplenishmentModal({ show, onClose, id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (show && id) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getReplenishmentView(id);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, id]);

  if (!show) return null;

  const calculateGrandTotal = (items) => {
    return items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-screen-xl w-full mx-2 max-h-screen overflow-y-auto">

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {data && (
          <div>       
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 text-center">
                Replenishment Details
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div><strong>Reference No:</strong> {data.reference_no}</div>
              <div><strong>Supplier:</strong> {data.supplier}</div>
              <div><strong>Date Received:</strong> {data.date_received}</div>
              <div><strong>Remarks:</strong> {data.remarks}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <div className="bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-header text-white">
                    <tr className="border-0">
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">SKU</th>
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Product Name</th>
                      <th className="border-r p-2 text-right">Quantity</th>
                      <th className="border-r p-2 text-right">Cost per Unit</th>
                      <th className="border-r p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border-r border-b border-l p-2">{item.sku}</td>
                        <td className="border-r border-b p-2">{item.product_name}</td>
                        <td className="border-r border-b p-2 text-right">{item.qty_added}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.cost_per_unit)}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                      <td colSpan="4" className="border-r border-b border-l p-2 text-right">Grand Total</td>
                      <td className="border-r p-2 text-right">{formatCurrency(calculateGrandTotal(data.items))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-custom hover:bg-gray-50 transition-colors text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="red" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
      </div>
    </div>
  );
}

export default ViewReplenishmentModal;

import React, { useState, useEffect } from 'react';
import { getStockBatches } from '../../api/salesService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';

function ViewStockBatchesModal ({ show, onClose, id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (show && id) {
      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getStockBatches(id);
        if (result.success) {
          setData(result.data);
          setItems(result.data.items);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, id]);

  useEffect(() => {
    console.log('datax', data);
  }, [data]);

  useEffect(() => {
    // console.log('itemsx', items);
  }, [items]);

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

  const updateItemField = (id, field, value) => {
    // Update items state
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    // Update data state
    setData(prev => {
      const updatedItems = prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      );

      // Compute total_target_quantity across all items
      const totalTargetQuantity = updatedItems.reduce(
        (sum, item) => sum + (Number(item.target_quantity) || 0),
        0
      );

      return {
        ...prev,
        items: updatedItems,
        total_target_quantity: totalTargetQuantity
      };
    });
  };

  const handleApply = () => {
    const newErrors = {};

    items.forEach((item) => {
      // Validate Quantity: triggers only if the field is wiped clean
      if (item.target_quantity === "" || item.target_quantity === null || item.target_quantity === undefined || isNaN(item.target_quantity) || Number(item.target_quantity) === 0) {
        newErrors[`target_quantity_${item.id}`] = "Invalid quantity.";
      }

      if(Number(item.current_qty) < Number(item.target_quantity)) {
        newErrors[`target_quantity_${item.id}`] = "Insufficient stock.";
      }
    });

    setErrors(newErrors);
    console.log(newErrors, newErrors.len);
    if (Object.keys(newErrors).length === 0) {
      onClose();
    }

    // return Object.keys(newErrors).length === 0;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
      {/* <div className="bg-white rounded-custom p-4 max-w-screen-xl w-full mx-2 max-h-screen overflow-y-auto"> */}
  
        <div className="mb-2 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            View Stock Batches
          </h2 >
          {loading && <div className='w-full text-center'><span className='text-green-700'>Loading...</span></div>}
          {error && <div className='w-full text-center'><span className='text-red-500'>{error}</span></div>}
        </div>

        {data && (
          <div>
            <div className="grid grid-cols-2 gap-0 mb-2 text-sm">
              <div><span>Product Name:</span> <span className="font-semibold text-red-400">{data.product_name} ({data.sku}) [{data.current_qty}/{data.reorder_level}]</span></div>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <div className="bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-header text-white">
                    <tr className="border-0">
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Date Received</th>
                      {/* <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Transaction #</th> */}
                      <th className="border-r p-2 text-right">Cost per Unit</th>
                      <th className="border-r p-2 text-right">Current Quantity</th>
                      <th className="border-r p-2 text-right">Quantity to Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="border-r border-b p-2">{formatLongDate(item.date_received)}</td>
                        {/* <td className="border-r border-b border-l p-2">{item.reference_no}</td> */}
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.cost_per_unit)}</td>
                        <td className="border-r border-b p-2 text-right">{item.current_qty}</td>
                        <td className="border-r border-b p-2 text-right">
                          <input
                            type="number"
                            name="quantity"
                            value={item.target_quantity}
                            onChange={(e) => updateItemField(item.id, 'target_quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            max={item.current_qty}
                            className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                              errors[`target_quantity_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                            }`}
                          />
                          {errors[`target_quantity_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`target_quantity_${item.id}`]}</p>}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="border-r p-2 text-right" colSpan={3}>Total:</td>
                      <td className="border-r border-b p-2  pr-6 text-right font-semibold">{data.total_target_quantity}</td>
                    </tr>
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
            <button
              type="button"
              onClick={() => handleApply()}
              className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewStockBatchesModal;
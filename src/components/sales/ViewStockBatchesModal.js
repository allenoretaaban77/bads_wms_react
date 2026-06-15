import React, { useState, useEffect } from 'react';
import { getStockBatches } from '../../api/salesService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';

function ViewStockBatchesModal({ show, onClose, id, allocatedBatches, onApply }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (show && id) {
      setData(null);
      setErrors({});

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getStockBatches(id);
          if (result.success) {
            // Guarantee target_quantity defaults to an empty string or 0 if not present
            const normalizedItems = (result.data.items || []).map(item => ({
              ...item,
              quantity_out: item.quantity_out ?? ''
            }));

            // const updatedNormalizedItems = normalizedItems.map((normalizedItem) => {
            //   // Find the allocated item that matches BOTH inventory_id AND cost_per_unit
            //   const matchedAllocation = allocatedBatches.find(
            //     (allocatedBatch) =>
            //       allocatedBatch.inventory_id === normalizedItem.inventory_id &&
            //       Number(allocatedBatch.cost_per_unit) === Number(normalizedItem.cost_per_unit)
            //   );
            //   // If a match is found, update target_quantity with qty_sold. Otherwise, keep it as is.
            //   return {
            //     ...normalizedItem,
            //     target_quantity: matchedAllocation ? matchedAllocation.qty_sold : normalizedItem.target_quantity
            //   };
            // });

            console.log('allocatedBatches', allocatedBatches[0]);
            const updatedNormalizedItems = normalizedItems.map(item => ({
              ...item,
              quantity_out: allocatedBatches.find(b => b.inventory_id === item.inventory_id && +b.cost_per_unit === +item.cost_per_unit)?.quantity_out ?? item.quantity_out
            }));
            console.log('updatedNormalizedItems', updatedNormalizedItems);

            const totalTargetQuantity = updatedNormalizedItems.reduce(
              (sum, item) => sum + (Number(item.quantity_out) || 0),
              0
            );

            setData({
              ...result.data,
              items: updatedNormalizedItems,
              total_target_quantity: totalTargetQuantity
            });
          } else {
            setError(result.error || "Failed to load stock batches.");
          }
        } catch (err) {
          console.error("Error fetching stock batches:", err);
          setError("An unexpected error occurred.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [show, id]);

  const handleClose = () => {
    setData(null);
    setError(null);
    setErrors({});
    setLoading(false);
    onClose();
  };

  const updateItemField = (itemId, field, value) => {
    setData(prev => {
      if (!prev) return prev;

      const updatedItems = prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      );

      const totalTargetQuantity = updatedItems.reduce(
        (sum, item) => sum + (Number(item.quantity_out) || 0),
        0
      );

      return {
        ...prev,
        items: updatedItems,
        total_target_quantity: totalTargetQuantity
      };
    });

    // Clear error dynamically when the user repairs the field
    if (errors[`quantity_out_${itemId}`]) {
      setErrors(prev => ({ ...prev, [`quantity_out_${itemId}`]: '' }));
    }
  };

  const handleApplyClick = () => {
    if (!data || !data.items) return;

    const newErrors = {};
    data.items.forEach((item) => {
      const targetQty = Number(item.quantity_out);
      if (item.quantity_out === "" || item.quantity_out === null || isNaN(targetQty) || targetQty < 0) {
        newErrors[`quantity_out_${item.id}`] = "Invalid quantity.";
      }
      if (targetQty > Number(item.current_qty)) {
        newErrors[`quantity_out_${item.id}`] = "Insufficient stock.";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Filter out only the batches the user explicitly assigned values to
    const allocatedBatches = data.items.filter(item => (Number(item.quantity_out) || 0) > 0);

    // Bubble up data arrays to parent
    if (onApply) {
      onApply({
        inventory_id: id,
        total_allocated: data.total_target_quantity, // Set as row quantity string
        batches: allocatedBatches                    // Detailed batch breakdown list
      });
    }

    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom p-4 max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
  
        {/* Header */}
        <div className="mb-2 border-b border-gray-200 pb-4 flex-0">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            View Stock Batches
          </h2>
          {loading && <div className='w-full text-center mt-2'><span className='text-green-700 animate-pulse text-sm font-medium'>Loading batch metrics...</span></div>}
          {error && <div className='w-full text-center mt-2'><span className='text-red-500 text-sm font-medium'>{error}</span></div>}
        </div>

        {/* Content Wrapper - Scrollable area */}
        {data && (
          <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">Product Name:</span>{" "}
              <span className="font-semibold text-gray-800">
                {data.product_name} {data.sku ? `(${data.sku})` : ''}
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-red-50 text-red-600 font-medium">
                Stock: {data.current_qty} / Reorder: {data.reorder_level}
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-header text-white sticky top-0 z-10">
                  <tr className="border-0">
                    <th className="px-3 py-2 text-left">Date Received</th>
                    <th className="p-2 text-right">Cost per Unit</th>
                    <th className="p-2 text-right">Current Quantity</th>
                    <th className="p-2 text-right w-40">Quantity to Out</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id || item.batch_id} className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                      <td className="p-2 text-gray-700">{formatLongDate(item.date_received)}</td>
                      <td className="p-2 text-right text-gray-700">{formatCurrency(item.cost_per_unit)}</td>
                      <td className="p-2 text-right font-medium text-gray-900">{item.current_qty}</td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity_out}
                          onChange={(e) => updateItemField(item.id, 'quantity_out', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          min="0"
                          max={item.current_qty}
                          className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`quantity_out_${item.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {errors[`quantity_out_${item.id}`] && (
                          <p className="mt-1 text-[11px] text-red-600 text-right font-medium">
                            {errors[`quantity_out_${item.id}`]}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-900">
                    <td className="p-2 text-right" colSpan={3}>Total Selected:</td>
                    <td className="p-2 text-right pr-3 text-green-700">{data.total_target_quantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 flex-0 mt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-custom text-sm flex items-center transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
          <button
            type="button"
            onClick={handleApplyClick}
            disabled={!data}
            className="px-4 py-2 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Apply Allocation
          </button>
        </div>

      </div>
    </div>
  );
}

export default ViewStockBatchesModal;
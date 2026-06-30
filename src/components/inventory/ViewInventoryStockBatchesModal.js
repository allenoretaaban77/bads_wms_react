import React, { useState, useEffect } from 'react';
import { getStockBatches } from '../../api/salesService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import { FormButton, FormHeader, FormModalThead, FormModalTheadDefault } from '../../utils/themes.js';

function ViewInventoryStockBatchesModal({ show, onClose, id, onApply }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(true);
  
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
            setData({
              ...result.data,
              items: result.data.items //normalizedItems, //updatedNormalizedItems,
              // total_target_quantity: totalTargetQuantity
            });
          } else {
            setError(result.error || "Failed to load stock batches.");
          }
        } catch (err) {
          console.error("Error fetching stock batches:", err);
          setError("An unexpected error occurred.");
        } finally {
          setLoading(false);
          setIsSubmitting(false);
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
    if (errors[`cost_per_unit_${itemId}`]) {
      setErrors(prev => ({ ...prev, [`cost_per_unit_${itemId}`]: '' }));
    }
  };

  const validateFormForEmpty = () => {
    const newErrors = {};

    data.items.forEach((item) => {
      if (item.cost_per_unit === "" || item.cost_per_unit === null || item.cost_per_unit === undefined || isNaN(item.cost_per_unit) || Number(item.cost_per_unit) <= 0) {
        newErrors[`cost_per_unit_${item.id}`] = "Invalid cost.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateCost = async () => {
    if (!validateFormForEmpty()) return;
    setIsSubmitting(true);

    try {
      const jsonData = {
        inventory_id: id,
        items: data.items.map(item => ({
          inventory_id: item.inventory_id,
          id: item.id,
          cost_per_unit: Number(item.cost_per_unit) || 0,
          date_received: item.date_received,
        }))
      };
      const result = await onApply(jsonData);
      
    } catch (error) {
      console.error("Error updating batch costs:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-3xl w-full mx-4 flex flex-col max-h-[85vh]">
  
        {/* Header */}
        <FormHeader headerTitle="View Stock Batches" onClick={handleClose} />

        <div className="p-3 flex-1 flex flex-col min-h-0 space-y-4 text-xs">
          {/* Global Messaging Status Bars */}
          {loading && (
            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium animate-pulse">
              Loading stock data...
            </div>
          )}
          {error && (
            <div className="w-full text-center py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium">
              {error}
            </div>
          )}

          {data && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Product Metadata Info Board */}
              <div className="px-3 pt-1 pb-2 bg-gray-50 border border-gray-200 rounded flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block">Product Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.product_name}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block pb-1">Stock Keeping Unit</span>
                  <span className="font-mono bg-white border border-gray-300 px-2 py-0.5 rounded text-gray-700 font-bold">{data.sku}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block pb-1">Total Stocks</span>
                  <span className="font-mono bg-white border border-gray-300 px-2 py-0.5 rounded text-gray-700 font-bold">{data.current_qty}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block pb-1">Reorder Quantity</span>
                  <span className="font-mono bg-white border border-gray-300 px-2 py-0.5 rounded text-gray-700 font-bold">{data.reorder_level}</span>
                </div>
              </div>
              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner">
                <table className="w-full text-left table-auto border-collapse">
                  <FormModalTheadDefault data={[
                    {"title":"Date Received", "class":"py-2 text-left"},
                    {"title":"Stock", "class":"py-2 text-right"},
                    {"title":"Cost per Unit", "class":"py-2 text-right w-40"},
                  ]} />
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-2 text-gray-600 align-middle">
                          {formatLongDate(item.date_received)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 align-middle">
                          {item.current_qty}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-700 align-middle">
                          <input
                            type="number"
                            name="quantity"
                            value={item.cost_per_unit}
                            onChange={(e) => updateItemField(item.id, 'cost_per_unit', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            min="0"
                            className={`w-full px-2 py-1 text-right text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                              errors[`cost_per_unit_${item.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors[`cost_per_unit_${item.id}`] && (
                            <p className="mt-1 text-[11px] text-red-600 text-right font-medium">
                              {errors[`cost_per_unit_${item.id}`]}
                            </p>
                          )}
                        </td>
                        {/* <td className="p-2 text-right w-40">
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity_out}
                            onChange={(e) => updateItemField(item.id, 'quantity_out', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            min="0"
                            max={item.current_qty}
                            className={`w-full px-2 py-1 text-right text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                              errors[`quantity_out_${item.id}`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors[`quantity_out_${item.id}`] && (
                            <p className="mt-1 text-[11px] text-red-600 text-right font-medium">
                              {errors[`quantity_out_${item.id}`]}
                            </p>
                          )}
                        </td> */}
                      </tr>
                    ))}
                    {/* <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-gray-900">
                      <td className="p-2 text-right" colSpan={2}>Total Selected:</td>
                      <td className="p-2 text-right pr-3 text-green-700">{data.total_target_quantity}</td>
                    </tr> */}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-2 flex-shrink-0  border-t border-gray-100 px-3 pb-3">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross"
            onClick={handleClose} 
          />
          <FormButton
            btnType="success"
            btnLabel="Update"
            btnIcon="check"
            onClick={() => handleUpdateCost()} 
            disabled={isSubmitting}
            isProcessing={isSubmitting}
          />
        </div>

      </div>
    </div>
  );
}

export default ViewInventoryStockBatchesModal;
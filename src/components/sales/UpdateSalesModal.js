import React, { useState, useEffect, useRef } from 'react';
import { getInventoryBatchesListSearch } from '../../api/inventoryService';
import { formatCurrency, formatDate, toTitleCase } from '../../utils/formatters';
import { getSalesViewUpdate } from '../../api/salesService';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { APP_CONFIG } from '../../config/constants';
import ViewStockBatchesModal from './ViewStockBatchesModal';

const UpdateSalesModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [formData, setFormData] = useState({
    id: '',
    customer_name: '',
    invoice_no: '',
    date_sold: new Date().toISOString().split('T')[0],
    payment_status: '',
    amount: '',
    remarks: '',
    updated_by: userData?.employee_id || '',
    status: '',
  });
  
  const [items, setItems] = useState([]);
  const [nextItemId, setNextItemId] = useState(1);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef(null);
  const [errors, setErrors] = useState({});
    
  const [showStockBatchesModal, setShowStockBatchesModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  useEffect(() => {
    console.log('UpdateSalesModal', items);
  }, [items]);

  useEffect(() => {
    if (showEditModal && selectedItem) {
      setFormData({
        id: selectedItem.id || '',
        customer_name: selectedItem.customer_name || '',
        invoice_no: selectedItem.invoice_no || '',
        date_sold: formatDate(selectedItem.date_sold) || '',
        payment_status: selectedItem.payment_status || '',
        amount: 0,
        remarks: selectedItem.remarks || '',
        updated_by: userData?.employee_id || '',
        status: selectedItem.status || '',
      });

      const fetchData = async () => {
        setIsSubmitting(true);
        setErrors({});
        try {
          const result = await getSalesViewUpdate(selectedItem.id);
          if (result && result.success && result.data?.items) {
            const formattedItems = result.data.items.map((inventory_item, index) => {
              const name = resolveSuggestionName(inventory_item);
              const priceValue = resolveSuggestionPrice(inventory_item);
              const costValue = resolveSuggestionCost(inventory_item);  

              return {
                ...inventory_item,
                id: nextItemId + index,
                inventory_id: inventory_item.inventory_id,
                item_name: name,
                quantity: inventory_item.qty_sold || '',
                current_qty: inventory_item.current_qty || 0,
                payment_status: inventory_item.payment_status,
                reorder_level: inventory_item.reorder_level || 0,
                sku: inventory_item.sku,
                current_price: priceValue !== undefined ? priceValue.toString() : '',
                price: priceValue !== undefined ? priceValue.toString() : '',
                cost: costValue !== undefined ? costValue.toString() : '',
                total: Number(inventory_item.total) || 0
              };
            });
            
            setNextItemId(prev => prev + formattedItems.length);
            setItems(formattedItems);
          } else {
            setErrors(result?.error || {});
          }
        } catch (err) {
          console.error("Error setting sales edit data:", err);
        } finally {
          setIsSubmitting(false);
        }
      };
      fetchData();
    }
  }, [selectedItem, showEditModal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (itemSearchTerm.trim()) {
        fetchItemSuggestions(itemSearchTerm);
      } else {
        setItemSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [itemSearchTerm]);

  const handleApplyStockAllocation = (allocationData) => {
    // allocationData structure: { inventory_id, total_allocated, batches }
    setItems(prev => prev.map(item => {
      // Identify the item matching the active modal stock item look-up
      if (item.inventory_id !== allocationData.inventory_id) return item;

      const updatedQty = allocationData.total_allocated;
      const price = Number(item.price) || 0;

      return {
        ...item,
        quantity: updatedQty > 0 ? updatedQty.toString() : '',
        total: updatedQty * price,
        // Save the selected sub-batch distribution data 
        // so your handleSubmit payload can utilize it if needed
        allocated_batches: allocationData.batches.map(b => ({
          batch_id: b.batch_id || b.id,
          inventory_id: b.inventory_id,
          cost_per_unit: Number(b.cost_per_unit) || 0,
          quantity_out: Number(b.quantity_out) || 0,
          price_per_unit: Number(b.price_per_unit) || 0,
        }))
      };
    }));

    // Clear any structural quantity errors on this row since it's now populated
    if (selectedStockItem) {
      setErrors(prev => ({
        ...prev,
        [`quantity_${selectedStockItem.id}`]: ''
      }));
    }
  };

  const getItemsTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const showAvailableStocks = (item) => {
    setSelectedStockItem(item);
    setShowStockBatchesModal(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const updateItemField = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };
      const qty = Number(updated.quantity) || 0;
      const price = Number(updated.price) || 0;
      updated.total = qty * price;
      return updated;
    }));
  };

  const removeItemRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const resolveSuggestionName = (suggestion) => {
    return suggestion.name || suggestion.product_name || suggestion.item_name || suggestion.description || `Item ${nextItemId}`;
  };

  const resolveSuggestionCost = (suggestion) => {
    return suggestion.cost_per_unit || suggestion.cost || 0;
  };

  const resolveSuggestionPrice = (suggestion) => {
    return suggestion.price_per_unit || suggestion.price || 0;
  };

  const fetchItemSuggestions = async (query) => {
    setIsSearching(true);
    try {
      const result = await getInventoryBatchesListSearch({ search: query, page: 1, pageSize: 30 });
      if (!result || !result.success || !result.data) {
        setItemSuggestions([]);
        setShowSuggestions(false);
      } else {
        const results = Array.isArray(result.data) ? result.data : result.data.data || [];
        setItemSuggestions(results);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Error looking up item suggestion:", err);
      setItemSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const name = resolveSuggestionName(suggestion);
    const priceValue = resolveSuggestionPrice(suggestion);
    const costValue = resolveSuggestionCost(suggestion);
    const newErrors = {};

    setItems(prev => {
      const exists = prev.some(item => {
        return (
          item.inventory_id === suggestion.inventory_id && Number(item.cost) === Number(suggestion.cost_per_unit)
        );
      });
      if (exists) {
        newErrors['items'] = `Item "${name}" with this specific unit cost is already listed.`;
        setErrors(newErrors);
        return prev;
      } else {
        setErrors(newErrors);
      }

      return [
        ...prev,
        {
          id: nextItemId,
          batch_id: suggestion.batch_id,
          inventory_id: suggestion.inventory_id,
          item_name: name,
          current_qty: suggestion.current_qty,
          reorder_level: suggestion.reorder_level,
          quantity: '',
          sku: suggestion.sku,
          current_price: priceValue !== undefined ? priceValue.toString() : '',
          price: priceValue !== undefined ? priceValue.toString() : '',
          cost: costValue !== undefined ? costValue.toString() : '',
          total: 0,
        },
      ];
    });

    setNextItemId(prev => prev + 1);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const validateForm = (result) => {
    const newErrors = {};
    setErrors(newErrors);
    if (result && !result.success && result.error?.errors) {
      setErrors(result.error.errors);
    } 
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCancel = () => {
    setErrors({});
    setShowEditModal(false);
    setFormData({
      id: '',
      customer_name: '',
      invoice_no: '',
      date_sold: new Date().toISOString().split('T')[0],
      remarks: '',
      payment_status: '',
      updated_by: userData?.employee_id || '',
      status: '',
    });
    setItems([]);
    setNextItemId(1);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const validateFormForEmpty = () => {
    const newErrors = {};

    if (items.length === 0) {
      newErrors['items'] = "Please add at least one item to save the transaction.";
    }

    items.forEach((item) => {
      if (item.quantity === "" || item.quantity === null || item.quantity === undefined || isNaN(item.quantity) || Number(item.quantity) <= 0) {
        newErrors[`quantity_${item.id}`] = "Invalid quantity.";
      }
      if (item.price === "" || item.price === null || item.price === undefined || isNaN(item.price) || Number(item.price) <= 0) {
        newErrors[`price_${item.id}`] = "Invalid price.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (action) => {
    if (!validateFormForEmpty()) return;
    setIsSubmitting(true);

    try {
      const result = await onSave({
        id: formData.id,
        customer_name: formData.customer_name,
        invoice_no: formData.invoice_no,
        date_sold: formData.date_sold,
        amount: getItemsTotal(),
        payment_status: formData.payment_status,
        remarks: formData.remarks,
        updated_by: formData.updated_by,
        items: items.map(item => ({
          batch_id: item.batch_id,
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          cost: Number(item.cost) || 0,
          total: Number(item.total) || 0,
          allocated_batches: (item.allocated_batches || []).map(batch => ({
            ...batch
          }))
        })),
        status: action,
      });

      if (result && result.success) {
        setShowEditModal(false);
        setFormData({
          id: '',
          customer_name: '',
          invoice_no: '',
          date_sold: new Date().toISOString().split('T')[0],
          remarks: '',
          payment_status: '',
          updated_by: userData?.employee_id || '',
          status: '',
        });
        setItems([]);
        setNextItemId(1);
        setErrors({});
      } else {
        validateForm(result);
      }
    } catch (error) {
      console.error("Error saving sales transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusRow = (current) => {
    if (current === "draft") return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Approved', color: 'text-green-600' };
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom p-4 max-w-screen-2xl w-full h-full flex flex-col">
        
        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 flex-0">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Update Sales Transaction - <span className={getStatusRow(formData.status).color}>{toTitleCase(formData.status || '')}</span>
          </h2>
        </div>

        {/* Form Container */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 flex-1 flex flex-col min-h-0">

          {/* Inputs Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Transaction Number</label>
              <input
                name="invoice_no"
                value={formData.invoice_no}
                onChange={handleChange}
                placeholder="Enter sales transaction number"
                className={`w-full px-3 py-2 text-sm border rounded-custom bg-gray-50 focus:outline-none ${
                  errors.invoice_no ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.invoice_no && <p className="mt-1 text-xs text-red-600">{errors.invoice_no}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Sold</label>
              <input
                type="date"
                name="date_sold"
                value={formData.date_sold}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.date_sold ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date_sold && <p className="mt-1 text-xs text-red-600">{errors.date_sold}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Enter customer name"
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.customer_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.customer_name && <p className="mt-1 text-xs text-red-600">{errors.customer_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={1}
                placeholder="Add any remarks or notes"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>
          </div>

          {/* Search Bar Container */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-0 relative">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search items</label>
              <input
                type="text"
                ref={searchInputRef}
                value={itemSearchTerm}
                onBlur={handleBlur}
                onChange={(e) => {
                  setItemSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search items to add..."
                className="w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
              {showSuggestions && itemSearchTerm.trim() && (
                <div className="absolute left-0 right-0 z-20 mt-1 rounded-custom border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                  ) : itemSuggestions.length > 0 ? (
                    itemSuggestions.map((suggestion, index) => {
                      const name = resolveSuggestionName(suggestion);
                      const priceValue = resolveSuggestionPrice(suggestion);
                      const costValue = resolveSuggestionCost(suggestion);
                      return (
                        <button
                          key={`${suggestion.inventory_id || index}-${index}`}
                          type="button"
                          onMouseDown={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 block border-b border-gray-50 last:border-b-0"
                        >
                          <div className="font-medium">{name} {suggestion.sku ? `[${suggestion.sku}]` : ''}</div>
                          <div className="text-xs text-gray-500">Cost: ₱{Number(costValue).toFixed(2)} | Price: ₱{Number(priceValue).toFixed(2)}</div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No items found</div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.payment_status ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Payment Status</option>
                {APP_CONFIG?.PAYMENT_STATUS && Object.entries(APP_CONFIG.PAYMENT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.payment_status && (
                <p className="mt-1 text-xs text-red-600">{errors.payment_status}</p>
              )}
            </div>
          </div>

          {/* Scrollable Table Section */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex-0">
              Items ({items.length || 0}) {errors.items && <span className="ml-2 text-xs text-red-600 font-normal">{errors.items}</span>}
            </label>
            
            <div className="rounded-custom border border-gray-300 flex-1 overflow-y-auto min-h-0">
              <table className="min-w-full text-left text-sm table-auto border-collapse">
                <thead className="bg-header text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 pl-2 bg-header w-10"></th>
                    <th className="px-3 py-2 bg-header w-32">SKU</th>
                    <th className="px-3 py-2 bg-header">Item Name</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header w-44">Quantity</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header w-44">Price</th>
                    <th className="px-3 py-2 text-right pr-3 bg-header w-40">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50" id={item.id}>
                      <td className="px-1 py-2 align-top text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-sm text-red-600 hover:text-red-800 pt-1 block mx-auto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-3 py-3 align-top font-medium text-gray-800">{item.sku}</td>
                      <td className="px-3 py-3 align-top text-gray-700">
                        <span className="font-medium">{item.item_name}</span>
                        <span className="pl-2 text-xs text-gray-400 mt-0.5">Stock: {item.current_qty || 0} / Reorder: {item.reorder_level || 0}</span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className={`w-full flex items-center px-2 py-1 border rounded-custom bg-white ${
                            errors[`quantity_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          {item && item.tracking_method === APP_CONFIG.TRACKING_METHOD.BATCH && (
                            <button type="button" aria-label="View batches" title="Available Batches" onClick={() => showAvailableStocks(item)}
                              className="text-blue-600 hover:text-blue-800 mr-1 flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <input
                            readOnly={(item.tracking_method === APP_CONFIG.TRACKING_METHOD.BATCH) ? 1 : 0}
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="flex-1 focus:outline-none text-right bg-transparent w-full"
                          />
                        </div>
                        {errors[`quantity_${item.id}`] && <p className="mt-1 text-[11px] text-red-600 text-right">{errors[`quantity_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          value={item.price}
                          onChange={(e) => updateItemField(item.id, 'price', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0.00"
                          className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none ${
                            errors[`price_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`price_${item.id}`] && <p className="mt-1 text-[11px] text-red-600 text-right">{errors[`price_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-3 align-top text-right pr-3 font-medium text-gray-900">{formatCurrency(item.total) || '₱ 0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Summary Row */}
          <div className="flex-0 rounded-custom border border-gray-300 pr-3 py-2 bg-gray-50 text-right text-md font-semibold text-green-900" style={{ marginTop: "5px" }}>
            Total: {formatCurrency(getItemsTotal()) || '₱ 0.00'}
          </div>

          {/* Actions Footer Row */}
          <div className="justify-end space-x-3 flex flex-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit(formData.status || "draft")}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-900/50 text-white rounded-custom hover:bg-gray-900 transition-colors text-sm flex items-center disabled:opacity-50 font-medium"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update
                </>
              )}
            </button>
          </div> 
        
          <ViewStockBatchesModal
            show={showStockBatchesModal}
            onClose={() => setShowStockBatchesModal(false)}
            id={selectedStockItem?.inventory_id}
            allocatedBatches={selectedStockItem?.allocated_batches || []}
            onApply={handleApplyStockAllocation}
          />  

        </form>        
      </div>
    </div>
  );
};

export default UpdateSalesModal;
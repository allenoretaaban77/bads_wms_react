import React, { useState, useEffect, useRef } from 'react';
import { getInventoryBatchesListSearch } from '../../api/inventoryService';
import { formatCurrency } from '../../utils/formatters';
import { generateTransactionNumber } from '../../api/salesService';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { APP_CONFIG } from '../../config/constants';
import ViewStockBatchesModal from './ViewStockBatchesModal';

const CreateSalesModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_no: '',
    date_sold: new Date().toISOString().split('T')[0],
    payment_status: '',
    remarks: '',
    added_by: userData.employee_id
  });
  
  const [items, setItems] = useState([]);
  const [nextItemId, setNextItemId] = useState(1);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef(null);
  
  const [showStockBatchesModal, setShowStockBatchesModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  const getItemsTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

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

  useEffect(() => {
    if (showCreateModal) {
      fetchTransactionNumber();
    }
  }, [showCreateModal]);

  useEffect(() => {
    console.log('items', items);
  }, [items]);

  useEffect(() => {
    console.log('nextItemId', nextItemId);
  }, [nextItemId]);

  const showAvailableStocks = (item) => {
    setSelectedStockItem(item);
    setShowStockBatchesModal(true);
  };

  const fetchTransactionNumber = async () => {
    try {
      setErrors({});
      const trnxNumber = await generateTransactionNumber();
      setFormData(prev => ({
        ...prev,
        invoice_no: trnxNumber,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleBlur = () => {
    // setTimeout(() => setShowSuggestions(false), 200);
    setTimeout(() => setItemSearchTerm(''), 200);
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

  const resolveSuggestionPrice = (suggestion) => {
    return suggestion.price_per_unit || suggestion.price || 0;
  };

  const resolveSuggestionCost = (suggestion) => {
    return suggestion.cost_per_unit || suggestion.cost || 0;
  };

  const fetchItemSuggestions = async (query) => {
    if (!query.trim()) {
      setItemSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await getInventoryBatchesListSearch({ search: query, page: 1, pageSize: 30 });
      if (!result.success || !result.data) {
        setItemSuggestions([]);
        setShowSuggestions(false);
      } else {
        const results = Array.isArray(result.data) ? result.data : result.data.data || [];
        setItemSuggestions(results);
        setShowSuggestions(true);
      }
    } catch (err) {
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
        newErrors['items'] = `Item with inventory id ${suggestion.product_name} and cost ${suggestion.cost_per_unit} already selected.`;
        setErrors(newErrors);
        return prev; // return unchanged
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
          batches: suggestion.batches
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
    console.log('validateForm', newErrors);

    setErrors(newErrors);
    if (result && !result.success) {
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

    setShowCreateModal(false);
    setFormData({
      customer_name: '',
      invoice_no: '',
      date_sold: new Date().toISOString().split('T')[0],
      remarks: '',
      added_by: '',
    });
    setItems([]);
    setNextItemId(1);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const validateFormForEmpty = () => {
    const newErrors = {};

    // Loop through items to check ONLY for blank/empty inputs
    items.forEach((item) => {
      
      // Validate Quantity: triggers only if the field is wiped clean
      if (item.quantity === "" || item.quantity === null || item.quantity === undefined || isNaN(item.quantity) || Number(item.quantity) === 0) {
        newErrors[`quantity_${item.id}`] = "Invalid quantity.";
      }

      // Validate Cost: triggers only if the field is wiped clean
      if (item.price === "" || item.price === null || item.price === undefined || isNaN(item.price) || Number(item.price) === 0) {
        newErrors[`price_${item.id}`] = "Invalid price.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (action) => {
    // e.preventDefault();
    if (!validateFormForEmpty()) return;

    // if (!onSave) return;
    setIsSubmitting(true);

    try {
      const result = await onSave({
        customer_name: formData.customer_name,
        invoice_no: formData.invoice_no,
        date_sold: formData.date_sold,
        payment_status: formData.payment_status,
        amount: getItemsTotal(),
        remarks: formData.remarks,
        added_by: userData.employee_id,
        items: items.map(item => ({
          batch_id: item.batch_id,
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
        })),
        status : action,
      });

      if (result && result.success) {
        setShowCreateModal(false);
        setFormData({
          customer_name: '',
          invoice_no: '',
          date_sold: new Date().toISOString().split('T')[0],
          remarks: '',
          added_by: '',
        });
        setItems([]);
        setNextItemId(1);
        setErrors({});
      } else {
        validateForm(result);
      }

      setIsSubmitting(false);
    } catch (error) {
      console.error("Error saving sales:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom p-4 max-w-screen-2xl w-full h-full flex flex-col">
        
        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 flex-0">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Create Sales Transaction</h2>
        </div>

        {/* Form Container */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 flex-1 flex flex-col min-h-0">

          {/* Inputs section - Fixed at top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Transaction Number</label>
              <div className={`flex gap-2 w-full px-3 py-2 text-sm border rounded-custom bg-gray-50 focus:outline-none ${
                  errors.invoice_no ? 'border-red-300' : 'border-gray-300'
                }`}>
                <input
                  name="invoice_no"
                  value={formData.invoice_no}
                  onChange={handleChange}
                  placeholder="Enter sales transaction number"
                  className="flex-1 focus:outline-none"
                />
                <button id="refreshBtn" type="button" aria-label="Refresh value" title="Refresh" onClick={fetchTransactionNumber}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
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

          {/* Search Bar - Fixed */}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-0">
            <div className="md:col-span-3" style={{ marginTop: "0px" }}>
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
                <div className="absolute z-20 mt-1 w-full rounded-custom border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                  ) : itemSuggestions.length > 0 ? (
                    itemSuggestions.map((suggestion, index) => {
                      const name = suggestion.name || suggestion.product_name || suggestion.item_name || suggestion.sku || `Item ${index + 1}`;
                      const priceValue = suggestion.price_per_unit || suggestion.price || 0;
                      const costValue = suggestion.cost_per_unit || suggestion.cost || 0;
                      return (
                        <button
                          key={`${name}-${index}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="font-medium">{name} [{suggestion.sku}]</div>
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
                {Object.entries(APP_CONFIG.PAYMENT_STATUS).map(([key, value]) => (
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

          {/* --- SCROLLABLE TABLE CONTAINER START --- */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex-0">
              Items ({items.length || 0}) {errors.items && <span className="mt-1 text-xs text-red-600">{errors.items}</span>}
            </label>
            
            {/* This wrapper limits table height and manages scrolling */}
            <div className="rounded-custom border border-gray-300 flex-1 overflow-y-auto min-h-0">
              <table className="min-w-full text-left text-sm table-auto border-collapse">
                {/* sticky top-0 ensures the table header stays at the top while scrolling items */}
                <thead className="bg-header text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 pl-2 bg-header"> </th>
                    <th className="py-2 bg-header">#</th>
                    <th className="px-3 py-2 bg-header">Item</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header">Quantity</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header">Price</th>
                    <th className="px-3 py-2 text-right pr-3 bg-header">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-1 py-2 align-top text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-sm text-red-600 hover:text-red-800 pt-1 pr-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-2 align-top text-left">{index + 1}</td>
                      {/* <td className="px-3 py-2 align-top text-gray-700">
                        {item.item_name} [{item.sku}] [{item.current_qty}/{item.reorder_level}] [Cost: {formatCurrency(item.cost)}] [Price: {formatCurrency(item.current_price)}]
                      </td> */}
                      <td className="px-3 py-2 align-top text-gray-700">
                        {item.item_name} [{item.sku}] [{item.current_qty}/{item.reorder_level}]
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className={`w-full flex px-2 py-1 text-left text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                              errors[`quantity_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                        {item && item.batches.length > 0 && (
                        <button id="refreshBtn" type="button" aria-label="Refresh value" title="Refresh" onClick={() => showAvailableStocks(item)}
                          className="text-blue-600 hover:text-red-800">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        )}
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className="flex-1 focus:outline-none text-right"
                        />
                        </div>
                        {errors[`quantity_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`quantity_${item.id}`]}</p>}
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
                          className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`price_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`price_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`price_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top text-right pr-3">{formatCurrency(item.total) || '₱ 0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* --- SCROLLABLE TABLE CONTAINER END --- */}

          {/* Total Summary Row - Fixed */}
          <div className="flex-0 rounded-custom border border-gray-300 pr-3 py-1 bg-gray-50 text-right text-md font-semibold text-green-900" style={{ marginTop: "5px" }}>
            Total: {formatCurrency(getItemsTotal()) || '₱ 0.00'}
          </div>

          {/* Actions Row - Fixed */}
          <div className="justify-end space-x-3 flex flex-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-gray-900/50 text-white rounded-custom hover:bg-gray-900 transition-colors text-sm flex items-center disabled:opacity-50"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5l-2-2zM7 3v4h10V3M12 12v4m0 0h4m-4 0H8" />
                  </svg>
                  Save as Draft
                </>
              )}
            </button>
          </div>

        </form>        
        
        <ViewStockBatchesModal
          show={showStockBatchesModal}
          onClose={() => setShowStockBatchesModal(false)}
          id={selectedStockItem?.inventory_id}
        />

      </div>
    </div>
  );
};

export default CreateSalesModal;

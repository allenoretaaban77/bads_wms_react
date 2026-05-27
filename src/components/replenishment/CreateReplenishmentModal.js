import React, { useState, useEffect, useRef } from 'react';
import { getInventoryListsearch } from '../../api/inventoryService';
import { formatCurrency } from '../../utils/formatters';
import { generateTransactionNumber } from '../../api/replenishmentService';
import useAppViewModel from '../../viewmodels/useAppViewModel';

const CreateReplenishmentModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [formData, setFormData] = useState({
    supplier: '',
    reference_no: '',
    date_received: new Date().toISOString().split('T')[0],
    remarks: '',
    added_by: userData.employee_id
  });
  
  const [items, setItems] = useState([]);
  const [nextItemId, setNextItemId] = useState(2);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef(null);

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

  const fetchTransactionNumber = async () => {
    try {
      const trnxNumber = await generateTransactionNumber();
      setFormData(prev => ({
        ...prev,
        reference_no: trnxNumber,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const updateItemField = (inventory_id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.inventory_id !== inventory_id) return item;
      const updated = { ...item, [field]: value };
      const qty = Number(updated.quantity) || 0;
      const cost = Number(updated.cost) || 0;
      updated.total = qty * cost;
      return updated;
    }));
  };

  const removeItemRow = (id) => {
    setItems(prev => prev.filter(item => item.inventory_id !== id));
  };

  const resolveSuggestionName = (suggestion) => {
    return suggestion.name || suggestion.product_name || suggestion.item_name || suggestion.description || `Item ${nextItemId}`;
  };

  const resolveSuggestionCost = (suggestion) => {
    return suggestion.cost_per_unit || suggestion.cost || suggestion.price_per_unit || suggestion.price || 0;
  };

  const fetchItemSuggestions = async (query) => {
    if (!query.trim()) {
      setItemSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const result = await getInventoryListsearch({ search: query, page: 1, pageSize: 30 });
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
    const costValue = resolveSuggestionCost(suggestion);
    const newErrors = {};

    setItems(prev => {
      const exists = prev.some(item => item.inventory_id === suggestion.id);
      if (exists) {
        newErrors['items'] = `Item with inventory id ${suggestion.product_name} already selected`;
        setErrors(newErrors);
        return prev; // return unchanged
      } else {
        setErrors(newErrors);
      }

      return [
        ...prev,
        {
          id: nextItemId,
          inventory_id: suggestion.id,
          item_name: name,
          current_qty: suggestion.current_qty,
          reorder_level: suggestion.reorder_level,
          quantity: '',
          sku: suggestion.sku,
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
      supplier: '',
      reference_no: '',
      date_received: new Date().toISOString().split('T')[0],
      remarks: '',
      added_by: ''
    });
    setItems([]);
    setNextItemId(1);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (!validateForm()) return;

    // if (!onSave) return;
    setIsSubmitting(true);

    try {
      const result = await onSave({
        supplier: formData.supplier,
        reference_no: formData.reference_no,
        date_received: formData.date_received,
        amount: getItemsTotal(),
        remarks: formData.remarks,
        added_by: formData.added_by,
        items: items.map(item => ({
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: Number(item.quantity) || 0,
          cost: Number(item.cost) || 0,
          total: Number(item.total) || 0,
        })),
      });

      if (result && result.success) {
        setShowCreateModal(false);
        setFormData({
          supplier: '',
          reference_no: '',
          date_received: new Date().toISOString().split('T')[0],
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
      console.error("Error saving replenishment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-screen-2xl w-full mb-5 mt-5 mx-4 max-h-screen overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Create Replenishment</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
                placeholder="Enter reference number"
                // readOnly
                className={`w-full px-3 py-2 text-sm border rounded-custom bg-gray-50 focus:outline-none ${
                  errors.reference_no ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.reference_no && <p className="mt-1 text-xs text-red-600">{errors.reference_no}</p>}
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <div className={`flex gap-2 w-full px-3 py-2 text-sm border rounded-custom bg-gray-50 focus:outline-none ${
                    errors.reference_no ? 'border-red-300' : 'border-gray-300'
                  }`}>
                <input
                  name="reference_no"
                  value={formData.reference_no}
                  onChange={handleChange}
                  placeholder="Enter reference number"
                  className="flex-1 focus:outline-none"
                />
                <button id="refreshBtn" type="button" aria-label="Refresh value" title="Refresh" onClick={fetchTransactionNumber}>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {errors.reference_no && <p className="mt-1 text-xs text-red-600">{errors.reference_no}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Enter supplier"
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.supplier ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.supplier && <p className="mt-1 text-xs text-red-600">{errors.supplier}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
              <input
                type="date"
                name="date_received"
                value={formData.date_received}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.date_received ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.date_received && <p className="mt-1 text-xs text-red-600">{errors.date_received}</p>}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          </div>

          <div className="relative" style={{ marginTop: "0px" }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search items</label>
            <input
              type="text"
              ref={searchInputRef}
              value={itemSearchTerm}
              onChange={(e) => {
                setItemSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search items to add..."
              className="w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
            />
            {showSuggestions && itemSearchTerm.trim() && (
              <div className="absolute z-20 mt-1 w-full rounded-custom border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                ) : itemSuggestions.length > 0 ? (
                  itemSuggestions.map((suggestion, index) => {
                    const name = suggestion.name || suggestion.product_name || suggestion.item_name || suggestion.sku || `Item ${index + 1}`;
                    const costValue = suggestion.cost_per_unit || suggestion.cost || 0;
                    return (
                      <button
                        key={`${name}-${index}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="font-medium">{name} [{suggestion.sku}]</div>
                        <div className="text-xs text-gray-500">Cost: ₱{Number(costValue).toFixed(2)}</div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No items found</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Items {errors.items && <label className="mt-1 text-xs text-red-600">{errors.items}</label>}</label>
            <div className="rounded-custom border border-gray-300 overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-header text-white">
                  <tr>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2 text-right pr-9">Quantity</th>
                    <th className="px-3 py-2 text-right pr-9">Cost</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.inventory_id} className="border-t border-gray-200">
                      <td className="px-3 py-2 align-top">{item.sku}</td>
                      <td className="px-3 py-2 align-top text-gray-700">{item.item_name} [{item.current_qty}/{item.reorder_level}]</td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.inventory_id, 'quantity', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`quantity_${item.inventory_id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`quantity_${item.inventory_id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`quantity_${item.inventory_id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          step="0.01"
                          name="cost"
                          value={item.cost}
                          onChange={(e) => updateItemField(item.inventory_id, 'cost', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0.00"
                          className={`w-full px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`cost_${item.inventory_id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`cost_${item.inventory_id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`cost_${item.inventory_id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top text-right">{formatCurrency(item.total) || '₱ 0.00'}</td>
                      <td className="px-3 py-2 align-top text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.inventory_id)}
                          className="text-sm text-red-600 hover:text-red-800 pt-1 pr-1"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-custom border border-gray-300 pr-4 py-1 bg-gray-50 text-right text-md font-semibold text-green-900" style={{ marginTop: "5px" }}>
            Total: {formatCurrency(getItemsTotal()) || '₱ 0.00'}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-custom hover:bg-gray-50 transition-colors text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReplenishmentModal;

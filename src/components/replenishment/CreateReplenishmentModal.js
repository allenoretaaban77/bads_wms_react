import React, { useState, useEffect } from 'react';
import { getInventoryList } from '../../api/inventoryService';
import { formatCurrency } from '../../utils/formatters';

const CreateReplenishmentModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    reference_no: '',
    date_received: '',
    remarks: '',
  });
  const [items, setItems] = useState([]);
  const [nextItemId, setNextItemId] = useState(2);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getItemsTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
    ]);
    setNextItemId(prev => prev + 1);
  };

  const updateItemField = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const qty = Number(updated.quantity) || 0;
      const cost = Number(updated.cost) || 0;
      updated.total = qty * cost;
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
      const result = await getInventoryList({ search: query, page: 1, pageSize: 10 });
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

  const handleSelectSuggestion = (suggestion) => {
    const name = resolveSuggestionName(suggestion);
    const costValue = resolveSuggestionCost(suggestion);

    setItems(prev => [
      ...prev,
      {
        id: nextItemId,
        item_name: name,
        quantity: '',
        cost: costValue !== undefined ? costValue.toString() : '',
        total: 0,
      },
    ]);
    setNextItemId(prev => prev + 1);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.reference_no.trim()) {
      validationErrors.reference_no = 'Reference number is required';
    }
    if (!formData.supplier.trim()) {
      validationErrors.supplier = 'Supplier is required';
    }
    if (!formData.date_received.trim()) {
      validationErrors.date_received = 'Date received is required';
    }

    if (!items.length) {
      validationErrors.items = 'Add at least one item';
    }

    items.forEach(item => {
      if (!item.quantity.toString().trim() || Number.isNaN(Number(item.quantity))) {
        validationErrors[`quantity_${item.id}`] = 'Quantity must be a valid number';
      }
      if (!item.cost.toString().trim() || Number.isNaN(Number(item.cost))) {
        validationErrors[`cost_${item.id}`] = 'Cost must be a valid number';
      }
    });

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
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
    setShowCreateModal(false);
    setErrors({});
    setFormData({
      supplier: '',
      reference_no: '',
      date_received: '',
      remarks: '',
    });
    setItems([{ id: 1, item_name: '', quantity: '', cost: '', total: 0 }]);
    setNextItemId(2);
    setItemSearchTerm('');
    setItemSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!onSave) return;
    setIsSubmitting(true);

    const result = await onSave({
      supplier: formData.supplier,
      reference_no: formData.reference_no,
      date_received: formData.date_received,
      amount: getItemsTotal(),
      remarks: formData.remarks,
      items: items.map(item => ({
        item_name: item.item_name,
        quantity: Number(item.quantity) || 0,
        cost: Number(item.cost) || 0,
        total: Number(item.total) || 0,
      })),
    });

    setIsSubmitting(false);

    if (result && result.success) {
      setShowCreateModal(false);
      setFormData({
        supplier: '',
        reference_no: '',
        date_received: '',
        remarks: '',
      });
      setItems([{ id: 1, item_name: '', quantity: '', cost: '', total: 0 }]);
      setNextItemId(2);
      setErrors({});
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-6 max-w-screen-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">Create Replenishment</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
                placeholder="Enter reference number"
                className={`w-full px-3 py-2 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.reference_no ? 'border-red-300' : 'border-gray-300'
                }`}
              />
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

          <div className="relative"  style={{ marginTop: "0px" }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search items</label>
            <input
              type="text"
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
                    const name = suggestion.name || suggestion.product_name || suggestion.item_name || suggestion.description || `Item ${index + 1}`;
                    const costValue = suggestion.cost_per_unit || suggestion.cost || suggestion.price_per_unit || suggestion.price || 0;
                    return (
                      <button
                        key={`${name}-${index}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="font-medium">{name}</div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
            <div className="rounded-custom border border-gray-300 overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-header text-white">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 align-top">{item.id}</td>
                      <td className="px-3 py-2 align-top text-gray-700">{item.item_name}</td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                          className={`w-full px-2 py-1 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`quantity_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`quantity_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`quantity_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          step="0.01"
                          name="cost"
                          value={item.cost}
                          onChange={(e) => updateItemField(item.id, 'cost', e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2 py-1 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`cost_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`cost_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`cost_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top">{formatCurrency(item.total) || '₱ 0.00'}</td>
                      <td className="px-3 py-2 align-top">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
            </div>
          </div>

          <div className="rounded-custom border border-gray-300 pr-2 py-1 bg-gray-50 text-right text-md font-semibold text-green-900" style={{ marginTop: "0px" }}>
            Total: {formatCurrency(getItemsTotal()) || '₱ 0.00'}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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

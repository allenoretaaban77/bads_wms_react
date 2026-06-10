import React, { useState, useEffect, useRef } from 'react';
import { getInventoryReplenishmentListsearch } from '../../api/inventoryService';
import { formatCurrency, formatReplinishmentDate, toTitleCase, formatPostingDate } from '../../utils/formatters';
import { generateTransactionNumber, getReplenishmentView } from '../../api/replenishmentService';
import useAppViewModel from '../../viewmodels/useAppViewModel';
import ViewStockInHistoryModal from './ViewStockInHistoryModal';

const UpdateReplenishmentModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [formData, setFormData] = useState({
    supplier: '',
    reference_no: '',
    date_received: new Date().toISOString().split('T')[0],
    remarks: '',
    added_by: userData.employee_id
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

  const [showStockInHistoryModal, setShowStockInHistoryModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  useEffect(() => {
    console.log(items);
  }, [items]);

  useEffect(() => {
    if (showEditModal && selectedItem) {
      setFormData({
        id: selectedItem.id || '',
        reference_no: selectedItem.reference_no || '',
        supplier: selectedItem.supplier || '',
        remarks: selectedItem.remarks || '',
        status: selectedItem.status || '',
        date_received: formatReplinishmentDate(selectedItem.date_received) || '',
        updated_by: userData.employee_id
      });

      const fetchData = async () => {
        setIsSubmitting(true);
        setErrors({});
        
        const result = await getReplenishmentView(selectedItem.id);
        if (result.success) {
          let lastItemId = 0;

          const formattedItems = result.data.items.map((inventory_item, index) => {
            const name = resolveSuggestionName(inventory_item);
            const costValue = resolveSuggestionCost(inventory_item);      
            const qty = Number(inventory_item.qty_added) || 0;
            const cost = Number(costValue) || 0;
            
            lastItemId = nextItemId + index;
        
            return {
              ...inventory_item,
              id: nextItemId + index,
              inventory_id: inventory_item.inventory_id,
              item_name: name,
              quantity: inventory_item.qty_added,
              current_qty: inventory_item.current_qty,
              reorder_level: inventory_item.reorder_level,
              sku: inventory_item.sku,
              cost: costValue !== undefined ? costValue.toString() : '',
              total: inventory_item.total
            };
          });
          
          // setNextItemId(lastItemId);
          setNextItemId(prev => prev + 1);
          setItems(formattedItems);
        } else {
          setErrors(result.error);
        }
        setIsSubmitting(false);
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

  const showStockInHistory = (item) => {
    setSelectedStockItem(item);
    setShowStockInHistoryModal(true);
  }

  const handleBlur = () => {
    // setTimeout(() => setShowSuggestions(false), 200);
    setTimeout(() => setItemSearchTerm(''), 200);
  };

  const getItemsTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

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

  const updateItemField = (id, field, value) => {
    setItems(prev => prev.map(item => {
      // const itemId = item.id || item.inventory_id;
      const itemId = item.id;
      
      if (itemId !== id) {
        return item; // Not the item we are looking for, return it unchanged
      }

      // 2. Update the specific field and calculate the new total
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
    return suggestion.product_name || suggestion.item_name || suggestion.description || `Item ${nextItemId}`;
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
      const result = await getInventoryReplenishmentListsearch({ search: query, page: 1, pageSize: 30 });
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
      const exists = prev.some(item => item.id === suggestion.id);
      if (exists) {
        // newErrors['items'] = `Item with inventory id ${suggestion.product_name} already selected`;
        // setErrors(newErrors);
        // return prev; // return unchanged
      } else {
        setErrors(newErrors);
      }

      // setNextItemId(nextItemId, prev => prev + 1);
      console.log("handleSelectSuggestion nextItemId", nextItemId);
      // console.log(nextItemId, prev => prev + 1);

      return [
        ...prev,
        {
          id: nextItemId + 1,
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

  const validateFormForEmpty = () => {
    const newErrors = {};

    // Loop through items to check ONLY for blank/empty inputs
    items.forEach((item) => {
      
      // Validate Quantity: triggers only if the field is wiped clean
      if (item.quantity === "" || item.quantity === null || item.quantity === undefined || isNaN(item.quantity) || Number(item.quantity) === 0) {
        newErrors[`quantity_${item.id}`] = "Invalid quantity.";
      }

      // Validate Cost: triggers only if the field is wiped clean
      if (item.cost === "" || item.cost === null || item.cost === undefined || isNaN(item.cost) || Number(item.cost) === 0) {
        newErrors[`cost_${item.id}`] = "Invalid cost.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = (result) => {
    const newErrors = {};

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
    setShowEditModal(false);
    setErrors({});
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

  const handleSubmit = async (action) => {
    // e.preventDefault();
    if (!validateFormForEmpty()) return;

    // if (!onSave) return;
    setIsSubmitting(true);

    try {
      const result = await onSave({
        id: formData.id,
        supplier: formData.supplier,
        reference_no: formData.reference_no,
        date_received: formatPostingDate(formData.date_received),
        amount: getItemsTotal(),
        remarks: formData.remarks,
        updated_by: formData.updated_by,
        items: items.map(item => ({
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: Number(item.quantity) || 0,
          cost: Number(item.cost) || 0,
          total: Number(item.total) || 0,
        })),
        status : action,
      });

      if (result && result.success) {
        setShowEditModal(false);
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

  const getStatus = (current) => {
    if (current == "draft") return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Approved', color: 'text-green-600' };
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom p-4 max-w-screen-2xl w-full h-full flex flex-col">
        
        {/* Modal Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 flex-0">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Update Replenishment - <span className={getStatus(formData.status).color}>{toTitleCase(formData.status)}</span>
          </h2>
        </div>

        {/* Form Container */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 flex-1 flex flex-col min-h-0">

          {/* Inputs section - Fixed at top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Transaction Number</label>
              <input
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
                placeholder="Enter reference number"
                className={`w-full px-3 py-2 text-sm border rounded-custom bg-gray-50 focus:outline-none ${
                  errors.reference_no ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.reference_no && <p className="mt-1 text-xs text-red-600">{errors.reference_no}</p>}
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
          <div className="grid grid-cols-1 md:grid-cols-1 gap-2 flex-0">
            <div className="relative flex-0" style={{ marginTop: "0px" }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search items</label>
              <input
                type="text"
                ref={searchInputRef}
                value={itemSearchTerm}
                onChange={(e) => {
                  setItemSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onBlur={handleBlur}
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
          </div>

          {/* --- SCROLLABLE TABLE CONTAINER START --- */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex-0">
              Items ({items.length}) {errors.items && <span className="mt-1 text-xs text-red-600">{errors.items}</span>}
            </label>
            
            {/* Wrapper managing isolated scroll parameters */}
            <div className="rounded-custom border border-gray-300 flex-1 overflow-y-auto min-h-0">
              <table className="min-w-full text-left text-sm table-auto border-collapse">
                {/* sticky top-0 keeps table headers floating smoothly overhead */}
                <thead className="bg-header text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 pl-2 bg-header"> </th>
                    <th className="py-2 bg-header">#</th>
                    <th className="px-3 py-2 bg-header">Item</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header">Quantity</th>
                    <th className="px-3 py-2 text-right pr-9 bg-header">Cost</th>
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
                      <td className="px-3 py-2 align-top text-gray-700">{item.item_name} [{item.sku}] [{item.current_qty}/{item.reorder_level}]</td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          className={`w-full flex px-2 py-1 text-right text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                            errors[`quantity_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors[`quantity_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`quantity_${item.id}`]}</p>}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className={`w-full flex px-2 py-1 text-left text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                          errors[`cost_${item.id}`] ? 'border-red-300' : 'border-gray-300'
                        }`}>
                          <button id="refreshBtn" type="button" aria-label="Refresh value" title="Refresh" onClick={() => showStockInHistory(item)}
                            className="text-blue-600 hover:text-red-800">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            step="0.01"
                            name="cost"
                            value={item.cost}
                            onChange={(e) => updateItemField(item.id, 'cost', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0.00"
                            className="flex-1 focus:outline-none text-right"
                          />
                        </div>
                        {errors[`cost_${item.id}`] && <p className="mt-1 text-[11px] text-red-600">{errors[`cost_${item.id}`]}</p>}
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
              className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center disabled:opacity-50"
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

        </form>

        <ViewStockInHistoryModal
          show={showStockInHistoryModal}
          onClose={() => setShowStockInHistoryModal(false)}
          id={selectedStockItem?.inventory_id}
        />
        
      </div>
    </div>
  );
};

export default UpdateReplenishmentModal;

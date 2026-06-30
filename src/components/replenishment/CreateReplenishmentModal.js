import React, { useState, useEffect, useRef } from 'react';
import { getInventoryReplenishmentListsearch } from '../../api/inventoryService';
import { formatCurrency, formatPostingDate } from '../../utils/formatters';
import { generateTransactionNumber } from '../../api/replenishmentService';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import ViewStockInHistoryModal from './ViewStockInHistoryModal';
import { FormButton, FormHeader, FormModalThead } from '../../utils/themes.js';
import { getSuppliersList } from '../../api/suppliersService.js';

const CreateReplenishmentModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  
  const [formData, setFormData] = useState({
    supplier: '',
    reference_no: '',
    date_received: new Date().toISOString().split('T')[0],
    remarks: '',
    added_by: userData?.employee_id || ''
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

  const [showStockInHistoryModal, setShowStockInHistoryModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [suppliersData, setSuppliersData] = useState([]);

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
      (async () => {
        try {
          const [trnxNumber, suppliersResult] = await Promise.all([
            generateTransactionNumber(),
            getSuppliersList({ pageSize: 100, order: 'asc', sort: 'name' })
          ]);

          setFormData(prev => ({
            ...prev,
            reference_no: trnxNumber,
          }));

          if (suppliersResult.success && suppliersResult.data) {
            const data = suppliersResult.data.data || suppliersResult.data;
            setSuppliersData(data);
          } else {
            setSuppliersData({});
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      })();
    }
  }, [showCreateModal]);

  const fetchTransactionNumber = async () => {
    try {
      setErrors({});
      const trnxNumber = await generateTransactionNumber();
      setFormData(prev => ({
        ...prev,
        reference_no: trnxNumber,
      }));
    } catch (error) {
      console.error("Error fetching transaction number:", error);
    } 
  };

  const showAvailableStocks = (item) => {
    setSelectedStockItem(item);
    setShowStockInHistoryModal(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 250);
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
    
    if (errors[`${field}_${id}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${id}`]: '' }));
    }
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
    setIsSearching(true);
    try {
      const result = await getInventoryReplenishmentListsearch({ search: query, page: 1, pageSize: 30 });
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
    const costValue = resolveSuggestionCost(suggestion);
    const newErrors = { ...errors };

    // const isDuplicate = items.some(item => item.inventory_id === suggestion.id);
    // if (isDuplicate) {
    //   newErrors['items'] = `Item "${name}" is already included in this batch.`;
    //   setErrors(newErrors);
    //   setItemSearchTerm('');
    //   return;
    // }

    delete newErrors['items'];
    setErrors(newErrors);

    setItems(prev => [
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
        history: suggestion.history || []
      },
    ]);

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
    setShowCreateModal(false);
    setFormData({
      supplier: '',
      reference_no: '',
      date_received: new Date().toISOString().split('T')[0],
      remarks: '',
      added_by: userData?.employee_id || '',
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
      newErrors['items'] = "Please add at least one inventory item to register the replenishment payload.";
    }

    items.forEach((item) => {
      if (!item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0) {
        newErrors[`quantity_${item.id}`] = "Required quantity";
      }
      if (!item.cost || isNaN(item.cost) || Number(item.cost) < 0) {
        newErrors[`cost_${item.id}`] = "Required cost";
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
        supplier: formData.supplier,
        reference_no: formData.reference_no,
        date_received: formatPostingDate(formData.date_received),
        amount: getItemsTotal(),
        remarks: formData.remarks,
        added_by: userData?.employee_id || '',
        items: items.map(item => ({
          inventory_id: item.inventory_id,
          item_name: item.item_name,
          quantity: Number(item.quantity) || 0,
          cost: Number(item.cost) || 0,
          total: Number(item.total) || 0,
        })),
        status: action,
      });

      if (result && result.success) {
        setShowCreateModal(false);
        setFormData({
          supplier: '',
          reference_no: '',
          date_received: new Date().toISOString().split('T')[0],
          remarks: '',
          added_by: userData?.employee_id || '',
        });
        setItems([]);
        setNextItemId(1);
        setErrors({});
      } else {
        validateForm(result);
      }
    } catch (error) {
      console.error("Error saving replenishment transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col">

        <FormHeader headerTitle="Create Replenishment" onClick={handleCancel} />
   
        <form onSubmit={(e) => e.preventDefault()} className="p-4 flex-1 flex flex-col min-h-0 space-y-3 bg-gray-50/30">

          {/* Transaction Fields Metadata Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-shrink-0 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Reference Number</label>
              <div 
                className={`flex items-center gap-2 px-3 py-1.5 border rounded bg-gray-50 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent ${errors.reference_no ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
              >
                <input
                  name="reference_no"
                  value={formData.reference_no}
                  onChange={handleChange}
                  placeholder="Generating reference..."
                  className="flex-1 focus:outline-none bg-transparent font-medium text-gray-800"
                />
                <button 
                  type="button" 
                  aria-label="Refresh value" 
                  title="Regenerate Reference Code" 
                  onClick={fetchTransactionNumber}
                  className="text-gray-500 hover:text-gray-800 focus:outline-none"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              {errors.reference_no && <p className="mt-1 text-[11px] text-red-600">{errors.reference_no}</p>}
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Date Received</label>
              <input
                type="date"
                name="date_received"
                value={formData.date_received}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.date_received ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              />
              {errors.date_received && <p className="mt-1 text-[11px] text-red-600">{errors.date_received}</p>}
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Supplier</label>
              {/* <input
                // required
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="Specify supplier name"
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.supplier ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              /> */}
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.supplier ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              >
                <option value="">Select...</option>
                {suppliersData.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              {errors.supplier && <p className="mt-1 text-[11px] text-red-600">{errors.supplier}</p>}
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Remarks / Notes</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={1}
                placeholder="Log transaction details..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 resize-none"
              />
            </div>
          </div>

          {/* Autocomplete Real-time Search Processing Block */}
          <div className="flex-shrink-0 relative text-xs">
            <label className="block font-semibold text-gray-600 mb-0.5">Search Item</label>
            <div className="relative">
              <input
                type="text"
                ref={searchInputRef}
                value={itemSearchTerm}
                onBlur={handleBlur}
                onChange={(e) => {
                  setItemSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Type product name, SKU and other description..."
                className="w-full pl-8 pr-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent"
                style={{paddingTop:'6px', paddingBottom:'7px'}}
              />
              <div className="absolute left-2.5 top-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {showSuggestions && itemSearchTerm.trim() && (
              <div className="absolute left-0 right-0 z-30 mt-1 rounded border border-gray-200 bg-white shadow-xl max-h-56 overflow-y-auto">
                {isSearching ? (
                  <div className="px-4 py-3 text-gray-500 italic flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-button animate-ping"></span>
                    Querying warehouse endpoints...
                  </div>
                ) : itemSuggestions.length > 0 ? (
                  itemSuggestions.map((suggestion, index) => {
                    const name = resolveSuggestionName(suggestion);
                    const costValue = resolveSuggestionCost(suggestion);
                    return (
                      <button
                        key={`${suggestion.id || index}-${index}`}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(suggestion)}
                        className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 block border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-gray-800">
                          {name} {suggestion.sku ? <span className="text-gray-400 font-normal ml-1">[{suggestion.sku}]</span> : ''}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex gap-2">
                          <span>Stock: <strong className="text-gray-700">{suggestion.current_qty ?? 0}</strong></span>
                          <span>Base Cost: <strong className="text-gray-700">₱{Number(costValue).toFixed(2)}</strong></span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-gray-500 italic">No inventory products match criteria.</div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Manifest Interactive Table Section Container */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1 flex-shrink-0">
              <label className="block text-xs font-semibold text-gray-600">
                Item Count ({items.length || 0})
              </label>
              {errors.items && (
                <span className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded px-2 py-0.5 animate-pulse">
                  {errors.items}
                </span>
              )}
            </div>
            
            <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner">
              <table className="min-w-full text-left text-xs table-auto border-collapse">
                <FormModalThead data={[
                  {"title":"#", "class":"pl-2 w-10 text-center"},
                  {"title":"Item Description", "class":"py-2 text-left"},
                  {"title":"Quantity", "class":"py-2 text-right w-40"},
                  {"title":"Unit Cost", "class":"py-2 text-right w-40"},
                  {"title":"Total", "class":"py-2 text-right w-40"},
                ]} />
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-1 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors block mx-auto focus:outline-none"
                          title="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-2 text-center text-gray-400 font-medium align-middle">{index + 1}</td>
                      <td className="px-3 py-2 align-middle text-gray-800">
                        <div className="font-medium">
                          {item.item_name} {item.sku ? <span className="text-gray-400 font-normal ml-0.5">[{item.sku}]</span> : ''}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Current Stock: {item.current_qty || 0} <span className="mx-1">|</span> Reorder Level: {item.reorder_level || 0}
                        </div>
                      </td>

                      <td className="px-3 py-1 align-middle">
                        <div className={`flex items-center px-2 py-1 border rounded bg-white ${
                          errors[`quantity_${item.id}`] ? 'border-red-400 bg-red-50/20' : 'border-gray-300 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent'
                        }`}>
                          <input
                            type="number"
                            name="quantity"
                            value={item.quantity}
                            onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-full focus:outline-none text-right bg-transparent font-semibold text-gray-800"
                          />
                        </div>
                        {errors[`quantity_${item.id}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600 text-right font-medium">{errors[`quantity_${item.id}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <div className={`flex items-center px-2 py-1 border rounded bg-white ${
                          errors[`cost_${item.id}`] ? 'border-red-400 bg-red-50/20' : 'border-gray-300 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent'
                        }`}>
                          <button 
                            type="button" 
                            title="View Stock History" 
                            onClick={() => showAvailableStocks(item)}
                            className="text-blue-500 hover:text-blue-700 mr-1.5 focus:outline-none flex-shrink-0"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            className="w-full focus:outline-none text-right bg-transparent text-gray-800"
                          />
                        </div>
                        {errors[`cost_${item.id}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600 text-right font-medium">{errors[`cost_${item.id}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle text-right pr-4 font-bold text-gray-700">
                        {formatCurrency(item.total) || '₱ 0.00'}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 italic bg-gray-50/30">
                        No product lines staging. Search above to append items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aggregate Valuation Footer Summary Indicator */}
          <div className="flex-shrink-0 rounded border border-gray-200 px-4 py-2.5 bg-gray-50 text-right text-sm font-bold text-emerald-800 shadow-sm flex justify-end items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Accumulated Total:</span>
            <span className="text-base font-black">{formatCurrency(getItemsTotal()) || '₱ 0.00'}</span>
          </div>

          {/* Control Buttons Panel */}
          <div className="justify-end space-x-2 flex flex-shrink-0 text-xs">
            <FormButton
              btnType="outline"
              btnLabel="Cancel"
              btnIcon="cross"
              onClick={handleCancel} 
            />
            <FormButton
              btnType="ash"
              btnLabel="Save as Draft"
              btnIcon="draft"
              onClick={() => handleSubmit("draft")} 
              disabled={isSubmitting || items.length === 0}
              isProcessing={isSubmitting}
            />
          </div>

        </form> 
        
        {/* Secondary Overlay Modal */}
        <ViewStockInHistoryModal
          show={showStockInHistoryModal}
          onClose={() => setShowStockInHistoryModal(false)}
          id={selectedStockItem?.inventory_id}
          item={selectedStockItem}
        />
        
      </div>
    </div>
  );
};

export default CreateReplenishmentModal;
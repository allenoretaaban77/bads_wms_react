import React, { useState, useEffect, useRef } from 'react';
import { getInventoryBatchesListSearch } from '../../api/inventoryService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getSalesViewUpdate } from '../../api/salesService';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { APP_CONFIG } from '../../config/constants';
import ViewStockBatchesModal from './ViewStockBatchesModal';
import { FormButton, FormHeader, FormModalThead } from '../../utils/themes.js';

const UpdateSalesModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [formData, setFormData] = useState({
    id: '',
    customer_name: '',
    invoice_no: '',
    date_sold: new Date().toLocaleDateString('sv-SE'),
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
  const [errors, setErrors] = useState({});
    
  const [showStockBatchesModal, setShowStockBatchesModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState(null);

  // useEffect(() => {
  //   console.log('UpdateSalesModal', items);
  // }, [items]);

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
      if (item.id !== allocationData.id) return item;

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
      
      if (inputRefs.current[6]) {
        inputRefs.current[6].focus();
      }
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
      const exists = items.some(item => {
        return (
          item.inventory_id === suggestion.inventory_id && Number(item.cost) === Number(suggestion.cost_per_unit)
        );
      });
      if (exists) {
        // newErrors['items'] = `Item "${name}" with this specific unit cost is already listed.`;
        // setErrors(newErrors);
        // return prev;
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
          tracking_method: suggestion.tracking_method,
          current_price: priceValue !== undefined ? priceValue.toString() : '',
          price: priceValue !== undefined ? priceValue.toString() : '',
          cost: costValue !== undefined ? costValue.toString() : '',
          total: 0,
          allocated_batches: suggestion.batches || []
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
    if (items.length > 0) {
      const confirmClose = window.confirm(
        "You have unsaved progress on this transaction. Are you sure you want to close?"
      );
      if (!confirmClose) return; // Halt closure if cancel is clicked
    }

    setErrors({});
    setShowEditModal(false);
    setFormData({
      id: '',
      customer_name: '',
      invoice_no: '',
      date_sold: new Date().toLocaleDateString('sv-SE'),
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
          saved_id: item.id,
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
          date_sold: new Date().toLocaleDateString('sv-SE'),
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

  const inputRefs = useRef([]);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    if (items.length > 0 && tableContainerRef.current) {
      // Small delay to ensure the DOM has rendered the new row
      setTimeout(() => {
        tableContainerRef.current.scrollTo({
          top: tableContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
        
        // Focus the quantity input of the newly added item
        const lastIndex = (items.length - 1 + 3) * 2;
        if (inputRefs.current[lastIndex]) {
          inputRefs.current[lastIndex].focus();
        }
      }, 300);
    }
  }, [items.length]);

  const handleKeyDown = (e, index) => {

    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      } else {
        e.target.blur();
      }
    }
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col">
        
        <FormHeader headerTitle="Update Sales Transaction" onClick={handleCancel} headerStatus={formData.status} />
        
        <form onSubmit={(e) => e.preventDefault()} className="p-4 flex-1 flex flex-col min-h-0 space-y-3 bg-gray-50/30">

          {/* Transaction Fields Metadata Block */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-shrink-0 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Sales Transaction Number</label>
              <input
                name="invoice_no"
                value={formData.invoice_no}
                onChange={handleChange}
                placeholder="Generating reference..."
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.invoice_no ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
                ref={(el) => (inputRefs.current[0] = el)}
                onKeyDown={(e) => handleKeyDown(e, 0)}
              />
              {errors.invoice_no && <p className="mt-1 text-[11px] text-red-600">{errors.invoice_no}</p>}
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Date Sold</label>
              <input
                type="date"
                name="date_sold"
                value={formData.date_sold}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.date_sold ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
                ref={(el) => (inputRefs.current[1] = el)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
              />
              {errors.date_sold && <p className="mt-1 text-[11px] text-red-600">{errors.date_sold}</p>}
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-0.5">Customer Name</label>
              <input
                // required
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                placeholder="Specify customer name"
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.customer_name ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
                ref={(el) => (inputRefs.current[2] = el)}
                onKeyDown={(e) => handleKeyDown(e, 2)}
              />
              {errors.customer_name && <p className="mt-1 text-[11px] text-red-600">{errors.customer_name}</p>}
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
                ref={(el) => (inputRefs.current[3] = el)}
                onKeyDown={(e) => handleKeyDown(e, 3)}
              />
            </div>
          </div>
          
          {/* Autocomplete Real-time Search Processing Block */}
          <div className="flex-shrink-0 relative text-xs grid-cols-1 md:grid-cols-4 grid gap-2">
            <div className="md:col-span-3">
              <label className="block font-semibold text-gray-600 mb-0.5">Search Item</label>
              <div className="relative">
                <input
                  type="text"
                  ref={(el) => (inputRefs.current[4] = el)}
                  onKeyDown={(e) => handleKeyDown(e, 4)}
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
                      const priceValue = resolveSuggestionPrice(suggestion);
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
                            <span>Cost: <strong className="text-gray-700">₱{Number(costValue).toFixed(2)}</strong></span>
                            <span>Price: <strong className="text-gray-700">₱{Number(priceValue).toFixed(2)}</strong></span>
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
              <div className="md:col-span-1">
                <label className="block font-semibold text-gray-600 mb-0.5">Payment Type</label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                    errors.payment_status ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                  }`}
                  ref={(el) => (inputRefs.current[5] = el)}
                  onKeyDown={(e) => handleKeyDown(e, 5)}
                >
                  <option value="">Select Payment Type</option>
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
            
            <div 
              ref={tableContainerRef}
              className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner"
            >

              <table className="min-w-full text-left text-xs table-auto border-collapse">
                <FormModalThead data={[
                  {"title":"#", "class":"pl-2 w-10 text-center"},
                  {"title":"Item Description", "class":"py-2 text-left"},
                  {"title":"Quantity", "class":"py-2 text-right w-40"},
                  {"title":"Unit Price", "class":"py-2 text-right w-40"},
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
                        <div className="text-[10px] text-red-500 mt-0.5">
                          Stock: {item.current_qty || 0} <span className="mx-1">|</span> Reorder Level: {item.reorder_level || 0} <span className="mx-1">|</span> Cost: {formatCurrency(item.cost) || 0}
                        </div>
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <div className={`flex items-center px-2 py-1 border rounded bg-white ${
                          errors[`quantity_${item.id}`] ? 'border-red-400 bg-red-50/20' : 'border-gray-300 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent'
                        }`}>
                          {item && item.tracking_method === APP_CONFIG.TRACKING_METHOD.BATCH && (
                            <button 
                              type="button" 
                              title="View Stock Batches" 
                              onClick={() => showAvailableStocks(item)}
                              className="text-blue-500 hover:text-blue-700 mr-1.5 focus:outline-none flex-shrink-0"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <input
                            type="number"
                            name="quantity"
                            value={Number(item.quantity)}
                            onChange={(e) => updateItemField(item.id, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            readOnly={item && item.tracking_method === APP_CONFIG.TRACKING_METHOD.BATCH ? 1 : 0}
                            className="w-full focus:outline-none text-right bg-transparent text-gray-800"
                            ref={(el) => (inputRefs.current[(index + 3) * 2] = el)}
                            onKeyDown={(e) => handleKeyDown(e, (index + 3) * 2)}
                          />
                        </div>
                        {errors[`quantity_${item.id}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600 text-right font-medium">{errors[`quantity_${item.id}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <div className={`flex items-center px-2 py-1 border rounded bg-white ${
                          errors[`price_${item.id}`] ? 'border-red-400 bg-red-50/20' : 'border-gray-300 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent'
                        }`}>
                          <input
                            type="number"
                            step="0.01"
                            name="price"
                            value={item.price}
                            onChange={(e) => updateItemField(item.id, 'price', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0.00"
                            className="w-full focus:outline-none text-right bg-transparent font-semibold text-gray-800"
                            ref={(el) => (inputRefs.current[(index + 3) * 2 + 1] = el)}
                            onKeyDown={(e) => handleKeyDown(e, (index + 3) * 2 + 1)}
                          />
                        </div>
                        {errors[`price_${item.id}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600 text-right font-medium">{errors[`price_${item.id}`]}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle text-right pr-4 font-bold text-gray-700">
                        {formatCurrency(item.total) || '₱ 0.00'}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic bg-gray-50/30">
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
          
          {/* Interactive Action Dock Footer Row */}
          <div className="flex justify-end items-center gap-2 flex-shrink-0 pt-2 border-t border-gray-100">
            <FormButton
              btnType="outline"
              btnLabel="Cancel"
              btnIcon="cross"
              onClick={handleCancel} 
            />
            <FormButton
              btnType="success"
              btnLabel="Update"
              btnIcon="draft"
              onClick={() => handleSubmit(formData.status || "draft")} 
              disabled={isSubmitting}
              isProcessing={isSubmitting}
            />
          </div> 
        
          <ViewStockBatchesModal
            show={showStockBatchesModal}
            onClose={() => setShowStockBatchesModal(false)}
            id={selectedStockItem?.id}
            inventory_id={selectedStockItem?.inventory_id}
            allocatedBatches={selectedStockItem?.allocated_batches || []}
            onApply={handleApplyStockAllocation}
          />  

        </form>        
      </div>
    </div>
  );
};

export default UpdateSalesModal;
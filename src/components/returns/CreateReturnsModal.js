import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPostingDate } from '../../utils/formatters';
import { generateTransactionNumber } from '../../api/returnsService.js';
import { getInvoiceItems } from '../../api/returnsService'; // Connected your native service file here
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { FormButton, FormHeader, FormModalThead } from '../../utils/themes.js';

const CreateReturnsModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  
  const [formData, setFormData] = useState({
    return_no: '',
    invoice_id: '',
    invoice_no: '',
    customer_name: '',
    date_received: new Date().toISOString().split('T')[0],
    remarks: '',
    added_by: userData?.employee_id || ''
  });

  const [items, setItems] = useState([]);
  const [nextItemId, setNextItemId] = useState(1);
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [allowedInvoiceItems, setAllowedInvoiceItems] = useState([]); 
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getItemsTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  useEffect(() => {
    if (showCreateModal) {
      fetchTransactionNumber();
    }
  }, [showCreateModal]);

  const fetchTransactionNumber = async () => {
    try {
      setErrors({});
      const trnxNumber = await generateTransactionNumber(); 
      setFormData(prev => ({
        ...prev,
        return_no: trnxNumber,
      }));
    } catch (error) {
      console.error("Error fetching return key index mapping:", error);
    }
  };

  // Triggered when verifying/locking an invoice number from the frontend using native fetch wrapper
  const handleFetchInvoiceDetails = async () => {
    if (!invoiceSearchTerm.trim()) return;
    setIsSearchingInvoice(true);
    setInvoiceError('');
    
    // Pass the invoice string code directly to your returnsService handler method
    const result = await getInvoiceItems(invoiceSearchTerm.trim());
    
    if (result.success && result.data) {
      const payload = result.data;
      setAllowedInvoiceItems(payload.items || []);
      setFormData(prev => ({
        ...prev,
        invoice_no: invoiceSearchTerm.trim(),
        invoice_id: payload.invoice_id,
        customer_name: payload.customer_name || 'Walk-in Customer' 
      }));
      setItems([]); // Reset staging grid if switching invoices
    } else {
      setInvoiceError(result.error || 'Invoice details not located.');
      setAllowedInvoiceItems([]);
    }
    setIsSearchingInvoice(false);
  };

  const handleSelectProductLine = (e) => {
    const salesItemId = Number(e.target.value);
    if (!salesItemId) return;

    const matchedLine = allowedInvoiceItems.find(item => item.sales_item_id === salesItemId);
    if (!matchedLine) return;

    if (items.some(i => i.sales_item_id === salesItemId)) {
      setErrors(prev => ({ ...prev, items: 'This specific line item has already been appended.' }));
      return;
    }

    setItems(prev => [
      ...prev,
      {
        id: nextItemId,
        inventory_id: matchedLine.inventory_id,
        batch_id: matchedLine.batch_id, 
        sales_item_id: matchedLine.sales_item_id,
        sku: matchedLine.sku,
        item_name: matchedLine.product_name || `Product ID: ${matchedLine.inventory_id}`,
        qty_sold: matchedLine.qty_sold, 
        qty_returned: 1,
        unit_price: matchedLine.unit_price,
        total: matchedLine.unit_price,
        reason: ''
      }
    ]);

    setNextItemId(prev => prev + 1);
    setErrors(prev => ({ ...prev, items: '' }));
  };

  const updateItemField = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      
      if (field === 'qty_returned') {
        const qty = Number(value) || 0;
        updated.total = qty * Number(updated.unit_price);
      }
      return updated;
    }));
    
    if (errors[`${field}_${id}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${id}`]: '' }));
    }
  };

  const removeItemRow = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCancel = () => {
    setErrors({});
    setInvoiceError('');
    setInvoiceSearchTerm('');
    setAllowedInvoiceItems([]);
    setItems([]);
    setNextItemId(1);
    setShowCreateModal(false);
    setFormData({
      return_no: '',
      invoice_id: '',
      invoice_no: '',
      customer_name: '',
      date_received: new Date().toISOString().split('T')[0],
      remarks: '',
      added_by: userData?.employee_id || '',
    });
  };

  const validateFormForEmpty = () => {
    const newErrors = {};

    if (!formData.invoice_id) {
      newErrors['invoice_no'] = "An existing verified invoice record target must be specified.";
    }
    if (items.length === 0) {
      newErrors['items'] = "Please include at least one product row to save return context logs.";
    }

    items.forEach((item) => {
      if (!item.qty_returned || isNaN(item.qty_returned) || Number(item.qty_returned) <= 0) {
        newErrors[`qty_returned_${item.id}`] = "Required field";
      } else if (Number(item.qty_returned) > item.qty_sold) {
        newErrors[`qty_returned_${item.id}`] = `Exceeds purchase quantity (${item.qty_sold})`;
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
        return_no: formData.return_no,
        invoice_id: Number(formData.invoice_id),
        invoice_no: formData.invoice_no,
        customer_name: formData.customer_name,
        date_received: formatPostingDate(formData.date_received),
        amount: getItemsTotal(),
        remarks: formData.remarks,
        added_by: userData?.employee_id || '',
        status: action, 
        items: items.map(item => ({
          inventory_id: item.inventory_id,
          batch_id: item.batch_id,
          sales_item_id: item.sales_item_id,
          qty_returned: Number(item.qty_returned) || 0,
          unit_price: Number(item.unit_price) || 0,
          reason: item.reason
        }))
      });

      if (result && result.success) {
        handleCancel();
      } else if (result && result.error?.errors) {
        setErrors(result.error.errors);
      }
    } catch (error) {
      console.error("Error pushing return parameters context mapping:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col">

        <FormHeader headerTitle="Create Customer Returns Manifest" onClick={handleCancel} />
   
        <form onSubmit={(e) => e.preventDefault()} className="p-4 flex-1 flex flex-col min-h-0 space-y-3 bg-gray-50/30">

          {/* Form Header Parameters Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-shrink-0 text-xs">
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Return Reference ID</label>
              <input
                disabled
                name="return_no"
                value={formData.return_no}
                className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-100 font-medium text-gray-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-1">Date Returned</label>
              <input
                type="date"
                name="date_received"
                value={formData.date_received}
                onChange={handleChange}
                className={`w-full px-3 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-button focus:border-transparent text-gray-800 ${
                  errors.date_received ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-1">Customer Name</label>
              <input
                disabled
                name="customer_name"
                value={formData.customer_name}
                placeholder="Linked Customer Name"
                className="w-full px-3 py-1.5 border border-gray-200 rounded bg-gray-100 text-gray-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-600 mb-1">Remarks / Notes</label>
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

          {/* Two-Step Verification Lookup Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0 text-xs bg-white p-3 border border-gray-200 rounded shadow-sm">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Step 1: Input Original Invoice Target</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceSearchTerm}
                  onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                  placeholder="e.g. SLS1234567890"
                  className={`flex-1 px-3 py-1.5 border rounded focus:outline-none ${invoiceError || errors.invoice_no ? 'border-red-400 bg-red-50/30' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  disabled={isSearchingInvoice}
                  onClick={handleFetchInvoiceDetails}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {isSearchingInvoice ? 'Verifying...' : 'Verify Invoice'}
                </button>
              </div>
              {invoiceError && <p className="mt-1 text-[11px] text-red-600 font-medium">{invoiceError}</p>}
              {errors.invoice_no && <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.invoice_no}</p>}
              {formData.invoice_no && !invoiceError && (
                <p className="mt-1 text-[11px] text-green-600 font-medium flex items-center gap-1">
                  ✓ Active Invoice Locked: {formData.invoice_no}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Step 2: Append Sold Items to Return List</label>
              <select
                disabled={allowedInvoiceItems.length === 0}
                onChange={handleSelectProductLine}
                value=""
                className="w-full px-3 py-1.5 border border-gray-300 rounded text-gray-800 bg-white focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                <option value="">-- {allowedInvoiceItems.length === 0 ? "Unlock Invoice First" : "Select an eligible line item"} --</option>
                {allowedInvoiceItems.map((item) => (
                  <option key={item.sales_item_id} value={item.sales_item_id}>
                    {/* Item ID: {item.inventory_id} (Purchased Qty: {item.qty_sold} | Price: ₱{Number(item.unit_price).toFixed(2)}) */}
                    {item.product_name} [{item.sku}] (Quantity: {item.qty_sold} | Price: {formatCurrency(item.unit_price)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staging Manifest Grid Layout */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-1 flex-shrink-0">
              <label className="block text-xs font-semibold text-gray-600">
                Items Selected For Return ({items.length || 0})
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
                  {"title":"#", "class":"w-8 text-center"},
                  {"title":"Product Name", "class":"py-2 text-left"},
                  {"title":"Unit Price", "class":"py-2 text-right w-36"},
                  {"title":"Quantity", "class":"py-2 text-right w-40"},
                  {"title":"Total", "class":"py-2 text-right w-36"},
                  {"title":"Condition / Reason", "class":"py-2 text-center w-48"}
                ]} />
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-1 align-middle text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(item.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors block mx-auto focus:outline-none"
                          title="Remove row"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-2 text-center text-gray-400 font-medium align-middle">{index + 1}</td>
                      <td className="px-3 py-2 align-middle text-gray-800">
                        {/* <div className="font-semibold">Product Item Reference: #{item.inventory_id} {item.item_name}</div> */}
                        <div className="font-semibold">{item.item_name} [{item.sku}]</div>
                        {/* <div className="text-[10px] text-gray-400 mt-0.5">
                          Invoice Line: #{item.sales_item_id} <span className="mx-1">|</span> Batch Layer: {item.batch_id || 'System Dynamic Auto-Select'}
                        </div> */}
                        <div className="text-[10px] text-gray-400 mt-0.5">Purchase Quantity: <span className="mx-1">{item.qty_sold}</span></div>
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-gray-600 align-middle">
                        ₱{Number(item.unit_price).toFixed(2)}
                      </td>

                      <td className="px-3 py-1 align-middle">
                        <div className={`flex items-center px-2 py-1 border rounded bg-white ${
                          errors[`qty_returned_${item.id}`] ? 'border-red-400 bg-red-50/20' : 'border-gray-300 focus-within:ring-1 focus-within:ring-button focus-within:border-transparent'
                        }`}>
                          <input
                            type="number"
                            name="qty_returned"
                            value={item.qty_returned}
                            onChange={(e) => updateItemField(item.id, 'qty_returned', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="0"
                            className="w-full focus:outline-none text-right bg-transparent font-semibold text-gray-800"
                          />
                        </div>
                        {errors[`qty_returned_${item.id}`] && (
                          <p className="mt-0.5 text-[10px] text-red-600 text-right font-medium">{errors[`qty_returned_${item.id}`]}</p>
                        )}
                      </td>
                      
                      <td className="px-3 py-2 align-middle text-right font-bold text-gray-700">
                        {formatCurrency(item.total) || '₱ 0.00'}
                      </td>

                      <td className="px-3 py-1 align-middle">
                        <input
                          type="text"
                          value={item.reason}
                          onChange={(e) => updateItemField(item.id, 'reason', e.target.value)}
                          placeholder="e.g. Defective, Wrong Spec"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-button text-center text-gray-700"
                        />
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 italic bg-gray-50/30">
                        No lines added. Lock an original Invoice reference number first above to choose lines.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aggregate Metric Card Layout */}
          <div className="flex-shrink-0 rounded border border-gray-200 px-4 py-2.5 bg-gray-50 text-right text-sm font-bold text-emerald-800 shadow-sm flex justify-end items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Accumulated Total:</span>
            <span className="text-base font-black">{formatCurrency(getItemsTotal()) || '₱ 0.00'}</span>
          </div>

          {/* Button Layout Footer Controls */}
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
        
      </div>
    </div>
  );
};

export default CreateReturnsModal;
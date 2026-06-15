import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getSalesList } from '../../api/salesService'; // Used to validate against original limits

function UpdateReturnsModal({ showUpdateModal, setShowUpdateModal, selectedReturn, onUpdate }) {
  // Form states
  const [returnItems, setReturnItems] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [formError, setFormError] = useState(null);

  // Safely close and clear states
  const handleClose = () => {
    setFormError(null);
    setShowUpdateModal(false);
  };

  // Sync state when modal mounts or selected return record changes
  useEffect(() => {
    if (showUpdateModal && selectedReturn) {
      setRemarks(selectedReturn.remarks || '');
      syncAndValidateWithInvoice();
    }
  }, [showUpdateModal, selectedReturn]);

  // Fetch original invoice to establish upper bounds for quantities
  const syncAndValidateWithInvoice = async () => {
    if (!selectedReturn?.invoice_no && !selectedReturn?.invoice_id) return;
    
    try {
      setIsLoadingInvoice(true);
      setFormError(null);

      // Search using the linked invoice identification tracking key
      const params = { search: selectedReturn.invoice_no || selectedReturn.invoice_id, pageSize: 1 };
      const result = await getSalesList(params);
      const originalInvoice = result?.data?.data?.[0] || result?.data?.[0];
      
      const draftItems = selectedReturn.items || selectedReturn.return_details || [];
      const invoiceItems = originalInvoice?.items || originalInvoice?.sales_details || [];

      // Map current draft quantities alongside original limits
      const mappedItems = draftItems.map(draftItem => {
        // Match line item to original invoice stock to check max boundaries
        const originalLine = invoiceItems.find(invItem => invItem.id === draftItem.sales_item_id || invItem.item_name === draftItem.item_name);
        
        return {
          id: draftItem.id, // return detail row id
          sales_item_id: draftItem.sales_item_id,
          item_name: draftItem.item_name,
          unit_price: draftItem.unit_price || 0,
          quantity_returned: draftItem.quantity_returned || draftItem.quantity || 0,
          // Fallback gracefully if original invoice tracking lookup isn't accessible
          quantity_sold: originalLine ? originalLine.quantity : (draftItem.quantity_sold || 9999) 
        };
      });

      setReturnItems(mappedItems);
    } catch (err) {
      setFormError('Warning: Could not pull baseline transaction references to verify quantity thresholds.');
      // Fallback fallback: Populate with what we have from the draft snapshot
      const draftItems = selectedReturn.items || selectedReturn.return_details || [];
      setReturnItems(draftItems.map(i => ({
        ...i,
        quantity_returned: i.quantity_returned || i.quantity || 0,
        quantity_sold: i.quantity_sold || 9999
      })));
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleQtyChange = (index, value) => {
    const updated = [...returnItems];
    const qty = Math.max(0, parseInt(value) || 0);
    
    // Boundary lock guard: prevent over-crediting limits
    if (qty > updated[index].quantity_sold) return;
    
    updated[index].quantity_returned = qty;
    setReturnItems(updated);
  };

  // Derived calculations
  const totalRefundAmount = returnItems.reduce((acc, item) => {
    return acc + (item.quantity_returned * item.unit_price);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = returnItems.filter(item => item.quantity_returned > 0);
    if (validItems.length === 0) {
      setFormError('Please preserve at least one item breakdown count above zero, or cancel the voucher.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const updatePayload = {
        id: selectedReturn.id,
        invoice_id: selectedReturn.invoice_id,
        invoice_no: selectedReturn.invoice_no,
        customer_name: selectedReturn.customer_name,
        amount: totalRefundAmount,
        remarks: remarks,
        status: 'draft', // Preserved as draft state
        items: validItems
      };

      const response = await onUpdate(updatePayload);
      
      if (response && response.success === false) {
        setFormError(response.error || 'Failed to submit modifications.');
      } else {
        handleClose();
      }
    } catch (err) {
      setFormError('An error occurred during updating lifecycle synchronization pipelines.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showUpdateModal || !selectedReturn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        {/* Header Block */}
        <div className="px-4 py-3 bg-header text-white flex justify-between items-center rounded-t-custom">
          <div>
            <h2 className="text-base font-semibold">Modify Return Voucher Draft</h2>
            <p className="text-[10px] text-gray-200 opacity-90">Updating reference target: #{selectedReturn.return_no || selectedReturn.id}</p>
          </div>
          <button onClick={handleClose} className="text-white hover:text-gray-200 focus:outline-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input Form Fields */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {formError && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-xs px-3 py-2 rounded">
              <strong>Pipeline Validation Flag:</strong> {formError}
            </div>
          )}

          {/* Reference Document Breadcrumbs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700">
            <div>
              <span className="text-gray-400 block font-medium">Customer Name</span>
              <span className="font-semibold">{selectedReturn.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Orig. Invoice Target</span>
              <span className="font-semibold underline text-gray-600">{selectedReturn.invoice_no}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Current Workflow Stage</span>
              <span className="px-2 py-0.2 bg-blue-100 text-blue-800 font-bold uppercase text-[9px] rounded border border-blue-200 tracking-wider">
                {selectedReturn.status}
              </span>
            </div>
          </div>

          {/* Line Items Table Adjustment Matrices */}
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Adjust Item Log Quantities</h3>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2">Item Description</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-center w-28">Max Sold Limit</th>
                    <th className="px-3 py-2 text-center w-28">Return Qty</th>
                    <th className="px-3 py-2 text-right w-32">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoadingInvoice ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-6 text-center text-gray-400 italic animate-pulse">
                        Synchronizing tracking data indexes from system servers...
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                        <td className="px-3 py-2 text-center text-gray-400 font-medium">
                          {item.quantity_sold === 9999 ? 'Unverified' : item.quantity_sold}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity_sold}
                            value={item.quantity_returned}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-button font-semibold"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          {formatCurrency(item.quantity_returned * item.unit_price)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Remarks Context Area */}
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-gray-700">Update Audit Logs / Adjustment Reason</label>
            <textarea
              rows="2"
              placeholder="Provide clarifying context regarding the changes made to this credit draft request..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-custom">
          <div>
            <span className="text-sm font-semibold text-gray-800">
              Recalculated Credit: <span className="text-red-600">{formatCurrency(totalRefundAmount)}</span>
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-custom hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLoadingInvoice || totalRefundAmount === 0}
              className="px-4 py-1.5 bg-button text-white text-sm rounded-custom hover:bg-button-hover disabled:opacity-50 transition-colors shadow-sm font-medium"
            >
              {isSubmitting ? 'Updating Draft...' : 'Save Draft Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default UpdateReturnsModal;
import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { getSalesList } from '../../api/salesService'; // Used to look up original invoice details

function CreateReturnsModal({ showCreateModal, setShowCreateModal, onSave, preselectedInvoiceId = null }) {
  // Form states
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [isSearchingInvoice, setIsSearchingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Reset form helper
  const resetForm = () => {
    setInvoiceSearch('');
    setSelectedInvoice(null);
    setReturnItems([]);
    setRemarks('');
    setFormError(null);
  };

  // Handle closure safely
  const handleClose = () => {
    resetForm();
    setShowCreateModal(false);
  };

  // Effect to automatically pull invoice data if opened inline from a sales modal
  useEffect(() => {
    if (showCreateModal && preselectedInvoiceId) {
      fetchInvoiceDetails(preselectedInvoiceId);
    }
  }, [showCreateModal, preselectedInvoiceId]);

  // Fetch invoice helper function
  const fetchInvoiceDetails = async (searchKeyOrId) => {
    try {
      setIsSearchingInvoice(true);
      setFormError(null);
      
      // Query parameters to get invoice with line items
      const params = { 
        search: searchKeyOrId, 
        pageSize: 1 
      };
      
      const result = await getSalesList(params);
      const invoice = result?.data?.data?.[0] || result?.data?.[0];

      if (result?.success && invoice) {
        setSelectedInvoice(invoice);
        // Map original sold line items to structured return item entities
        const lineItems = invoice.items || invoice.sales_details || [];
        
        setReturnItems(lineItems.map(item => ({
          sales_item_id: item.id,
          item_name: item.item_name,
          unit_price: item.unit_price,
          quantity_sold: item.quantity,
          quantity_returned: 0, // Default initialization state
          reason: 'Defective'   // Default option dropdown state
        })));
      } else {
        setFormError('Invoice not found. Please verify the transaction number.');
        setSelectedInvoice(null);
        setReturnItems([]);
      }
    } catch (err) {
      setFormError('Failed to retrieve invoice tracking details.');
    } finally {
      setIsSearchingInvoice(false);
    }
  };

  const handleInvoiceSearchSubmit = (e) => {
    e.preventDefault();
    if (!invoiceSearch.trim()) return;
    fetchInvoiceDetails(invoiceSearch.trim());
  };

  const handleQtyChange = (index, value) => {
    const updated = [...returnItems];
    const qty = Math.max(0, parseInt(value) || 0);
    
    // Guard parameter limits against original quantity sold bounds
    if (qty > updated[index].quantity_sold) {
      return; 
    }
    
    updated[index].quantity_returned = qty;
    setReturnItems(updated);
  };

  const handleItemReasonChange = (index, reason) => {
    const updated = [...returnItems];
    updated[index].reason = reason;
    setReturnItems(updated);
  };

  // Derived State calculations for credit return totals
  const totalRefundAmount = returnItems.reduce((acc, item) => {
    return acc + (item.quantity_returned * item.unit_price);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    // Filter down matrix variables to items actively flagged for a return cycle
    const itemsToReturn = returnItems.filter(item => item.quantity_returned > 0);
    
    if (itemsToReturn.length === 0) {
      setFormError('Please specify at least one item row collection quantity to return.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const returnPayload = {
        invoice_id: selectedInvoice.id,
        invoice_no: selectedInvoice.invoice_no,
        customer_name: selectedInvoice.customer_name,
        amount: totalRefundAmount,
        remarks: remarks,
        status: 'draft', // Saved initially as draft state pipeline step
        items: itemsToReturn
      };

      const response = await onSave(returnPayload);
      
      // If parent handler returns a response and it failed, map error state back to modal UI
      if (response && response.success === false) {
        setFormError(response.error || 'Failed to submit return records.');
      } else {
        handleClose();
      }
    } catch (err) {
      setFormError('An unexpected server communication state fault occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        {/* Header section (Using your signature bg-header background & text-base sizing) */}
        <div className="px-4 py-3 bg-header text-white flex justify-between items-center rounded-t-custom">
          <h2 className="text-base font-semibold">Initialize Sales Return Log</h2>
          <button onClick={handleClose} className="text-white hover:text-gray-200 focus:outline-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Content Area */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
              <strong>Error validation state:</strong> {formError}
            </div>
          )}

          {/* Look up phase conditionally isolated */}
          {!selectedInvoice && !preselectedInvoiceId && (
            <form onSubmit={handleInvoiceSearchSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">Link Original Invoice Profile Tracking Number</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. INV-2026-0042"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button"
                  disabled={isSearchingInvoice}
                />
                <button
                  type="submit"
                  disabled={isSearchingInvoice}
                  className="px-4 py-1.5 bg-button text-white text-xs rounded-custom hover:bg-button-hover disabled:opacity-50 transition-colors"
                >
                  {isSearchingInvoice ? 'Searching...' : 'Find Invoice'}
                </button>
              </div>
            </form>
          )}

          {/* Loaded details layout interface mapping display logs */}
          {selectedInvoice && (
            <div className="space-y-4 animate-fadeIn">
              {/* Reference Header Summary Block (Uses consistent text-xs styling) */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block">Orig. Invoice Target</span>
                  <span className="font-semibold text-gray-800">{selectedInvoice.invoice_no}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Customer Name</span>
                  <span className="font-semibold text-gray-800">{selectedInvoice.customer_name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Original Paid Sum</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Date Finalized</span>
                  <span className="font-semibold text-gray-800">{selectedInvoice.date_sold}</span>
                </div>
              </div>

              {/* Line items return tracking manipulation list breakdown table */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Item Return Log Breakdown Configurations</h3>
                <div className="border border-gray-200 rounded overflow-hidden">
                  
                  {/* Styled breakdown table adhering to your clean gray theme and fine text sizing */}
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2">Item Description</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-center">Qty Sold</th>
                        <th className="px-3 py-2 text-center w-24">Qty Return</th>
                        <th className="px-3 py-2 w-40">Return Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {returnItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{item.quantity_sold}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity_sold}
                              value={item.quantity_returned}
                              onChange={(e) => handleQtyChange(index, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-button"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.reason}
                              onChange={(e) => handleItemReasonChange(index, e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-button"
                            >
                              <option value="Defective">Defective / Damaged</option>
                              <option value="Wrong Item">Wrong Item Shipped</option>
                              <option value="Customer Dissatisfaction">Customer Return</option>
                              <option value="Expired">Expired Stock</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              </div>

              {/* General remarks logic block inputs */}
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Internal Audit Remarks / Root Cause Explanatory</label>
                <textarea
                  rows="2"
                  placeholder="Provide processing details or handling conditions regarding this credit update context..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions mapping block container */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-custom">
          <div>
            {selectedInvoice && (
              <span className="text-xs font-semibold text-gray-800">
                Total Return Credit Value: <span className="text-red-600 font-bold">{formatCurrency(totalRefundAmount)}</span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-custom hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            {selectedInvoice && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || totalRefundAmount === 0}
                className="px-4 py-1.5 bg-button text-white text-xs rounded-custom hover:bg-button-hover disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmitting ? 'Saving Draft...' : 'Save Return Logs'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CreateReturnsModal;
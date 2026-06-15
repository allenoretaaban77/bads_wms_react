import React from 'react';
import { formatCurrency } from '../../utils/formatters';

function ViewReturnsModal({ showViewModal, setShowViewModal, selectedReturn }) {
  
  if (!showViewModal || !selectedReturn) return null;

  // Helper to dynamically style the return status badges
  const getStatusBadgeClass = (status) => {
    const base = "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ";
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return base + "bg-green-100 text-green-800 border border-green-200";
      case 'draft':
        return base + "bg-blue-100 text-blue-800 border border-blue-200";
      case 'rejected':
      case 'cancelled':
        return base + "bg-red-100 text-red-800 border border-red-200";
      default:
        return base + "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Safe mapping for line items (handles varying API payload naming conventions)
  const returnItems = selectedReturn.items || selectedReturn.return_details || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-3xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Header Section */}
        <div className="px-4 py-3 bg-header text-white flex justify-between items-center rounded-t-custom">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-semibold">Return Voucher Details</h2>
            <span className="text-xs opacity-75">#{selectedReturn.return_no || selectedReturn.id}</span>
          </div>
          <button 
            onClick={() => setShowViewModal(false)} 
            className="text-white hover:text-gray-200 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
            <div>
              <span className="text-gray-500 block mb-0.5">Customer Profile</span>
              <span className="font-semibold text-gray-800">{selectedReturn.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Linked Invoice</span>
              <span className="font-semibold text-gray-600 underline">
                {selectedReturn.invoice_no || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block mb-0.5">Date Logged</span>
              <span className="font-semibold text-gray-800">{selectedReturn.date_returned || selectedReturn.created_at}</span>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Process Status</span>
              <span className={getStatusBadgeClass(selectedReturn.status)}>
                {selectedReturn.status || 'Pending'}
              </span>
            </div>
          </div>

          {/* Line Item Table Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Returned Items Summary</h3>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2">Item Description</th>
                    <th className="px-3 py-2 text-right">Unit Value</th>
                    <th className="px-3 py-2 text-center">Returned Qty</th>
                    <th className="px-3 py-2 text-right w-32">Credited Total</th>
                    <th className="px-3 py-2 w-44">Reason Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {returnItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-gray-400 italic">
                        No itemizations found in this return snapshot.
                      </td>
                    </tr>
                  ) : (
                    returnItems.map((item, index) => {
                      const qty = item.quantity_returned || item.quantity || 0;
                      const price = item.unit_price || 0;
                      const lineTotal = qty * price;

                      return (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-3 py-2 font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(price)}</td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-800">{qty}</td>
                          <td className="px-3 py-2 text-right font-medium text-red-600">{formatCurrency(lineTotal)}</td>
                          <td className="px-3 py-2">
                            <span className="inline-block bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded border border-gray-200">
                              {item.reason || 'Not Specified'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Internal Audit Notes Box */}
          {selectedReturn.remarks && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded p-3 space-y-1">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                Internal Audit & Root Cause Remarks
              </span>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                "{selectedReturn.remarks}"
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center rounded-b-custom">
          <div>
            <span className="text-sm font-semibold text-gray-800">
              Total Refunded Value: <span className="text-red-600">{formatCurrency(selectedReturn.amount || 0)}</span>
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowViewModal(false)}
              className="px-5 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-custom hover:bg-gray-700 transition-colors shadow-sm"
            >
              Close Record
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ViewReturnsModal;
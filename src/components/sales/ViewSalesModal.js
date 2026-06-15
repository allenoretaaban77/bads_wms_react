import React, { useState, useEffect } from 'react';
import { getSalesViewSales } from '../../api/salesService';
import { formatCurrency, toTitleCase, formatLongDate } from '../../utils/formatters';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { generatePrintReceipt } from '../../utils/printUtils';

function ViewSalesModal({ show, onClose, onUpdate, onDelete, onApprove, onReturn, id }) {
  const userData = useAppViewModel((state) => state.userData);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (show && id) {
      setData(null);

      const fetchData = async () => {
        setLoading(true);
        setError(null);
        const result = await getSalesViewSales(id);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, id]);

  const handlePaidUnpaid = (data) => {
    // Implement your payment status toggler here
  };

  const handleUpdate = (item) => {
    onUpdate(item);
  };

  const handleDelete = (item) => {
    onDelete(item.id);
  };

  const handlePrint = (item) => {  
    const dataToPrint = {
      ...item,
      employee: userData.firstname + ' ' + userData.middlename + ' ' + userData.lastname 
    };
    generatePrintReceipt(dataToPrint);
  };

  const handleInitiateSingleReturn = async (item) => {
    const qtyToReturn = window.prompt(`How many units of "${item.product_name}" are being returned?`, "1");
    
    if (qtyToReturn === null) return; // User cancelled prompt
    
    const parsedQty = parseInt(qtyToReturn, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      window.alert("Please enter a valid positive quantity.");
      return;
    }

    if (parsedQty > item.qty_sold) {
      window.alert(`Maximum allowed return quantity is ${item.qty_sold}.`);
      return;
    }

    const isDefective = window.confirm("Is this item defective or structurally damaged?\n\n[OK] Yes, set as Defective\n[Cancel] No, restock as Sellable");

    if (window.confirm(`Confirm processing return for ${parsedQty} unit(s) of "${item.product_name}"?`)) {
      setIsSubmitting(true);
      try {
        const returnPayload = {
          invoice_no: data.invoice_no,
          updated_by: userData.employee_id,
          items: [
            {
              inventory_id: item.inventory_id || item.id, // Fallback depending on your structural item key
              batch_id: item.batch_id,
              quantity: parsedQty,
              is_defective: isDefective
            }
          ]
        };

        const result = await onReturn(returnPayload);
        if (result && result.success) {
          // Refresh item details view to showcase changes
          const updatedDetails = await getSalesViewSales(id);
          if (updatedDetails.success) setData(updatedDetails.data);
          setError(null);
        } else {
          setError(result?.error || "Failed to complete processing return sequence.");
        }
      } catch (err) {
        console.error("Error running return operation execution:", err);
        setError("An unhandled exception occurred during transaction rollback handling.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (action, data) => {
    console.log(action, data);
    if (window.confirm('Are you sure you want to APPROVE this transaction?')) {
      setIsSubmitting(true);

      try {
        const result = await onApprove({
          id: data.id,
          invoice_no: data.invoice_no,
          updated_by: userData.employee_id,
          status : action
        });

        if (result && result.success) {
          setError(null);
        } else {
          console.log(result.error.error);
          setError(result.error.error);
        }
      } catch (error) {
        console.error("Error saving replenishment:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const getQuantityStatus = (status) => {
    if (status === 'credit') return { text: 'Credit', color: 'text-red-600' };
    if (status === 'draft') return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Cash', color: 'text-green-600' };
  };
  
  const getRecordStatus = (status) => {
    if (status === 'inactive') return { text: 'Voided', color: 'text-red-600' };
    return { text: '', color: 'text-green-600' };
  };

  const getStatus = (current) => {
    if (current === "draft") return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Approved', color: 'text-green-600' };
  };
  
  const getPaidStatus = (status) => {
    if (status === 'no') return { text: 'Not Paid', color: 'text-red-600' };
    return { text: 'Paid', color: 'text-green-600' };
  };

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-screen-xl w-full mx-2 max-h-screen overflow-y-auto">
  
        {loading && <div className='w-full text-center'><span className='text-green-700'>Loading...</span></div>}
  
        <div className="mb-6 border-b border-gray-200 pb-4">
          {data && (
            <>
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Sales Transaction Details - <span className={getQuantityStatus(data.payment_status).color}> {toTitleCase(data.payment_status)}</span> - <span className={getStatus(data.status).color}>{getStatus(data.status).text}</span> - <span className={getPaidStatus(data.is_paid).color}>{getPaidStatus(data.is_paid).text}</span>
            </h2 >
            {error && <div className='w-full text-center'><span className='text-red-500'>{error}</span></div>}
            </>
          )}
        </div>

        {data && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div><strong>Transaction No:</strong> {data.invoice_no}</div>
              <div><strong>Date Sold:</strong> {formatLongDate(data.date_sold)}</div>
              <div><strong>Customer Name:</strong> {data.customer_name}</div>
              <div><strong>Remarks:</strong> <span className={getRecordStatus(data.record_status).color}> {toTitleCase(getRecordStatus(data.record_status).text)}</span>{data.remarks}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <div className="bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-header text-white">
                    <tr className="border-0">
                      <th className="border-r px-3 py-2 text-left text-white">SKU</th>
                      <th className="border-r px-3 py-2 text-left text-white">Product Name</th>
                      <th className="border-r p-2 text-right">Quantity</th>
                      <th className="border-r p-2 text-right">Price per Unit</th>
                      <th className="border-r p-2 text-right">Total</th>
                      {data.status === "approved" && <th className="p-2 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="border-r border-b border-l p-2">{item.sku}</td>
                        <td className="border-r border-b p-2">{item.product_name}</td>
                        <td className="border-r border-b p-2 text-right">{item.qty_sold}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.price_per_unit)}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.total)}</td>
                        {data.status === "approved" && (
                          <td className="border-r border-b p-2 text-center">
                            {item.qty_sold > 0 ? (
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleInitiateSingleReturn(item)}
                                className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center mx-auto"
                                title="Process single line item item exchange/return"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Return
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Fully Returned</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                      <td colSpan="4" className="border-r border-b border-l p-2 text-right">Grand Total</td>
                      <td className="border-r p-2 text-right">{formatCurrency(data.amount)}</td>
                      {data.status === "approved" && <td className="border-r border-b p-2"></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="red" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
            {data && data.status === "draft" && (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdate(data)}
                  className="px-3 py-1.5 bg-gray-900/50 text-white rounded-custom hover:bg-gray-900 transition-colors text-sm flex items-center disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(data)}
                  className="px-3 py-1.5 bg-red-700 text-white rounded-custom hover:bg-red-900 transition-colors text-sm flex items-center disabled:opacity-50"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("approved", data)}
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
                      Approve
                    </>
                  )}
                </button>
              </>
            )}
            {data && (
              <button
                type="button"
                onClick={() => handlePrint(data)}
                className="px-3 py-1.5 text-white border border-blue-600/50 bg-blue-500 hover:text-white hover:border-blue-800/50 rounded-custom hover:bg-blue-700 transition-colors text-sm flex items-center disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h10v4H6v-4z"
                  />
                </svg>
                Print
              </button>
            )}
            {data && (
              <button
                type="button"
                onClick={() => handlePaidUnpaid(data)}
                className="px-3 py-1.5 text-white border border-yellow-600/50 bg-yellow-500 hover:text-white hover:border-yellow-800/50 rounded-custom hover:bg-yellow-700 transition-colors text-sm flex items-center disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {data.is_paid === "yes" && ('Set Unpaid')}
                {data.is_paid === "no" && ('Set Paid')}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewSalesModal;
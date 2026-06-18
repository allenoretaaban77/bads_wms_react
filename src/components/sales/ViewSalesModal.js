import React, { useState, useEffect } from 'react';
import { getSalesViewSales } from '../../api/salesService';
import { formatCurrency, tocapitalize, formatLongDate, getQuantityStatus, getPaidStatus } from '../../utils/formatters';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { generatePrintReceipt } from '../../utils/printUtils';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';

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
  
  const getRecordStatus = (status) => {
    if (status === 'inactive') return { text: 'Voided', color: 'text-red-600' };
    return { text: '', color: 'text-green-600' };
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-screen-xl w-full mx-2 flex flex-col max-h-[85vh]">

        <FormHeader headerStatus={data?.status} headerPaymentStatus={data?.payment_status} headerIsPaidStatus={data?.is_paid} headerTitle="Sales Transaction Details" onClick={handleClose} />

        <div className="p-3 flex-1 flex flex-col min-h-0 space-y-4 text-xs">
          {loading && (
            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium animate-pulse flex-shrink-0">
              Loading replenishment layout tracking data...
            </div>
          )}
          {error && (
            <div className="w-full text-center py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium flex-shrink-0">
              {error}
            </div>
          )}
          
          {data && (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              {/* Reference Meta Information Data Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Transaction No</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{data.invoice_no}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Date Sold</span>
                  <span className="font-semibold text-gray-700 text-sm">{formatLongDate(data.date_sold)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Customer Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.customer_name}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 capitalize tracking-wider text-[10px] block mb-0.5">Remarks / Note</span>
                  <span className="font-medium text-gray-600 text-xs block truncate" title={data.remarks || '-'}>
                    {data.remarks || '-'}
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner">
                  <table className="w-full text-left table-auto border-collapse">
                    <FormModalTheadDefault data={[
                      {"title":"SKU", "class":"py-2 text-left w-40"},
                      {"title":"Product Name", "class":"py-2 text-left"},
                      {"title":"Quantity", "class":"py-2 text-right w-40"},
                      {"title":"Unit Price", "class":"py-2 text-right w-40"},
                      {"title":"Total", "class":"py-2 pl-5 text-right w-40"},
                    ]} />
                    <tbody className="divide-y divide-gray-100">
                      {data.items && data.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3 py-2 font-mono text-gray-700 font-semibold align-middle">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium align-middle">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {item.qty_sold}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.price_per_unit)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-800">
                        <tr>
                          <td colSpan="4" className="px-3 py-2.5 text-right uppercase tracking-wider text-[10px] text-gray-500 align-middle">
                            Grand Total
                          </td>
                          <td className="px-3 py-2.5 text-right pr-4 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                            {formatCurrency(data.amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex-shrink-0 rounded bg-gray-50 text-right text-sm font-bold text-emerald-800 shadow-sm flex justify-end items-center gap-2 px-3 pb-3">
            <FormButton
              btnType="outline"
              btnLabel="Close"
              btnIcon="cross" 
              onClick={handleClose}
              form="create-inventory-form"
            />
            {data && data.status === "draft" && (
              <>
                <FormButton
                  btnType="ash"
                  btnLabel="Edit"
                  btnIcon="edit"
                  onClick={() => handleUpdate(data)} 
                />
                <FormButton
                  btnType="danger"
                  btnLabel="Delete"
                  btnIcon="trash"
                  onClick={() => handleDelete(data)} 
                />
                <FormButton
                  btnType="success"
                  btnLabel="Approve"
                  btnIcon="check"
                  onClick={() => handleSubmit("approved", data)} 
                  disabled={isSubmitting}
                  isProcessing={isSubmitting}
                />
              </>
            )}
            {data && (
              <FormButton
                btnType="primary"
                btnLabel="Print"
                btnIcon="print"
                onClick={() => handlePrint(data)} 
              />
            )}
            {data && data.is_paid === "yes" && (
              <FormButton
                btnType="affirm"
                btnLabel="Set Unpaid"
                btnIcon="dollar"
                onClick={() => handlePaidUnpaid(data)} 
              />
            )}
            {data && data.is_paid === "no" && (
              <FormButton
                btnType="success"
                btnLabel="Set Paid"
                btnIcon="dollar"
                onClick={() => handlePaidUnpaid(data)} 
              />
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewSalesModal;
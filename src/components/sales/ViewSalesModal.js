import React, { useState, useEffect } from 'react';
import { getSalesViewSales, setPaidUnpaid, updateSorting } from '../../api/salesService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { generatePrintReceipt } from '../../utils/printUtils';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';

function ViewSalesModal({ show, onClose, onUpdate, onDelete, onApprove, onUpdateTable, id }) {
  const userData = useAppViewModel((state) => state.userData);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // DRAG & DROP STATE
  const [draggedIndex, setDraggedIndex] = useState(null);

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

  // NATIVE DRAG AND DROP HANDLERS
  const handleDragStart = (e, index) => {
    // console.log('handleDragStart')
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    // console.log('handleDragOver')
    e.preventDefault(); 
  };

  const handleDrop = (e, targetIndex) => {
    // console.log('handleDrop')
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...data.items];
    const draggedItem = newItems[draggedIndex];

    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    // Loop through and update the order/position property for each item locally
    // const updatedItems = newItems.map((item, idx) => ({
    //   ...item,
    //   // Change 'sort_order' to whatever field name your database expects (e.g., position, queue, etc.)
    //   sort_order: idx + 1 
    // }));
    setData({ ...data, items: newItems });
    // setData({ ...data, items: updatedItems });
  };

  const handleDragEnd = () => {
    handleUpdateSorting();
    setDraggedIndex(null);
  };

  const handleUpdateSorting = async () => {
    try {
      const new_data = {
        sales_id: id,
        items: data.items.map((item, idx) => ({
          old_saved_id: item.old_saved_id,
          saved_id: idx + 1
        })
      )};
      const result = await updateSorting(new_data);

      // console.log('handleUpdateSorting items', result.data.items);
      setData(prevData => ({
        ...prevData, // Copies id: 123
        items: result.data.items
      }));
    } catch (err) {
      console.log('handleUpdateSorting Error', err);
    }
  };

  const handleUpdate = (item) => {
    console.log('handleUpdate')
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

  const handlePaidUnpaid = async (data) => {
    if (window.confirm(`Set this invoice?`)) {
      setIsSubmitting(true);

      try {
        const result = await setPaidUnpaid({
          invoice_no: data.invoice_no,
          updated_by: userData.employee_id,
          is_paid: data.is_paid === "yes" ? "no" : "yes",
        });

        if (result && result.success) {
          const result = await getSalesViewSales(id);
          if (result.success) {
            setData(result.data);
            setError(null);
            onUpdateTable();
          } else {
            setError(result.error);
          }
        } else {
          setError(result?.error || "Failed to complete processing sequence.");
        }
      } catch (err) {
        setError("An unhandled exception occurred during transaction rollback handling.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmit = async (action, data) => {
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
          setError(result.error.errors.items);
        }
      } catch (error) {
        if (error !== undefined) {
          console.error("Error saving replenishment:", error);
        }
      } finally {
        setIsSubmitting(false);
      }
    }
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
              Loading...
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Transaction No</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{data.invoice_no}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Date Sold</span>
                  <span className="font-semibold text-gray-700 text-sm">{formatLongDate(data.date_sold)}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Customer Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.customer_name}</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 capitalize tracking-wider text-[10px] block mb-0.5">Remarks / Note</span>
                  <span className="font-medium text-gray-600 text-xs block truncate" title={data.remarks || '-'}>
                    {data.remarks || '-'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Item Count</span>
                  <span className="font-bold text-gray-800 text-sm">{data.items.length}</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner scrollbar-thin">
                  <table className="w-full text-left table-auto border-collapse">
                    <FormModalTheadDefault data={[
                      {"title":"#", "class":"py-2 text-left w-10"},
                      {"title":"SKU", "class":"py-2 text-left w-28"},
                      {"title":"Product Name", "class":"py-2 text-left"},
                      {"title":"Quantity", "class":"py-2 text-right w-20"},
                      {"title":"Unit Price", "class":"py-2 text-right w-40"},
                      {"title":"Total", "class":"py-2 pl-5 text-right w-40"},
                      {"title":"Position", "class":"py-2 text-center w-24"}, 
                    ]} />
                    {/* {!loading && ( */}
                    <tbody className="divide-y divide-gray-100">
                      {data.items && data.items.map((item, index) => (
                        <tr 
                          key={index} 
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`transition-colors select-none cursor-grab active:cursor-grabbing hover:bg-gray-50/80 ${
                            draggedIndex === index ? 'opacity-40 bg-gray-100' : ''
                          }`}
                        >
                          <td className="px-3 py-2 font-mono text-gray-700 font-semibold align-middle">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-700 font-semibold align-middle">
                            {item.sku}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-medium align-middle">
                            {item.product_name}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {Number(item.qty_sold)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.price_per_unit)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-700 align-middle">
                            {formatCurrency(item.total)}
                          </td>
                          {/* Updated Action Cell with Grip/Drag Lines Icon */}
                          <td className="px-3 py-2 text-center align-middle whitespace-nowrap">
                            <div 
                              className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                              title="Drag row to reorder"
                            >
                              <svg 
                                className="w-4 h-4" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* )} */}
                    <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-800">
                      <tr>
                        <td colSpan="3" className="px-3 py-2.5 text-left uppercase tracking-wider text-[10px] text-gray-500 align-middle">
                          Grand Total
                        </td>
                        <td className="px-3 py-2.5 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                          {Number(data.total_quantity).toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right pr-4 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                        </td>
                        <td className="px-3 py-2.5 text-right pr-3 text-base font-extrabold text-gray-900 align-middle bg-gray-100/60">
                          {formatCurrency(data.amount)}
                        </td>
                        <td className="bg-gray-100/60"></td> 
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
                disabled={isSubmitting}
                isProcessing={isSubmitting}
              />
            )}
            {data && data.is_paid === "no" && (
              <FormButton
                btnType="success"
                btnLabel="Set Paid"
                btnIcon="dollar"
                onClick={() => handlePaidUnpaid(data)} 
                disabled={isSubmitting}
                isProcessing={isSubmitting}
              />
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewSalesModal;
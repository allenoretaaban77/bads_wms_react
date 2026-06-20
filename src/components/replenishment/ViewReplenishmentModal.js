import React, { useState, useEffect } from 'react';
import { getReplenishmentView } from '../../api/replenishmentService';
import { formatCurrency, formatLongDate } from '../../utils/formatters';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { FormButton, FormHeader, FormModalTheadDefault } from '../../utils/themes.js';

function ViewReplenishmentModal({ show, onClose, onUpdate, onDelete, onApprove, id }) {
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
        const result = await getReplenishmentView(id);
        if (result.success) {
          console.log('datax', result.data);
          setData(result.data);
        } else {
          setError(result.error);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [show, id]);

  const handleUpdate = (item) => {
    onUpdate(item);
  };

  const handleDelete = (item) => {
    onDelete(item.id);
  };

  const handleSubmit = async (action, data) => {
    console.log(action, data);
    if (window.confirm('Are you sure you want to APPROVE this transaction?')) {
      setIsSubmitting(true);

      try {
        const result = await onApprove({
          id: data.id,
          reference_no: data.reference_no,
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

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl max-w-screen-xl w-full mx-2 flex flex-col max-h-[85vh]">
  
        {/* Header Container */}
        <FormHeader headerStatus={data?.status}  headerTitle="Replenishment Details" onClick={handleClose} />

        {/* Content Body Container */}
        <div className="p-3 flex-1 flex flex-col min-h-0 space-y-4 text-xs">
          
          {/* Global Messaging Status Bars */}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded flex-shrink-0">
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Reference No</span>
                  <span className="font-bold text-gray-800 text-sm font-mono">{data.reference_no}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Supplier Name</span>
                  <span className="font-bold text-gray-800 text-sm">{data.supplier}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Date Received</span>
                  <span className="font-semibold text-gray-700 text-sm">{formatLongDate(data.date_received)}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] block mb-0.5">Remarks / Note</span>
                  <span className="font-medium text-gray-600 text-xs block truncate" title={data.remarks || '-'}>
                    {data.remarks || '-'}
                  </span>
                </div>
              </div>

              {/* Scrollable Items Table Box Component */}
              <div className="border border-gray-200 rounded flex-1 overflow-y-auto min-h-0 bg-white shadow-inner">
                <table className="w-full text-left table-auto border-collapse">
                  <FormModalTheadDefault data={[
                    {"title":"SKU", "class":"py-2 text-left w-40"},
                    {"title":"Product Name", "class":"py-2 text-left"},
                    {"title":"Quantity", "class":"py-2 text-right w-40"},
                    {"title":"Unit Cost", "class":"py-2 text-right w-40"},
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
                          {item.qty_added}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 align-middle">
                          {formatCurrency(item.cost_per_unit)}
                        </td>
                        <td className="px-3 py-2 text-right pr-4 font-bold text-gray-900 align-middle">
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

          {/* Dialog Action Footprint Controller Form */}
          <form onSubmit={(e) => e.preventDefault()} >
            <div className="flex-shrink-0 rounded bg-gray-50 text-right text-sm font-bold text-emerald-800 shadow-sm flex justify-end items-center gap-2">
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
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

export default ViewReplenishmentModal;
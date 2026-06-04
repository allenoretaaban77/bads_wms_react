import React, { useState, useEffect } from 'react';
import { getReplenishmentView } from '../../api/replenishmentService';
import { formatCurrency, toTitleCase, formatLongDate } from '../../utils/formatters';
import useAppViewModel from '../../viewmodels/useAppViewModel';

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
          // onClose(true);
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

  const getStatus = (current) => {
    if (current == "draft") return { text: 'Draft', color: 'text-yellow-600' };
    return { text: 'Approved', color: 'text-green-600' };
  };

  const handleClose = () => {
    setData(null);
    setError(null);
    onClose();
  }

  if (!show) return null;

  // const calculateGrandTotal = (items) => {
  //   return items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  // };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-4 max-w-screen-xl w-full mx-2 max-h-screen overflow-y-auto">
  
        {loading && <div className='w-full text-center'><span className='text-green-700'>Loading...</span></div>}

        <div className="mb-6 border-b border-gray-200 pb-4">
          {data && (
            <>
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Replenishment Details - <span className={getStatus(data.status).color}>{getStatus(data.status).text}</span>
            </h2 >
            {error && <div className='w-full text-center'><span className='text-red-500'>{error}</span></div>}
            </>
          )}
        </div>

        {data && (
          <div>
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
            <div><strong>Reference No:</strong> {data.reference_no}</div>
              <div><strong>Supplier:</strong> {data.supplier}</div>
              <div><strong>Date Received:</strong> {formatLongDate(data.date_received)}</div>
              <div><strong>Remarks:</strong> {data.remarks}</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <div className="bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-header text-white">
                    <tr className="border-0">
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">SKU</th>
                      <th className="border-r px-3 text-left cursor-pointer hover:bg-green-700 text-white">Product Name</th>
                      <th className="border-r p-2 text-right">Quantity</th>
                      <th className="border-r p-2 text-right">Cost per Unit</th>
                      <th className="border-r p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="border-r border-b border-l p-2">{item.sku}</td>
                        <td className="border-r border-b p-2">{item.product_name}</td>
                        <td className="border-r border-b p-2 text-right">{item.qty_added}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.cost_per_unit)}</td>
                        <td className="border-r border-b p-2 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold bg-gray-50">
                      <td colSpan="4" className="border-r border-b border-l p-2 text-right">Grand Total</td>
                      <td className="border-r p-2 text-right">{formatCurrency(data.amount)}</td>
                      {/* <td className="border-r p-2 text-right">{formatCurrency(calculateGrandTotal(data.items))}</td> */}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {data && (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            )}
            {data && data.status == "draft" && (
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
          </div>
        </form>

      </div>
    </div>
  );
}

export default ViewReplenishmentModal;

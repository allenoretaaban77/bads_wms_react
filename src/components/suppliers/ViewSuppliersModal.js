


import React, { useEffect, useState } from 'react';
import { getStatusTextColor } from '../../utils/statusColors.js';
import { FormButton, FormHeader } from '../../utils/themes.js';
import { viewSupplier } from '../../api/suppliersService.js';
import { formatLongDate } from '../../utils/formatters.js';

const ViewSuppliersModal = ({ selectedItem, showViewModal, setShowViewModal }) => {

  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (showViewModal && selectedItem) {
      setData({});

      const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        const result = await viewSupplier(selectedItem.id);
        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error);
        }
        setIsLoading(false);
      };

      fetchData();
    }
  }, [showViewModal, selectedItem]);

  const onClose = () => {
    setData({});
    setShowViewModal(false);
  } 

  if (!showViewModal || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-sm flex flex-col">
        
        {/* Header Section */}
        <FormHeader headerTitle="Supplier Information" onClick={() => onClose()} />

        {/* Modal Main View Data Content Area */}
        <div className="p-3 overflow-y-auto flex-1 space-y-5">
          
          {/* Global Messaging Status Bars */}
          {isLoading && (
            <div className="w-full text-center py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium animate-pulse flex-shrink-0">
              Loading...
            </div>
          )}
          {error && (
            <div className="w-full text-center py-2 bg-red-50 text-red-600 border border-red-200 rounded font-medium flex-shrink-0">
              {error}
            </div>
          )}
          
          {/* {data?.id && ( */}
            <>
              {/* Primary Identity Header Display */}
              <div className="border-b border-gray-100">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">Supplier Name</span>
                <h1 className="text-xl font-bold text-gray-800">
                  {data.name || "-"}
                </h1>
              </div>

              {/* Core Configuration & Metrics Data Grid Layout */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-5 text-xs">
                
                <div>
                  <span className="block font-semibold text-gray-500 mb-0.5">Date Created</span>
                  <p className="text-gray-900 font-bold text-sm">{formatLongDate(data.date_created) || '-'}</p>
                </div>

              </div>
            </>
          {/* )} */}

        </div>

        {/* Action Panel Footer Segment */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross" 
            onClick={() => onClose()}
          />
        </div>

      </div>
    </div>
  );
};

export default ViewSuppliersModal;

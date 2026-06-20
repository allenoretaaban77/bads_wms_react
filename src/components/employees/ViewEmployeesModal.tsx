import React from 'react';
import { getStatusTextColor } from '../../utils/statusColors.js';
import { FormButton, FormHeader } from '../../utils/themes.js';
import { ViewEmployeesModalProps } from '../../interface/employee.tsx';

const ViewEmployeesModal: React.FC<ViewEmployeesModalProps> = ({ selectedItem, showViewModal, setShowViewModal }) => {
  if (!showViewModal || !selectedItem) return null;

  // Helper to format full names nicely
  const formatFullName = (first, middle, last) => {
    return [first, middle, last].filter(Boolean).join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <FormHeader headerTitle="Employee Information" onClick={() => setShowViewModal(false)} />

        {/* Modal Main View Data Content Area */}
        <div className="p-3 overflow-y-auto flex-1 space-y-5">
          
          {/* Primary Identity Header Display */}
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">Full Name</span>
            <h1 className="text-xl font-bold text-gray-800">
              {formatFullName(selectedItem.firstname, selectedItem.middlename, selectedItem.lastname)}
            </h1>
          </div>

          {/* Core Configuration & Metrics Data Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            
            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Employee ID</span>
              <p className="text-gray-900 font-bold text-sm">{selectedItem.employee_number || '-'}</p>
            </div>

            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Account Status</span>
              <p className={`font-bold ${getStatusTextColor(selectedItem.status)}`}>
                {selectedItem.status || 'Unknown'}
              </p>
            </div>

            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Job Position</span>
              <p className="text-gray-900 font-medium">{selectedItem.position_name || '-'}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Username</span>
              <p className="text-gray-900 font-medium">{selectedItem.username || '-'}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">System Status ID</span>
              <p className="text-gray-900 font-medium">{selectedItem.status_id ?? '-'}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Position Code ID</span>
              <p className="text-gray-900 font-medium">{selectedItem.position_id ?? '-'}</p>
            </div>

          </div>

          {/* System Logs Context Sizing Wrapper */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
            <div>
              <span className="font-semibold text-gray-400">Profile Created:</span> {selectedItem.date_created || '-'}
            </div>
            <div className="md:text-right">
              <span className="font-semibold text-gray-400">Last Records Update:</span> {selectedItem.date_updated || '-'}
            </div>
          </div>

        </div>

        {/* Action Panel Footer Segment */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross" 
            onClick={() => setShowViewModal(false)}
          />
        </div>

      </div>
    </div>
  );
};

export default ViewEmployeesModal;

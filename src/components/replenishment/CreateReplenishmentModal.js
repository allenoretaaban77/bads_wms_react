import React from 'react';
import { getStatusTextColor } from '../../utils/statusColors';

const CreateReplenishmentModal = ({ selectedItem, showCreateModal, setShowCreateModal, onSave }) => {
  if (!showCreateModal || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Product Name at Top */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Replenishment Request
          </h2>
        </div>
        
        {/* Item Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-500">Remarks</span>
            <p className="font-medium">{selectedItem.remarks}</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateReplenishmentModal;

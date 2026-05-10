import React from 'react';

const ViewInventoryModal = ({ selectedItem, showViewModal, setShowViewModal }) => {
  if (!showViewModal || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Product Name at Top */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {selectedItem.product_name}x
          </h2>
        </div>
        
        {/* Item Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-500">SKU</span>
            <p className="font-medium">{selectedItem.sku}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status</span>
            <p className="font-medium">{selectedItem.status}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Current Quantity</span>
            <p className="font-medium">{selectedItem.current_qty}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Reorder Level</span>
            <p className="font-medium">{selectedItem.reorder_level}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Cost per Unit</span>
            <p className="font-medium">${Number(selectedItem.cost_per_unit).toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Price per Unit</span>
            <p className="font-medium">${Number(selectedItem.price_per_unit).toFixed(2)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Initial Quantity</span>
            <p className="font-medium">{selectedItem.initial_qty}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Date Created</span>
            <p className="font-medium">{selectedItem.date_created}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Date Updated</span>
            <p className="font-medium">{selectedItem.date_updated}</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowViewModal(false)}
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

export default ViewInventoryModal;

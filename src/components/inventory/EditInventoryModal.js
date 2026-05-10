import React, { useState } from 'react';

const EditInventoryModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const [formData, setFormData] = useState({
    product_name: selectedItem?.product_name || '',
    sku: selectedItem?.sku || '',
    cost_per_unit: selectedItem?.cost_per_unit || '',
    price_per_unit: selectedItem?.price_per_unit || '',
    current_qty: selectedItem?.current_qty || '',
    reorder_level: selectedItem?.reorder_level || '',
    status: selectedItem?.status || 'Available'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert numeric fields to numbers
    const submitData = {
      ...formData,
      cost_per_unit: Number(formData.cost_per_unit),
      price_per_unit: Number(formData.price_per_unit),
      current_qty: Number(formData.current_qty),
      reorder_level: Number(formData.reorder_level)
    };
    
    onSave(selectedItem.id, submitData);
    setShowEditModal(false);
  };

  const handleCancel = () => {
    setShowEditModal(false);
  };

  if (!showEditModal || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-custom p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Product Name at Top */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {selectedItem.product_name}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Name - Full Width */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit</label>
              <input
                type="number"
                name="cost_per_unit"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
              <input
                type="number"
                name="price_per_unit"
                step="0.01"
                value={formData.price_per_unit}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <input
                type="number"
                name="current_qty"
                value={formData.current_qty}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </form>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-custom hover:bg-gray-50 transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-custom hover:bg-blue-600 transition-colors text-sm flex items-center mr-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInventoryModal;

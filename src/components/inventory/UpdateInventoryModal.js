import React, { useState, useEffect } from 'react';
import useAppViewModel from '../../viewmodels/useAppViewModel';
import { APP_CONFIG } from '../../config/constants';

// Add CSS for loading circle animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

const UpdateInventoryModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    id: '',
    product_name: '',
    sku: '',
    cost_per_unit: '',
    price_per_unit: '',
    initial_qty: '',
    current_qty: '',
    reorder_level: '',
    type: '',
    rack: '',
    shelf: '',
    box: '',
    status: 'In Stock',
    remarks: '',
    updated_by: userData.employee_id
  });


  // Populate form with selected item data when modal opens
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        id: selectedItem.id || '',
        product_name: selectedItem.product_name || '',
        sku: selectedItem.sku || '',
        cost_per_unit: selectedItem.cost_per_unit,
        price_per_unit: selectedItem.price_per_unit,
        initial_qty: selectedItem.initial_qty,
        current_qty: selectedItem.current_qty,
        reorder_level: selectedItem.reorder_level,
        type: selectedItem.type || '',
        rack: selectedItem.rack || '',
        shelf: selectedItem.shelf || '',
        box: selectedItem.box || '',
        status: selectedItem.status || 'In Stock',
        remarks: selectedItem.remarks || '',
        updated_by: userData.employee_id
      });
    }
  }, [selectedItem, showEditModal]);

  const validateForm = (result) => {
    const newErrors = {};

    setErrors(newErrors);
    if (result && !result.success) {
      setErrors(result.error.errors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Convert numeric fields to numbers
    // const submitData = {
    //   id: formData.id,
    //   product_name: formData.product_name,
    //   sku: formData.sku,
    //   cost_per_unit: Number(formData.cost_per_unit),
    //   price_per_unit: Number(formData.price_per_unit),
    //   initial_qty: Number(formData.initial_qty),
    //   current_qty: Number(formData.current_qty),
    //   reorder_level: Number(formData.reorder_level),
    //   type: formData.type,
    //   rack: formData.rack,
    //   shelf: formData.shelf,
    //   box: formData.box,
    //   status: formData.status,
    //   remarks: formData.remarks,
    //   updated_by: formData.updated_by
    // };
    
    try {
      const result = await onSave(formData);
      
      if (result.success) {
        // Reset form and loading state
        setFormData({
          product_name: '',
          sku: '',
          cost_per_unit: '',
          price_per_unit: '',
          initial_qty: 0,
          current_qty: '',
          reorder_level: '',
          type: '',
          rack: '',
          shelf: '',
          box: '',
          status: 'In Stock',
          remarks: '',
          updated_by: ''
        });
        
        // Clear errors
        setErrors({});
      } else {
        validateForm(result);
      }
      // Reset loading state
      setIsLoading(false);
    } catch (error) {
      // Reset loading state
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setErrors({});

    setShowEditModal(false);
    // Reset form
    setFormData({
      product_name: '',
      sku: '',
      cost_per_unit: '',
      price_per_unit: '',
      initial_qty: 0,
      current_qty: '',
      reorder_level: '',
      type: '',
      rack: '',
      shelf: '',
      box: '',
      status: 'In Stock',
      remarks: '',
      updated_by: ''
    });
  };

  if (!showEditModal) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-custom p-4 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
          {/* Product Name at Top */}
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Update Inventory Item
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Name - Full Width */}
            <div className="grid grid-cols-2 gap-4">
              <div className="product_name col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.product_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.product_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.product_name}</p>
                )}
              </div>
              <div className="sku">
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Enter SKU"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.sku ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.sku && (
                  <p className="mt-1 text-xs text-red-600">{errors.sku}</p>
                )}
              </div>
              <div className="cost_per_unit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit *</label>
                <input
                  type="number"
                  name="cost_per_unit"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.cost_per_unit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.cost_per_unit && (
                  <p className="mt-1 text-xs text-red-600">{errors.cost_per_unit}</p>
                )}
              </div>
              <div className="type">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.type ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Type</option>
                  {Object.entries(APP_CONFIG.INVENTORY_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                )}
              </div>
              <div className="price_per_unit">
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit *</label>
                <input
                  type="number"
                  name="price_per_unit"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.price_per_unit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.price_per_unit && (
                  <p className="mt-1 text-xs text-red-600">{errors.price_per_unit}</p>
                )}
              </div>
              <div className="rack">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
                <select
                  name="rack"
                  value={formData.rack}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="">Select Rack</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Rack {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div className="initial_qty">
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
                <input
                  type="number"
                  name="initial_qty"
                  value={formData.initial_qty}
                  onChange={handleChange}
                  placeholder="0"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.initial_qty ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.initial_qty && (
                  <p className="mt-1 text-xs text-red-600">{errors.initial_qty}</p>
                )}
              </div> */}
              <div className="current_qty">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
                <input
                  type="number"
                  name="current_qty"
                  value={formData.current_qty}
                  onChange={handleChange}
                  placeholder="0"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.current_qty ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.current_qty && (
                  <p className="mt-1 text-xs text-red-600">{errors.current_qty}</p>
                )}
              </div>
              <div className="shelf">
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf</label>
                <select
                  name="shelf"
                  value={formData.shelf}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="">Select Shelf</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Shelf {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="reorder_level">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level *</label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  placeholder="0"
                  className={`w-full px-2 py-1.5 text-sm border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.reorder_level ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.reorder_level && (
                  <p className="mt-1 text-xs text-red-600">{errors.reorder_level}</p>
                )}
              </div>
              <div className="box">
                <label className="block text-sm font-medium text-gray-700 mb-1">Box</label>
                <select
                  name="box"
                  value={formData.box}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                >
                  <option value="">Select Box</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Box {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="remarks col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Enter any additional notes..."
                  rows="3"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                />
              </div>
            </div>
          </form>
          <div className="mt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 border border-gray-300 hover:text-white hover:border-gray-500/50 rounded-custom hover:bg-gray-900/50 transition-colors text-sm flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-3 py-1.5 bg-button text-white rounded-custom hover:bg-button-hover transition-colors text-sm flex items-center disabled:opacity-50"
            >
              {isLoading ? (
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
                  Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  
    </>
  );
}

export default UpdateInventoryModal;

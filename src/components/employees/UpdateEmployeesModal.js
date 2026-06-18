import React, { useState, useEffect } from 'react';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { APP_CONFIG } from '../../config/constants';
import { FormButton, FormHeader } from '../../utils/themes.js';

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

const UpdateEmployeesModal = ({ selectedItem, showEditModal, setShowEditModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    id: '',
    product_name: '',
    sku: '',
    cost_per_unit: '',
    price_per_unit: '',
    reorder_level: '',
    type: '',
    rack: '',
    shelf: '',
    box: '',
    status: 'In Stock',
    remarks: '',
    updated_by: userData?.employee_id || '',
    tracking_method: ''
  });

  // Populate form with selected item data when modal opens
  useEffect(() => {
    if (selectedItem && showEditModal) {
      setFormData({
        id: selectedItem.id || '',
        product_name: selectedItem.product_name || '',
        sku: selectedItem.sku || '',
        cost_per_unit: selectedItem.cost_per_unit ?? '',
        price_per_unit: selectedItem.price_per_unit ?? '',
        reorder_level: selectedItem.reorder_level ?? '',
        type: selectedItem.type || '',
        rack: selectedItem.rack || '',
        shelf: selectedItem.shelf || '',
        box: selectedItem.box || '',
        status: selectedItem.status || 'In Stock',
        remarks: selectedItem.remarks || '',
        updated_by: userData?.employee_id || '',
        tracking_method: selectedItem.tracking_method || ''
      });
    }
  }, [selectedItem, showEditModal, userData?.employee_id]);

  const validateForm = (result) => {
    const newErrors = {};
    setErrors(newErrors);
    
    if (result && !result.success) {
      setErrors(result.error.errors || {});
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await onSave(formData);
      
      if (result.success) {
        setErrors({});
        setShowEditModal(false);
      } else {
        validateForm(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    setShowEditModal(false);
  };

  if (!showEditModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Section - Matches top brand system definitions */}
        <FormHeader headerTitle="Modify Inventory Item" onClick={handleCancel} />
        
        {/* Modal Form Context Area */}
        <div className="p-4 overflow-y-auto flex-1">
          <form id="update-inventory-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Product Name - Full Width */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Product Name *</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="Enter item descriptive title"
                className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.product_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.product_name && (
                <p className="text-xs text-red-600 mt-0.5">{errors.product_name}</p>
              )}
            </div>
            
            {/* Split Sizing Fields Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">SKU Code</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Enter Stock Identifier"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.sku ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.sku && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.sku}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Category *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs border bg-white rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
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
                  <p className="text-xs text-red-600 mt-0.5">{errors.type}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Cost per Unit *</label>
                <input
                  type="number"
                  name="cost_per_unit"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.cost_per_unit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.cost_per_unit && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.cost_per_unit}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Price per Unit *</label>
                <input
                  type="number"
                  name="price_per_unit"
                  step="0.01"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.price_per_unit ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.price_per_unit && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.price_per_unit}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Reorder Threshold *</label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  placeholder="0"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.reorder_level ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.reorder_level && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.reorder_level}</p>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Tracking Pipeline Method *</label>
                <select
                  name="tracking_method"
                  value={formData.tracking_method}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs border bg-white rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.tracking_method ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Tracking Method</option>
                  {Object.entries(APP_CONFIG.TRACKING_METHOD).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {errors.tracking_method && (
                  <p className="text-xs text-red-600 mt-0.5">{errors.tracking_method}</p>
                )}
              </div>

            </div>

            {/* Structured gray warehouse cell card container */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 grid grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-600">Rack Space</label>
                <select
                  name="rack"
                  value={formData.rack}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-button"
                >
                  <option value="">Select</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Rack {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-600">Shelf Tier</label>
                <select
                  name="shelf"
                  value={formData.shelf}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-button"
                >
                  <option value="">Select</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Shelf {i + 1}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-600">Box Container</label>
                <select
                  name="box"
                  value={formData.box}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-button"
                >
                  <option value="">Select</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Box {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Remarks Entry Line */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Remarks / Inventory Notes</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Log tracking modification updates..."
                rows="2"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

          </form>
        </div>

        {/* Action Panel Footer Segment */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end space-x-2 rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Cancel"
            btnIcon="cross" 
            onClick={handleCancel}
          />
          <FormButton
            btnType="success"
            btnLabel="Update"
            btnIcon="check" 
            isProcessing={isLoading}
            type="submit"
            disabled={isLoading}
            form="update-inventory-form"
          />
        </div>

      </div>
    </div>
  );
};

export default UpdateEmployeesModal;
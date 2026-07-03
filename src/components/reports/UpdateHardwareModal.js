


import React, { useEffect, useState } from 'react';
import { FormButton, FormHeader } from '../../utils/themes.js';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';

const UpdateHardwareModal = ({ selectedItem, showHardwareModal, setShowHardwareModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    created_by: userData?.employee_id || '',
  });

  useEffect(() => {
    console.log(selectedItem);
    if (selectedItem && showHardwareModal) {
      setFormData({
        id: selectedItem.id || '',
        name: selectedItem.name || '',
        remarks: selectedItem.remarks || '',
        updated_by: userData?.employee_id || '',
        tracking_method: selectedItem.tracking_method || ''
      });
    }
  }, [selectedItem, showHardwareModal, userData?.employee_id]);

  const handleCancel = () => {
    setErrors({});
    setShowHardwareModal(false);
    setFormData({
      name: '',
      created_by: userData?.employee_id || '',
    });
    setIsLoading(false);
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

  const validateForm = (result) => {
    const newErrors = {};
    setErrors(newErrors);
    
    if (result && !result.success) {
      setErrors(result.error.errors || {});
    } 
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await onSave(formData);
      console.log(result);
      
      if (result.success) {
        const refData = {
          name: '',
          created_by: userData?.employee_id || '',
        };
        setFormData(refData);

        setErrors({});
        setShowHardwareModal(false);
      } else {
        validateForm(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showHardwareModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-sm flex flex-col">
        
        {/* Header Section */}
        <FormHeader headerTitle="Modify Hardware Details" onClick={() => handleCancel()} />

        <div className="p-4 overflow-y-auto flex-1">
          <form id="update-supplier-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Product Name - Full Width with standardized subtle text-xs sizing */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Amount *</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                  errors.amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.amount && (
                <p className="text-xs text-red-600 mt-0.5">{errors.amount}</p>
              )}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Details *</label>
              <textarea
                required
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Enter details here..."
                rows="4"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

          </form>
        </div>

        <div className="px-4 pb-3 bg-gray-50 flex justify-end space-x-2 rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross" 
            onClick={() => handleCancel()}
          />
          <FormButton
            btnType="success"
            btnLabel="Update"
            btnIcon="check" 
            isProcessing={isLoading}
            type="submit"
            // disabled={isLoading}
            form="update-supplier-form"
          />
        </div>

      </div>
    </div>
  );
};

export default UpdateHardwareModal;

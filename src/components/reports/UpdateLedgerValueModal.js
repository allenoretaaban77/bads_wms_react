import React, { useEffect, useState } from 'react';
import { FormButton, FormHeader } from '../../utils/themes.js';

const UpdateLedgerValueModal = ({ selectedItem, showLedgerValueModal, setShowLedgerValueModal, onUpdate }) => {
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    details: '',
  });

  useEffect(() => {
    if (selectedItem && showLedgerValueModal) {
      let value = 0;
      let details = "";
      switch(selectedItem?.ledgerValueToUpdate) {
        case "hardware": value = selectedItem.hardware; details = selectedItem.hardware_details; break;
        case "bahay": value = selectedItem.bahay; details = selectedItem.bahay_details; break;
      }

      setFormData({
        id: selectedItem.id || '',
        amount: value || '',
        details: details || '',
        save_type: selectedItem?.ledgerValueToUpdate
      });
    }
  }, [selectedItem, showLedgerValueModal]);

  const handleCancel = () => {
    setErrors({});
    setShowLedgerValueModal(false);
    setFormData({
      amount: '',
      details: '',
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
      let updateData = {};
      // switch(formData?.save_type) {
      //   case "hardware": 
      //     updateData = {
      //       id: formData.id || '',
      //       hardware: formData.amount || '',
      //       hardware_details: formData.details || '',
      //       save_type: formData.save_type
      //     }; 
      //     break;
      //   case "bahay":  
      //     updateData = {
      //       id: formData.id || '',
      //       bahay: formData.amount || '',
      //       bahay_details: formData.details || '',
      //       save_type: formData.save_type
      //     }; 
      //     break;
      // }

      const result = await onUpdate(formData);
      console.log('UpdateLedgerValueModal handleSubmit result', result);
      
      if (result.success) {
        const refData = {
          amount: '',
          details: '',
        };
        setFormData(refData);

        setErrors({});
        setShowLedgerValueModal(false);
      } else {
        validateForm(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showLedgerValueModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-sm flex flex-col">
        
        {/* Header Section */}
        <FormHeader headerTitle={`Modify ${formData.save_type} Details`} onClick={() => handleCancel()} />

        <div className="p-4 overflow-y-auto flex-1">
          <form id="update-ledger-values-form" onSubmit={handleSubmit} className="space-y-4">
            
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
                className={`text-right w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
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
                rows="7"
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
            disabled={isLoading}
            form="update-ledger-values-form"
          />
        </div>

      </div>
    </div>
  );
};

export default UpdateLedgerValueModal;

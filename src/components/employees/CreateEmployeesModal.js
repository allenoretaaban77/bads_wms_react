import React, { useState, useEffect } from 'react';
import useAppViewModel from '../../viewmodels/useAppViewModel.tsx';
import { APP_CONFIG } from '../../config/constants';
import { FormButton, FormHeader } from '../../utils/themes.js';
import { generateEmployeeNumber } from '../../api/employeeService.js';

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

const CreateEmployeesModal = ({ showCreateModal, setShowCreateModal, onSave }) => {
  const userData = useAppViewModel((state) => state.userData);
  const [isLoading, setIsLoading] = useState(false);
  
  // Exactly matching your Postman keys
  const getInitialFormState = () => ({
    firstname: '',
    lastname: '',
    middlename: '',
    username: '',
    password: '',
    status: 'Active',
    status_id: '1', // Passed as string/value to match standard form data
    position_name: '',
    position_id: '',
  });

  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showCreateModal) {
      fetchEmployeeNumber();
    }
  }, [showCreateModal]);

  const fetchEmployeeNumber = async () => {
    try {
      setErrors({});
      const employeeNumber = await generateEmployeeNumber();
      setFormData(prev => ({
        ...prev,
        employee_number: employeeNumber,
      }));
    } catch (error) {
      console.error("Error fetching transaction number:", error);
    }
  };

  const validateForm = (result) => {
    const newErrors = {};
    setErrors(newErrors);
    
    if (result && !result.success) {
      setErrors(result.errors || {});
    } 
    
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-sync position_name when position_id changes to match your exact Postman blueprint
    if (name === 'position_id') {
      const selectedText = e.target.options[e.target.selectedIndex].text;
      setFormData(prev => ({
        ...prev,
        position_id: value,
        position_name: value ? selectedText : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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
      // Note: Ensure your `onSave` utility formats data as URL-encoded if needed, 
      // though a standard flat object works perfectly with modern fetch/axios libraries.
      const result = await onSave(formData);
      
      if (result.success) {
        setFormData(getInitialFormState());
        setErrors({});
        setShowCreateModal(false);
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
    setShowCreateModal(false);
    setFormData(getInitialFormState());
  };

  if (!showCreateModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <FormHeader headerTitle="Register New Employee" onClick={handleCancel} />
        
        {/* Modal Form Scrollable Context Area */}
        <div className="p-4 overflow-y-auto flex-1">
          <form id="create-employee-form" onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Employe Number *</label>
                <input
                  type="text"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={handleChange}
                  placeholder="e.g. Michael"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.employee_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                  readOnly={1}
                />
                {errors.firstname && <p className="text-xs text-red-600 mt-0.5">{errors.firstname}</p>}
              </div>
            </div>
            
            {/* Row 1: Name Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="e.g. Michael"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.firstname ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.firstname && <p className="text-xs text-red-600 mt-0.5">{errors.firstname}</p>}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Middle Name *</label>
                <input
                  type="text"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleChange}
                  placeholder="e.g. Mac Lee"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.middlename ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.middlename && <p className="text-xs text-red-600 mt-0.5">{errors.middlename}</p>}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="e.g. Faraday"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.lastname ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.lastname && <p className="text-xs text-red-600 mt-0.5">{errors.lastname}</p>}
              </div>
            </div>
            
            {/* Row 2: Account Login Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. employee"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.username ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.username && <p className="text-xs text-red-600 mt-0.5">{errors.username}</p>}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="e.g. employee123"
                  className={`w-full px-3 py-1.5 text-xs border rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.password && <p className="text-xs text-red-600 mt-0.5">{errors.password}</p>}
              </div>
            </div>

            {/* Row 3: Roles Assignments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-700">Position Role *</label>
                <select
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-xs border bg-white rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent ${
                    errors.position_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Position Role</option>
                  {Object.entries(APP_CONFIG.EMPLOYEE_POSITIONS).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                {errors.position_id && <p className="text-xs text-red-600 mt-0.5">{errors.position_id}</p>}
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-gray-600">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-button"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Action Tray Footer */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end space-x-2 rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Cancel"
            btnIcon="cross" 
            onClick={handleCancel}
          />
          <FormButton
            btnType="success"
            btnLabel="Register"
            btnIcon="check" 
            isProcessing={isLoading}
            type="submit"
            disabled={isLoading}
            form="create-employee-form"
          />
        </div>

      </div>
    </div>
  );
};

export default CreateEmployeesModal;
import { useState, useCallback } from 'react';
import { usePageControl } from './pagination';
import { deleteSupplier } from '../api/suppliersService';
import useAppViewModel from '../viewmodels/useAppViewModel';
import { useAlertStore } from './alert';

export const useHandlerSupplier = () => {
  const pagination = usePageControl();
  const userData = useAppViewModel((state) => state.userData);
  const alertStore = useAlertStore();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to DELETE this supplier?')) {
      try {
        const result = await deleteSupplier(id, userData.employee_id);
        if (result.success) {
          alertStore.setAlert({
            show: true,
            message: 'Supplier record successfully deleted.',
            type: 'success'
          });
          
          setTimeout(() => {
            alertStore.setAlert({ show: false, message: '', type: '' });
          }, 3000);
          
          handleRefresh();
        } else {
          alertStore.setAlert({
            show: true,
            message: 'Failed to delete supplier record.',
            type: 'error'
          });
        }
      } catch (err) {
        alertStore.setAlert({
          show: true,
          message: 'Failed to delete supplier record.',
          type: 'error'
        });
      }
    }
  };

  const handleRefresh = () => {
    alertStore.setRefreshSupplier(prev => prev + 1)
  }

  return {
    selectedItem, setSelectedItem,
    showViewModal, setShowViewModal,
    showCreateModal, setShowCreateModal,
    showEditModal, setShowEditModal,
    handleRefresh,
    handleDelete,
  };
}
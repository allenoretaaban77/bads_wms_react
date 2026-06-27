import { useState, useCallback } from 'react';
import { usePagination } from './pagination';
import { deleteSupplier } from '../api/suppliersService';
import useAppViewModel from '../viewmodels/useAppViewModel';
import { useAlertStore } from './alert';

export const useHandlers = () => {
  const pagination = usePagination();
  const userData = useAppViewModel((state) => state.userData);
  const alertStore = useAlertStore();

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to DELETE this supplier?')) {
      try {
        const result = await deleteSupplier(id, userData.employee_id);
        if (result.success) {
          alertStore.setAlert({
            show: true,
            message: type + ' record successfully deleted.',
            type: 'success'
          });
          
          setTimeout(() => {
            alertStore.setAlert({ show: false, message: '', type: '' });
          }, 3000);
          
          handleRefreshSupplier();
        } else {
          alertStore.setAlert({
            show: true,
            message: 'Failed to delete ' + type + ' record.',
            type: 'error'
          });
        }
      } catch (err) {
        alertStore.setAlert({
          show: true,
          message: 'Failed to delete ' + type + ' record.',
          type: 'error'
        });
      }
    }
  };

  const handleRefreshSupplier = () => {
    alertStore.setRefreshSupplier(prev => prev + 1)
  }

  return {
    handleRefreshSupplier,
    handleDelete,
  };
}
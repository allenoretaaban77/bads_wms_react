import { useState, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants';

export const useTableControl = () => {
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return {
    sortField, setSortField,
    sortOrder, setSortOrder,
    loading, setLoading,
    error, setError
  };
}
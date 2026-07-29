import { useState } from 'react';

export const useTableControl = () => {
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  return {
    sortField, setSortField,
    sortOrder, setSortOrder,
    // loading, setLoading,
    error, setError,
    handleSort
  };
}
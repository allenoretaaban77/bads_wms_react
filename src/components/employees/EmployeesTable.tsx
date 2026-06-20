import React, { useState, useEffect } from 'react';
import { getStatusColor } from '../../utils/statusColors';
import { getEmployeeList, createEmployee, updateEmployee, deleteEmployee } from '../../api/employeeService';
import { APP_CONFIG } from '../../config/constants';
import ViewEmployeesModal from './ViewEmployeesModal';
import UpdateEmployeesModal from './UpdateEmployeesModal';
import CreateEmployeesModal from './CreateEmployeesModal';
import Alert from '../../utils/alert';
import { FormButton, FormPagination, FormThead } from '../../utils/themes.js';

// Define the shape of an Employee object based on your table layout
export interface Employee {
  id: string | number;
  employee_number: string;
  firstname: string;
  lastname: string;
  middlename?: string;
  username: string;
  position_name?: string;
  status?: string;
}

interface EmployeesTableProps {
  page_type: string;
}

interface AlertState {
  show: boolean;
  message: string;
  type: string;
}

interface FetchParams {
  type: string;
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  status: string;
  position_id: string;
}

function EmployeesTable({ page_type }: EmployeesTableProps) {

  // Cleaned state names specifically for Employee entities with strong types
  const [employeeData, setEmployeeData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(APP_CONFIG.DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<Employee | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  // Alert state
  const [alert, setAlert] = useState<AlertState>({ show: false, message: '', type: '' });

  const handleRefresh = (): void => {
    setRefreshKey(prev => prev + 1);
  };

  // Fetch employees data matching your DB structure
  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params: FetchParams = {
          type: page_type,
          page: currentPage,
          pageSize: pageSize,
          search: searchTerm,
          sort: sortField,
          order: sortOrder,
          status: statusFilter !== 'all' ? statusFilter : '',
          position_id: positionFilter !== 'all' ? positionFilter : ''
        };

        const result = await getEmployeeList(params);
        
        if (result.success && result.data) {
          const data = result.data.data || result.data; 
          const total = result.data.total || data.length;
          const totalPagesCount = result.data.totalPages || Math.ceil(total / pageSize);
          
          setEmployeeData(data);
          setTotalItems(total);
          setTotalPages(totalPagesCount);
        } else {
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load employee data');
          setEmployeeData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err: any) {
        console.error('Error fetching employees:', err);
        setError(`Failed to load employee data: ${err.message}`);
        setEmployeeData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeData();
  }, [page_type, currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, positionFilter, refreshKey]);

  const handleView = (item: Employee): void => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEdit = (item: Employee): void => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string | number): Promise<void> => {
    if (window.confirm('Are you sure you want to DELETE this employee?')) {
      try {
        const result = await deleteEmployee(id);
        if (result.success) {
          triggerAlert('Employee successfully deleted', 'success');
          setRefreshKey(prev => prev + 1);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to delete employee');
      }
    }
  };

  const handleCreateItem = async (itemData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await createEmployee(itemData);
      if (result.success) {
        setShowCreateModal(false);
        triggerAlert('Employee created successfully!', 'success');
        setCurrentPage(1); 
        setRefreshKey(prev => prev + 1);
      }
      return result;
    } catch (err) {
      setError('Failed to create employee');
      return { success: false, error: 'Failed to create employee' };
    }
  };

  const handleEditItem = async (itemData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateEmployee(itemData);
      if (result.success) {
        setShowEditModal(false);
        triggerAlert('Employee updated successfully!', 'success');
        setRefreshKey(prev => prev + 1); 
      }
      return result;
    } catch (err) {
      setError('Failed to update employee');
      return { success: false, error: 'Failed to update employee' };
    }
  };

  const triggerAlert = (message: string, type: string): void => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSort = (field: string): void => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  const handlePageChange = (page: number): void => setCurrentPage(page);

  const handlePageSizeChange = (newPageSize: number): void => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  return (
    <div></div>
  );
}

export default EmployeesTable;
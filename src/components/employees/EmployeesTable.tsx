import { useState, useEffect } from 'react';
import { getStatusColor } from '../../utils/statusColors';
import { getEmployeeList, createEmployee, updateEmployee, deleteEmployee } from '../../api/employeeService';
import { APP_CONFIG } from '../../config/constants';
import ViewEmployeesModal from './ViewEmployeesModal.tsx';
import UpdateEmployeesModal from './UpdateEmployeesModal.tsx';
import CreateEmployeesModal from './CreateEmployeesModal.tsx';
import Alert from '../../utils/alert';
import { FormButton, FormPagination, FormThead } from '../../utils/themes.js';
import { EmployeesTableProps, Employee, AlertState, FetchParams, initialFormState } from '../../interface/employee.tsx';

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
  
  // Modal states
  const [selectedItem, setSelectedItem] = useState<Employee>(initialFormState);
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
  }, [page_type, currentPage, pageSize, searchTerm, sortField, sortOrder, statusFilter, refreshKey]);

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
    <div className="flex flex-col h-screen">
      <Alert 
        show={alert.show}
        message={alert.message}
        type={alert.type}
        onDismiss={() => setAlert({ show: false, message: '', type: '' })}
      />
      
      <div className="flex-shrink-0 space-y-0">
      
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-gray-800">Employees Management</h3>
            <div className="flex space-x-2 pb-2">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={handleRefresh} 
                className="mt-3"
              />
              <FormButton
                btnType="success"
                btnLabel="Create"
                btnIcon="plus"
                onClick={() => setShowCreateModal(true)} 
                className="mt-3"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
            {/* Search Input mapping to names/username */}
            <div className="lg:col-span-4 text-xs">
              <label className="block font-semibold text-gray-600 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name, employee number, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>

            <div className="text-xs">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {employeeData.length} of {totalItems} items
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 overflow-auto mt-2">
        <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-hidden">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-button"></div>
              <span className="ml-2 text-gray-600">Loading employee data...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded">
              <strong>Error:</strong> {error}ö
            </div>
          )}
          
          {!loading && !error && (
            <div className="bg-white border border-gray-200 rounded-custom shadow-sm overflow-hidden">
              <table className="w-full">
                <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={[
                  {"title":"Emp ID", "name":"employee_number", "align":"left"},
                  {"title":"Full Name", "name":"lastname", "align":"left"},
                  {"title":"Username", "name":"username", "align":"left"},
                  {"title":"Position", "name":"position_name", "align":"left"},
                  {"title":"Status", "name":"status", "align":"center"},
                  {"title":"Actions", "name":"actions", "default":1},
                ]} />
                <tbody>
                  {employeeData.map((item, index) => {
                    const fullName = `${item.lastname}, ${item.firstname} ${item.middlename || ''}`.trim();
                    return (
                      <tr 
                        key={item.id}
                        className={`border-0 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                        }`}
                      >
                        <td className="px-3 py-2 border-r text-sm font-semibold text-gray-900">{item.employee_number}</td>
                        <td className="px-3 py-2 border-r text-sm font-medium text-green-900">{fullName}</td>
                        <td className="px-3 py-2 border-r text-sm">{item.username}</td>
                        <td className="px-3 py-2 border-r text-sm">{item.position_name || 'N/A'}</td>
                        <td className="px-3 py-2 border-r text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status || '')}`}>
                            {item.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-0">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleView(item)}
                              className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                              title="View"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {employeeData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No record/s found.
            </div>
          )}
          
          <FormPagination 
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            handlePageSizeChange={handlePageSizeChange}
            handlePageChange={handlePageChange}
          />
        </div>

        {/* Modal Components */}
        <ViewEmployeesModal 
          selectedItem={selectedItem}
          showViewModal={showViewModal}
          setShowViewModal={setShowViewModal}
        />
        
        <CreateEmployeesModal 
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          onSave={handleCreateItem}
        />
        
        <UpdateEmployeesModal 
          selectedItem={selectedItem}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          onSave={handleEditItem}
        />
        
      </div>
    </div>
  );
}

export default EmployeesTable;
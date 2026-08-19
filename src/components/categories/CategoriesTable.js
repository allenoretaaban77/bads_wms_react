import React, { useState, useEffect } from 'react';
import { formatLongDate } from '../../utils/formatters';
import Alert from '../../utils/alert';
import { FormButton, FormThead } from '../../utils/themes.js';
import { getCategoriesList, createCategory, updateCategory } from '../../api/categoriesService.js';
import { FormPagination, usePageControl } from '../../utils/pagination.js';
import { useTableControl } from '../../utils/table.js';
import { useAlertStore } from '../../utils/alert';
import ViewCategoriesModal from './ViewCategoriesModal.js';
import CreateCategoriesModal from './CreateCategoriesModal.js';
import UpdateCategoriesModal from './UpdateCategoriesModal.js';
import { useHandlerCategories } from '../../utils/handlers.js';

function CategoriesTable() {
  const alertStore = useAlertStore();
  const { currentPage, setCurrentPage, pageSize, totalItems, setTotalItems, totalPages, setTotalPages, handlePageSizeChange, handlePageChange } = usePageControl();
  const { sortField, sortOrder, error, setError, handleSort } = useTableControl();
  const { selectedItem, setSelectedItem, showViewModal, setShowViewModal, showCreateModal, setShowCreateModal, showEditModal, setShowEditModal, loading, setLoading, handleRefresh, handleDelete } = useHandlerCategories();
  
  // Filter states
  const [filteredData, setFilteredData] = useState([]);
  const [recordStatusFilter] = useState('all'); 
  const [isPaidFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!sortOrder) setLoading(true);
        setError(null);
        
        const params = {
          page: currentPage,
          pageSize: pageSize,
          search: searchTerm,
          sort: 'name',
          order: 'ASC',
          record_status: recordStatusFilter !== 'all' ? recordStatusFilter : '',
          is_paid: isPaidFilter !== 'all' ? isPaidFilter : '',
        };

        const result = await getCategoriesList(params);
        
        if (result.success && result.data) {
          const data = result.data.data || result.data; 
          const total = result.data.total !== undefined ? result.data.total : data.length;
          const totalPages = result.data.totalPages || Math.ceil(total / pageSize);
          
          setFilteredData(data);
          setTotalItems(total);
          setTotalPages(totalPages);
        } else {
          console.warn('API returned error:', result.error);
          setError(result.error || 'Failed to load category data');
          setFilteredData([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(`Failed to load category data: ${err.message}`);
        setFilteredData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setLoading(false);

      }
    };

    fetchCategories();
  }, [currentPage, pageSize, searchTerm, sortField, sortOrder, recordStatusFilter, isPaidFilter, alertStore.refreshCategories]);

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleCreateCategory = async (itemData) => {
    try {
      const result = await createCategory(itemData);
      if (result.success) {
        // Close modal immediately
        setShowCreateModal(false);
        
        // Show success alert
        alertStore.setAlert({
          show: true,
          message: 'Category record created successfully!',
          type: 'success'
        });
        
        setTimeout(() => {
          alertStore.setAlert({ show: false, message: '', type: '' });
        }, 3000);
        
        setCurrentPage(1);
        alertStore.setRefreshCategories(prev => prev + 1);
      } 
      
      return result;
    } catch (err) {
      setError('Failed to create category record.');
      // Return error result
      return {
        success: false,
        error: 'Failed to create category record.'
      };
    }
  };

  const handleUpdateCategory = async (itemData) => {
    try {
      const result = await updateCategory(itemData);
      console.log(result.success);
      if (result.success) {
        setShowEditModal(false);
        
        alertStore.setAlert({
          show: true,
          message: 'Category record updated successfully!',
          type: 'success'
        });

        setTimeout(() => {
          alertStore.setAlert({ show: false, message: '', type: '' });
        }, 3000);

        setCurrentPage(1);
        alertStore.setRefreshCategories(prev => prev + 1); // Trigger data refresh
      } 
      
      return result;
    } catch (err) {
      setError('Failed to update category record error.');

      return {
        success: false,
        error: 'Failed to update category record.'
      };
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  }

  return (
    <div className="flex flex-col h-screen">

      <div className="flex-shrink-0 space-y-0 mb-2">
        
        <div className="bg-white pl-3 pr-3 pb-2 rounded-custom border border-gray-200">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2">
            
            <div className="lg:col-span-10 text-xs">
              <label className="block font-semibold text-gray-600 mb-0.5">Search</label>
              <input
                type="text"
                placeholder="Search category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
              />
            </div>
            
            <div className="text-xs lg:col-span-1 mt-1.5">
              <FormButton
                btnType="affirm"
                btnLabel="Refresh"
                btnIcon="refresh"
                onClick={() => handleRefresh()} 
                className="mt-3 w-full"
              />
            </div>

            <div className="text-xs lg:col-span-1 mt-1.5">
              <FormButton
                btnType="success"
                btnLabel="Create"
                btnIcon="plus"
                onClick={() => setShowCreateModal(true)} 
                className="mt-3 w-full"
              />
            </div>
          </div>
            
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              Showing {filteredData.length} of {totalItems} items
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-2 mb-1.5 rounded text-center">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-custom shadow-xs overflow-auto flex flex-col h-[calc(100vh-13.5rem)]">
        
        <table className="w-full text-sm border-collapse">
          <FormThead sortOrder={sortOrder} sortField={sortField} handleSort={handleSort} data={
            [
              {"title":"#", "name":"idx", "align":"center", "class": "w-20"},
              {"title":"ID", "name":"id", "align":"center", "class": "w-20"},
              {"title":"Category Name", "name":"name", "align":"left"},
              {"title":"Category Tag", "name":"tag", "align":"left"},
              {"title":"Remarks / Notes", "name":"remarks", "align":"left"},
              {"title":"Date Created", "name":"date_created", "align":"left", "class": "w-40"},
              {"title":"Action", "name":"action", "default":1},
            ]
          } />

          <tbody>
            {filteredData.map((item, index) => {
              const sequentialRowNumber = ((currentPage - 1) * pageSize) + index + 1;
              
              return (
                <tr 
                  key={item.id || index}
                  className={`border-0 transition-colors duration-200 ${
                    index % 2 === 0 ? 'bg-white hover:bg-green-50' : 'bg-row-alt hover:bg-green-100'
                  }`}
                >
                  <td className="px-3 py-2 border-r text-sm font-semibold text-green-900 text-center">
                    {sequentialRowNumber}
                  </td>
                  <td className="px-3 py-2 border-r text-sm text-center">{item.id}</td>
                  <td className="px-3 py-2 border-r text-sm">{item.name}</td>
                  <td className="px-3 py-2 border-r text-sm">{item.tag}</td>
                  <td className="px-3 py-2 border-r text-sm">{item.remarks}</td>
                  <td className="px-3 py-2 border-r text-sm">{formatLongDate(item.date_created)}</td>
                  <td className="px-0 py-2 border-0">
                    {item.remarks !== 'System Generated' && (
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => handleView(item)}
                        className="text-blue-600 hover:text-blue-800 px-0 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-green-600 hover:text-green-800 px-0 py-1 rounded hover:bg-green-50 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 px-0 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No record/s found.
          </div>
        )}
      </div>
      
      <FormPagination 
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        totalPages={totalPages}
        handlePageSizeChange={handlePageSizeChange}
        handlePageChange={handlePageChange}
        loading={loading}
      />
        
      <ViewCategoriesModal 
        selectedItem={selectedItem}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
      />
      
      <CreateCategoriesModal 
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        onSave={handleCreateCategory}
      />
      
      <UpdateCategoriesModal 
        selectedItem={selectedItem}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        onSave={handleUpdateCategory}
      />

      <Alert 
        show={alertStore.alert.show}
        message={alertStore.alert.message}
        type={alertStore.alert.type}
        onDismiss={() => alertStore.setAlert({ show: false, message: '', type: '' })}
      />
      
    </div>
  );
}

export default CategoriesTable;
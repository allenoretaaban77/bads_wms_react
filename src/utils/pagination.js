import { useState, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants';
import { create } from 'zustand';

export const usePageControl = (defaultSize) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize || APP_CONFIG.DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to page 1 safely
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);  

  return {
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    totalItems, setTotalItems,
    totalPages, setTotalPages,
    handlePageSizeChange,
    handlePageChange
  };
}

export const FormPagination = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  handlePageSizeChange,
  handlePageChange,
  loading
}) => {

  if (loading) return (
    <div className="text-orange-700 px-2 pt-2 text-left">
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-900"></div>
        <span className="ml-3 pt-1">Loading data...</span>
      </div>
    </div>
  )

  return (

    <div className="px-2 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-700">
            Showing {totalItems === 0 ? 0 : ((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Custom Stylized Select Dropdown to match your green theme buttons */}
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="appearance-none bg-white px-3 pr-8 py-1 border border-gray-300 rounded-custom text-xs font-medium focus:outline-none focus:ring-2 focus:ring-button focus:border-button text-gray-700 cursor-pointer transition-colors hover:border-gray-400 bg-no-repeat bg-[right_0.5rem_center] bg-[length:1em_1em]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234B5563' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`
            }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || totalItems === 0}
            className="px-3 py-1 border border-gray-300 rounded-custom text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const safeTotalPages = totalPages || 1;
              let pageNum;
              
              if (safeTotalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= safeTotalPages - 2) {
                pageNum = safeTotalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded-custom text-xs transition-colors ${
                    currentPage === pageNum
                      ? 'bg-button text-white border-button font-medium'
                      : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages <= 1}
            className="px-3 py-1 border border-gray-300 rounded-custom text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export const usePaginationStore = create((set,get) => ({
  sortField: 'id', 
  sortOrder: 'desc',
  currentPage: 1,
  pageSize: APP_CONFIG.DEFAULT_PAGE_SIZE || 20,
  totalItems: 0,
  totalPages: 0,
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }), // Reset to page 1 on size change
  setTotalItems: (total) => set({ totalItems: total }),
  setTotalPages: (pages) => set({ totalPages: pages }),
  handlePageChange: (page) => {
    get().setCurrentPage(page);
  },
  handlePageSizeChange: (newPageSize) => {
    get().setPageSize(newPageSize);
    get().setCurrentPage(1);
  }
}));
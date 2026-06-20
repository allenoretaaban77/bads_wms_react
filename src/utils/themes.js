import React, { useEffect } from 'react';
import { getStatusColor, getPaymentStatus, getPaidStatus } from './formatters';

// 1. Define distinct styles and icons for each title type
const BUTTON_CONFIGS = {
  edit: {
    // Your original gray styling
    colorClasses: 'bg-gray-900/50 hover:bg-gray-900 border-gray-400',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  affirm: {
    colorClasses: 'text-white bg-yellow-500 border-yellow-500 hover:bg-yellow-700 hover:border-yellow-700',
  },
  ash: {
    colorClasses: 'text-white bg-gray-500 border-gray-500 hover:bg-gray-800 hover:border-gray-800',
  },
  success: {
    colorClasses: 'text-white bg-green-600 border-green-600 hover:bg-green-800 hover:border-green-800',
  },
  outline: {
    colorClasses: 'text-gray-700 border-gray-400 hover:text-white hover:bg-gray-400 hover:border-gray-400',
  },
  danger: {
    colorClasses: 'text-white bg-red-600 border-red-600 hover:bg-red-800 hover:border-red-800',
  },
  plain: {
    colorClasses: 'text-white border-none focus:outline-none',
  },
  primary: {
    colorClasses: 'text-white bg-blue-600 border-blue-600 hover:bg-blue-800 hover:border-blue-800',
  },
};

const ICONS = {
  refresh: (
    <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  plus: (
    <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  check: (
    <svg className="h-3.5 w-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
  ),
  loading: (
    <svg className="animate-spin h-3.5 w-3.5 mr-1 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
  cross: (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  cross_large: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  draft: (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5l-2-2zM7 3v4h10V3M12 12v4m0 0h4m-4 0H8" />
    </svg>
  ),
  edit: (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  print: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-10 0h10v4H6v-4z"
      />
    </svg>
  ),
  dollar: (
    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export const FormButton = ({ 
  btnType = '',
  btnLabel = '', 
  btnIcon = '',
  isProcessing = false,
  className = '', 
  type = 'button',
  ...props 
}) => {
  const config = BUTTON_CONFIGS[btnType.toLowerCase()] || BUTTON_CONFIGS.edit;
  const icon_config = ICONS[btnIcon.toLowerCase()] || ICONS.edit;
  const baseLayoutClasses = 'px-3 py-1.5 rounded-custom transition-colors flex items-center disabled:opacity-50 duration-200 border text-xs';
  
  return (
    <button
      className={`${className} ${baseLayoutClasses} ${config.colorClasses}`}
      {...props}
    >
      {isProcessing && (<>{ICONS['loading']}Processing...</>)} 
      {!isProcessing && (<>{icon_config}{btnLabel}</>)} 
    </button>
  );
};

export const FormHeader = ({ 
  headerTitle = '', 
  headerStatus = '',
  headerPaymentStatus = '',
  headerIsPaidStatus = '',
  ...props 
}) => {
  return (
    <div className="px-4 py-2 bg-header text-white flex justify-between items-center rounded-t-custom">
      <h2 className="text-base font-semibold gap-2 flex capitalize">{headerTitle}
        {headerStatus && (
          <>
            <span className="text-gray-400 font-normal capitalize">|</span>
            <span className={getStatusColor(headerStatus)}>{headerStatus || ''}</span>
          </>
        )}
        {headerPaymentStatus && (
          <>
            <span className="text-gray-400 font-normalcapitalize">|</span>
            <span className={getPaymentStatus(headerPaymentStatus).color}>{headerPaymentStatus || ''}</span>
          </>
        )}
        {headerIsPaidStatus && (
          <>
            <span className="text-gray-400 font-normalcapitalize">|</span>
            <span className={getPaidStatus(headerIsPaidStatus).color}>{getPaidStatus(headerIsPaidStatus || '').text}</span>
          </>
        )}
      </h2>
      <button className="text-white hover:text-gray-200 focus:outline-none" {...props}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export const FormPagination = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  handlePageSizeChange,
  handlePageChange,
}) => {
  return (
    <div className="px-2 py-2 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-custom text-sm focus:outline-none focus:ring-2 focus:ring-button text-xs"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded-custom text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-xs"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 border rounded-custom text-xs ${
                    currentPage === pageNum
                      ? 'bg-button text-white border-button'
                      : 'border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded-custom text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export const FormTh = ({
  columnTitle,
}) => {
  return (
    <th className="border-0 px-3 py-2 text-center text-white font-semibold border-0 text-xs">{columnTitle}</th>
  )
};

export const FormThSort = ({
  columnTitle,
  columnName,
  sortField,
  sortOrder,
  handleSort
}) => {
  return (
    <th 
      onClick={() => handleSort(columnName)}
      className="border-r px-3 py-2 text-left text-white text-xs font-semibold border-0 cursor-pointer hover:bg-green-700"
    >
      <div className="flex items-center">
        {columnTitle}
        {sortField === columnName && (
          <span className="ml-1">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  )
};

export const FormThead = ({
  data = {},
  sortField,
  sortOrder,
  handleSort
}) => {
  return (
    <thead className="bg-header text-white">
      <tr>
          {data.map((item, index) => {
            if (item.default === 1) {
              return (
                <th key={index} className="border-0 px-3 py-2 text-center text-white font-semibold border-0 text-xs w-40">{item.title}</th>
              )
            } else {
              return (
                <th 
                  key={index} 
                  onClick={() => handleSort(item.name)}
                  className={`border-r px-3 py-2 text-white text-xs font-semibold border-0 cursor-pointer hover:bg-green-700 text-` + item.align}
                >
                  <div>
                    {item.title}
                    {sortField === item.name && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              );
            }
          })}
      </tr>
    </thead>
  );
};

export const FormModalThead = ({
  data = [],
}) => {
  return (
    <thead className="bg-header text-white sticky top-0 z-10 font-semibold">
      <tr>
          <th className="py-2 pl-2 w-10 text-center bg-header"></th>
          {data.map((item, index) => {
            return (
              <th key={index} className={`px-3 bg-header ` + item.class}>{item.title}</th>
            )
          })}
      </tr>
    </thead>
  );
};

export const FormModalTheadDefault = ({
  data = [],
}) => {
  return (
    <thead className="bg-header text-white sticky top-0 z-10 font-semibold">
      <tr>
          {data.map((item, index) => {
            return (
              <th key={index} className={`px-3 bg-header ` + item.class}>{item.title}</th>
            )
          })}
      </tr>
    </thead>
  );
};

export const FormThemes = {
  modalOuterDiv: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
  modalInnerDiv: "bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col"
};

export const FormModalMaxOld = (WrappedComponent) => {
  const EnhancedComponent = ({showCreateModal, ...props}) => {

    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col">
          <FormHeader headerTitle="Create Replenishment" {...props} />
          <WrappedComponent {...props} />
        </div>
      </div>
    );
  };

  return EnhancedComponent;
};

export const FormModalMax = (WrappedComponent) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col">
        <>
          {WrappedComponent}
        </>
      </div>
    </div>
  );
}

export const ModalWrapper = ({ isOpen, onClose, children }) => {
  
  // 1. Listen for the 'Escape' key to close the modal automatically
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // 2. Prevent the underlying background page from scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // If the modal toggle is false, render absolutely nothing
  if (!isOpen) return null;

  return (
    /* Outer Layer: Backdrop dim overlay */
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose} // Clicking the dark background fires the close action
    >
      {/* Inner Layer: The actual modal white box card frame */}
      <div 
        className="bg-white rounded-custom border border-gray-200 shadow-xl w-full h-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // CRITICAL: Stops clicks inside the modal from closing it
      >
        {children}
      </div>
    </div>
  );
};
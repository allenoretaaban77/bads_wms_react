import React, { useState } from 'react';
import { create } from 'zustand';

export const useAlert = () => {
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  return {
    alert, setAlert
  };
}

export const useAlertStore = create((set,get) => ({
  alert: { show: false, message: '', type: '' }, 
  setAlert: (data) => set({ alert: data }),
  refreshSupplier: 0,
  setRefreshSupplier: (updater) => set((state) => ({
    refreshSupplier: typeof updater === 'function' ? updater(state.refreshSupplier) : updater
  })),
  refreshDailySalesReport: 0,
  setRefreshDailySalesReport: (updater) => set((state) => ({
    refreshDailySalesReport: typeof updater === 'function' ? updater(state.refreshDailySalesReport) : updater
  })),
}));

const Alert = ({ show, message, type, onDismiss }) => {
  if (!show) return null;

  const alertStyles = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400'
  };

  return (
    <div className={`fixed top-1 mt-1 right-2 z-50 p-4 rounded-md shadow-lg max-w-lg w-full ${alertStyles[type]}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 01-1.414 1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-white first-letter:uppercase">
            {message}
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={onDismiss}
            className="-mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-500 rounded-md p-1.5 inline-flex h-8 w-8 transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 20 15">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;

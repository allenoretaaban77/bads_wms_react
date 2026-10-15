import React, { useState, useEffect } from 'react';
import { FormButton, FormHeader } from '../../utils/themes.js';

const GenerateSandLedgerModal = ({ show, onClose, onGenerate, selectedItem }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [runningGravel, setRunningGravel] = useState('');
  const [runningSand, setRunningSand] = useState('');
  const [runningSandB, setRunningSandB] = useState('');
  const [runningSandH, setRunningSandH] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedItem && show) {
      const [rawMonth, rawYear] = selectedItem.date_value.split(", ");
      setSelectedMonth(rawMonth);
      setSelectedYear(rawYear);
      setRunningGravel(selectedItem.i_1898);
      setRunningSand(selectedItem.i_1897);
      setRunningSandB(selectedItem.i_1906);
      setRunningSandH(selectedItem.i_1907);
    }
  }, [selectedItem, show]);


  if (!show) return null;

  // Generate Year options from 2020 to Current Year
  const startYear = 2020;
  const years = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleCancel = () => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear.toString());
    setRunningGravel('');
    setRunningSand('');
    setRunningSandB('');
    setRunningSandH('');
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      if (onGenerate) {
        await onGenerate(selectedMonth, selectedYear, runningGravel, runningSand, runningSandB, runningSandH);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRunningGravel('');
      setRunningSand('');
      setRunningSandB('');
      setRunningSandH('');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-sm flex flex-col">
        
        {/* Header Section */}
        <FormHeader headerTitle="Generate Sand Ledger" onClick={handleCancel} />

        <div className="p-4 overflow-y-auto flex-1">
          <form id="generate-monthly-ledger-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Select Month */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Select Month *</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Year */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Select Year *</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              >
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Initial Gravel *</label>
              <input
                type="number"
                name="runningGravel"
                value={runningGravel}
                onChange={(e) => setRunningGravel(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Initial Sand *</label>
              <input
                type="number"
                name="runningSand"
                value={runningSand}
                onChange={(e) => setRunningSand(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Initial Sand Bistay*</label>
              <input
                type="number"
                name="runningSandB"
                value={runningSandB}
                onChange={(e) => setRunningSandB(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-gray-700">Initial Sand Hindi Bistay *</label>
              <input
                type="number"
                name="runningSandH"
                value={runningSandH}
                onChange={(e) => setRunningSandH(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-button focus:border-transparent"
                required
              />
            </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end space-x-2 rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross"
            onClick={handleCancel}
          />
          <FormButton
            btnType="success"
            btnLabel="Generate"
            btnIcon="check"
            isProcessing={isLoading}
            type="submit"
            disabled={isLoading}
            form="generate-monthly-ledger-form"
          />
        </div>

      </div>
    </div>
  );
};

export default GenerateSandLedgerModal;
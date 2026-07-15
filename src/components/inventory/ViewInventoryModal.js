import React from 'react';
import { getStatusTextColor } from '../../utils/statusColors';
import { FormButton, FormHeader } from '../../utils/themes.js';

const ViewInventoryModal = ({ selectedItem, showViewModal, setShowViewModal }) => {
  if (!showViewModal || !selectedItem) return null;

  // Safe fallback utility for numeric presentation values
  const formatCurrency = (value) => {
    const num = Number(value);
    return isNaN(num) ? '₱ 0.00' : `₱ ${num.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-custom shadow-xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header Section - Matches styling with application system headers */}
        <FormHeader headerTitle="Inventory Item Information" onClick={() => setShowViewModal(false)} />

        {/* Modal Main View Data Content Area */}
        <div className="p-3 overflow-y-auto flex-1 space-y-5">
          
          {/* Primary Item Identity Header Display */}
          <div className="border-b border-gray-100 pb-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">Product Name</span>
            <h1 className="text-xl font-bold text-gray-800">{selectedItem.product_name}</h1>
          </div>

          {/* Core Configuration & Metrics Data Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            
            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">SKU Code</span>
              <p className="text-gray-900 font-medium break-all">{selectedItem.sku}</p>
            </div>

            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Availability Status</span>
              <p className={`font-bold ${getStatusTextColor(selectedItem.status)}`}>
                {selectedItem.status || 'Unknown'}
              </p>
            </div>

            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Category</span>
              <p className="text-gray-900 font-medium">{selectedItem.type || '-'}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Current Stock Qty</span>
              <p className="text-gray-900 font-bold text-sm">{Number(selectedItem.current_qty) ?? 0}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Reorder Threshold</span>
              <p className="text-gray-900 font-medium">{selectedItem.reorder_level ?? 0}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Tracking Method</span>
              <p className="text-gray-900 font-medium">{selectedItem.tracking_method || '-'}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Cost per Unit</span>
              <p className="text-gray-900 font-medium">{formatCurrency(selectedItem.cost_per_unit)}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Total Inventory Cost</span>
              <p className="text-gray-700 font-medium">{formatCurrency(selectedItem.total_inventory_cost)}</p>
            </div>

            <div className="hidden md:block border-t border-gray-100 pt-2"></div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Price per Unit</span>
              <p className="text-gray-900 font-medium">{formatCurrency(selectedItem.price_per_unit)}</p>
            </div>

            <div className="border-t border-gray-100 pt-2">
              <span className="block font-semibold text-gray-500 mb-0.5">Total Retail Asset Value</span>
              <p className="text-gray-700 font-medium">{formatCurrency(selectedItem.total_inventory_value)}</p>
            </div>

            <div className="hidden md:block border-t border-gray-100 pt-2"></div>
          </div>

          {/* Structured location tracking segment element card container */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Rack Space</span>
              <p className="text-gray-900 font-medium">
                {selectedItem.rack && selectedItem.rack.toString().trim() !== "" ? `Rack ${selectedItem.rack}` : "-"}
              </p>
            </div>
            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Shelf Tier</span>
              <p className="text-gray-900 font-medium">
                {selectedItem.shelf && selectedItem.shelf.toString().trim() !== "" ? `Shelf ${selectedItem.shelf}` : "-"}
              </p>
            </div>
            <div>
              <span className="block font-semibold text-gray-500 mb-0.5">Box Container</span>
              <p className="text-gray-900 font-medium">
                {selectedItem.box && selectedItem.box.toString().trim() !== "" ? `Box ${selectedItem.box}` : "-"}
              </p>
            </div>
          </div>

          {/* Item Logs Context Sizing Wrapper */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
            <div>
              <span className="font-semibold text-gray-400">System Log Ingestion:</span> {selectedItem.date_created || '-'}
            </div>
            <div className="md:text-right">
              <span className="font-semibold text-gray-400">Last Database Mutation:</span> {selectedItem.date_updated || '-'}
            </div>
          </div>

          {/* Remarks Entry Line display content block */}
          {selectedItem.remarks && selectedItem.remarks.trim() !== "" && (
            <div className="border-t border-gray-100 pt-3">
              <span className="block text-xs font-semibold text-gray-500 mb-0.5">Internal Remarks / Notes</span>
              <div className="bg-amber-50/50 border border-amber-200/60 text-xs text-gray-700 p-3 rounded-custom whitespace-pre-wrap leading-relaxed">
                {selectedItem.remarks}
              </div>
            </div>
          )}

        </div>

        {/* Action Panel Footer Segment */}
        <div className="px-4 pb-3 bg-gray-50 flex justify-end rounded-b-custom">
          <FormButton
            btnType="outline"
            btnLabel="Close"
            btnIcon="cross" 
            onClick={() => setShowViewModal(false)}
          />
        </div>

      </div>
    </div>
  );
};

export default ViewInventoryModal;
import { create } from 'zustand';

// 1. Define the interfaces for your structured objects
export interface Batch {
  batch_id: number;
  cost: number;
  current_quantity: number;
  target_quantity: number;
}

export interface SaleItem {
  id: number;
  batch_id: number;
  inventory_id: number;
  item_name: string;
  current_qty: number;
  reorder_level: number;
  quantity: string | number;
  sku: string;
  current_price: string;
  price: string;
  cost: string;
  total: number;
  batches: Batch[];
}

// 2. Define the exact shape of your Zustand Store State and Actions
interface SalesStore {
  items: SaleItem[];
  nextItemId: number;
  itemSearchTerm: string;
  itemSuggestions: any[]; // Replace 'any' with your actual product suggestion type if you have one
  showSuggestions: boolean;
  activeInventoryId: number | null;
  tempBatches: Batch[];
  
  setItemSearchTerm: (term: string) => void;
  setItemSuggestions: (suggestions: any[]) => void;
  setShowSuggestions: (show: boolean) => void;
  setIsSearching: (show: boolean) => void;
  handleSelectSuggestion: (
    suggestion: any, 
    setLocalErrors: React.Dispatch<React.SetStateAction<any>>
  ) => void;
  resetSale: () => void;
}

// 3. Pass the <SalesStore> interface to create()
export const useSalesStore = create<SalesStore>((set, get) => ({
  items: [],
  nextItemId: 1,
  itemSearchTerm: '',
  itemSuggestions: [],
  showSuggestions: false,
  activeInventoryId: null,
  tempBatches: [],

  setItemSearchTerm: (term) => set({ itemSearchTerm: term }),
  setItemSuggestions: (suggestions) => set({ itemSuggestions: suggestions }),
  setShowSuggestions: (show) => set({ showSuggestions: show }),
  setIsSearching: (show) => set({ showSuggestions: show }),

  handleSelectSuggestion: (suggestion, setLocalErrors) => {
    // TypeScript now knows exactly what types 'items' and 'nextItemId' are!
    const { items, nextItemId } = get();

    const name = suggestion.product_name || ''; 
    const priceValue = suggestion.selling_price || suggestion.price || 0;
    const costValue = suggestion.cost_per_unit || suggestion.cost || 0;

    const exists = items.some(item => 
      item.inventory_id === suggestion.inventory_id && 
      Number(item.cost) === Number(suggestion.cost_per_unit)
    );

    if (exists) {
      setLocalErrors((prev: any) => ({
        ...prev,
        items: `Item with inventory id ${suggestion.product_name} and cost ${suggestion.cost_per_unit} already selected.`
      }));
      return; 
    }

    setLocalErrors((prev: any) => ({ ...prev, items: '' }));

    const newItem: SaleItem = {
      id: nextItemId,
      batch_id: suggestion.batch_id,
      inventory_id: suggestion.inventory_id,
      item_name: name,
      current_qty: suggestion.current_qty,
      reorder_level: suggestion.reorder_level,
      quantity: '',
      sku: suggestion.sku,
      current_price: priceValue !== undefined ? priceValue.toString() : '',
      price: priceValue !== undefined ? priceValue.toString() : '',
      cost: costValue !== undefined ? costValue.toString() : '',
      total: 0,
      batches: suggestion.batches || []
    };

    set({
      items: [...items, newItem],
      nextItemId: nextItemId + 1,
      itemSearchTerm: '',
      itemSuggestions: [],
      showSuggestions: false
    });
  },

  

  resetSale: () => set({ items: [], nextItemId: 1, itemSearchTerm: '', itemSuggestions: [], showSuggestions: false })
}));
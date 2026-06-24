import { getAccessToken } from '../api/tokenService';

export const API_BASE_URL = 'http://his.local';

export const getApiHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token is available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const getApiHeadersPost = () => {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Add authorization header if token is available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Application Configuration
export const APP_CONFIG = {
  // API Settings
  API_BASE_URL: API_BASE_URL,
  
  // Pagination Defaults
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Token Settings
  TOKEN_KEY: 'access_token',
  TOKEN_EXPIRY_KEY: 'token_expiry',
  
  // App Settings
  APP_NAME: 'BAD Inventory Management System',
  VERSION: '1.0.0',
  
  // UI Settings
  DEBOUNCE_DELAY: 300, // for search inputs
  TOAST_DURATION: 3000, // for notifications
  
  // Inventory Settings
  INVENTORY_STATUSES: {
    // AVAILABLE: 'Available',
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock'
  },
  
  RECORD_STATUSES: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived'
  },

  INVENTORY_TYPES: {
    NUTS_AND_BOLTS: 'nuts and bolts',
    CEMENTS: 'cements',
    ELECTRICALS: 'electricals',
    FAST_MOVING_MATERIALS: 'fast moving materials',
    PAINTS: 'paints',
    ROOFINGS: 'roofings',
    SANITARY_AND_WATERLINES: 'sanitary and waterlines', 
    STEEL_MATERIAL: 'steel materials',
    UNCATEGORIZED: 'uncategorized',
  },

  INVENTORY_MENU: {
    ALL: 'all',
    NUTS_AND_BOLTS: 'nuts and bolts',
    CEMENTS: 'cements',
    ELECTRICALS: 'electricals',
    FAST_MOVING_MATERIALS: 'fast moving materials',
    PAINTS: 'paints',
    ROOFINGS: 'roofings',
    SANITARY_AND_WATERLINES: 'sanitary and waterlines', 
    STEEL_MATERIAL: 'steel materials',
    UNCATEGORIZED: 'uncategorized',
  },

  PAYMENT_STATUS: {
    CASH: 'cash',
    CREDIT: 'credit',
    // DRAFT: 'draft',
  },

  TRACKING_METHOD: {
    BATCH: 'batch_monitored',
    STANDARD: 'standard',
  },

  EMPLOYEE_POSITIONS: {
    ADMIN: 1,
    EMPLOYEE: 2
  }
};

export default APP_CONFIG;


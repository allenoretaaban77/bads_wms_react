import { getAccessToken } from './apiService';
import { API_BASE_URL } from '../config/constants';

// Centralized headers function
const getApiHeaders = () => {
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

const getApiHeadersPost = () => {
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

// Inventory service using native fetch API
export const getInventoryList = async (params = {}) => {
  try {
    // Validate and build query parameters
    const queryParams = new URLSearchParams();
    
    // Add parameters if they exist and are not empty
    if (params.page !== undefined && params.page !== null) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize !== undefined && params.pageSize !== null) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.search && params.search.trim()) {
      queryParams.append('search', params.search.trim());
    }
    if (params.sort && params.sort.trim()) {
      queryParams.append('sort', params.sort.trim());
    }
    if (params.order && params.order.trim()) {
      queryParams.append('order', params.order.trim());
    }
    if (params.rack && params.rack.trim()) {
      queryParams.append('rack', params.rack.trim());
    }
    if (params.shelf && params.shelf.trim()) {
      queryParams.append('shelf', params.shelf.trim());
    }
    if (params.box && params.box.trim()) {
      queryParams.append('box', params.box.trim());
    }
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.record_status && params.record_status.trim() && params.record_status !== 'all') {
      queryParams.append('record_status', params.record_status.trim());
    }

    // Prepare headers with authorization
    const headers = getApiHeaders();

    // Make API call using fetch
    const response = await fetch(`${API_BASE_URL}/api/inventory/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    // Handle response
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to fetch inventory data';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    // Parse successful response
    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check if the server is running on localhost:8080.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while fetching inventory data',
      };
    }
  }
};

export const createInventoryItem = async (itemData) => {
  try {
    // Create URL-encoded form data like login system
    const formData = new URLSearchParams();
    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/api/inventory/create`, {
      method: 'POST',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create inventory item';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check if the server is running on localhost:8080.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while creating inventory item',
      };
    }
  }
};

export const updateInventoryItem = async (itemData) => {
  try {
    // Create URL-encoded form data like login system
    const formData = new URLSearchParams();
    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/api/inventory/update`, {
      method: 'PUT',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update inventory item';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check if the server is running on localhost:8080.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while updating inventory item',
      };
    }
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    const formData = new URLSearchParams();
    formData.append('id', id);

    const response = await fetch(`${API_BASE_URL}/api/inventory/delete`, {
      method: 'DELETE',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete inventory item';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      
      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check if the server is running on localhost:8080.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while deleting inventory item',
      };
    }
  }
};

export default {
  getInventoryList,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
};

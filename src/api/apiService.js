import { API_BASE_URL } from '../config/constants';

// Get access token from viewmodel (this is a simplified approach)
// In a real app, you might want to use a more sophisticated token management
let currentToken = '';

export const setAccessToken = (token) => {
  currentToken = token;
};

export const getAccessToken = () => {
  return currentToken;
};

// Generic API call function with authorization
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token is available
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      // Handle unauthorized access (token expired)
      if (response.status === 401) {
        // Clear token and redirect to login
        currentToken = '';
        window.location.href = '/login';
        return;
      }

      // Try to get error message from response
      let errorMessage = 'API call failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // Parse successful response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Specific API methods for common operations
export const getItems = async () => {
  return apiCall('/api/items', {
    method: 'GET',
  });
};

export const createItem = async (itemData) => {
  return apiCall('/api/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
};

export const updateItem = async (id, itemData) => {
  return apiCall(`/api/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(itemData),
  });
};

export const deleteItem = async (id) => {
  return apiCall(`/api/items/${id}`, {
    method: 'DELETE',
  });
};

export default {
  apiCall,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  setAccessToken,
  getAccessToken,
};

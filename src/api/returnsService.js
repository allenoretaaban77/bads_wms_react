import { API_BASE_URL, getApiHeaders, getApiHeadersPost } from '../config/constants';

export const getReturnsList = async (params = {}) => {
  try {

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
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/api/returns/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch returns data';
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
        error: 'Network error. Please check if the server is running.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while fetching returns data',
      };
    }
  }
};

export const createReturnsTransaction = async (params = {}) => {
  return false;
};

export const updateReturnsTransaction = async (params = {}) => {
  return false;
};

export const approveReturnsTransaction = async (params = {}) => {
  return false;
};

export const voidRetursnTransaction = async (params = {}) => {
  return false;
};

export const deleteReturnsTransaction = async (params = {}) => {
  return false;
};
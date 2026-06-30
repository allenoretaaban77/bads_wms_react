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

    const response = await fetch(`${API_BASE_URL}/returns/list?${queryParams.toString()}`, {
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

export const getReturnsView = async (id) => {
  try {
    const headers = getApiHeaders();
    const response = await fetch(`${API_BASE_URL}/returns/view?id=${id}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch returns details';
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
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while fetching returns details',
    };
  }
};

export const createReturnsTransaction = async (itemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/returns/create`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create returns transaction.';
      try {
        const errorData = await response.json();
        errorMessage = errorData;
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
        error: 'An unexpected error occurred while creating returns transaction.',
      };
    }
  }
};

export const updateReturnsTransaction = async (params = {}) => {
  return false;
};

export const approveReturnsTransaction = async (itemData) => {
  try {
    const formData = new URLSearchParams();
    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/returns/approve`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update returns transaction.';
      try {
        const errorData = await response.json();
        errorMessage = errorData;
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
        error: 'An unexpected error occurred while approving returns transaction.',
      };
    }
  }
};

export const voidRetursnTransaction = async (params = {}) => {
  return false;
};

export const deleteReturnsTransaction = async (params = {}) => {
  return false;
};

export const getInvoiceItems = async (id) => {
  try {
    const headers = getApiHeaders();
    const response = await fetch(`${API_BASE_URL}/returns/getinvoiceitems?id=${id}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch invoice details';
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
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred while fetching invoice details',
    };
  }
};

export const generateTransactionNumber = async () => {
  try {

    const response = await fetch(`${API_BASE_URL}/returns/generatetrnxno`, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to generate transaction number');
    }

    const data = await response.json();

    return data.trnxno;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
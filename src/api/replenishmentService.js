import { API_BASE_URL, getApiHeaders, getApiHeadersPost } from '../config/constants';

export const getReplenishmentList = async (params = {}) => {
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

    const response = await fetch(`${API_BASE_URL}/api/replenishment/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch replenishment data';
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
        error: 'An unexpected error occurred while fetching replenishment data',
      };
    }
  }
};

export const getReplenishmentView = async (id) => {
  try {
    const headers = getApiHeaders();
    const response = await fetch(`${API_BASE_URL}/api/replenishment/view?id=${id}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch replenishment details';
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
      error: 'An unexpected error occurred while fetching replenishment details',
    };
  }
};

export const createRelenishmentTransaction = async (itemData) => {
  try {

    const response = await fetch(`${API_BASE_URL}/api/replenishment/create`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(itemData),
    });


    if (!response.ok) {

      let errorMessage = 'Failed to create replenishment transaction.';
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
        error: 'An unexpected error occurred while creating replenishment transaction.',
      };
    }
  }
};

export const updateRelenishmentTransaction = async (itemData) => {
  try {
    const formData = new URLSearchParams();
    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/api/replenishment/update`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update replenishment transaction.';
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
        error: 'An unexpected error occurred while creating replenishment transaction.',
      };
    }
  }
};

export const deleteRelenishmentTransaction = async (id) => {
  try {
    const formData = new URLSearchParams();
    formData.append('id', id);

    const response = await fetch(`${API_BASE_URL}/api/replenishment/delete`, {
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
        error: 'Network error. Please check if the server is running.',
      };
    } else {
      return {
        success: false,
        error: 'An unexpected error occurred while deleting replenishment transaction.',
      };
    }
  }
};

export const generateTransactionNumber = async () => {
  try {

    const response = await fetch(`${API_BASE_URL}/replenishment/generatetrnxno`, {
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

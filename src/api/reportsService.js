import { API_BASE_URL, getApiHeaders, getApiHeadersPost } from '../config/constants';

export const getDailyReports = async (params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }
    if (params.pageType && params.pageType.trim() && params.is_paid !== 'all') {
      queryParams.append('pageType', params.pageType.trim());
    }
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/reports/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const getDailyReportItems = async (item, params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }

    const formData = new URLSearchParams();
    formData.append('date', item.date);
    formData.append('page_type', item.pageType.trim());

    const response = await fetch(`${API_BASE_URL}/reports/listitems?${queryParams.toString()}`, {
      method: 'POST',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const updateReport = async (date) => {
  try {
    const formData = new URLSearchParams();
    formData.append('date', date);

    const response = await fetch(`${API_BASE_URL}/reports/updatereport`, {
      method: 'POST',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update report.';
      try {
        const errorData = await response.json();
        errorMessage = errorData; // errorMessage || errorData.message || errorData.error;
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
        error: 'An unexpected error occurred while updating report.',
      };
    }
  }
};

export const getDailyStockIns = async (params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/reports/getdailystockins?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const getDailyStockInItems = async (date, params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }

    const formData = new URLSearchParams();
    formData.append('date', date);

    const response = await fetch(`${API_BASE_URL}/reports/getdailystockinitems?${queryParams.toString()}`, {
      method: 'POST',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const getMonthlyReports = async (params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/reports/getmonthlyreports?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const getDailyBusinessLedger = async (params = {}) => {
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
    if (params.status && params.status.trim() && params.status !== 'all') {
      queryParams.append('status', params.status.trim());
    }
    if (params.payment_status && params.payment_status.trim() && params.payment_status !== 'all') {
      queryParams.append('payment_status', params.payment_status.trim());
    }
    if (params.is_paid && params.is_paid.trim() && params.is_paid !== 'all') {
      queryParams.append('is_paid', params.is_paid.trim());
    }
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/reports/getdailybusinessledger?${queryParams.toString()}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch reports data';
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
        error: 'An unexpected error occurred while fetching reports data',
      };
    }
  }
};

export const updateLedgerValue = async (itemData) => {
  try {
    const formData = new URLSearchParams();
    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    const response = await fetch(`${API_BASE_URL}/reports/updateledgervalue`, {
      method: 'PUT',
      headers: getApiHeaders(),
      body: JSON.stringify(itemData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update report.';
      try {
        const errorData = await response.json();
        errorMessage = errorData; // errorMessage || errorData.message || errorData.error;
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
        error: 'An unexpected error occurred while updating report.',
      };
    }
  }
};

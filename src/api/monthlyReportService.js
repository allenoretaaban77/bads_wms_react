import { API_BASE_URL, getApiHeaders, getApiHeadersPost } from '../config/constants';

export const getMonthlyBusinessLedger = async (params = {}) => {
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

    const response = await fetch(`${API_BASE_URL}/reports/getmonthlybusinessledger?${queryParams.toString()}`, {
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

export const updateReportMonthly = async (date, running_money_on_hand = 0, running_tubo = 0, running_puhunan = 0) => {
  try {
    const formData = new URLSearchParams();
    formData.append('date', date);
    formData.append('running_money_on_hand', running_money_on_hand);
    formData.append('running_tubo', running_tubo);
    formData.append('running_puhunan', running_puhunan);

    const response = await fetch(`${API_BASE_URL}/reports/updatereportmonthly`, {
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

export const deleteReportMonthtly = async (item, employee_id) => {
  try {
    const formData = new URLSearchParams();
    formData.append('date', item.date);
    formData.append('id', item.id);
    formData.append('employee_id', employee_id);

    const response = await fetch(`${API_BASE_URL}/reports/deletereportmonthly`, {
      method: 'DELETE',
      headers: getApiHeadersPost(),
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete supplier record.';
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
        error: 'An unexpected error occurred while deleting supplier record',
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
    if (params.date && params.date.trim()) {
      queryParams.append('date', params.date.trim());
    }
    
    const headers = getApiHeaders();

    const response = await fetch(`${API_BASE_URL}/reports/getmonthlyviewbusinessledger?${queryParams.toString()}`, {
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
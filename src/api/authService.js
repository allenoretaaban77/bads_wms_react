const API_BASE_URL = 'http://localhost:8080';

// Login service using native fetch API
export const login = async (username, password) => {
  try {
    // Validate inputs first
    if (!username || !username.trim()) {
      return {
        success: false,
        error: 'Username is required.',
      };
    }

    if (!password || !password.trim()) {
      return {
        success: false,
        error: 'Password is required.',
      };
    }

    // Create URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('username', username.trim());
    formData.append('password', password.trim());

    // Make API call using fetch
    const response = await fetch(`${API_BASE_URL}/api/employee/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // Handle response
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Login failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
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
        error: 'An unexpected error occurred',
      };
    }
  }
};

export default {
  login,
};

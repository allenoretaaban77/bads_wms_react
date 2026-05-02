import axios from 'axios';

export function login({ username, password }) {
  return new Promise(async (resolve) => {
    try {
      // Validate inputs first
      if (!username || !username.trim()) {
        resolve({ success: false, message: 'Username is required.' });
        return;
      }

      if (!password || !password.trim()) {
        resolve({ success: false, message: 'Password is required.' });
        return;
      }

      // Create URL-encoded form data
      const formData = new URLSearchParams();
      formData.append('username', username.trim());
      formData.append('password', password.trim());

      // Make API call to localhost:8080
      const response = await axios.post('http://localhost:8080/api/employee/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Handle successful login
      resolve({
        success: true,
        username: username.trim(),
        data: response.data,
      });

    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        resolve({
          success: false,
          message: error.response.data.message || 'Login failed',
          status: error.response.status,
        });
      } else if (error.request) {
        // Network error - server not reachable
        resolve({
          success: false,
          message: 'Network error. Please check if the server is running on localhost:8080.',
        });
      } else {
        // Other error
        resolve({
          success: false,
          message: 'An unexpected error occurred',
        });
      }
    }
  });
}

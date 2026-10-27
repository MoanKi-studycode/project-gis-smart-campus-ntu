import axios from 'axios';

/**
 * Axios Client Configuration
 * - Base URL configuration
 * - Request interceptor: Token injection
 * - Response interceptor: 401 Unauthorized handling
 */

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================
// REQUEST INTERCEPTOR
// Inject Authorization token and user info into every request
// ============================================
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user ID header for backend identification
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Try multiple possible ID fields (case-insensitive)
        const userId = user.maso || user.MaSo || user.id || user.MaNguoiDung;
        if (userId) {
          config.headers['x-user-id'] = userId;
        }
        if (user.role) {
          config.headers['x-user-role'] = user.role;
        }
      } catch (e) {
        console.warn('Could not parse user from localStorage');
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// Handle 401 Unauthorized - redirect to login
// ============================================
axiosClient.interceptors.response.use(
  (response) => {
    // Return data directly for convenience
    return response.data;
  },
  (error) => {
    const { response } = error;

    if (response) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // Handle 403 Forbidden
      if (response.status === 403) {
        console.error('Access denied: You do not have permission to access this resource.');
      }

      // Handle 500 Server Error
      if (response.status >= 500) {
        console.error('Server error. Please try again later.');
      }

      // Return error message from server
      return Promise.reject({
        status: response.status,
        message: response.data?.message || 'Có lỗi xảy ra',
        errors: response.data?.errors || [],
      });
    }

    // Network error
    return Promise.reject({
      status: 0,
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
    });
  }
);

export default axiosClient;

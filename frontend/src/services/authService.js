import axiosClient from '../api/axiosClient';

/**
 * Authentication Service
 * Handles: Login, Logout, GetProfile, Token management
 */

const authService = {
  /**
   * Login with username and password
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<{token: string, user: object}>}
   */
  login: async (username, password) => {
    const response = await axiosClient.post('/auth/login', {
      username,
      password,
    });
    
    // Store token and user in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Logout - Clear stored credentials
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user profile from server
   * @returns {Promise<object>} User profile
   */
  getProfile: async () => {
    return await axiosClient.get('/auth/me');
  },

  /**
   * Get stored user from localStorage
   * @returns {object|null} User object or null
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Change password
   * @param {string} oldPassword 
   * @param {string} newPassword 
   * @returns {Promise<object>}
   */
  changePassword: async (oldPassword, newPassword) => {
    return await axiosClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  },
};

export default authService;

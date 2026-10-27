import axiosClient from '../api/axiosClient';

/**
 * User Service
 * CRUD operations for Admin user management
 */

const userService = {
  // ============================================
  // GET ALL USERS (with optional filters)
  // ============================================
  
  /**
   * Get all users with optional filters
   * @param {object} params - Query parameters (role, search, page, limit)
   * @returns {Promise<{data: array, total: number, page: number}>}
   */
  getAll: async (params = {}) => {
    return await axiosClient.get('/users', { params });
  },

  /**
   * Get users by role
   * @param {'admin'|'lecturer'|'student'} role 
   * @returns {Promise<array>}
   */
  getByRole: async (role) => {
    return await axiosClient.get('/users', { params: { role } });
  },

  /**
   * Get all admins
   */
  getAdmins: async () => {
    return await axiosClient.get('/users', { params: { role: 'admin' } });
  },

  /**
   * Get all lecturers
   */
  getLecturers: async () => {
    return await axiosClient.get('/users', { params: { role: 'lecturer' } });
  },

  /**
   * Get all students
   */
  getStudents: async () => {
    return await axiosClient.get('/users', { params: { role: 'student' } });
  },

  // ============================================
  // GET SINGLE USER
  // ============================================
  
  /**
   * Get user by ID
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  getById: async (id) => {
    return await axiosClient.get(`/users/${id}`);
  },

  // ============================================
  // CREATE USER
  // ============================================
  
  /**
   * Create new user
   * @param {object} userData - { username, password, hoTen, email, role, ... }
   * @returns {Promise<object>}
   */
  create: async (userData) => {
    return await axiosClient.post('/users', userData);
  },

  // ============================================
  // UPDATE USER
  // ============================================
  
  /**
   * Update user by ID
   * @param {number|string} id 
   * @param {object} userData 
   * @returns {Promise<object>}
   */
  update: async (id, userData) => {
    return await axiosClient.put(`/users/${id}`, userData);
  },

  // ============================================
  // DELETE USER
  // ============================================
  
  /**
   * Delete user by ID
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  delete: async (id) => {
    return await axiosClient.delete(`/users/${id}`);
  },

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  /**
   * Reset user password (Admin only)
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  resetPassword: async (id) => {
    return await axiosClient.post(`/users/${id}/reset-password`);
  },

  /**
   * Toggle user active status
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  toggleStatus: async (id) => {
    return await axiosClient.patch(`/users/${id}/toggle-status`);
  },
};

export default userService;

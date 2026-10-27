import axiosClient from '../api/axiosClient';

/**
 * Event Service
 * Methods for Events and Attendance management
 */

const eventService = {
  // ============================================
  // EVENTS (Sự kiện)
  // ============================================
  
  events: {
    /**
     * Get all events
     * @param {object} params - { search, status, startDate, endDate, page, limit }
     */
    getAll: async (params = {}) => {
      return await axiosClient.get('/events', { params });
    },

    /**
     * Get upcoming events
     */
    getUpcoming: async (limit = 10) => {
      return await axiosClient.get('/events', { 
        params: { status: 'upcoming', limit } 
      });
    },

    /**
     * Get event by ID
     */
    getById: async (id) => {
      return await axiosClient.get(`/events/${id}`);
    },

    /**
     * Create new event
     * @param {object} data - { tenSK, moTa, ngayBatDau, ngayKetThuc, diaDiem, toaNhaId }
     */
    create: async (data) => {
      return await axiosClient.post('/events', data);
    },

    /**
     * Update event
     */
    update: async (id, data) => {
      return await axiosClient.put(`/events/${id}`, data);
    },

    /**
     * Delete event
     */
    delete: async (id) => {
      return await axiosClient.delete(`/events/${id}`);
    },
  },

  // ============================================
  // ATTENDANCE (Điểm danh)
  // ============================================
  
  attendance: {
    /**
     * Get attendance sessions for a course
     * @param {number} courseId 
     */
    getByCourse: async (courseId) => {
      return await axiosClient.get('/attendance/sessions', { 
        params: { courseId } 
      });
    },

    /**
     * Get active attendance session
     */
    getActive: async (courseId) => {
      return await axiosClient.get('/attendance/active', { 
        params: { courseId } 
      });
    },

    /**
     * Open attendance session (Lecturer)
     * @param {object} data - { lopHocId, thoiGianKetThuc }
     */
    openSession: async (data) => {
      return await axiosClient.post('/attendance/open', data);
    },

    /**
     * Close attendance session (Lecturer)
     * @param {number} sessionId 
     */
    closeSession: async (sessionId) => {
      return await axiosClient.post(`/attendance/${sessionId}/close`);
    },

    /**
     * Check in (Student)
     * @param {number} sessionId 
     */
    checkIn: async (sessionId) => {
      return await axiosClient.post(`/attendance/${sessionId}/checkin`);
    },

    /**
     * Get attendance records for a session
     * @param {number} sessionId 
     */
    getRecords: async (sessionId) => {
      return await axiosClient.get(`/attendance/${sessionId}/records`);
    },

    /**
     * Get student's attendance history
     * @param {number} studentId 
     * @param {number} courseId - Optional filter by course
     */
    getStudentHistory: async (studentId, courseId = null) => {
      return await axiosClient.get('/attendance/history', { 
        params: { studentId, courseId } 
      });
    },

    /**
     * Get attendance statistics for a course
     * @param {number} courseId 
     */
    getStatistics: async (courseId) => {
      return await axiosClient.get('/attendance/statistics', { 
        params: { courseId } 
      });
    },

    /**
     * Manual attendance update (Lecturer)
     * @param {number} sessionId 
     * @param {number} studentId 
     * @param {boolean} present 
     */
    manualUpdate: async (sessionId, studentId, present) => {
      return await axiosClient.patch(`/attendance/${sessionId}/records/${studentId}`, {
        present,
      });
    },
  },

  // ============================================
  // NOTIFICATIONS (Thông báo)
  // ============================================
  
  notifications: {
    /**
     * Get user notifications
     */
    getAll: async (params = {}) => {
      return await axiosClient.get('/notifications', { params });
    },

    /**
     * Get unread notifications count
     */
    getUnreadCount: async () => {
      return await axiosClient.get('/notifications/unread-count');
    },

    /**
     * Mark notification as read
     */
    markAsRead: async (id) => {
      return await axiosClient.patch(`/notifications/${id}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
      return await axiosClient.patch('/notifications/read-all');
    },
  },
};

export default eventService;

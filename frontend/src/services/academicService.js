import axiosClient from '../api/axiosClient';

/**
 * Academic Service
 * Methods for Subjects, Course Sections, Schedules
 */

const academicService = {
  // ============================================
  // SUBJECTS (Môn học)
  // ============================================
  
  subjects: {
    /**
     * Get all subjects
     * @param {object} params - { search, khoaId, page, limit }
     */
    getAll: async (params = {}) => {
      return await axiosClient.get('/subjects', { params });
    },

    /**
     * Get subject by ID
     */
    getById: async (id) => {
      return await axiosClient.get(`/subjects/${id}`);
    },

    /**
     * Create new subject
     * @param {object} data - { maMH, tenMH, tinChi, khoaId }
     */
    create: async (data) => {
      return await axiosClient.post('/subjects', data);
    },

    /**
     * Update subject
     */
    update: async (id, data) => {
      return await axiosClient.put(`/subjects/${id}`, data);
    },

    /**
     * Delete subject
     */
    delete: async (id) => {
      return await axiosClient.delete(`/subjects/${id}`);
    },
  },

  // ============================================
  // COURSES / SECTIONS (Lớp học phần)
  // ============================================
  
  courses: {
    /**
     * Get all course sections
     * @param {object} params - { search, subjectId, lecturerId, semester, page, limit }
     */
    getAll: async (params = {}) => {
      return await axiosClient.get('/courses', { params });
    },

    /**
     * Get course by ID
     */
    getById: async (id) => {
      return await axiosClient.get(`/courses/${id}`);
    },

    /**
     * Get courses by lecturer
     */
    getByLecturer: async (lecturerId) => {
      return await axiosClient.get('/courses', { params: { lecturerId } });
    },

    /**
     * Get courses by student
     */
    getByStudent: async (studentId) => {
      return await axiosClient.get('/courses', { params: { studentId } });
    },

    /**
     * Create new course section
     * @param {object} data - { maLHP, monHocId, giangVienId, siSoMax, hocKy, namHoc }
     */
    create: async (data) => {
      return await axiosClient.post('/courses', data);
    },

    /**
     * Update course section
     */
    update: async (id, data) => {
      return await axiosClient.put(`/courses/${id}`, data);
    },

    /**
     * Delete course section
     */
    delete: async (id) => {
      return await axiosClient.delete(`/courses/${id}`);
    },

    /**
     * Get students enrolled in a course
     */
    getStudents: async (courseId) => {
      return await axiosClient.get(`/courses/${courseId}/students`);
    },

    /**
     * Enroll student in course
     */
    enrollStudent: async (courseId, studentId) => {
      return await axiosClient.post(`/courses/${courseId}/enroll`, { studentId });
    },

    /**
     * Unenroll student from course
     */
    unenrollStudent: async (courseId, studentId) => {
      return await axiosClient.delete(`/courses/${courseId}/students/${studentId}`);
    },
  },

  // ============================================
  // SCHEDULES (Lịch học)
  // ============================================
  
  schedules: {
    /**
     * Get all schedules
     * @param {object} params - { courseId, roomId, dayOfWeek, startDate, endDate }
     */
    getAll: async (params = {}) => {
      return await axiosClient.get('/schedules', { params });
    },

    /**
     * Get schedule by course ID
     */
    getByCourse: async (courseId) => {
      return await axiosClient.get('/schedules', { params: { courseId } });
    },

    /**
     * Get schedule by lecturer (weekly view)
     */
    getByLecturer: async (lecturerId, weekStart) => {
      return await axiosClient.get('/schedules/lecturer', { 
        params: { lecturerId, weekStart } 
      });
    },

    /**
     * Get schedule by student (weekly view)
     */
    getByStudent: async (studentId, weekStart) => {
      return await axiosClient.get('/schedules/student', { 
        params: { studentId, weekStart } 
      });
    },

    /**
     * Create schedule entry
     * @param {object} data - { lopHocId, phongId, thu, tietBatDau, tietKetThuc, ngayBatDau, ngayKetThuc }
     */
    create: async (data) => {
      return await axiosClient.post('/schedules', data);
    },

    /**
     * Update schedule entry
     */
    update: async (id, data) => {
      return await axiosClient.put(`/schedules/${id}`, data);
    },

    /**
     * Delete schedule entry
     */
    delete: async (id) => {
      return await axiosClient.delete(`/schedules/${id}`);
    },
  },

  // ============================================
  // REFERENCE DATA
  // ============================================
  
  reference: {
    /**
     * Get all departments/faculties (Khoa)
     */
    getDepartments: async () => {
      return await axiosClient.get('/reference/departments');
    },

    /**
     * Get all rooms (Phòng học)
     */
    getRooms: async (buildingId) => {
      return await axiosClient.get('/reference/rooms', { 
        params: buildingId ? { buildingId } : {} 
      });
    },

    /**
     * Get all buildings (Tòa nhà)
     */
    getBuildings: async () => {
      return await axiosClient.get('/reference/buildings');
    },

    /**
     * Get all periods (Tiết học)
     */
    getPeriods: async () => {
      return await axiosClient.get('/reference/periods');
    },
  },
};

export default academicService;

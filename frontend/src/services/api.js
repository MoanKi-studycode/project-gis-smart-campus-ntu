/**
 * API Service
 * Centralized API client for frontend to call backend REST endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

/**
 * Get current user ID from localStorage
 */
const getCurrentUserId = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      // Try multiple possible ID fields for compatibility
      return parsed.id || parsed.MaSo || parsed.MaNguoiDung || null;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Base fetch wrapper with authentication
 */
export async function apiFetch(path, options = {}) {
  const userId = getCurrentUserId();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(userId && { 'x-user-id': userId }),
    ...options.headers
  };

  const res = await fetch(API_BASE + path, {
    ...options,
    headers
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error || 'API Error');
  }
  
  return data;
}

// ============ AUTH API ============
export const authApi = {
  login: (credentials) => apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  getProfile: () => apiFetch('/api/auth/me'),
  
  updateProfile: (data) => apiFetch('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  changePassword: (data) => apiFetch('/api/auth/password', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// ============ USERS API ============
export const usersApi = {
  // Get all users
  getAll: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/users${query}`);
  },
  
  // Get single user
  getById: (id) => apiFetch(`/api/users/${id}`),
  
  // Create user
  create: (data) => apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // Update user
  update: (id, data) => apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  // Delete user
  delete: (id) => apiFetch(`/api/users/${id}`, {
    method: 'DELETE'
  }),
  
  // Get by role with filters
  getAdmins: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/users/admins${query}`);
  },
  getLecturers: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/users/lecturers${query}`);
  },
  getStudents: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/users/students${query}`);
  }
};

// ============ SUBJECTS API ============
export const subjectsApi = {
  getAll: () => apiFetch('/api/subjects'),
  getById: (id) => apiFetch(`/api/subjects/${id}`),
  create: (data) => apiFetch('/api/subjects', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`/api/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`/api/subjects/${id}`, {
    method: 'DELETE'
  }),
  getForDropdown: () => apiFetch('/api/subjects/dropdown')
};

// ============ COURSES API ============
export const coursesApi = {
  // CRUD
  getAll: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/courses${query}`);
  },
  getById: (id) => apiFetch(`/api/courses/${id}`),
  create: (data) => apiFetch('/api/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`/api/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`/api/courses/${id}`, {
    method: 'DELETE'
  }),
  
  // Role-specific
  getByLecturer: (lecturerId, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/courses/lecturer/${lecturerId}${query}`);
  },
  getLecturerPending: (lecturerId) => apiFetch(`/api/courses/lecturer/${lecturerId}/pending`),
  getByStudent: (studentId, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/courses/student/${studentId}${query}`);
  },
  
  // Student registration
  getAvailableForRegistration: (studentId, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/courses/student/${studentId}/available${query}`);
  },
  getRegisteredByStudent: (studentId, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/courses/student/${studentId}/registered${query}`);
  },
  studentEnroll: (studentId, courseId) => apiFetch(`/api/courses/student/${studentId}/enroll/${courseId}`, {
    method: 'POST'
  }),
  studentCancelEnrollment: (studentId, courseId) => apiFetch(`/api/courses/student/${studentId}/enroll/${courseId}`, {
    method: 'DELETE'
  }),
  
  // Actions
  confirm: (id, maGiangVien) => apiFetch(`/api/courses/${id}/confirm`, { 
    method: 'PUT',
    body: JSON.stringify({ maGiangVien })
  }),
  openEnrollment: (id, hanDangKy = null) => apiFetch(`/api/courses/${id}/open`, { 
    method: 'PUT',
    body: JSON.stringify({ hanDangKy })
  }),
  startCourse: (id) => apiFetch(`/api/courses/${id}/start`, { method: 'PUT' }),
  updateStatus: (id, trangThai) => apiFetch(`/api/courses/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ trangThai })
  }),
  
  // Enrollment management (admin)
  getStudents: (id) => apiFetch(`/api/courses/${id}/students`),
  addStudent: (courseId, studentId) => apiFetch(`/api/courses/${courseId}/students`, {
    method: 'POST',
    body: JSON.stringify({ maSV: studentId })
  }),
  removeStudent: (courseId, studentId) => apiFetch(`/api/courses/${courseId}/students/${studentId}`, {
    method: 'DELETE'
  })
};

// ============ EVENTS API ============
export const eventsApi = {
  getAll: (params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/events${query}`);
  },
  getById: (id) => apiFetch(`/api/events/${id}`),
  create: (data) => apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiFetch(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiFetch(`/api/events/${id}`, {
    method: 'DELETE'
  }),
  
  // Cancel and restore (soft delete operations)
  cancel: (id) => apiFetch(`/api/events/${id}/cancel`, { method: 'PUT' }),
  restore: (id) => apiFetch(`/api/events/${id}/restore`, { method: 'PUT' }),
  
  getUpcoming: () => apiFetch('/api/events/upcoming'),
  getForUser: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return apiFetch(`/api/events/user${query}`);
  }
};

// ============ ATTENDANCE API ============
export const attendanceApi = {
  // Sessions
  createSession: (maLop, duration = 15) => apiFetch('/api/attendance/sessions', {
    method: 'POST',
    body: JSON.stringify({ maLop, duration })
  }),
  closeSession: (sessionId) => apiFetch(`/api/attendance/sessions/${sessionId}/close`, {
    method: 'PUT'
  }),
  getSession: (sessionId) => apiFetch(`/api/attendance/sessions/${sessionId}`),
  getSessionRecords: (sessionId) => apiFetch(`/api/attendance/sessions/${sessionId}/records`),
  
  // Check-in
  checkin: (maPhien, viTri = null) => apiFetch('/api/attendance/checkin', {
    method: 'POST',
    body: JSON.stringify({ maPhien, viTri })
  }),
  
  // Student APIs
  getActiveSessions: (studentId) => {
    const query = studentId ? `?studentId=${studentId}` : '';
    return apiFetch(`/api/attendance/student/active${query}`);
  },
  getActiveForStudent: (studentId) => apiFetch('/api/attendance/student/active'),
  getStudentAttendance: (studentId, classId) => apiFetch(`/api/attendance/student/${studentId}/class/${classId}`),
  
  // Lecturer APIs
  getLecturerOpenSessions: () => apiFetch('/api/attendance/lecturer/open'),
  getClassOpenSession: (classId) => apiFetch(`/api/attendance/class/${classId}/open`),
  getClassSessions: (classId, limit) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiFetch(`/api/attendance/class/${classId}/sessions${query}`);
  },
  getClassStatistics: (classId) => apiFetch(`/api/attendance/class/${classId}/statistics`),
  
  // Lecturer statistics
  getLecturerStatistics: (lecturerId, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/attendance/lecturer/${lecturerId}/statistics${query}`);
  },
  getDetailedClassStatistics: (classId) => apiFetch(`/api/attendance/class/${classId}/detailed-statistics`),
  getStudentAttendanceMatrix: (classId) => apiFetch(`/api/attendance/class/${classId}/student-attendance-matrix`),
  
  // Multi-round attendance APIs
  createRound: (classId, duration = 15) => apiFetch(`/api/attendance/class/${classId}/round`, {
    method: 'POST',
    body: JSON.stringify({ duration })
  }),
  getTodayRounds: (classId) => apiFetch(`/api/attendance/class/${classId}/today`),
  getTodayStudents: (classId, studentId) => {
    const query = studentId ? `?studentId=${studentId}` : '';
    return apiFetch(`/api/attendance/class/${classId}/today/students${query}`);
  },
  endTodayAttendance: (classId) => apiFetch(`/api/attendance/class/${classId}/end-day`, {
    method: 'PUT'
  }),
  getTodaySummary: (classId) => apiFetch(`/api/attendance/class/${classId}/today/summary`)
};

// ============ REFERENCE API ============
export const referenceApi = {
  getRoles: () => apiFetch('/api/reference/roles'),
  getPeriods: () => apiFetch('/api/reference/periods'),
  getFaculties: () => apiFetch('/api/reference/faculties'),
  getMajors: (facultyId) => {
    const query = facultyId ? `?faculty=${facultyId}` : '';
    return apiFetch(`/api/reference/majors${query}`);
  },
  getBuildings: () => apiFetch('/api/reference/buildings'),
  getClassrooms: (buildingId, floor) => {
    const params = new URLSearchParams();
    if (buildingId) params.append('building', buildingId);
    if (floor) params.append('floor', floor);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/api/reference/classrooms${query}`);
  },
  getSemesters: () => apiFetch('/api/reference/semesters'),
  getAcademicYears: () => apiFetch('/api/reference/academic-years'),
  getStudentYears: () => apiFetch('/api/reference/student-years'),
  getWeekdays: () => apiFetch('/api/reference/weekdays'),
  
  // Dropdown helpers
  getLecturersDropdown: () => apiFetch('/api/reference/dropdown/lecturers'),
  getSubjectsDropdown: () => apiFetch('/api/reference/dropdown/subjects')
};

// ============ ROOM STATUS API ============
export const roomStatusApi = {
  // Get single room status
  getByRoom: (maPhong) => apiFetch(`/api/room-status/${maPhong}`),
  
  // Get all rooms with status
  getAllRooms: () => apiFetch('/api/room-status/rooms/all'),
  
  // Get rooms by building with status
  getByBuilding: (buildingId) => apiFetch(`/api/room-status/building/${buildingId}`),
  
  // Start attendance for class (lecturer only)
  toggleAttendance: (maLop, action) => apiFetch('/api/attendance/toggle', {
    method: 'POST',
    body: JSON.stringify({ maLop, action }) // action: 'START' | 'STOP'
  })
};

// NOTE: Settings are UI-only, stored in localStorage (no backend API)

export default {
  auth: authApi,
  users: usersApi,
  subjects: subjectsApi,
  courses: coursesApi,
  events: eventsApi,
  attendance: attendanceApi,
  reference: referenceApi,
  roomStatus: roomStatusApi
};

/**
 * Attendance Routes
 * Handles attendance sessions and check-ins
 */
import { Router } from 'express';
import AttendanceModel from '../models/Attendance.model.js';

const router = Router();

/**
 * POST /api/attendance/sessions
 * Create new attendance session (Lecturer)
 */
router.post('/sessions', async (req, res) => {
  try {
    const { maLop, duration } = req.body;
    const maGiangVien = req.headers['x-user-id'];
    
    if (!maLop) {
      return res.status(400).json({ error: 'Thiếu mã lớp học phần' });
    }
    
    if (!maGiangVien) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    const session = await AttendanceModel.createSession(maLop, maGiangVien, duration || 15);
    res.status(201).json({ success: true, session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/attendance/sessions/:id/close
 * Close attendance session (Lecturer)
 */
router.put('/sessions/:id/close', async (req, res) => {
  try {
    const session = await AttendanceModel.closeSession(parseInt(req.params.id));
    
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy phiên điểm danh' });
    }
    
    res.json({ success: true, session, message: 'Đóng phiên điểm danh thành công' });
  } catch (error) {
    console.error('Close session error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/sessions/:id
 * Get attendance session details
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await AttendanceModel.getSession(parseInt(req.params.id));
    
    if (!session) {
      return res.status(404).json({ error: 'Không tìm thấy phiên điểm danh' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/sessions/:id/records
 * Get attendance records for a session
 */
router.get('/sessions/:id/records', async (req, res) => {
  try {
    const records = await AttendanceModel.getSessionAttendance(parseInt(req.params.id));
    res.json(records);
  } catch (error) {
    console.error('Get session records error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/open
 * Get open attendance session for a class
 */
router.get('/class/:classId/open', async (req, res) => {
  try {
    const session = await AttendanceModel.getOpenSession(req.params.classId);
    res.json(session);
  } catch (error) {
    console.error('Get open session error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/sessions
 * Get all attendance sessions for a class
 */
router.get('/class/:classId/sessions', async (req, res) => {
  try {
    const { limit } = req.query;
    const sessions = await AttendanceModel.getClassSessions(
      req.params.classId,
      limit ? parseInt(limit) : 20
    );
    res.json(sessions);
  } catch (error) {
    console.error('Get class sessions error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/statistics
 * Get attendance statistics for a class
 */
router.get('/class/:classId/statistics', async (req, res) => {
  try {
    const statistics = await AttendanceModel.getClassStatistics(req.params.classId);
    res.json(statistics);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/attendance/checkin
 * Student check-in
 */
router.post('/checkin', async (req, res) => {
  try {
    const { maPhien, viTri } = req.body;
    const maSV = req.headers['x-user-id'];
    
    if (!maPhien) {
      return res.status(400).json({ error: 'Thiếu mã phiên điểm danh' });
    }
    
    if (!maSV) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    const result = await AttendanceModel.studentCheckIn(parseInt(maPhien), maSV, viTri);
    res.json({ 
      success: true, 
      record: result, 
      message: result.trangthai === 'MUON' ? 'Điểm danh thành công (Đi muộn)' : 'Điểm danh thành công' 
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(400).json({ error: error.message || 'Lỗi điểm danh' });
  }
});

/**
 * GET /api/attendance/student/active
 * Get active attendance sessions for current student
 */
router.get('/student/active', async (req, res) => {
  try {
    const maSV = req.headers['x-user-id'];
    
    if (!maSV) {
      return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }
    
    const sessions = await AttendanceModel.getActiveSessionsForStudent(maSV);
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Get student active sessions error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/student/:studentId/class/:classId
 * Get student's attendance for a specific class
 */
router.get('/student/:studentId/class/:classId', async (req, res) => {
  try {
    const records = await AttendanceModel.getStudentAttendance(
      req.params.studentId,
      req.params.classId
    );
    res.json(records);
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/lecturer/open
 * Get lecturer's open attendance sessions
 */
router.get('/lecturer/open', async (req, res) => {
  try {
    const maGiangVien = req.headers['x-user-id'];
    
    if (!maGiangVien) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    const sessions = await AttendanceModel.getLecturerOpenSessions(maGiangVien);
    res.json(sessions);
  } catch (error) {
    console.error('Get lecturer open sessions error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// ==================================================================================
// LECTURER STATISTICS ENDPOINTS
// ==================================================================================

/**
 * GET /api/attendance/lecturer/:id/statistics
 * Get comprehensive statistics for lecturer's classes
 */
router.get('/lecturer/:id/statistics', async (req, res) => {
  try {
    const { hocKy, namHoc } = req.query;
    const stats = await AttendanceModel.getLecturerClassStatistics(
      req.params.id,
      hocKy ? parseInt(hocKy) : null,
      namHoc
    );
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get lecturer statistics error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/detailed-statistics
 * Get detailed attendance statistics for a class with session-by-session breakdown
 */
router.get('/class/:classId/detailed-statistics', async (req, res) => {
  try {
    const stats = await AttendanceModel.getDetailedClassStatistics(req.params.classId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get detailed statistics error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/student-attendance-matrix
 * Get student attendance matrix (sessions x students) for a class
 */
router.get('/class/:classId/student-attendance-matrix', async (req, res) => {
  try {
    const matrix = await AttendanceModel.getStudentAttendanceMatrix(req.params.classId);
    res.json({ success: true, data: matrix });
  } catch (error) {
    console.error('Get attendance matrix error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

// ==================================================================================
// MULTI-ROUND ATTENDANCE ENDPOINTS
// ==================================================================================

/**
 * POST /api/attendance/class/:classId/round
 * Create new attendance round for today
 */
router.post('/class/:classId/round', async (req, res) => {
  try {
    const { duration } = req.body;
    const maGiangVien = req.headers['x-user-id'];
    
    if (!maGiangVien) {
      return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }
    
    const session = await AttendanceModel.createAttendanceRound(
      req.params.classId, 
      maGiangVien, 
      duration || 15
    );
    
    res.status(201).json({ 
      success: true, 
      session, 
      message: `Đã mở lần điểm danh thứ ${session.landiemdanh}` 
    });
  } catch (error) {
    console.error('Create round error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/today
 * Get all attendance rounds for today
 */
router.get('/class/:classId/today', async (req, res) => {
  try {
    const rounds = await AttendanceModel.getTodayRounds(req.params.classId);
    res.json({ success: true, data: rounds });
  } catch (error) {
    console.error('Get today rounds error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/today/students
 * Get student attendance for all rounds today
 */
router.get('/class/:classId/today/students', async (req, res) => {
  try {
    const { studentId } = req.query;
    const attendance = await AttendanceModel.getStudentRoundAttendance(
      req.params.classId,
      studentId || null
    );
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get student round attendance error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/attendance/class/:classId/end-day
 * End today's attendance for a class
 */
router.put('/class/:classId/end-day', async (req, res) => {
  try {
    const summary = await AttendanceModel.endTodayAttendance(req.params.classId);
    res.json({ success: true, data: summary, message: 'Đã kết thúc buổi điểm danh hôm nay' });
  } catch (error) {
    console.error('End day attendance error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/attendance/class/:classId/today/summary
 * Get today's attendance summary
 */
router.get('/class/:classId/today/summary', async (req, res) => {
  try {
    const summary = await AttendanceModel.getTodaySummary(req.params.classId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Get today summary error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

export default router;

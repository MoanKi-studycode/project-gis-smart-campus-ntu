/**
 * Course Section Routes (LopHoc)
 * CRUD operations for course sections
 */
import { Router } from 'express';
import CourseSectionModel, { validateCourseData } from '../models/CourseSection.model.js';

const router = Router();

/**
 * GET /api/courses
 * Get all course sections with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { search, maGiangVien, hocKy, namHoc, trangThai, maMon, maNganh, page, limit } = req.query;
    
    const result = await CourseSectionModel.findAll({
      search,
      maGiangVien,
      hocKy: hocKy ? parseInt(hocKy) : null,
      namHoc,
      trangThai,
      maMon,
      maNganh,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/lecturer/:id
 * Get courses by lecturer (for teaching schedule)
 */
router.get('/lecturer/:id', async (req, res) => {
  try {
    const { hocKy, namHoc } = req.query;
    const courses = await CourseSectionModel.findByLecturer(
      req.params.id,
      hocKy ? parseInt(hocKy) : null,
      namHoc
    );
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get lecturer courses error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/lecturer/:id/pending
 * Get courses waiting for lecturer confirmation
 */
router.get('/lecturer/:id/pending', async (req, res) => {
  try {
    const courses = await CourseSectionModel.findWaitingConfirmation(req.params.id);
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get pending courses error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/student/:id
 * Get courses by student (for study schedule)
 */
router.get('/student/:id', async (req, res) => {
  try {
    const { hocKy, namHoc } = req.query;
    const courses = await CourseSectionModel.findByStudent(
      req.params.id,
      hocKy ? parseInt(hocKy) : null,
      namHoc
    );
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get student courses error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/student/:id/available
 * Get courses available for student registration
 */
router.get('/student/:id/available', async (req, res) => {
  try {
    const { hocKy, namHoc } = req.query;
    const courses = await CourseSectionModel.findAvailableForRegistration(
      req.params.id,
      hocKy ? parseInt(hocKy) : null,
      namHoc
    );
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/student/:id/registered
 * Get student's registered courses for a semester
 */
router.get('/student/:id/registered', async (req, res) => {
  try {
    const { hocKy, namHoc } = req.query;
    const courses = await CourseSectionModel.findRegisteredByStudent(
      req.params.id,
      hocKy ? parseInt(hocKy) : null,
      namHoc
    );
    res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Get registered courses error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/courses/student/:id/enroll/:courseId
 * Student self-enrolls in a course
 */
router.post('/student/:id/enroll/:courseId', async (req, res) => {
  try {
    const result = await CourseSectionModel.studentEnroll(req.params.courseId, req.params.id);
    res.json({ success: true, enrollment: result, message: 'Đăng ký học phần thành công' });
  } catch (error) {
    console.error('Student enroll error:', error);
    res.status(400).json({ success: false, error: error.message || 'Lỗi đăng ký' });
  }
});

/**
 * DELETE /api/courses/student/:id/enroll/:courseId
 * Student cancels enrollment
 */
router.delete('/student/:id/enroll/:courseId', async (req, res) => {
  try {
    const result = await CourseSectionModel.studentCancelEnrollment(req.params.courseId, req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy đăng ký' });
    }
    res.json({ success: true, message: 'Hủy đăng ký thành công' });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(400).json({ success: false, error: error.message || 'Lỗi hủy đăng ký' });
  }
});

/**
 * GET /api/courses/:id
 * Get course section by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await CourseSectionModel.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/courses/:id/students
 * Get students enrolled in a course
 */
router.get('/:id/students', async (req, res) => {
  try {
    const students = await CourseSectionModel.getEnrolledStudents(req.params.id);
    res.json(students);
  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/courses
 * Create new course section
 */
router.post('/', async (req, res) => {
  try {
    const courseData = req.body;
    
    // Comprehensive validation (includes FK checks and constraints)
    const validationErrors = await validateCourseData(courseData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Dữ liệu không hợp lệ',
        details: validationErrors
      });
    }
    
    // Check if course already exists
    const existing = await CourseSectionModel.findById(courseData.maLop);
    if (existing) {
      return res.status(400).json({ 
        error: 'Mã lớp học phần đã tồn tại',
        details: [`Lớp học phần "${courseData.maLop}" đã được tạo trước đó`]
      });
    }
    
    const newCourse = await CourseSectionModel.create(courseData);
    res.status(201).json({ 
      success: true, 
      course: newCourse,
      message: 'Tạo lớp học phần thành công'
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    // Distinguish different error types
    let errorMessage = 'Lỗi hệ thống';
    let statusCode = 500;
    
    if (error.code === '23505') {
      errorMessage = 'Mã lớp học phần đã tồn tại';
      statusCode = 400;
    } else if (error.code === '23503') {
      errorMessage = 'Tham chiếu không hợp lệ (kiểm tra mã môn học, giảng viên, phòng học)';
      statusCode = 400;
    } else if (error.code === '23502') {
      errorMessage = 'Thiếu thông tin bắt buộc';
      statusCode = 400;
    } else if (error.code === '23514') {
      errorMessage = 'Dữ liệu vi phạm ràng buộc hệ thống';
      statusCode = 400;
    } else if (error.message?.includes('Foreign key')) {
      errorMessage = 'Tham chiếu không hợp lệ';
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: [error.message]
    });
  }
});

/**
 * PUT /api/courses/:id
 * Update course section
 */
router.put('/:id', async (req, res) => {
  try {
    const courseData = req.body;
    
    const updatedCourse = await CourseSectionModel.update(req.params.id, courseData);
    
    if (!updatedCourse) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    
    res.json({ success: true, course: updatedCourse });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/courses/:id/confirm
 * Lecturer confirms course registration
 */
router.put('/:id/confirm', async (req, res) => {
  try {
    const { maGiangVien } = req.body;
    
    if (!maGiangVien) {
      return res.status(400).json({ error: 'Thiếu mã giảng viên' });
    }
    
    const result = await CourseSectionModel.lecturerConfirm(req.params.id, maGiangVien);
    
    if (!result) {
      return res.status(400).json({ error: 'Không thể xác nhận. Lớp học không ở trạng thái chờ xác nhận.' });
    }
    
    res.json({ success: true, course: result, message: 'Xác nhận đăng ký giảng dạy thành công' });
  } catch (error) {
    console.error('Confirm course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/courses/:id/open
 * Admin opens course section for student registration
 */
router.put('/:id/open', async (req, res) => {
  try {
    const { hanDangKy } = req.body;
    const result = await CourseSectionModel.openCourse(req.params.id, hanDangKy);
    
    if (!result) {
      return res.status(400).json({ error: 'Không thể mở lớp. Lớp học phải được giảng viên xác nhận trước.' });
    }
    
    res.json({ success: true, course: result, message: 'Mở đăng ký lớp học phần thành công' });
  } catch (error) {
    console.error('Open course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/courses/:id/start
 * Start course (change from open registration to in progress)
 */
router.put('/:id/start', async (req, res) => {
  try {
    const result = await CourseSectionModel.startCourse(req.params.id);
    
    if (!result) {
      return res.status(400).json({ error: 'Không thể bắt đầu. Lớp học phải đang ở trạng thái mở đăng ký.' });
    }
    
    res.json({ success: true, course: result, message: 'Lớp học đã bắt đầu' });
  } catch (error) {
    console.error('Start course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/courses/:id/status
 * Update course status
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { trangThai } = req.body;
    
    if (!trangThai) {
      return res.status(400).json({ error: 'Thiếu trạng thái' });
    }
    
    const result = await CourseSectionModel.updateStatus(req.params.id, trangThai);
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    
    res.json({ success: true, course: result });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/courses/:id/students
 * Add student to course
 */
router.post('/:id/students', async (req, res) => {
  try {
    const { maSV } = req.body;
    
    if (!maSV) {
      return res.status(400).json({ error: 'Thiếu mã sinh viên' });
    }
    
    const result = await CourseSectionModel.addStudent(req.params.id, maSV);
    res.json({ success: true, enrollment: result });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * DELETE /api/courses/:id/students/:studentId
 * Remove student from course
 */
router.delete('/:id/students/:studentId', async (req, res) => {
  try {
    const result = await CourseSectionModel.removeStudent(req.params.id, req.params.studentId);
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên trong lớp' });
    }
    
    res.json({ success: true, message: 'Xóa sinh viên khỏi lớp thành công' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * DELETE /api/courses/:id
 * Delete course section (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await CourseSectionModel.remove(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học phần' });
    }
    
    res.json({ success: true, message: 'Xóa lớp học phần thành công' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;

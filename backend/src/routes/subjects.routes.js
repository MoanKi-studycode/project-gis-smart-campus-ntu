/**
 * Subject Routes
 * CRUD operations for subjects (MonHoc)
 */
import { Router } from 'express';
import SubjectModel from '../models/Subject.model.js';

const router = Router();

/**
 * GET /api/subjects
 * Get all subjects with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { search, maNganh, soTinChi, namHoc, trangThai, page, limit } = req.query;
    
    const result = await SubjectModel.findAll({
      search,
      maNganh,
      soTinChi: soTinChi ? parseInt(soTinChi) : null,
      namHoc,
      trangThai,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/subjects/dropdown
 * Get active subjects for dropdown
 */
router.get('/dropdown', async (req, res) => {
  try {
    const subjects = await SubjectModel.findAllActive();
    res.json(subjects);
  } catch (error) {
    console.error('Get subjects dropdown error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/subjects/:id
 * Get subject by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const subject = await SubjectModel.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    
    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/subjects
 * Create new subject
 */
router.post('/', async (req, res) => {
  try {
    const subjectData = req.body;
    
    // Validate required fields
    if (!subjectData.maMon || !subjectData.tenMon) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Check if subject exists
    const existing = await SubjectModel.findById(subjectData.maMon);
    if (existing) {
      return res.status(400).json({ error: 'Mã môn học đã tồn tại' });
    }
    
    const newSubject = await SubjectModel.create(subjectData);
    res.status(201).json({ success: true, subject: newSubject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/subjects/:id
 * Update subject
 */
router.put('/:id', async (req, res) => {
  try {
    const subjectData = req.body;
    
    const updatedSubject = await SubjectModel.update(req.params.id, subjectData);
    
    if (!updatedSubject) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    
    res.json({ success: true, subject: updatedSubject });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * DELETE /api/subjects/:id
 * Delete subject (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await SubjectModel.remove(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    
    res.json({ success: true, message: 'Xóa môn học thành công' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;

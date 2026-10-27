/**
 * User Management Routes (Admin)
 * CRUD operations for users
 */
import { Router } from 'express';
import UserModel from '../models/User.model.js';

const router = Router();

/**
 * GET /api/users
 * Get all users with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { role, search, page, limit, status } = req.query;
    
    const result = await UserModel.findAll({
      role: role ? parseInt(role) : null,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/admins
 * Get all admin accounts
 */
router.get('/admins', async (req, res) => {
  try {
    const { search, page, limit } = req.query;
    const result = await UserModel.findAll({
      role: UserModel.ROLES.ADMIN,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    res.json(result);
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/lecturers
 * Get all lecturer accounts
 */
router.get('/lecturers', async (req, res) => {
  try {
    const { search, page, limit, maNganh, maKhoa } = req.query;
    const result = await UserModel.findAll({
      role: UserModel.ROLES.LECTURER,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      maNganh,
      maKhoa
    });
    res.json(result);
  } catch (error) {
    console.error('Get lecturers error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/students
 * Get all student accounts
 */
router.get('/students', async (req, res) => {
  try {
    const { search, page, limit, nienKhoa, maNganh } = req.query;
    const result = await UserModel.findAll({
      role: UserModel.ROLES.STUDENT,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      nienKhoa,
      maNganh
    });
    res.json(result);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/lecturers/dropdown
 * Get lecturers for dropdown selection
 */
router.get('/lecturers/dropdown', async (req, res) => {
  try {
    const lecturers = await UserModel.findByRole(UserModel.ROLES.LECTURER);
    res.json(lecturers);
  } catch (error) {
    console.error('Get lecturers dropdown error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/students/dropdown
 * Get students for dropdown selection
 */
router.get('/students/dropdown', async (req, res) => {
  try {
    const students = await UserModel.findByRole(UserModel.ROLES.STUDENT);
    res.json(students);
  } catch (error) {
    console.error('Get students dropdown error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    // Remove password
    const { matkhau: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/users
 * Create new user
 */
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.maSo || !userData.hoTen || !userData.maVaiTro) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Check if user exists
    const existingUser = await UserModel.findById(userData.maSo);
    if (existingUser) {
      return res.status(400).json({ error: 'Mã số đã tồn tại' });
    }
    
    // Set default password if not provided
    if (!userData.matKhau) {
      userData.matKhau = '123'; // In production, generate random password
    }
    
    const newUser = await UserModel.create(userData);
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id', async (req, res) => {
  try {
    const userData = req.body;
    
    const updatedUser = await UserModel.update(req.params.id, userData);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/users/:id/password
 * Reset user password (Admin)
 */
router.put('/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // In production, hash the password
    await UserModel.updatePassword(req.params.id, newPassword || '123');
    
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await UserModel.remove(req.params.id);
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    res.json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;

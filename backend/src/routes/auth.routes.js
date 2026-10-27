/**
 * Authentication Routes
 * Handles login, logout, profile
 */
import { Router } from 'express';
import * as UserModel from '../models/User.model.js';

const router = Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    // Accept multiple naming conventions for compatibility
    const maSo = req.body.maSo || req.body.username || req.body.tenDangNhap;
    const matKhau = req.body.matKhau || req.body.password;
    
    if (!maSo || !matKhau) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập mã số và mật khẩu' 
      });
    }
    
    const user = await UserModel.authenticate(maSo, matKhau);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Mã số hoặc mật khẩu không đúng' 
      });
    }
    
    // Map to frontend-friendly format
    // MaSo is the primary key, use it as MaNguoiDung for compatibility
    const userData = {
      id: user.maso,
      MaSo: user.maso,
      MaNguoiDung: user.maso,
      name: user.hoten || user.tennguoidung,
      HoTen: user.hoten || user.tennguoidung,
      email: user.email,
      Email: user.email,
      role: user.role?.toLowerCase() || UserModel.ROLE_NAMES[user.mavaitro]?.toLowerCase() || 'student',
      MaVaiTro: user.mavaitro,
      TenVaiTro: user.tenvaitro,
      MaKhoa: user.makhoa,
      MaNganh: user.manganh,
      SoDienThoai: user.sodienthoai,
      Avatar: user.avatar
    };
    
    res.json({ 
      success: true, 
      user: userData,
      message: 'Đăng nhập thành công'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống' 
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const maSo = req.headers['x-user-id'];
    
    if (!maSo) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }
    
    const user = await UserModel.findById(maSo);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }
    
    // Map to frontend-friendly format
    const userData = {
      id: user.maso,
      MaSo: user.maso,
      name: user.hoten,
      HoTen: user.hoten,
      email: user.email,
      Email: user.email,
      role: UserModel.ROLE_NAMES[user.mavaitro]?.toLowerCase() || 'student',
      MaVaiTro: user.mavaitro,
      MaKhoa: user.makhoa,
      MaNganh: user.manganh,
      SoDienThoai: user.sodienthoai,
      Avatar: user.avatar
    };
    
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống' 
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const maSo = req.headers['x-user-id'];
    
    if (!maSo) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }
    
    const { hoTen, HoTen, email, Email, soDienThoai, SoDienThoai, avatar } = req.body;
    
    const updatedUser = await UserModel.update(maSo, {
      hoTen: hoTen || HoTen, 
      email: email || Email, 
      soDienThoai: soDienThoai || SoDienThoai, 
      avatar
    });
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }
    
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống' 
    });
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', async (req, res) => {
  try {
    const maSo = req.headers['x-user-id'];
    
    if (!maSo) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }
    
    const { oldPassword, currentPassword, newPassword } = req.body;
    const passwordToVerify = oldPassword || currentPassword;
    
    // Verify old password
    const user = await UserModel.authenticate(maSo, passwordToVerify);
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: 'Mật khẩu cũ không đúng' 
      });
    }
    
    // Update with new password
    await UserModel.updatePassword(maSo, newPassword);
    
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi hệ thống' 
    });
  }
});

export default router;

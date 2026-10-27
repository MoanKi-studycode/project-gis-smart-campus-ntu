// auth.route.js
// Role: Authentication routes (login, refresh token, etc.)
import { Router } from 'express';
import * as UserModel from '../models/User.model.js';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập tên đăng nhập và mật khẩu' 
      });
    }

    const user = await UserModel.authenticate(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }

    // Map database fields to frontend expected format
    const userData = {
      id: user.maso,
      MaSo: user.maso,
      name: user.hoten,
      HoTen: user.hoten,
      TenNguoiDung: user.hoten, // alias for compatibility
      email: user.email,
      Email: user.email,
      role: user.role?.toLowerCase() || 'student',
      MaVaiTro: user.mavaitro,
      TenVaiTro: user.tenvaitro,
      MaKhoa: user.makhoa,
      MaNganh: user.manganh,
      SoDienThoai: user.sodienthoai,
      MaSV: user.mavaitro === 3 ? user.maso : null,
      MaGV: user.mavaitro === 2 ? user.maso : null
    };

    res.json({ 
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi đăng nhập' 
    });
  }
});

// Get current user (check session)
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }

    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }

    // Map database fields to frontend expected format
    const userData = {
      id: user.maso,
      MaSo: user.maso,
      name: user.hoten,
      HoTen: user.hoten,
      TenNguoiDung: user.hoten, // alias for compatibility
      email: user.email,
      Email: user.email,
      role: UserModel.ROLE_NAMES[user.mavaitro]?.toLowerCase() || 'student',
      MaVaiTro: user.mavaitro,
      TenVaiTro: user.tenvaitro,
      MaKhoa: user.makhoa,
      MaNganh: user.manganh,
      SoDienThoai: user.sodienthoai
    };

    res.json({ 
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server' 
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // For simple header-based auth, just return success
  // Client will clear localStorage
  res.json({ success: true });
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }

    const { HoTen, TenNguoiDung, Email, SoDienThoai } = req.body;
    
    const updatedUser = await UserModel.update(userId, {
      hoTen: HoTen || TenNguoiDung,
      email: Email,
      soDienThoai: SoDienThoai
    });

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Không tìm thấy người dùng' 
      });
    }

    res.json({ 
      success: true,
      user: {
        ...updatedUser,
        name: updatedUser.hoten,
        HoTen: updatedUser.hoten,
        TenNguoiDung: updatedUser.hoten
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi cập nhật hồ sơ' 
    });
  }
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'Chưa đăng nhập' 
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng nhập đủ thông tin' 
      });
    }

    const result = await UserModel.changePassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error || 'Không thể đổi mật khẩu' 
      });
    }

    res.json({ 
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi server khi đổi mật khẩu' 
    });
  }
});

export default router;

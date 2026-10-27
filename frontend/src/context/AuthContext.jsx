import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

// Role constants matching database
export const ROLES = {
  ADMIN: 1,
  LECTURER: 2,
  STUDENT: 3
};

export const ROLE_NAMES = {
  1: 'admin',
  2: 'lecturer', 
  3: 'student'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authApi.login({ tenDangNhap: username, matKhau: password });
      if (response.user) {
        // Add role name for easier UI logic
        const userData = {
          ...response.user,
          role: ROLE_NAMES[response.user.MaVaiTro] || 'unknown'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
      return { success: false, error: 'Đăng nhập thất bại' };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, error: error.message || 'Đăng nhập thất bại' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (data) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.user) {
        // Map database fields to frontend format
        const userData = {
          ...user,
          ...response.user,
          HoTen: response.user.hoten || response.user.HoTen || user.HoTen,
          Email: response.user.email || response.user.Email || user.Email,
          SoDienThoai: response.user.sodienthoai || response.user.SoDienThoai || user.SoDienThoai,
          Avatar: response.user.avatar || response.user.Avatar || data.avatar || user.Avatar,
          role: ROLE_NAMES[response.user.mavaitro || response.user.MaVaiTro] || user.role
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await authApi.changePassword({ matKhauCu: oldPassword, matKhauMoi: newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Role check helpers
  const isAdmin = user?.MaVaiTro === ROLES.ADMIN;
  const isLecturer = user?.MaVaiTro === ROLES.LECTURER;
  const isStudent = user?.MaVaiTro === ROLES.STUDENT;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateProfile,
      changePassword,
      isLoggedIn: !!user,
      loading,
      isAdmin,
      isLecturer,
      isStudent,
      ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

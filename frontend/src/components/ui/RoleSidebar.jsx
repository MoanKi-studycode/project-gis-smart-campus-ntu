/**
 * RoleSidebar.jsx
 * Role-based sidebar navigation for Admin/Lecturer/Student
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, BookOpen, Calendar, MapPin, 
  Settings, LogOut, Bell, FileCheck, 
  BarChart3, ClipboardList, X
} from 'lucide-react';

// Menu items configuration by role
const MENU_CONFIG = {
  admin: [
    { id: 'users', label: 'Quản lý tài khoản', icon: Users, path: '/admin/users' },
    { id: 'academic', label: 'Quản lý đào tạo', icon: BookOpen, path: '/admin/academic' },
    { id: 'events', label: 'Quản lý sự kiện', icon: Bell, path: '/admin/events' },
    { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings, path: '/settings' }
  ],
  lecturer: [
    { id: 'dashboard', label: 'Tổng quan', icon: BarChart3, path: '/lecturer/dashboard' },
    { id: 'schedule', label: 'Lịch giảng dạy', icon: Calendar, path: '/lecturer/schedule' },
    { id: 'attendance', label: 'Điểm danh', icon: FileCheck, path: '/lecturer/attendance' },
    { id: 'activities', label: 'Hoạt động', icon: ClipboardList, path: '/lecturer/activities' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings' }
  ],
  student: [
    { id: 'dashboard', label: 'Tổng quan', icon: BarChart3, path: '/student/dashboard' },
    { id: 'schedule', label: 'Thời khóa biểu', icon: Calendar, path: '/student/schedule' },
    { id: 'attendance', label: 'Điểm danh', icon: FileCheck, path: '/student/attendance' },
    { id: 'activities', label: 'Sự kiện', icon: Bell, path: '/student/activities' },
    { id: 'settings', label: 'Cài đặt', icon: Settings, path: '/settings' }
  ]
};

const ROLE_LABELS = {
  admin: { label: 'Quản trị viên', color: 'bg-red-100 text-red-700' },
  lecturer: { label: 'Giảng viên', color: 'bg-purple-100 text-purple-700' },
  student: { label: 'Sinh viên', color: 'bg-blue-100 text-blue-700' }
};

export default function RoleSidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const menuItems = MENU_CONFIG[user.role] || [];
  const roleInfo = ROLE_LABELS[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
  const userName = user.name || user.HoTen || user.TenNguoiDung || 'Người dùng';
  const userId = user.id || user.MaSo || '';

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleGoToMap = () => {
    navigate('/');
  };

  return (
    <aside className="h-full w-full bg-white flex flex-col">
      {/* Header with user info */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold truncate">{userName}</div>
            <div className="text-blue-100 text-sm truncate">{userId}</div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
              title="Đóng sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="mt-3">
          <span className={`px-2 py-1 rounded text-xs font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>
      </div>

      {/* Map Button */}
      <div className="p-3 border-b">
        <button
          onClick={handleGoToMap}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all"
        >
          <MapPin size={20} />
          <span className="font-medium">Bản đồ Campus</span>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer with logout */}
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

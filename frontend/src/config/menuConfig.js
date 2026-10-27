import {
  Map,
  User,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Activity,
  BarChart3,
  Bell,
  GraduationCap,
  Building2,
  ClipboardList,
  UserCog,
  UserCheck,
  CalendarDays,
  BookMarked,
  Layers,
  CheckSquare,
  CalendarClock,
} from 'lucide-react';

/**
 * Role-Based Menu Configuration
 * 
 * Structure:
 * - id: unique identifier
 * - label: display text
 * - icon: lucide-react icon component
 * - path: route path (null if has children)
 * - children: sub-menu items (optional)
 */

export const ROLE_MENUS = {
  // ============================================
  // ADMIN MENU (MaVaiTro = 1)
  // ============================================
  admin: [
    {
      id: 'map',
      label: 'Bản đồ',
      icon: Map,
      path: '/',
    },
    {
      id: 'profile',
      label: 'Hồ sơ Admin',
      icon: User,
      path: '/profile',
    },
    {
      id: 'accounts',
      label: 'Quản lý tài khoản',
      icon: Users,
      path: null,
      children: [
        { id: 'accounts-admin', label: 'Quản trị viên', path: '/admin/accounts/admins', icon: UserCog },
        { id: 'accounts-lecturer', label: 'Giảng viên', path: '/admin/accounts/lecturers', icon: GraduationCap },
        { id: 'accounts-student', label: 'Sinh viên', path: '/admin/accounts/students', icon: UserCheck },
      ],
    },
    {
      id: 'academic',
      label: 'Quản lý học vụ',
      icon: BookOpen,
      path: null,
      children: [
        { id: 'academic-subjects', label: 'Môn học', path: '/admin/academic/subjects', icon: BookMarked },
        { id: 'academic-courses', label: 'Lớp học phần', path: '/admin/academic/courses', icon: Layers },
      ],
    },
    {
      id: 'events',
      label: 'Quản lý sự kiện',
      icon: Calendar,
      path: '/admin/events',
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      path: '/settings',
    },
  ],

  // ============================================
  // LECTURER MENU (MaVaiTro = 2)
  // ============================================
  lecturer: [
    {
      id: 'map',
      label: 'Bản đồ',
      icon: Map,
      path: '/',
    },
    {
      id: 'profile',
      label: 'Hồ sơ Giảng viên',
      icon: User,
      path: '/profile',
    },
    {
      id: 'schedule',
      label: 'Lịch giảng dạy',
      icon: Calendar,
      path: null,
      children: [
        { id: 'schedule-weekly', label: 'Lịch tuần', path: '/lecturer/schedule/weekly', icon: CalendarDays },
        { id: 'schedule-courses', label: 'Lớp phụ trách', path: '/lecturer/schedule/courses', icon: BookOpen },
      ],
    },
    {
      id: 'activities',
      label: 'Hoạt động',
      icon: Activity,
      path: null,
      children: [
        { id: 'activities-attendance', label: 'Điểm danh', path: '/lecturer/attendance', icon: CheckSquare },
        { id: 'activities-events', label: 'Sự kiện', path: '/lecturer/events', icon: CalendarClock },
      ],
    },
    {
      id: 'statistics',
      label: 'Thống kê',
      icon: BarChart3,
      path: '/lecturer/statistics',
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      path: '/settings',
    },
  ],

  // ============================================
  // STUDENT MENU (MaVaiTro = 3)
  // ============================================
  student: [
    {
      id: 'map',
      label: 'Bản đồ',
      icon: Map,
      path: '/',
    },
    {
      id: 'profile',
      label: 'Hồ sơ Sinh viên',
      icon: User,
      path: '/profile',
    },
    {
      id: 'schedule',
      label: 'Lịch học',
      icon: Calendar,
      path: null,
      children: [
        { id: 'schedule-weekly', label: 'Thời khóa biểu', path: '/student/schedule', icon: CalendarDays },
        { id: 'schedule-register', label: 'Đăng ký học phần', path: '/student/register', icon: ClipboardList },
      ],
    },
    {
      id: 'events',
      label: 'Sự kiện',
      icon: Bell,
      path: null,
      children: [
        { id: 'events-attendance', label: 'Thông báo điểm danh', path: '/student/attendance', icon: CheckSquare },
        { id: 'events-general', label: 'Sự kiện chung', path: '/student/events', icon: CalendarClock },
      ],
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      path: '/settings',
    },
  ],
};

/**
 * Get menu items for a specific role
 * @param {string} role - 'admin' | 'lecturer' | 'student'
 * @returns {Array} Menu items array
 */
export const getMenuByRole = (role) => {
  return ROLE_MENUS[role] || ROLE_MENUS.student;
};

/**
 * Check if a path is for the map page
 * @param {string} path 
 * @returns {boolean}
 */
export const isMapPath = (path) => {
  return path === '/' || path === '/campus';
};

export default ROLE_MENUS;

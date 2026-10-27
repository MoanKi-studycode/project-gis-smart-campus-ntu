import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, Users, AlertTriangle, CheckCircle, XCircle, 
  Filter, Calendar, Clock, MapPin, ChevronRight, 
  BookOpen, Eye, X, ArrowLeft, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Statistics - Lecturer Class Attendance Statistics
 * 
 * Features:
 * - View classes by semester/academic year (database-driven)
 * - Detailed class view with student attendance statistics
 * - Session-by-session attendance matrix
 * - Risk level indicators (Safe/Warning/Banned)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper function for API calls
const fetchApi = async (endpoint, userId) => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId
    }
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
};

// Academic years (generate from current year)
const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    const year = currentYear - i;
    years.push({ value: `${year}-${year + 1}`, label: `${year}-${year + 1}` });
  }
  return years;
};

const ACADEMIC_YEARS = generateAcademicYears();

const SEMESTERS = [
  { value: '', label: 'Tất cả học kỳ' },
  { value: '1', label: 'Học kỳ 1' },
  { value: '2', label: 'Học kỳ 2' },
  { value: '3', label: 'Học kỳ hè' },
];

// Status badge configurations
const STATUS_CONFIG = {
  DANG_HOC: { label: 'Đang học', color: 'bg-green-100 text-green-700 border-green-200' },
  DA_MO: { label: 'Đang mở', color: 'bg-green-100 text-green-700 border-green-200' },
  MO_DANG_KY: { label: 'Mở đăng ký', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  DA_DONG: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200' }
};

const WEEKDAYS = ['', 'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// Progress Bar Component
function AttendanceProgressBar({ percentage }) {
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBgColor = () => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="flex items-center gap-3 min-w-[120px]">
      <div className={`flex-1 h-2 rounded-full ${getBgColor()}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-semibold min-w-[40px] text-right ${
        percentage >= 80 ? 'text-green-600' : 
        percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {percentage}%
      </span>
    </div>
  );
}

// Risk Label Component
function RiskLabel({ level }) {
  const config = {
    safe: { label: 'An toàn', icon: CheckCircle, className: 'bg-green-50 text-green-700 border-green-200' },
    warning: { label: 'Cảnh báo', icon: AlertTriangle, className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    banned: { label: 'Cấm thi', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
  };

  const { label, icon: Icon, className } = config[level] || config.safe;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Class Card Component
function ClassCard({ course, onViewDetails }) {
  const statusConfig = STATUS_CONFIG[course.trangthai] || STATUS_CONFIG.CHO_XAC_NHAN;
  const weekday = WEEKDAYS[course.thu] || '';
  
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{course.tenmon}</h3>
          <p className="text-sm text-gray-500">{course.malop}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
          {statusConfig.label}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span>HK{course.hocky} - {course.namhoc}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock size={14} className="text-gray-400" />
          <span>{weekday}, Tiết {course.matietbatdau}-{course.matietbatdau + course.sotiet - 1}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={14} className="text-gray-400" />
          <span>{course.tenphong || 'Chưa xếp phòng'}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users size={14} className="text-gray-400" />
          <span>{course.tongsinhvien} sinh viên</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Tỷ lệ chuyên cần TB</p>
          <AttendanceProgressBar percentage={parseFloat(course.tylechuyencantb) || 0} />
        </div>
        <button
          onClick={() => onViewDetails(course)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Eye size={16} />
          Chi tiết
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        {course.tongbuoihoc} buổi đã học
      </div>
    </div>
  );
}

// Session Attendance Cell
function AttendanceCell({ status }) {
  if (!status) return <span className="text-gray-300">-</span>;
  
  const config = {
    CO_MAT: { color: 'bg-green-500', label: '✓' },
    MUON: { color: 'bg-yellow-500', label: 'M' },
    VANG: { color: 'bg-red-500', label: '✗' }
  };
  
  const { color, label } = config[status] || { color: 'bg-gray-300', label: '?' };
  
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-white text-xs font-bold ${color}`}>
      {label}
    </span>
  );
}

// ==================================================================================
// DETAIL MODAL COMPONENT
// ==================================================================================

function ClassDetailModal({ course, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [matrixData, setMatrixData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await fetchApi(`/attendance/class/${course.malop}/detailed-statistics`, user.MaSo);
        setData(result.data);
        
        // Also fetch matrix data
        const matrix = await fetchApi(`/attendance/class/${course.malop}/student-attendance-matrix`, user.MaSo);
        setMatrixData(matrix.data);
      } catch (error) {
        console.error('Failed to fetch class details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [course.malop, user.MaSo]);

  const getRiskLevel = (percentage) => {
    if (percentage >= 80) return 'safe';
    if (percentage >= 50) return 'warning';
    return 'banned';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">{data?.classInfo?.tenmon}</h2>
            <p className="text-blue-100 text-sm mt-1">
              {course.malop} • HK{course.hocky} - {course.namhoc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-6 gap-3">
            <StatCard label="Tổng SV" value={data?.summary?.totalStudents || 0} icon={<Users size={18} />} color="blue" />
            <StatCard label="Số buổi" value={data?.summary?.totalSessions || 0} icon={<Calendar size={18} />} color="indigo" />
            <StatCard label="TB chuyên cần" value={`${data?.summary?.avgAttendance || 0}%`} icon={<BarChart3 size={18} />} color="green" />
            <StatCard label="An toàn" value={data?.summary?.safe || 0} icon={<CheckCircle size={18} />} color="green" />
            <StatCard label="Cảnh báo" value={data?.summary?.warning || 0} icon={<AlertTriangle size={18} />} color="yellow" />
            <StatCard label="Cấm thi" value={data?.summary?.banned || 0} icon={<XCircle size={18} />} color="red" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Danh sách sinh viên
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'matrix'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ma trận điểm danh
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Lịch sử buổi học
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'students' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">STT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sinh viên</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Có mặt</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Muộn</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Vắng</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tỷ lệ</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.students?.map((student, index) => (
                    <tr key={student.masv} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {student.hoten?.split(' ').pop()?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.hoten}</p>
                            <p className="text-xs text-gray-500">{student.masv}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-green-600 font-medium">{student.socomat || 0}</td>
                      <td className="px-4 py-3 text-center text-yellow-600 font-medium">{student.somuon || 0}</td>
                      <td className="px-4 py-3 text-center text-red-600 font-medium">{student.sovang || 0}</td>
                      <td className="px-4 py-3">
                        <AttendanceProgressBar percentage={parseFloat(student.tylechuyencan) || 0} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RiskLabel level={getRiskLevel(parseFloat(student.tylechuyencan) || 0)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'matrix' && matrixData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                      Sinh viên
                    </th>
                    {matrixData?.sessions?.map((session, idx) => (
                      <th key={session.maphien} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 min-w-[40px]">
                        B{idx + 1}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 min-w-[80px]">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matrixData?.students?.map((student) => {
                    const presentCount = student.sessions.filter(s => s.trangThai === 'CO_MAT' || s.trangThai === 'MUON').length;
                    const percentage = student.sessions.length > 0 
                      ? Math.round(presentCount / student.sessions.length * 100) 
                      : 0;
                    
                    return (
                      <tr key={student.maSV} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{student.hoTen}</span>
                          </div>
                        </td>
                        {student.sessions.map((session, idx) => (
                          <td key={idx} className="px-2 py-2 text-center">
                            <AttendanceCell status={session.trangThai} />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <span className={`font-semibold ${
                            percentage >= 80 ? 'text-green-600' : 
                            percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {percentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <AttendanceCell status="CO_MAT" /> Có mặt
                </span>
                <span className="flex items-center gap-1">
                  <AttendanceCell status="MUON" /> Muộn
                </span>
                <span className="flex items-center gap-1">
                  <AttendanceCell status="VANG" /> Vắng
                </span>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {data?.sessions?.map((session, index) => {
                const total = (parseInt(session.socomat) || 0) + (parseInt(session.somuon) || 0) + (parseInt(session.sovang) || 0);
                const attendanceRate = total > 0 
                  ? Math.round(((parseInt(session.socomat) || 0) + (parseInt(session.somuon) || 0)) / total * 100) 
                  : 0;
                
                return (
                  <div key={session.maphien} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          Buổi {index + 1}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.thoigianbatdau).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          <CheckCircle size={14} className="inline mr-1" />
                          {session.socomat || 0}
                        </span>
                        <span className="text-yellow-600">
                          <Clock size={14} className="inline mr-1" />
                          {session.somuon || 0}
                        </span>
                        <span className="text-red-600">
                          <XCircle size={14} className="inline mr-1" />
                          {session.sovang || 0}
                        </span>
                      </div>
                      <div className="w-32">
                        <AttendanceProgressBar percentage={attendanceRate} />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {(!data?.sessions || data.sessions.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  Chưa có buổi học nào được điểm danh
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================================================
// MAIN COMPONENT
// ==================================================================================

export default function Statistics() {
  const { user } = useAuth();
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0].value);
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Fetch lecturer's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.MaSo) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (semester) params.append('hocKy', semester);
        if (academicYear) params.append('namHoc', academicYear);
        
        const result = await fetchApi(
          `/attendance/lecturer/${user.MaSo}/statistics?${params.toString()}`,
          user.MaSo
        );
        setCourses(result.data || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.MaSo, academicYear, semester]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (courses.length === 0) return null;
    
    const totalStudents = courses.reduce((sum, c) => sum + (parseInt(c.tongsinhvien) || 0), 0);
    const totalSessions = courses.reduce((sum, c) => sum + (parseInt(c.tongbuoihoc) || 0), 0);
    const avgAttendance = courses.length > 0
      ? courses.reduce((sum, c) => sum + (parseFloat(c.tylechuyencantb) || 0), 0) / courses.length
      : 0;
    
    const activeCourses = courses.filter(c => c.trangthai === 'DANG_HOC' || c.trangthai === 'DA_MO').length;
    const closedCourses = courses.filter(c => c.trangthai === 'DA_DONG').length;

    return {
      totalCourses: courses.length,
      activeCourses,
      closedCourses,
      totalStudents,
      totalSessions,
      avgAttendance: Math.round(avgAttendance * 10) / 10
    };
  }, [courses]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Thống kê điểm danh</h1>
        <p className="text-gray-500 mt-1">Quản lý và theo dõi chuyên cần các lớp học phần</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-400" />
          <h2 className="font-semibold text-gray-700">Bộ lọc</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACADEMIC_YEARS.map(year => (
                <option key={year.value} value={year.value}>{year.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEMESTERS.map(sem => (
                <option key={sem.value} value={sem.value}>{sem.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-4">
          <StatCard label="Tổng lớp HP" value={stats.totalCourses} icon={<BookOpen size={20} />} color="blue" />
          <StatCard label="Đang mở" value={stats.activeCourses} icon={<CheckCircle size={20} />} color="green" />
          <StatCard label="Đã đóng" value={stats.closedCourses} icon={<XCircle size={20} />} color="red" />
          <StatCard label="Tổng SV" value={stats.totalStudents} icon={<Users size={20} />} color="indigo" />
          <StatCard label="Tổng buổi học" value={stats.totalSessions} icon={<Calendar size={20} />} color="yellow" />
          <StatCard label="TB chuyên cần" value={`${stats.avgAttendance}%`} icon={<BarChart3 size={20} />} color="green" />
        </div>
      )}

      {/* Courses List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Không có lớp học phần nào
          </h3>
          <p className="text-gray-500">
            Bạn chưa được phân công giảng dạy lớp nào trong {academicYear}
            {semester && ` - Học kỳ ${semester}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses.map(course => (
            <ClassCard 
              key={course.malop} 
              course={course} 
              onViewDetails={setSelectedCourse}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCourse && (
        <ClassDetailModal 
          course={selectedCourse} 
          onClose={() => setSelectedCourse(null)} 
        />
      )}
    </div>
  );
}

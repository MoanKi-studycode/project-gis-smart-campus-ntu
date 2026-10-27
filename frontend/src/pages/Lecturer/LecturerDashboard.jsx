import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, attendanceApi } from '../../services/api';
import { Calendar, Clock, MapPin, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    activeAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Support multiple ID fields for compatibility
        const lecturerId = user?.MaNguoiDung || user?.id || user?.MaSo;
        if (!lecturerId) return;
        
        const response = await coursesApi.getByLecturer(lecturerId);
        
        // Handle both { success, data } format and direct array
        const classes = response.success ? (response.data || []) : (Array.isArray(response) ? response : []);
        setSchedule(classes.slice(0, 5)); // Show recent 5 classes
        
        // Calculate stats
        const today = new Date().getDay() || 7; // 0 = Sunday -> 7
        const todayClasses = classes.filter(c => c.Thu === today || c.thu === today);
        
        setStats({
          totalClasses: classes.length,
          totalStudents: classes.reduce((sum, c) => sum + (c.SiSoDangKy || c.sisodangky || 0), 0),
          todayClasses: todayClasses.length,
          activeAttendance: classes.filter(c => c.TrangThaiDiemDanh === 'OPEN' || c.trangthaidiemdanh === 'OPEN').length
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userName = user?.name || user?.HoTen || user?.TenNguoiDung || 'Giảng viên';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
            {userName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin chào, {userName}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-sm font-medium">Giảng viên</span>
              <span className="text-gray-400">|</span>
              <span>Mã GV: {user?.id || user?.MaSo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng lớp giảng dạy</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng sinh viên</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lớp hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayClasses}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Điểm danh đang mở</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAttendance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Truy cập nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/lecturer/schedule')}
              className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex flex-col items-center gap-2"
            >
              <Calendar className="text-indigo-600" size={28} />
              <span className="text-sm font-medium text-indigo-700">Xem lịch dạy</span>
            </button>
            <button
              onClick={() => navigate('/lecturer/attendance')}
              className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors flex flex-col items-center gap-2"
            >
              <CheckCircle className="text-green-600" size={28} />
              <span className="text-sm font-medium text-green-700">Điểm danh</span>
            </button>
            <button
              onClick={() => navigate('/campus')}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors flex flex-col items-center gap-2"
            >
              <MapPin className="text-purple-600" size={28} />
              <span className="text-sm font-medium text-purple-700">Bản đồ</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors flex flex-col items-center gap-2"
            >
              <Users className="text-orange-600" size={28} />
              <span className="text-sm font-medium text-orange-700">Hồ sơ cá nhân</span>
            </button>
          </div>
        </div>

        {/* Recent Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lịch dạy gần đây</h2>
            <button 
              onClick={() => navigate('/lecturer/schedule')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Xem tất cả →
            </button>
          </div>
          
          {schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((cls, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                    T{cls.thu}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{cls.tenmon}</p>
                    <p className="text-xs text-gray-500">
                      Tiết {cls.matietbatdau}-{cls.matietbatdau + cls.sotiet - 1} • {cls.tenphong || cls.maphong}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    cls.trangthaidiemdanh === 'OPEN' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cls.trangthaidiemdanh === 'OPEN' ? 'Đang điểm danh' : 'Chưa mở'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Chưa có lịch dạy nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

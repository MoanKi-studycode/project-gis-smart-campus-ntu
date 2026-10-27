import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, attendanceApi } from '../../services/api';
import { Calendar, Clock, MapPin, User, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [schedule, setSchedule] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    todayClasses: 0,
    pendingCheckin: 0,
    completedCheckin: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Support multiple ID fields for compatibility
        const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
        if (!studentId) return;
        
        // Fetch student's schedule
        const scheduleResponse = await coursesApi.getByStudent(studentId);
        // Handle both { success, data } format and direct array
        const classes = scheduleResponse.success ? (scheduleResponse.data || []) : (Array.isArray(scheduleResponse) ? scheduleResponse : []);
        setSchedule(classes.slice(0, 5)); // Show recent 5 classes
        
        // Calculate stats
        const today = new Date().getDay() || 7; // 0 = Sunday -> 7
        const todayClasses = classes.filter(c => c.Thu === today || c.thu === today);
        
        setStats(prev => ({
          ...prev,
          totalCourses: classes.length,
          todayClasses: todayClasses.length
        }));
        
        // Fetch active attendance sessions
        try {
          const attendanceResponse = await attendanceApi.getActiveSessions();
          const sessions = attendanceResponse.success ? (attendanceResponse.data || []) : (Array.isArray(attendanceResponse) ? attendanceResponse : []);
          setActiveAttendance(sessions);
          setStats(prev => ({
            ...prev,
            pendingCheckin: sessions.length
          }));
        } catch (err) {
          console.error('Error fetching attendance:', err);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const handleQuickCheckin = async (sessionId) => {
    try {
      const response = await attendanceApi.checkin(sessionId);
      
      if (response.success || response.MaDiemDanh) {
        toast.success('Điểm danh thành công', 'Bạn đã điểm danh thành công!');
        // Refresh active attendance
        const newResponse = await attendanceApi.getActiveSessions();
        if (newResponse.success) {
          setActiveAttendance(newResponse.data || []);
        }
      } else {
        toast.error('Điểm danh thất bại', response.error || 'Vui lòng thử lại');
      }
    } catch (error) {
      toast.error('Lỗi', 'Lỗi khi điểm danh');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userName = user?.name || user?.HoTen || user?.TenNguoiDung || 'Sinh viên';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
            {userName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xin chào, {userName}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-medium">Sinh viên</span>
              <span className="text-gray-400">|</span>
              <span>MSSV: {user?.id || user?.MaSo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Active Attendance Alert */}
      {activeAttendance.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-orange-600" size={24} />
            <h3 className="font-semibold text-orange-800">Có {activeAttendance.length} phiên điểm danh đang mở!</h3>
          </div>
          <div className="space-y-2">
            {activeAttendance.map((session, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.tenmon || session.malop}</p>
                  <p className="text-sm text-gray-500">Phòng {session.maphong || 'N/A'}</p>
                </div>
                <button
                  onClick={() => handleQuickCheckin(session.maphiendiemdanh)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                >
                  Điểm danh ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Môn đang học</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
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
              <AlertCircle className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Chờ điểm danh</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingCheckin}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Đã điểm danh</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedCheckin}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Truy cập nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/student/schedule')}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex flex-col items-center gap-2"
            >
              <Calendar className="text-blue-600" size={28} />
              <span className="text-sm font-medium text-blue-700">Xem lịch học</span>
            </button>
            <button
              onClick={() => navigate('/student/attendance')}
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
              <User className="text-orange-600" size={28} />
              <span className="text-sm font-medium text-orange-700">Hồ sơ cá nhân</span>
            </button>
          </div>
        </div>

        {/* Recent Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Lịch học gần đây</h2>
            <button 
              onClick={() => navigate('/student/schedule')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả →
            </button>
          </div>
          
          {schedule.length > 0 ? (
            <div className="space-y-3">
              {schedule.map((cls, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
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
                    {cls.trangthaidiemdanh === 'OPEN' ? 'Đang điểm danh' : cls.tengv || 'GV'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Chưa có lịch học nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

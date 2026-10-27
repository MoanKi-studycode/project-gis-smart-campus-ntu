import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi, coursesApi } from '../../services/api';
import { 
  CheckCircle, XCircle, Clock, 
  MapPin, Calendar, Bell, User
} from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Poll for active sessions every 10 seconds
    const interval = setInterval(loadActiveSessions, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = async () => {
    const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
    if (!studentId) return;
    setLoading(true);
    try {
      const [coursesResponse, activeResponse] = await Promise.all([
        coursesApi.getByStudent(studentId),
        attendanceApi.getActiveSessions()
      ]);
      const coursesData = coursesResponse.success ? (coursesResponse.data || []) : (Array.isArray(coursesResponse) ? coursesResponse : []);
      const activeData = activeResponse.success ? (activeResponse.data || []) : (Array.isArray(activeResponse) ? activeResponse : []);
      setCourses(coursesData);
      setActiveSessions(activeData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const activeResponse = await attendanceApi.getActiveSessions();
      const activeData = activeResponse.success ? (activeResponse.data || []) : (Array.isArray(activeResponse) ? activeResponse : []);
      setActiveSessions(activeData);
    } catch (error) {
      console.error('Failed to load active sessions', error);
    }
  };

  const getSessionForCourse = (courseId) => {
    return activeSessions.find(s => 
      (s.malop || s.MaLop || s.MaLopHoc) === courseId
    );
  };

  // Get attendance status for display
  const getAttendanceStatus = (session) => {
    if (!session) return null;
    
    const isOpen = session.trangthai === 'OPEN' || !session.thoigianketthuc;
    const isCheckedIn = session.dadiemdanh || session.DaDiemDanh;
    
    if (isCheckedIn) {
      return {
        type: 'checked',
        label: 'Đã điểm danh',
        color: 'green',
        icon: CheckCircle
      };
    }
    
    if (isOpen) {
      return {
        type: 'pending',
        label: 'Chưa điểm danh',
        color: 'yellow',
        icon: Clock
      };
    }
    
    // Session closed but not checked in = Absent
    return {
      type: 'absent',
      label: 'Vắng mặt',
      color: 'red',
      icon: XCircle
    };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  // Filter active sessions for student's enrolled courses
  const myActiveSessions = activeSessions.filter(s => {
    const sessionCourseId = s.malop || s.MaLop || s.MaLopHoc;
    return courses.some(c => (c.MaLop || c.MaLopHoc) === sessionCourseId);
  });

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Điểm danh</h1>
        <p className="text-gray-500 text-sm mt-1">
          Theo dõi trạng thái điểm danh các lớp học của bạn
        </p>
      </div>

      {/* Active Sessions Alert */}
      {myActiveSessions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shrink-0">
          <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
            <Bell size={20} className="animate-bounce" />
            CÓ {myActiveSessions.length} PHIÊN ĐIỂM DANH ĐANG MỞ!
          </div>
          <p className="text-sm text-green-600">
            Sử dụng popup thông báo ở góc màn hình để điểm danh.
          </p>
        </div>
      )}

      {/* Active Sessions - Show Status Only */}
      {myActiveSessions.length > 0 && (
        <div className="space-y-3 shrink-0">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Phiên điểm danh đang mở
          </h2>
          {myActiveSessions.map(session => {
            const sessionCourseId = session.malop || session.MaLop || session.MaLopHoc;
            const course = courses.find(c => (c.MaLop || c.MaLopHoc) === sessionCourseId);
            const status = getAttendanceStatus(session);
            const sessionId = session.maphien || session.MaPhien;
            const sessionTime = session.thoigianbatdau || session.ThoiGianBatDau;
            
            const StatusIcon = status?.icon || Clock;
            const colorClasses = {
              green: 'bg-green-100 text-green-700 border-green-200',
              yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              red: 'bg-red-100 text-red-700 border-red-200'
            };
            
            return (
              <div 
                key={sessionId}
                className={`p-4 rounded-xl border-2 ${
                  status?.type === 'checked' 
                    ? 'bg-green-50 border-green-200' 
                    : status?.type === 'absent'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {session.tenmon || course?.TenMon || 'Môn học'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{sessionCourseId}</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {session.phong || course?.TenPhong || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> 
                        Mở lúc {sessionTime ? new Date(sessionTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={14} /> {session.tengv || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge Only - No Button */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colorClasses[status?.color || 'yellow']}`}>
                    <StatusIcon size={20} />
                    <span className="font-medium">{status?.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All Courses Overview */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <h2 className="font-semibold text-gray-700">Tất cả môn học</h2>
        {courses.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Bạn chưa đăng ký môn học nào
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => {
              const courseId = course.MaLop || course.MaLopHoc;
              const activeSession = getSessionForCourse(courseId);
              const status = getAttendanceStatus(activeSession);
              
              return (
                <div 
                  key={courseId}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{course.TenMon}</h3>
                    {/* Status indicator */}
                    {status && <StatusBadge status={status} />}
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>{courseId}</div>
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Thứ {course.Thu}, Tiết {course.MaTietBatDau}-{(course.MaTietBatDau || 0) + (course.SoTiet || 1) - 1}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      {course.TenPhong || 'Chưa có phòng'}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">GV: {course.TenGiangVien || 'N/A'}</span>
                    <span className="text-gray-500">{course.SoTinChi} TC</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  if (!status) return null;
  
  const StatusIcon = status.icon;
  const classes = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700'
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${classes[status.color]}`}>
      <StatusIcon size={12} />
      {status.label}
    </span>
  );
}
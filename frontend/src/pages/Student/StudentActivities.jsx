import React, { useState, useEffect } from 'react';
import { eventsApi, attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, Calendar, CheckCircle, Clock, MapPin, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export default function StudentActivities() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
      
      const [eventsResponse, attendanceResponse] = await Promise.all([
        eventsApi.getUpcoming(),
        attendanceApi.getActiveForStudent(studentId).catch(() => ({ data: [] }))
      ]);
      
      // Handle both { success, data } format and direct array
      const eventsData = eventsResponse.success ? (eventsResponse.data || []) : (Array.isArray(eventsResponse) ? eventsResponse : []);
      const attendanceData = attendanceResponse.success ? (attendanceResponse.data || []) : (Array.isArray(attendanceResponse) ? attendanceResponse : []);
      
      setEvents(eventsData);
      setActiveAttendance(attendanceData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (sessionId) => {
    try {
      const response = await attendanceApi.checkin(sessionId);
      if (response.success || response.MaDiemDanh) {
        toast.success('Điểm danh thành công', 'Bạn đã điểm danh thành công!');
        loadData();
      } else {
        toast.error('Điểm danh thất bại', response.error || 'Vui lòng thử lại');
      }
    } catch (error) {
      toast.error('Lỗi', 'Lỗi khi điểm danh: ' + error.message);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'HOI_THAO': return <Users size={20} />;
      case 'KIEM_TRA': return <AlertCircle size={20} />;
      default: return <Bell size={20} />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'HOI_THAO': return 'bg-purple-100 text-purple-600';
      case 'KIEM_TRA': return 'bg-red-100 text-red-600';
      case 'BAO_TRI': return 'bg-orange-100 text-orange-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Hoạt động & Thông báo</h1>
      
      {/* Active Attendance Sessions */}
      {activeAttendance.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-green-700 flex items-center gap-2">
            <Clock size={20} className="animate-pulse" />
            Phiên điểm danh đang mở ({activeAttendance.length})
          </h2>
          {activeAttendance.map((session) => (
            <div 
              key={session.MaPhien} 
              className="p-4 rounded-xl bg-green-50 border border-green-200 shadow-sm flex gap-4 items-center"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <CheckCircle size={20} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{session.TenMon || session.TenLop}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {session.TenPhong} • Còn {session.ThoiGianConLai || '15'} phút
                </p>
              </div>

              <button 
                onClick={() => handleCheckin(session.MaPhien)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Điểm danh ngay
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700">Sự kiện sắp diễn ra</h2>
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Không có sự kiện nào sắp diễn ra.</p>
        ) : (
          events.map((event) => (
            <div key={event.MaSuKien} className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getEventColor(event.LoaiSuKien)}`}>
                {getEventIcon(event.LoaiSuKien)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{event.TenSuKien}</h3>
                <p className="text-gray-600 text-sm mt-1">{event.MoTa}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(event.ThoiGianBatDau).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(event.ThoiGianBatDau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.DiaDiem && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {event.DiaDiem}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

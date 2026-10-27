import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, Calendar, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { eventsApi, attendanceApi } from '../../services/api';

/**
 * Student Notifications Page
 * View notifications from active attendance sessions and upcoming events
 */

export default function StudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, attendance, event
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(new Set()); // Track locally read notifications

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const studentId = user?.MaSo || user?.maso;
      const result = [];

      // Load active attendance sessions (real-time notifications)
      try {
        const attendanceRes = await attendanceApi.getActiveSessions(studentId);
        const sessions = attendanceRes.data || attendanceRes || [];
        
        sessions.forEach(session => {
          result.push({
            id: `attendance-${session.maphien || session.MaPhien}`,
            type: 'attendance',
            title: 'Điểm danh đang mở',
            message: `Môn ${session.tenmon || session.TenMon || session.malop} đang mở điểm danh. Vui lòng điểm danh ngay!`,
            time: formatTimeAgo(session.thoigianbatdau || session.ThoiGianBatDau),
            read: readIds.has(`attendance-${session.maphien || session.MaPhien}`),
            icon: CheckCircle,
            color: 'text-green-500',
            bgColor: 'bg-green-50',
            sessionId: session.maphien || session.MaPhien
          });
        });
      } catch (e) {
        console.log('Could not load attendance notifications');
      }

      // Load upcoming events
      try {
        const eventsRes = await eventsApi.getForUser(studentId);
        const events = eventsRes.data || eventsRes || [];
        
        events.filter(e => {
          const status = e.TrangThai || e.trangthai;
          return status === 'UPCOMING' || status === 'ACTIVE';
        }).slice(0, 5).forEach(event => {
          const eventId = event.masukien || event.MaSuKien;
          result.push({
            id: `event-${eventId}`,
            type: 'event',
            title: event.tensukien || event.TenSuKien || 'Sự kiện',
            message: event.mota || event.MoTa || 'Sự kiện sắp diễn ra',
            time: formatDateTime(event.thoigianbatdau || event.ThoiGianBatDau),
            read: readIds.has(`event-${eventId}`),
            icon: Calendar,
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
          });
        });
      } catch (e) {
        console.log('Could not load event notifications');
      }

      // Sort by unread first, then by time
      result.sort((a, b) => {
        if (a.read !== b.read) return a.read ? 1 : -1;
        return 0;
      });

      setNotifications(result);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return `${Math.floor(diff / 1440)} ngày trước`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setReadIds(prev => new Set([...prev, id]));
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(new Set(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-gray-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={loadNotifications}
            className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'unread', label: 'Chưa đọc' },
          { key: 'attendance', label: 'Điểm danh' },
          { key: 'event', label: 'Sự kiện' },
          { key: 'schedule', label: 'Lịch học' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p>Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                notification.read 
                  ? 'bg-white border-gray-200 hover:border-gray-300' 
                  : 'bg-blue-50 border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className="flex gap-4">
                <div className={`${notification.bgColor} p-2 rounded-lg h-fit`}>
                  <notification.icon className={notification.color} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

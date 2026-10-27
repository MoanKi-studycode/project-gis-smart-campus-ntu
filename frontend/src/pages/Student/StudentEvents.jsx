import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, MapPin, Clock, Bell, CheckCircle, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { eventsApi, attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * Student - Events Page (General Events + Active Attendance Sessions)
 * Database-driven events and attendance sessions
 */

export default function StudentEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flyToDirectly } = useMap();
  const [events, setEvents] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const maSo = user?.MaSo || user?.maso;
      
      // Load both events and active attendance sessions in parallel
      const [eventsRes, sessionsRes] = await Promise.all([
        eventsApi.getForUser(maSo).catch(() => ({ data: [] })),
        attendanceApi.getActiveSessions(maSo).catch(() => ({ data: [] }))
      ]);
      
      const eventsData = eventsRes.data || eventsRes || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      
      const sessionsData = sessionsRes.data || sessionsRes || [];
      setActiveSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setEvents([]);
      setActiveSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event) => {
    const thoiGianBatDau = event.thoigianbatdau || event.ThoiGianBatDau;
    const thoiGianKetThuc = event.thoigianketthuc || event.ThoiGianKetThuc;
    const now = new Date();
    
    if (!thoiGianBatDau) return 'unknown';
    
    const startDate = new Date(thoiGianBatDau);
    const endDate = thoiGianKetThuc ? new Date(thoiGianKetThuc) : null;
    
    if (endDate && now > endDate) return 'past';
    if (now >= startDate && (!endDate || now <= endDate)) return 'ongoing';
    return 'upcoming';
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra';
      case 'ongoing': return 'Đang diễn ra';
      case 'past': return 'Đã diễn ra';
      default: return 'Chưa xác định';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-50 text-blue-600';
      case 'ongoing': return 'bg-green-100 text-green-700';
      case 'past': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Combine events and attendance sessions
  const allItems = [
    ...activeSessions.map(session => ({
      ...session,
      type: 'attendance',
      id: session.maphien || session.MaPhien,
    })),
    ...events.map(event => ({
      ...event,
      type: 'event',
      id: event.mask || event.MaSK,
    }))
  ];

  const filteredItems = allItems.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleViewOnMap = (item) => {
    const tenToaNha = item.tentoanha || item.TenToaNha || 'G6';
    const tenPhong = item.tenphong || item.TenPhong || '';
    const coords = getBuildingCoords(tenToaNha);
    
    flyToDirectly({
      lat: coords.lat,
      lng: coords.lng,
      name: `${tenToaNha} - ${tenPhong}`,
      buildingId: tenToaNha,
    }, navigate);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50">
            <CalendarClock className="text-amber-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sự kiện</h1>
            <p className="text-sm text-gray-500">
              {activeSessions.length} phiên điểm danh • {events.length} sự kiện
            </p>
          </div>
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Tất cả', icon: Bell },
          { key: 'attendance', label: 'Điểm danh', icon: CheckCircle },
          { key: 'event', label: 'Sự kiện chung', icon: CalendarClock },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <f.icon size={16} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'Chưa có sự kiện hoặc phiên điểm danh nào' 
              : filter === 'attendance' 
                ? 'Không có phiên điểm danh đang mở'
                : 'Chưa có sự kiện nào'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isAttendance = item.type === 'attendance';
            
            if (isAttendance) {
              // Attendance session
              const tenMon = item.tenmon || item.TenMon;
              const tenLop = item.malop || item.MaLop;
              const thoiGianKetThuc = item.thoigianketthuc || item.ThoiGianKetThuc;
              const tenPhong = item.tenphong || item.TenPhong;
              const tenToaNha = item.tentoanha || item.TenToaNha;
              
              return (
                <div 
                  key={`session-${item.id}`} 
                  className="rounded-xl border p-5 hover:shadow-md transition-shadow bg-green-50 border-green-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <h3 className="font-semibold text-gray-800">
                          Điểm danh - {tenMon || tenLop}
                        </h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                          Đang mở
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {thoiGianKetThuc && (
                          <div className="text-red-500 font-medium flex items-center gap-1">
                            ⏰ Hạn: {formatTime(thoiGianKetThuc)}
                          </div>
                        )}
                        {(tenToaNha || tenPhong) && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{tenToaNha} {tenPhong && `- ${tenPhong}`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(tenToaNha || tenPhong) && (
                      <button
                        onClick={() => handleViewOnMap(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <MapPin size={16} />
                        Xem bản đồ
                      </button>
                    )}
                  </div>
                </div>
              );
            } else {
              // Event
              const tenSK = item.tensk || item.TenSK;
              const moTa = item.mota || item.MoTa;
              const thoiGianBatDau = item.thoigianbatdau || item.ThoiGianBatDau;
              const tenPhong = item.tenphong || item.TenPhong;
              const tenToaNha = item.tentoanha || item.TenToaNha;
              const status = getEventStatus(item);
              
              return (
                <div 
                  key={`event-${item.id}`} 
                  className="rounded-xl border p-5 hover:shadow-md transition-shadow bg-white border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CalendarClock size={20} className="text-amber-600" />
                        <h3 className="font-semibold text-gray-800">{tenSK}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      
                      {moTa && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{moTa}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-gray-400" />
                          <span>{formatDateTime(thoiGianBatDau)}</span>
                        </div>
                        {(tenToaNha || tenPhong) && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span>{tenToaNha} {tenPhong && `- ${tenPhong}`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(tenToaNha || tenPhong) && (
                      <button
                        onClick={() => handleViewOnMap(item)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <MapPin size={16} />
                        Xem bản đồ
                      </button>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

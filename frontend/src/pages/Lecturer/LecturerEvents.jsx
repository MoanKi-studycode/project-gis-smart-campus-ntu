import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, MapPin, Clock, Users, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * Lecturer - Events Page
 * Database-driven events list for lecturers
 */

export default function LecturerEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flyToDirectly } = useMap();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get events for the current user (lecturer)
      const response = await eventsApi.getForUser(user?.MaSo || user?.maso);
      const eventsData = response.data || response || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to load events:', error);
      // If API fails, try to get all events
      try {
        const allEvents = await eventsApi.getAll();
        const data = allEvents.data || allEvents || [];
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        setEvents([]);
      }
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
      case 'ongoing': return 'bg-green-50 text-green-600';
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

  const filteredEvents = events.filter(e => {
    const status = getEventStatus(e);
    if (filter === 'all') return true;
    if (filter === 'upcoming') return status === 'upcoming' || status === 'ongoing';
    if (filter === 'past') return status === 'past';
    return true;
  });

  const handleViewOnMap = (event) => {
    const tenToaNha = event.tentoanha || event.TenToaNha || event.toaNha || 'G6';
    const tenPhong = event.tenphong || event.TenPhong || event.diaDiem || '';
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50">
            <CalendarClock className="text-teal-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sự kiện</h1>
            <p className="text-sm text-gray-500">{events.length} sự kiện</p>
          </div>
        </div>
        <button 
          onClick={loadEvents}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'upcoming', label: 'Sắp diễn ra' },
          { key: 'past', label: 'Đã diễn ra' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'all' ? 'Chưa có sự kiện nào' : `Không có sự kiện ${filter === 'upcoming' ? 'sắp diễn ra' : 'đã diễn ra'}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const maSK = event.mask || event.MaSK;
            const tenSK = event.tensk || event.TenSK;
            const moTa = event.mota || event.MoTa;
            const thoiGianBatDau = event.thoigianbatdau || event.ThoiGianBatDau;
            const thoiGianKetThuc = event.thoigianketthuc || event.ThoiGianKetThuc;
            const tenPhong = event.tenphong || event.TenPhong;
            const tenToaNha = event.tentoanha || event.TenToaNha;
            const soLuongToiDa = event.soluongtoida || event.SoLuongToiDa;
            const status = getEventStatus(event);
            
            return (
              <div key={maSK} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{tenSK}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </div>
                    
                    {moTa && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{moTa}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        <span>{formatDateTime(thoiGianBatDau)}</span>
                        {thoiGianKetThuc && (
                          <span className="text-gray-400">- {formatDateTime(thoiGianKetThuc)}</span>
                        )}
                      </div>
                      {(tenToaNha || tenPhong) && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{tenToaNha} {tenPhong && `- ${tenPhong}`}</span>
                        </div>
                      )}
                      {soLuongToiDa && (
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400" />
                          <span>Tối đa {soLuongToiDa} người</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(tenToaNha || tenPhong) && (
                    <button
                      onClick={() => handleViewOnMap(event)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <MapPin size={16} />
                      Xem bản đồ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { eventsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Bell, Calendar, Clock, MapPin, Users } from 'lucide-react';

export default function LecturerActivities() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsApi.getUpcoming();
      // Handle both { success, data } format and direct array
      const data = response.success ? (response.data || []) : (Array.isArray(response) ? response : []);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'HOI_THAO': return <Users size={20} />;
      case 'KIEM_TRA': return <Clock size={20} />;
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Hoạt động & Thông báo</h1>
      
      <div className="space-y-4">
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

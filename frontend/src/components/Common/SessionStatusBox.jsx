import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Wifi, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * SessionStatusBox - Top right mini box showing:
 * - GPS Location
 * - Real-time date/time
 * - Session status
 */
export default function SessionStatusBox() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState({ lat: null, lng: null, status: 'Đang lấy vị trí...' });
  const [sessionStart] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // GPS Location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: null, lng: null, status: 'GPS không hỗ trợ' });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          status: 'GPS'
        });
      },
      (error) => {
        let errorMsg = 'Lỗi GPS';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'GPS bị từ chối';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Không có tín hiệu GPS';
            break;
          case error.TIMEOUT:
            errorMsg = 'GPS timeout';
            break;
        }
        setLocation({ lat: null, lng: null, status: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate session duration
  const getSessionDuration = () => {
    const diff = Math.floor((currentTime - sessionStart) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="fixed top-4 right-4 z-[1000] flex items-start gap-0">
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-white/95 backdrop-blur-sm rounded-l-lg shadow-lg border border-r-0 border-gray-200 p-2 hover:bg-gray-50 transition-colors"
        title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        {isCollapsed ? (
          <ChevronLeft size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
      </button>

      {/* Content Box */}
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-lg rounded-l-none shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 p-0 border-l-0 opacity-0' : 'w-[220px] p-3 opacity-100'
        }`}
      >
        {!isCollapsed && (
          <>
            {/* Header with session indicator */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-medium text-gray-600">
                  {isOnline ? 'Đang hoạt động' : 'Mất kết nối'}
                </span>
              </div>
              <Wifi size={14} className={isOnline ? 'text-green-500' : 'text-red-500'} />
            </div>

            {/* Location */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-gray-700">Vị trí: {location.status}</div>
                {location.lat && (
                  <div className="text-gray-500 font-mono text-[10px]">
                    {location.lat}, {location.lng}
                  </div>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-2 mb-2">
              <Clock size={16} className="text-orange-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-gray-800 text-sm tabular-nums">
                  {formatTime(currentTime)}
                </div>
                <div className="text-gray-500 capitalize">
                  {formatDate(currentTime)}
                </div>
              </div>
            </div>

            {/* Session Duration */}
            <div className="pt-2 border-t border-gray-100">
              <div className="text-[10px] text-gray-400 flex justify-between">
                <span>Phiên làm việc:</span>
                <span className="font-mono font-medium text-gray-600">{getSessionDuration()}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

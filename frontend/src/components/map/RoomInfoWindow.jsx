/**
 * RoomInfoWindow.jsx
 * InfoWindow displayed on building center showing real-time classroom status
 * Styled like Google Maps info window
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Clock, User, BookOpen, Calendar,
  Loader2, CheckCircle, AlertTriangle, Play, Timer
} from 'lucide-react';
import buildingApi from '../../services/buildingApi';

// Status configurations
const STATUS_CONFIG = {
  EMPTY: {
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    iconBg: 'bg-gray-100',
    icon: CheckCircle,
    label: 'Phòng trống'
  },
  UPCOMING: {
    color: 'yellow',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    iconBg: 'bg-amber-100',
    icon: Timer,
    label: 'Sắp bắt đầu'
  },
  IN_PROGRESS: {
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconBg: 'bg-green-100',
    icon: Play,
    label: 'Đang diễn ra'
  },
  ENDING_SOON: {
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconBg: 'bg-red-100',
    icon: AlertTriangle,
    label: 'Sắp kết thúc'
  }
};

export default function RoomInfoWindow({ 
  roomData, // { building, room, location }
  onClose,
  style = {} // Position style passed from parent
}) {
  const [roomStatus, setRoomStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch room status
  const fetchRoomStatus = useCallback(async () => {
    if (!roomData?.room?.maphong) return;

    setLoading(true);
    setError(null);

    try {
      const status = await buildingApi.getRoomStatus(roomData.room.maphong);
      setRoomStatus(status);
    } catch (err) {
      console.error('Failed to fetch room status:', err);
      setError('Không thể tải trạng thái phòng');
      // Set default empty state
      setRoomStatus({
        type: 'EMPTY',
        status: 'EMPTY',
        statusLabel: 'Phòng trống',
        color: 'gray',
        data: null
      });
    } finally {
      setLoading(false);
    }
  }, [roomData?.room?.maphong]);

  useEffect(() => {
    fetchRoomStatus();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchRoomStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchRoomStatus]);

  if (!roomData) return null;

  const config = STATUS_CONFIG[roomStatus?.status] || STATUS_CONFIG.EMPTY;
  const StatusIcon = config.icon;

  return (
    <div 
      className="absolute z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        ...style,
        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.25))'
      }}
    >
      {/* Main Card */}
      <div className={`w-72 bg-white rounded-xl overflow-hidden border-2 ${config.borderColor}`}>
        {/* Header */}
        <div className={`${config.bgColor} px-4 py-3 flex items-center justify-between border-b ${config.borderColor}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center`}>
              <StatusIcon size={18} className={config.textColor} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {roomData.room.tenphong}
              </h3>
              <p className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Đang tải...</span>
            </div>
          ) : roomStatus?.type === 'EMPTY' ? (
            // Empty Room State
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Phòng đang trống</p>
              <p className="text-xs text-gray-400 mt-1">Không có lịch học hoặc sự kiện</p>
            </div>
          ) : roomStatus?.type === 'CLASS' ? (
            // Class Info
            <div className="space-y-3">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor}`}>
                <span className={`w-2 h-2 rounded-full ${config.color === 'green' ? 'bg-green-500' : config.color === 'yellow' ? 'bg-amber-500' : config.color === 'red' ? 'bg-red-500' : 'bg-gray-400'} animate-pulse`}></span>
                <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {roomStatus.data?.giangVien?.avatar ? (
                    <img 
                      src={roomStatus.data.giangVien.avatar} 
                      alt={roomStatus.data.giangVien.hoTen}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Giảng viên</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {roomStatus.data?.giangVien?.hoTen || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* Subject/Details */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Môn học</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {roomStatus.data?.tenMon || 'Chưa cập nhật'}
                  </p>
                  {roomStatus.data?.maLop && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lớp: {roomStatus.data.maLop}
                    </p>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Thời gian</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {roomStatus.data?.thoiGian?.batDau || '--:--'} - {roomStatus.data?.thoiGian?.ketThuc || '--:--'}
                  </p>
                </div>
              </div>
            </div>
          ) : roomStatus?.type === 'EVENT' ? (
            // Event Info
            <div className="space-y-3">
              {/* Status Badge */}
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50`}>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-blue-700">Sự kiện</span>
              </div>

              {/* Event Manager */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {roomStatus.data?.chuSuKien?.avatar ? (
                    <img 
                      src={roomStatus.data.chuSuKien.avatar} 
                      alt={roomStatus.data.chuSuKien.hoTen}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} className="text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Người quản lý</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {roomStatus.data?.chuSuKien?.hoTen || 'Quản trị viên'}
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Chi tiết</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {roomStatus.data?.tenSuKien || 'Sự kiện'}
                  </p>
                  {roomStatus.data?.moTa && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {roomStatus.data.moTa}
                    </p>
                  )}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Thời gian</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {roomStatus.data?.thoiGian?.batDau || '--:--'} - {roomStatus.data?.thoiGian?.ketThuc || '--:--'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-3 p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pointer/Arrow */}
      <div className="flex justify-center -mt-px">
        <div 
          className={`w-4 h-4 bg-white border-r-2 border-b-2 ${config.borderColor} transform rotate-45 -translate-y-2`}
          style={{ marginTop: '-8px' }}
        />
      </div>
    </div>
  );
}

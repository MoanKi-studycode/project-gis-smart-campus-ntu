import React, { useState, useEffect } from 'react';
import { X, Clock, User, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { roomStatusApi, referenceApi, attendanceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function BuildingInfoBox({ building, onClose, user }) {
  const toast = useToast();
  const [floor, setFloor] = useState('1');
  const [room, setRoom] = useState(null);
  const [roomsOnFloor, setRoomsOnFloor] = useState([]);
  const [roomStatus, setRoomStatus] = useState(null); // { type: 'CLASS'|'EVENT'|'EMPTY', status, data }
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load rooms when floor changes
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const allRooms = await referenceApi.getClassrooms(building.MaToaNha, floor);
        const rooms = Array.isArray(allRooms) ? allRooms : [];
        setRoomsOnFloor(rooms);
        if (rooms.length > 0) {
          setRoom(rooms[0].maphong || rooms[0].MaPhong);
        } else {
          setRoom(null);
        }
      } catch (error) {
        console.error('Failed to load rooms:', error);
        setRoomsOnFloor([]);
      }
    };
    if (building.type !== 'utility') {
      loadRooms();
    }
  }, [building, floor]);

  // Check status when room changes
  useEffect(() => {
    const checkStatus = async () => {
      if (!room) return;
      setLoading(true);
      try {
        const info = await roomStatusApi.getByRoom(room);
        setRoomStatus(info);
      } catch (error) {
        console.error('Failed to get room status:', error);
        setRoomStatus({ status: 'EMPTY', statusLabel: 'Phòng trống' });
      }
      setLoading(false);
    };
    checkStatus();
  }, [room]);

  const handleAttendance = async (action) => {
    if (!roomStatus?.data?.maLop) return;
    
    setActionLoading(true);
    try {
      if (action === 'START') {
        await attendanceApi.createSession(roomStatus.data.maLop, 15);
        toast.success('Thành công', 'Đã mở điểm danh');
      } else {
        const session = await attendanceApi.getClassOpenSession(roomStatus.data.maLop);
        if (session?.MaPhien) {
          await attendanceApi.closeSession(session.MaPhien);
          toast.success('Thành công', 'Đã đóng điểm danh');
        }
      }
    } catch (error) {
      toast.error('Thao tác thất bại', error.message || 'Lỗi kết nối');
    }
    setActionLoading(false);
  };

  // Case: Utility
  if (building.type === 'utility') {
    return (
      <div className="w-[350px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-left duration-300">
        <div className="h-40 bg-gray-200 relative">
          <img 
            src="https://via.placeholder.com/350x160?text=Utility" 
            alt={building.name} 
            className="w-full h-full object-cover"
          />
          <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white text-gray-700">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-800">{building.name}</h2>
          <p className="text-gray-600 mt-2 text-sm">{building.description || 'Tiện ích công cộng'}</p>
        </div>
      </div>
    );
  }

  const isOccupied = roomStatus?.type === 'CLASS' || roomStatus?.type === 'EVENT';

  // Case: Building
  return (
    <div className="w-[350px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] animate-in slide-in-from-left duration-300">
      {/* 1. Image */}
      <div className="h-40 bg-gray-200 relative shrink-0">
        <img 
          src={`https://via.placeholder.com/350x160?text=${building.MaToaNha}`} 
          alt={building.TenToaNha} 
          className="w-full h-full object-cover"
        />
        <button onClick={onClose} className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white text-gray-700">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 overflow-y-auto custom-scrollbar">
        {/* 2. General Info */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">{building.TenToaNha}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin size={14} /> {building.MaToaNha}
          </p>
        </div>

        {/* 3. Selectors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tầng</label>
            <select 
              value={floor} 
              onChange={(e) => setFloor(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
            >
              {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Tầng {f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phòng</label>
            <select 
              value={room || ''} 
              onChange={(e) => setRoom(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              disabled={roomsOnFloor.length === 0}
            >
              {roomsOnFloor.map(r => (
                <option key={r.maphong || r.MaPhong} value={r.maphong || r.MaPhong}>
                  {r.tenphong || r.TenPhong}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Real-time Status Box */}
        <div className={`p-4 rounded-xl border ${
            loading ? 'bg-gray-50 border-gray-100' :
            isOccupied ? 'bg-blue-50 border-blue-100' : 
            'bg-green-50 border-green-100'
        }`}>
          {loading ? (
            <div className="flex items-center justify-center text-sm text-gray-500 py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang tải trạng thái...
            </div>
          ) : roomStatus?.type === 'CLASS' ? (
            <div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                   {roomStatus.statusLabel || 'Đang có lớp'}
                 </span>
                 <span className={`w-2 h-2 rounded-full ${
                   roomStatus.status === 'IN_PROGRESS' ? 'bg-green-500' :
                   roomStatus.status === 'UPCOMING' ? 'bg-yellow-500' :
                   roomStatus.status === 'ENDING_SOON' ? 'bg-red-500' :
                   'bg-blue-500'
                 } animate-pulse`}></span>
               </div>
               <h3 className="font-bold text-gray-800 text-lg leading-tight">{roomStatus.data?.tenMon}</h3>
               <div className="mt-2 space-y-1">
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                   <User size={14} /> <span>{roomStatus.data?.giangVien?.hoTen}</span>
                 </div>
                 {roomStatus.data?.thoiGian && (
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Clock size={14} /> <span>{roomStatus.data.thoiGian.batDau} - {roomStatus.data.thoiGian.ketThuc}</span>
                   </div>
                 )}
               </div>
            </div>
          ) : roomStatus?.type === 'EVENT' ? (
            <div>
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
                   {roomStatus.statusLabel || 'Sự kiện'}
                 </span>
                 <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
               </div>
               <h3 className="font-bold text-gray-800 text-lg leading-tight">{roomStatus.data?.tenSuKien}</h3>
               {roomStatus.data?.moTa && (
                 <p className="text-sm text-gray-600 mt-1">{roomStatus.data.moTa}</p>
               )}
            </div>
          ) : (
            <div className="text-center py-2">
               <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mb-2">
                 <Clock size={20} />
               </div>
               <p className="font-medium text-green-800">Phòng trống</p>
               <p className="text-xs text-green-600 mt-1">Có thể sử dụng tự do</p>
            </div>
          )}
        </div>

        {/* 5. Attendance Control (Lecturer Only) */}
        {user?.role === 'lecturer' && roomStatus?.type === 'CLASS' && roomStatus.data?.giangVien?.maSo === user.MaSo && (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Điểm danh</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleAttendance('START')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Bắt đầu'}
                    </button>
                    <button 
                        onClick={() => handleAttendance('STOP')}
                        disabled={actionLoading}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Kết thúc'}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, MapPin, Users, Clock, Calendar, BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { roomStatusApi, referenceApi, attendanceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function BuildingInfoPanel({ building, onClose, user }) {
  const toast = useToast();
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset when building changes
  useEffect(() => {
    if (building) {
      if (building.type === 'UTILITY') {
        setFloors([]);
        setSelectedFloor(null);
        setRooms([]);
        setSelectedRoom(null);
      } else {
        // Load floors/rooms for this building
        const loadRooms = async () => {
          try {
            const allRooms = await referenceApi.getClassrooms(building.MaToaNha);
            const buildingRooms = Array.isArray(allRooms) ? allRooms : [];
            
            // Extract unique floors
            const uniqueFloors = [...new Set(buildingRooms.map(r => r.sotang || r.SoTang))].sort();
            setFloors(uniqueFloors);
            
            // Default to Floor 1
            if (uniqueFloors.length > 0) {
              setSelectedFloor(uniqueFloors[0]);
            }
          } catch (error) {
            console.error('Failed to load rooms:', error);
            setFloors([]);
          }
        };
        loadRooms();
      }
    }
  }, [building]);

  // Update rooms when floor changes
  useEffect(() => {
    if (building && selectedFloor) {
      const loadRooms = async () => {
        try {
          const floorRooms = await referenceApi.getClassrooms(building.MaToaNha, selectedFloor);
          setRooms(Array.isArray(floorRooms) ? floorRooms : []);
          setSelectedRoom(null); // Reset room selection
          setRoomStatus(null);
        } catch (error) {
          console.error('Failed to load rooms:', error);
          setRooms([]);
        }
      };
      loadRooms();
    }
  }, [building, selectedFloor]);

  // Fetch room status when room selected
  useEffect(() => {
    if (selectedRoom) {
      const fetchStatus = async () => {
        setLoading(true);
        try {
          const maPhong = selectedRoom.maphong || selectedRoom.MaPhong;
          const status = await roomStatusApi.getByRoom(maPhong);
          setRoomStatus(status);
        } catch (error) {
          console.error("Failed to fetch room status", error);
          setRoomStatus({ status: 'EMPTY', statusLabel: 'Phòng trống' });
        } finally {
          setLoading(false);
        }
      };
      fetchStatus();
    } else {
      setRoomStatus(null);
    }
  }, [selectedRoom]);

  const handleAttendance = async (action) => {
    if (!roomStatus?.data?.maLop) return;
    
    setActionLoading(true);
    try {
      if (action === 'START') {
        await attendanceApi.createSession(roomStatus.data.maLop, 15);
        setAttendanceStatus('OPEN');
        toast.success('Thành công', 'Đã mở điểm danh!');
      } else {
        const session = await attendanceApi.getClassOpenSession(roomStatus.data.maLop);
        if (session?.MaPhien) {
          await attendanceApi.closeSession(session.MaPhien);
        }
        setAttendanceStatus('CLOSED');
        toast.success('Thành công', 'Đã đóng điểm danh!');
      }
    } catch (e) {
      console.error(e);
      toast.error('Thao tác thất bại', e.message || 'Lỗi kết nối');
    }
    setActionLoading(false);
  };

  if (!building) return null;

  const isOccupied = roomStatus?.type === 'CLASS' || roomStatus?.type === 'EVENT';

  return (
    <div className="absolute top-20 left-4 w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-40 flex flex-col max-h-[calc(100vh-140px)] animate-in slide-in-from-left-4 duration-300 border border-gray-200">
      {/* Header Image */}
      <div className="relative h-48 bg-gray-200">
        <img 
          src={building.image || 'https://via.placeholder.com/400x200?text=No+Image'} 
          alt={building.TenToaNha}
          className="w-full h-full object-cover"
        />
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm"
        >
          <X size={20} />
        </button>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
          <h2 className="text-2xl font-bold text-white leading-tight">{building.TenToaNha}</h2>
          <p className="text-white/90 text-sm flex items-center gap-1 mt-1">
            <MapPin size={14} />
            {building.MaToaNha}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
        <p className="text-gray-600 mb-6 leading-relaxed">{building.description}</p>

        {building.type === 'UTILITY' ? (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
              <CheckCircle size={18} />
              <span>Đang hoạt động</span>
            </div>
            <p className="text-sm text-green-600">Mở cửa: 07:00 - 21:00</p>
          </div>
        ) : (
          <div className="space-y-6">
            {floors.length === 0 ? (
               <div className="bg-gray-50 border border-gray-100 rounded-lg p-6 text-center">
                 <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                 <p className="text-gray-600 font-medium">Chưa có dữ liệu phòng học</p>
                 <p className="text-xs text-gray-500 mt-1">Thông tin chi tiết đang được cập nhật.</p>
               </div>
            ) : (
            <>
            {/* Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tầng</label>
                <select 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={selectedFloor || ''}
                  onChange={(e) => setSelectedFloor(Number(e.target.value))}
                >
                  {floors.map(f => (
                    <option key={f} value={f}>Tầng {f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Phòng</label>
                <select 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={selectedRoom?.MaPhong || ''}
                  onChange={(e) => {
                    const r = rooms.find(rm => rm.MaPhong === e.target.value);
                    setSelectedRoom(r);
                  }}
                  disabled={!selectedFloor}
                >
                  <option value="">Chọn phòng...</option>
                  {rooms.map(r => (
                    <option key={r.MaPhong} value={r.MaPhong}>Phòng {r.TenPhong}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Status Card */}
            {selectedRoom && (
              <div className={`rounded-xl border p-4 transition-all duration-300 ${
                loading ? 'opacity-50' : 'opacity-100'
              } ${
                isOccupied
                  ? 'bg-red-50 border-red-100' 
                  : 'bg-green-50 border-green-100'
              }`}>
                {loading ? (
                  <div className="flex items-center justify-center py-4 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang tải...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {selectedRoom.tenphong || selectedRoom.TenPhong}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? 'bg-red-200 text-red-700' 
                            : 'bg-green-200 text-green-700'
                        }`}>
                          {roomStatus?.statusLabel || (isOccupied ? 'Đang học' : 'Trống')}
                        </span>
                      </h3>
                    </div>

                    {roomStatus?.type === 'CLASS' ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <BookOpen size={18} className="text-red-500 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold">Môn học</div>
                            <div className="text-sm font-medium text-gray-800">{roomStatus.data?.tenMon}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Users size={18} className="text-red-500 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold">Giảng viên</div>
                            <div className="text-sm font-medium text-gray-800">{roomStatus.data?.giangVien?.hoTen}</div>
                          </div>
                        </div>
                        {roomStatus.data?.thoiGian && (
                          <div className="flex items-start gap-3">
                            <Clock size={18} className="text-red-500 mt-0.5" />
                            <div>
                              <div className="text-xs text-gray-500 uppercase font-semibold">Thời gian</div>
                              <div className="text-sm font-medium text-gray-800">
                                {roomStatus.data.thoiGian.batDau} - {roomStatus.data.thoiGian.ketThuc}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Lecturer Actions */}
                        {user && user.role === 'lecturer' && user.MaSo === roomStatus.data?.giangVien?.maSo && (
                          <div className="pt-3 mt-3 border-t border-red-200">
                            <button 
                              onClick={() => handleAttendance('START')}
                              disabled={actionLoading}
                              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                  <Clock size={16} />
                                  Mở điểm danh
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : roomStatus?.type === 'EVENT' ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Calendar size={18} className="text-pink-500 mt-0.5" />
                          <div>
                            <div className="text-xs text-gray-500 uppercase font-semibold">Sự kiện</div>
                            <div className="text-sm font-medium text-gray-800">{roomStatus.data?.tenSuKien}</div>
                          </div>
                        </div>
                        {roomStatus.data?.moTa && (
                          <p className="text-sm text-gray-600">{roomStatus.data.moTa}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-green-700 text-sm flex items-center justify-center gap-2">
                          <CheckCircle size={16} />
                          Phòng đang trống
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
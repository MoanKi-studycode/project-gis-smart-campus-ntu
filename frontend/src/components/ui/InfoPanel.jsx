import React, { useState, useEffect } from 'react';
import { X, Clock, User, MapPin, Loader2 } from 'lucide-react';
import { roomStatusApi, referenceApi, attendanceApi } from '../../services/api';

export default function InfoPanel({ building, onClose, user }) {
  const [floor, setFloor] = useState('1');
  const [room, setRoom] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [attendanceStarted, setAttendanceStarted] = useState(false);
  const [roomStatus, setRoomStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  // Load rooms for this building
  useEffect(() => {
    if (building?.id) {
      loadRooms();
    }
  }, [building?.id]);

  // Fetch room status when room changes
  useEffect(() => {
    if (room) {
      fetchRoomStatus();
    }
  }, [room]);

  const loadRooms = async () => {
    try {
      const roomsData = await referenceApi.getClassrooms(building.id);
      const roomsList = roomsData || [];
      setRooms(roomsList);
      
      // Set default room
      const floorRooms = roomsList.filter(r => String(r.Tang || r.tang) === floor);
      if (floorRooms.length > 0) {
        setRoom(floorRooms[0].MaPhong || floorRooms[0].maphong);
      }
    } catch (error) {
      console.error('Failed to load rooms', error);
    }
  };

  const fetchRoomStatus = async () => {
    if (!room) return;
    setLoadingStatus(true);
    try {
      const statusData = await roomStatusApi.getByRoom(room);
      if (statusData) {
        setRoomStatus(statusData.status || 'EMPTY');
        setCurrentClass(statusData.currentClass || null);
        setActiveSession(statusData.activeSession || null);
        setAttendanceStarted(!!statusData.activeSession);
      } else {
        setRoomStatus('EMPTY');
        setCurrentClass(null);
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Failed to fetch room status', error);
      setRoomStatus('EMPTY');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Update room list when floor changes
  useEffect(() => {
    const floorRooms = rooms.filter(r => String(r.Tang || r.tang) === floor);
    if (floorRooms.length > 0) {
      setRoom(floorRooms[0].MaPhong || floorRooms[0].maphong);
    }
  }, [floor, rooms]);

  const handleAttendance = async () => {
    if (!currentClass) return;
    
    if (user?.role === 'GiangVien' || user?.MaVaiTro === 2) {
      // Lecturer: Toggle attendance session
      try {
        setIsCheckingIn(true);
        if (attendanceStarted) {
          await attendanceApi.closeSession(activeSession?.MaPhien);
          setAttendanceStarted(false);
          setActiveSession(null);
        } else {
          const result = await attendanceApi.createSession(currentClass.MaLop);
          setAttendanceStarted(true);
          setActiveSession(result.session || result);
        }
        fetchRoomStatus();
      } catch (error) {
        alert('Lỗi: ' + error.message);
      } finally {
        setIsCheckingIn(false);
      }
    } else {
      // Student: Check in
      if (!activeSession) {
        alert('Chưa có phiên điểm danh nào đang diễn ra');
        return;
      }
      setIsCheckingIn(true);
      try {
        await attendanceApi.checkin(activeSession.MaPhien);
        alert('Điểm danh thành công!');
      } catch (error) {
        alert('Điểm danh thất bại: ' + error.message);
      } finally {
        setIsCheckingIn(false);
      }
    }
  };

  const getFloorRooms = () => {
    return rooms.filter(r => String(r.Tang || r.tang) === floor);
  };

  const getStatusDisplay = () => {
    switch (roomStatus) {
      case 'EMPTY': return { label: 'Trống', class: 'bg-gray-100 text-gray-700' };
      case 'UPCOMING': return { label: 'Sắp có lớp', class: 'bg-yellow-100 text-yellow-700' };
      case 'IN_PROGRESS': return { label: 'Đang học', class: 'bg-green-100 text-green-700' };
      case 'ENDING_SOON': return { label: 'Sắp kết thúc', class: 'bg-orange-100 text-orange-700' };
      default: return { label: 'Trống', class: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="w-[350px] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)] animate-in slide-in-from-left duration-300">
      {/* Header Image */}
      <div className="h-40 bg-gray-200 relative">
        <img 
          src={`/images/buildings/${building.id}.jpg`}
          alt={building.name} 
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = '/images/tree.avif'; }}
        />
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* General Info */}
        <h2 className="text-xl font-bold text-gray-800">{building.name}</h2>
        <p className="text-sm text-gray-500 mt-1">Khu vực trung tâm • {building.id}</p>

        {/* Selectors */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Tầng</label>
            <select 
              value={floor} 
              onChange={(e) => setFloor(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Tầng {f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">Phòng</label>
            <select 
              value={room} 
              onChange={(e) => setRoom(e.target.value)}
              className="w-full mt-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
            >
              {getFloorRooms().length > 0 ? (
                getFloorRooms().map(r => (
                  <option key={r.MaPhong || r.maphong} value={r.MaPhong || r.maphong}>
                    {r.TenPhong || r.tenphong || r.MaPhong || r.maphong}
                  </option>
                ))
              ) : (
                <option value="">Không có phòng</option>
              )}
            </select>
          </div>
        </div>

        {/* Room Details */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Trạng thái</span>
            {loadingStatus ? (
              <Loader2 className="animate-spin text-gray-400" size={16} />
            ) : (
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusDisplay.class}`}>
                {statusDisplay.label}
              </span>
            )}
          </div>

          {currentClass && (roomStatus === 'IN_PROGRESS' || roomStatus === 'ENDING_SOON') && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Môn học</p>
                <p className="font-medium text-gray-800">{currentClass.TenMon || currentClass.tenmon}</p>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">GV. {currentClass.TenGiangVien || currentClass.tengiangvien}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {currentClass.GioBatDau || currentClass.giobatdau} - {currentClass.GioKetThuc || currentClass.gioketthuc}
                </span>
              </div>
            </div>
          )}
          
          {roomStatus === 'EMPTY' && (
            <p className="text-sm text-gray-400 italic">Phòng đang trống</p>
          )}
        </div>

        {/* Attendance Section */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" /> Điểm danh
          </h3>
          
          {!user ? (
            <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
              Vui lòng đăng nhập để điểm danh
            </div>
          ) : !currentClass ? (
            <div className="p-3 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
              Không có lớp học trong phòng này
            </div>
          ) : (
            <>
              {user.role === 'GiangVien' || user.MaVaiTro === 2 ? (
                <button 
                  onClick={handleAttendance}
                  disabled={isCheckingIn}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    attendanceStarted 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                  }`}
                >
                  {isCheckingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Đang xử lý...
                    </span>
                  ) : attendanceStarted ? 'Kết thúc điểm danh' : 'Bắt đầu điểm danh'}
                </button>
              ) : (
                <button 
                  onClick={handleAttendance}
                  disabled={!attendanceStarted || isCheckingIn}
                  className={`w-full py-3 rounded-xl font-medium transition-colors ${
                    !attendanceStarted
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                  }`}
                >
                  {isCheckingIn ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Đang xử lý...
                    </span>
                  ) : 'Điểm danh ngay'}
                </button>
              )}
              
              {(user.role === 'SinhVien' || user.MaVaiTro === 3) && !attendanceStarted && (
                <p className="text-xs text-center text-gray-400 mt-2">
                  Chưa có phiên điểm danh nào đang diễn ra
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

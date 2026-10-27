import React, { useEffect, useState } from 'react';
import { roomStatusApi, attendanceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapPin, User, BookOpen, Clock, PlayCircle, StopCircle, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function RoomInfoBox({ roomId, onClose }) {
  const { user } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState('CLOSED'); // CLOSED | OPEN
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const data = await roomStatusApi.getByRoom(roomId);
        setInfo(data);
        
        // Check if there's an active attendance session
        if (data?.type === 'CLASS' && data?.data?.maLop) {
          try {
            const session = await attendanceApi.getClassOpenSession(data.data.maLop);
            if (session && session.MaPhien) {
              setAttendanceStatus('OPEN');
            }
          } catch {
            // No active session
          }
        }
      } catch (error) {
        console.error('Failed to fetch room info:', error);
        setInfo({ status: 'EMPTY', statusLabel: 'Phòng trống' });
      }
      setLoading(false);
    };
    if (roomId) fetchInfo();
  }, [roomId]);

  const handleAttendanceToggle = async () => {
    if (!info?.data?.maLop) return;
    
    setActionLoading(true);
    try {
      if (attendanceStatus === 'CLOSED') {
        // Start attendance session
        await attendanceApi.createSession(info.data.maLop, 15); // 15 minutes duration
        setAttendanceStatus('OPEN');
        toast.success('Thành công', 'Đã mở điểm danh');
      } else {
        // Get and close the open session
        const session = await attendanceApi.getClassOpenSession(info.data.maLop);
        if (session?.MaPhien) {
          await attendanceApi.closeSession(session.MaPhien);
        }
        setAttendanceStatus('CLOSED');
        toast.success('Thành công', 'Đã đóng điểm danh');
      }
    } catch (error) {
      toast.error('Thao tác thất bại', error.message || 'Lỗi kết nối');
    }
    setActionLoading(false);
  };

  if (!roomId) return null;

  const isEmptyRoom = !info || info.status === 'EMPTY' || info.type === 'EMPTY';
  const isClassRoom = info?.type === 'CLASS';
  const isEventRoom = info?.type === 'EVENT';

  return (
    <div className="absolute bottom-6 left-6 z-40 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <MapPin size={16} className="text-blue-600" />
          {roomId}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">Đóng</button>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang tải thông tin...
          </div>
        ) : isEmptyRoom ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
              <Clock size={24} />
            </div>
            <p className="text-green-700 font-medium">Phòng trống</p>
            <p className="text-xs text-gray-500 mt-1">Hiện không có lớp học nào.</p>
          </div>
        ) : isClassRoom ? (
          <div className="space-y-3">
            {/* Status badge */}
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              info.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
              info.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-700' :
              info.status === 'ENDING_SOON' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {info.statusLabel}
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-blue-600"><BookOpen size={18} /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Môn học</p>
                <p className="font-medium text-gray-900">{info.data?.tenMon}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 text-purple-600"><User size={18} /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Giảng viên</p>
                <p className="font-medium text-gray-900">{info.data?.giangVien?.hoTen}</p>
              </div>
            </div>

            {info.data?.thoiGian && (
              <div className="flex items-start gap-3">
                <div className="mt-1 text-orange-600"><Clock size={18} /></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Thời gian</p>
                  <p className="font-medium text-gray-900">
                    {info.data.thoiGian.batDau} - {info.data.thoiGian.ketThuc}
                  </p>
                </div>
              </div>
            )}

            {/* Lecturer Action Button */}
            {user?.role === 'lecturer' && user?.MaSo === info.data?.giangVien?.maSo && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <button
                  onClick={handleAttendanceToggle}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-sm transition-all ${
                    attendanceStatus === 'CLOSED'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200 shadow-lg animate-pulse'
                  } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : attendanceStatus === 'CLOSED' ? (
                    <>
                      <PlayCircle size={18} /> Bắt đầu điểm danh
                    </>
                  ) : (
                    <>
                      <StopCircle size={18} /> Kết thúc điểm danh
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : isEventRoom ? (
          <div className="space-y-3">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              info.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
              info.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {info.statusLabel}
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-1 text-pink-600"><Calendar size={18} /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Sự kiện</p>
                <p className="font-medium text-gray-900">{info.data?.tenSuKien}</p>
              </div>
            </div>
            
            {info.data?.moTa && (
              <p className="text-sm text-gray-600">{info.data.moTa}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

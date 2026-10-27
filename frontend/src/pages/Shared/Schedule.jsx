import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, referenceApi } from '../../services/api';
import { Calendar, Clock, MapPin, User, RefreshCw } from 'lucide-react';

export default function Schedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Use MaSo for both lecturer and student
      const userId = user.MaSo || user.maso;
      const role = user.role || user.MaVaiTro;
      
      if (!userId) {
        console.warn('No user ID (MaSo) found:', user);
        setLoading(false);
        return;
      }
      
      // Load periods for time display
      const periodsRes = await referenceApi.getPeriods();
      const periodsData = periodsRes.data || periodsRes || [];
      setPeriods(periodsData);
      
      // Load schedule based on role
      let data = [];
      if (role === 'lecturer' || role === 2) {
        const res = await coursesApi.getByLecturer(userId);
        data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
      } else {
        // Student or default
        const res = await coursesApi.getByStudent(userId);
        data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
      }
      
      // Sort: Day (Thu) -> Period (MaTietBatDau)
      const sorted = [...data].sort((a, b) => {
        const thuA = a.Thu || a.thu || 0;
        const thuB = b.Thu || b.thu || 0;
        if (thuA !== thuB) return thuA - thuB;
        const tietA = a.MaTietBatDau || a.matietbatdau || 0;
        const tietB = b.MaTietBatDau || b.matietbatdau || 0;
        return tietA - tietB;
      });
      setSchedule(sorted);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodTime = (periodId, numPeriods = 1) => {
    const startPeriod = periods.find(p => (p.MaTiet || p.matiet) === periodId);
    const endPeriod = periods.find(p => (p.MaTiet || p.matiet) === (periodId + numPeriods - 1));
    if (!startPeriod) return '';
    const start = startPeriod.GioBatDau || startPeriod.giobatdau || '';
    const end = endPeriod ? (endPeriod.GioKetThuc || endPeriod.gioketthuc || '') : '';
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải thời khóa biểu...</div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Thời khóa biểu
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Học kỳ 1 / 2025-2026
          </div>
          <button
            onClick={fetchSchedule}
            className="text-gray-500 hover:text-gray-700"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 text-sm shrink-0">
            <div className="col-span-2">Thứ / Tiết</div>
            <div className="col-span-4">Môn học</div>
            <div className="col-span-3">Địa điểm</div>
            <div className="col-span-3">Giảng viên</div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[500px]">
            {schedule.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {schedule.map((cls, index) => {
                        const thu = cls.Thu || cls.thu;
                        const maTiet = cls.MaTietBatDau || cls.matietbatdau;
                        const soTiet = cls.SoTiet || cls.sotiet || 3;
                        const tenMon = cls.TenMon || cls.tenmon;
                        const maMon = cls.MaMon || cls.mamon;
                        const maLop = cls.MaLop || cls.malop;
                        const tenToaNha = cls.TenToaNha || cls.tentoanha || '';
                        const tenPhong = cls.TenPhong || cls.tenphong || '';
                        const tenGV = cls.TenGiangVien || cls.tengiangvien || cls.TenGV || '';
                        
                        return (
                            <div key={index} className="grid grid-cols-12 gap-4 p-4 hover:bg-blue-50/50 transition-colors items-center">
                                <div className="col-span-2">
                                    <div className="font-bold text-gray-800">Thứ {thu}</div>
                                    <div className="text-xs text-gray-500 mt-1">Tiết {maTiet} - {maTiet + soTiet - 1}</div>
                                    <div className="text-xs text-blue-600 font-medium mt-0.5">{getPeriodTime(maTiet, soTiet)}</div>
                                </div>
                                <div className="col-span-4">
                                    <div className="font-semibold text-gray-900">{tenMon}</div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5">{maMon} • {maLop}</div>
                                </div>
                                <div className="col-span-3 flex items-center gap-2 text-gray-600 text-sm">
                                    <MapPin size={14} className="text-gray-400 shrink-0" />
                                    <span>{tenToaNha}{tenPhong ? ` - ${tenPhong}` : ''}</span>
                                </div>
                                <div className="col-span-3 flex items-center gap-2 text-gray-600 text-sm">
                                    <User size={14} className="text-gray-400 shrink-0" />
                                    <span>{tenGV || 'Chưa phân công'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 text-center text-gray-400">
                    Không có lịch học nào.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

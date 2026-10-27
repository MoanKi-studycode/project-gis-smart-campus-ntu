import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { coursesApi, referenceApi } from '../services/api';
import { Calendar, Clock, MapPin, User, RefreshCw } from 'lucide-react';

export default function SchedulePage() {
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
        const res = await coursesApi.getByStudent(userId);
        data = res.success ? (res.data || []) : (Array.isArray(res) ? res : []);
      }
      
      // Filter for today
      const today = new Date();
      const vnWeekday = today.getDay() === 0 ? 8 : today.getDay() + 1;
      const todayClasses = data.filter(c => (c.Thu || c.thu) === vnWeekday);
      
      // Sort by period
      const sorted = todayClasses.sort((a, b) => {
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
    return `${start?.slice(0, 5) || ''} - ${end?.slice(0, 5) || ''}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải lịch học...</div>;
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          {user?.role === 'lecturer' || user?.MaVaiTro === 2 ? 'Lịch Dạy Hôm Nay' : 'Lịch Học Hôm Nay'}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <button onClick={fetchSchedule} className="text-gray-500 hover:text-gray-700">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            📅
          </div>
          <p className="text-gray-500 font-medium">Hôm nay không có lịch học/dạy nào.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedule.map((item, index) => {
            const time = getPeriodTime(item.MaTietBatDau || item.matietbatdau, item.SoTiet || item.sotiet || 1);
            const isTheory = (item.SoTiet || item.sotiet || 3) <= 2;
            
            return (
              <div key={item.MaLop || item.malop || index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-sm ${
                  isTheory ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  <span className="text-xs font-normal opacity-90">{time.split(' - ')[0]}</span>
                  <span className="text-lg">{(item.MaTietBatDau || item.matietbatdau)}h</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-800">{item.TenMon || item.tenmon}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isTheory ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {isTheory ? 'Lý thuyết' : 'Thực hành'}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{item.TenPhong || item.tenphong || `Phòng ${item.MaPhong || item.maphong}`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{item.TenGiangVien || item.tengiangvien || 'Chưa phân công'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

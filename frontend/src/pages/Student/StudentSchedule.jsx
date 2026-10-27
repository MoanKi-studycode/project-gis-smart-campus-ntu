import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, referenceApi } from '../../services/api';
import { Calendar, Clock, MapPin, User, BookOpen, Building } from 'lucide-react';

export default function StudentSchedule() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [currentWeekday, setCurrentWeekday] = useState(new Date().getDay() + 1); // Convert to Vietnamese weekday

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // Use MaSo (student ID like 'sv001') not MaNguoiDung
    const studentId = user?.MaSo || user?.maso;
    if (!studentId) {
      console.warn('No student ID found in user object:', user);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [coursesResponse, periodsResponse] = await Promise.all([
        coursesApi.getByStudent(studentId),
        referenceApi.getPeriods()
      ]);
      // Handle both { success, data } format and direct array
      const coursesData = coursesResponse.success ? (coursesResponse.data || []) : (Array.isArray(coursesResponse) ? coursesResponse : []);
      const periodsData = periodsResponse.success ? (periodsResponse.data || []) : (Array.isArray(periodsResponse) ? periodsResponse : []);
      console.log('Loaded student schedule:', { studentId, courses: coursesData.length });
      setCourses(coursesData);
      setPeriods(periodsData);
    } catch (error) {
      console.error('Failed to load schedule', error);
    } finally {
      setLoading(false);
    }
  };

  const weekdays = [
    { value: 2, label: 'Thứ 2', short: 'T2' },
    { value: 3, label: 'Thứ 3', short: 'T3' },
    { value: 4, label: 'Thứ 4', short: 'T4' },
    { value: 5, label: 'Thứ 5', short: 'T5' },
    { value: 6, label: 'Thứ 6', short: 'T6' },
    { value: 7, label: 'Thứ 7', short: 'T7' },
    { value: 8, label: 'Chủ nhật', short: 'CN' }
  ];

  const getPeriodInfo = (periodId) => {
    const period = periods.find(p => p.MaTiet === periodId);
    return period ? { start: period.GioBatDau, end: period.GioKetThuc } : { start: '', end: '' };
  };

  const getCoursesByDay = (dayValue) => {
    return courses.filter(c => c.Thu === dayValue).sort((a, b) => a.MaTietBatDau - b.MaTietBatDau);
  };

  const getTodayCourses = () => {
    const today = new Date().getDay();
    const vnWeekday = today === 0 ? 8 : today + 1;
    return getCoursesByDay(vnWeekday);
  };

  const getRandomColor = (seed) => {
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-700',
      'bg-green-50 border-green-200 text-green-700',
      'bg-purple-50 border-purple-200 text-purple-700',
      'bg-orange-50 border-orange-200 text-orange-700',
      'bg-pink-50 border-pink-200 text-pink-700',
      'bg-cyan-50 border-cyan-200 text-cyan-700'
    ];
    return colors[seed % colors.length];
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải thời khóa biểu...</div>
      </div>
    );
  }

  const todayCourses = getTodayCourses();
  const totalCredits = courses.reduce((sum, c) => sum + (c.SoTinChi || 0), 0);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thời khóa biểu</h1>
          <p className="text-gray-500 text-sm mt-1">
            Học kỳ 1, năm học 2025-2026 • {courses.length} môn học • {totalCredits} tín chỉ
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Danh sách
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Lịch tuần
          </button>
        </div>
      </div>

      {/* Today's Classes */}
      {todayCourses.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shrink-0">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Calendar size={18} /> Lịch học hôm nay
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {todayCourses.map((course, idx) => {
              const periodInfo = getPeriodInfo(course.MaTietBatDau);
              return (
                <div key={course.MaLopHoc} className="bg-white rounded-lg p-3 min-w-[200px] border border-blue-100">
                  <div className="font-medium text-gray-900 truncate">{course.TenMon}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Tiết {course.MaTietBatDau}-{course.MaTietBatDau + course.SoTiet - 1}
                    <span className="ml-2 text-xs">({periodInfo.start})</span>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} /> {course.TenPhong || 'Chưa có'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <BookOpen size={48} className="mb-4 text-gray-300" />
          <p>Chưa đăng ký môn học nào</p>
        </div>
      ) : viewMode === 'list' ? (
        // List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600">Mã lớp</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Môn học</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Giảng viên</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Thời gian</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Phòng</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Tín chỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map((course, idx) => {
                  const periodInfo = getPeriodInfo(course.MaTietBatDau);
                  return (
                    <tr key={course.MaLopHoc} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{course.MaLop}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{course.TenMon}</div>
                        <div className="text-sm text-gray-500">{course.MaMon}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {course.TenGiangVien || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          {weekdays.find(w => w.value === course.Thu)?.label}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Clock size={14} className="text-gray-400" />
                          Tiết {course.MaTietBatDau}-{course.MaTietBatDau + course.SoTiet - 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-gray-400" />
                          {course.TenPhong || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                          {course.SoTinChi || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Calendar View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          <div className="grid grid-cols-7 gap-px bg-gray-200 h-full">
            {weekdays.map((day, dayIdx) => {
              const dayCourses = getCoursesByDay(day.value);
              const isToday = day.value === currentWeekday;
              return (
                <div key={day.value} className={`bg-white flex flex-col ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                  <div className={`px-3 py-2 text-center border-b ${isToday ? 'bg-blue-500 text-white' : 'bg-gray-50'}`}>
                    <div className="font-semibold">{day.label}</div>
                    <div className={`text-xs ${isToday ? 'text-blue-100' : 'text-gray-500'}`}>
                      {dayCourses.length} lớp
                    </div>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {dayCourses.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-4">Không có lớp</div>
                    ) : (
                      dayCourses.map((course, idx) => {
                        const periodInfo = getPeriodInfo(course.MaTietBatDau);
                        return (
                          <div 
                            key={course.MaLopHoc}
                            className={`p-2 rounded-lg border cursor-pointer hover:shadow transition-shadow ${getRandomColor(idx)}`}
                          >
                            <div className="font-medium text-sm truncate">{course.TenMon}</div>
                            <div className="text-xs mt-1">
                              Tiết {course.MaTietBatDau}-{course.MaTietBatDau + course.SoTiet - 1}
                            </div>
                            <div className="text-xs mt-1 flex items-center gap-1">
                              <MapPin size={10} /> {course.TenPhong || '-'}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
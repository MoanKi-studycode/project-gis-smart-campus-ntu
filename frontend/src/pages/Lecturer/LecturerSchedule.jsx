import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, referenceApi } from '../../services/api';
import { Calendar, Clock, MapPin, Users, BookOpen } from 'lucide-react';

export default function LecturerSchedule() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list | calendar
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // Use MaSo (lecturer ID like 'gv001') not MaNguoiDung
    const lecturerId = user?.MaSo || user?.maso;
    if (!lecturerId) {
      console.warn('No lecturer ID found in user object:', user);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [coursesResponse, periodsResponse] = await Promise.all([
        coursesApi.getByLecturer(lecturerId),
        referenceApi.getPeriods()
      ]);
      // Handle both { success, data } format and direct array
      const coursesData = coursesResponse.success ? (coursesResponse.data || []) : (Array.isArray(coursesResponse) ? coursesResponse : []);
      const periodsData = periodsResponse.success ? (periodsResponse.data || []) : (Array.isArray(periodsResponse) ? periodsResponse : []);
      console.log('Loaded lecturer schedule:', { lecturerId, courses: coursesData.length });
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
    { value: 8, label: 'CN', short: 'CN' }
  ];

  const getPeriodTime = (periodId) => {
    const period = periods.find(p => p.MaTiet === periodId);
    return period ? `${period.GioBatDau} - ${period.GioKetThuc}` : '';
  };

  const getCoursesByDay = (dayValue) => {
    return courses.filter(c => c.Thu === dayValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DANG_HOC':
      case 'DA_MO': return 'bg-green-100 text-green-700';
      case 'MO_DANG_KY':
      case 'DA_DUYET': return 'bg-blue-100 text-blue-700';
      case 'CHO_XAC_NHAN':
      case 'CHO_DUYET': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DANG_HOC': return 'Đang học';
      case 'DA_MO': return 'Đang dạy';
      case 'MO_DANG_KY': return 'Mở đăng ký';
      case 'DA_DUYET':
      case 'DA_XAC_NHAN': return 'Đã xác nhận';
      case 'CHO_DUYET':
      case 'CHO_XAC_NHAN': return 'Chờ xác nhận';
      case 'DA_DONG': return 'Đã đóng';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải lịch giảng dạy...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch giảng dạy</h1>
          <p className="text-gray-500 text-sm mt-1">
            Học kỳ 1, năm học 2025-2026 • {courses.length} lớp học phần
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

      {courses.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <BookOpen size={48} className="mb-4 text-gray-300" />
          <p>Chưa có lớp học phần nào</p>
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
                  <th className="px-6 py-4 font-semibold text-gray-600">Thời gian</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Phòng</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Sĩ số</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {courses.map(course => (
                  <tr key={course.MaLopHoc} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{course.MaLop}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{course.TenMon}</div>
                      <div className="text-sm text-gray-500">{course.MaMon}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {weekdays.find(w => w.value === course.Thu)?.label}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Clock size={14} className="text-gray-400" />
                        Tiết {course.MaTietBatDau}-{course.MaTietBatDau + course.SoTiet - 1}
                        <span className="text-xs">({getPeriodTime(course.MaTietBatDau)})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        {course.TenPhong || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        {course.SoSinhVien || 0}/{course.SiSoToiDa}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(course.TrangThai)}`}>
                        {getStatusLabel(course.TrangThai)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Calendar View
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
          <div className="grid grid-cols-7 gap-px bg-gray-200 h-full">
            {weekdays.map(day => {
              const dayCourses = getCoursesByDay(day.value);
              return (
                <div key={day.value} className="bg-white flex flex-col">
                  <div className="bg-gray-50 px-3 py-2 text-center border-b">
                    <div className="font-semibold text-gray-700">{day.label}</div>
                    <div className="text-xs text-gray-500">{dayCourses.length} lớp</div>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                    {dayCourses.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-4">Không có lớp</div>
                    ) : (
                      dayCourses.map(course => (
                        <div 
                          key={course.MaLopHoc}
                          className="p-2 rounded-lg bg-blue-50 border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <div className="font-medium text-blue-900 text-sm truncate">{course.TenMon}</div>
                          <div className="text-xs text-blue-700 mt-1">
                            Tiết {course.MaTietBatDau}-{course.MaTietBatDau + course.SoTiet - 1}
                          </div>
                          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {course.TenPhong || '-'}
                          </div>
                        </div>
                      ))
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
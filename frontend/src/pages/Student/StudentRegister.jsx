import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Check, X, BookOpen, Loader2, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi, referenceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

/**
 * Student - Course Registration Page
 * Uses real database data for course registration
 */

const WEEKDAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'CN' }
];

export default function StudentRegister() {
  const { user } = useAuth();
  const toast = useToast();
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [selectedHocKy, setSelectedHocKy] = useState(1);
  const [selectedNamHoc, setSelectedNamHoc] = useState('2025-2026');

  useEffect(() => {
    if (user) {
      loadCourses();
    }
  }, [user, selectedHocKy, selectedNamHoc]);

  const loadCourses = async () => {
    const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
    if (!studentId) return;
    
    setLoading(true);
    try {
      const params = { hocKy: selectedHocKy, namHoc: selectedNamHoc };
      const [availableRes, registeredRes] = await Promise.all([
        coursesApi.getAvailableForRegistration(studentId, params),
        coursesApi.getRegisteredByStudent(studentId, params)
      ]);
      
      const availableData = availableRes.success ? (availableRes.data || []) : (Array.isArray(availableRes) ? availableRes : []);
      const registeredData = registeredRes.success ? (registeredRes.data || []) : (Array.isArray(registeredRes) ? registeredRes : []);
      
      setAvailableCourses(availableData);
      setRegisteredCourses(registeredData);
    } catch (error) {
      console.error('Failed to load courses', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekdayLabel = (value) => {
    const day = WEEKDAYS.find(d => d.value === value);
    return day ? day.label : `T${value}`;
  };

  const filteredCourses = availableCourses.filter(c => {
    const tenMon = c.tenmon || c.TenMon || '';
    const maLop = c.malop || c.MaLop || '';
    const tenGV = c.tengiangvien || c.TenGiangVien || '';
    return tenMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           maLop.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tenGV.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCredits = registeredCourses.reduce((sum, c) => sum + (c.sotinchi || c.SoTinChi || 0), 0);

  const handleRegister = async (course) => {
    const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
    const courseId = course.malop || course.MaLop;
    
    setEnrolling(courseId);
    try {
      await coursesApi.studentEnroll(studentId, courseId);
      toast.success('Đăng ký thành công', `Đã đăng ký lớp ${course.tenmon || course.TenMon}`);
      await loadCourses();
    } catch (error) {
      toast.error('Đăng ký thất bại', error.message || 'Lỗi không xác định');
    } finally {
      setEnrolling(null);
    }
  };

  const handleUnregister = async (course) => {
    const studentId = user?.MaNguoiDung || user?.id || user?.MaSo;
    const courseId = course.malop || course.MaLop;
    
    const confirmed = await confirmAction('Bạn có chắc chắn muốn hủy đăng ký lớp học phần này?', 'Hủy đăng ký');
    if (!confirmed) return;
    
    setCancelling(courseId);
    try {
      await coursesApi.studentCancelEnrollment(studentId, courseId);
      toast.success('Hủy thành công', 'Đã hủy đăng ký lớp học phần');
      await loadCourses();
    } catch (error) {
      toast.error('Hủy đăng ký thất bại', error.message || 'Lỗi không xác định');
    } finally {
      setCancelling(null);
    }
  };

  const isRegistered = (courseId) => {
    return registeredCourses.some(c => (c.malop || c.MaLop) === courseId);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-50">
            <ClipboardList className="text-green-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Đăng ký học phần</h1>
            <p className="text-sm text-gray-500">Học kỳ {selectedHocKy}, {selectedNamHoc}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Semester filter */}
          <select
            value={selectedHocKy}
            onChange={(e) => setSelectedHocKy(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
          >
            <option value={1}>Học kỳ 1</option>
            <option value={2}>Học kỳ 2</option>
            <option value={3}>Học kỳ hè</option>
          </select>
          
          {/* Year filter */}
          <select
            value={selectedNamHoc}
            onChange={(e) => setSelectedNamHoc(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl text-sm"
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
          </select>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Tổng tín chỉ</p>
            <p className="text-2xl font-bold text-blue-600">{totalCredits}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Available Courses */}
        <div className="flex flex-col min-h-0">
          <h2 className="font-semibold text-gray-800 mb-4 shrink-0">
            Học phần có thể đăng ký ({filteredCourses.length})
          </h2>
          
          {/* Search */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm học phần..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 overflow-y-auto flex-1">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p>Không có học phần nào mở đăng ký</p>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const courseId = course.malop || course.MaLop;
                const alreadyRegistered = course.dadangky || course.DaDangKy || isRegistered(courseId);
                const conLai = course.conlai ?? course.ConLai ?? 0;
                const isFull = conLai <= 0;
                
                return (
                  <div key={courseId} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {courseId}
                          </span>
                          {(course.handangky || course.HanDangKy) && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                              <Calendar size={12} />
                              Hạn: {new Date(course.handangky || course.HanDangKy).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-800 mt-2">{course.tenmon || course.TenMon}</h3>
                        <p className="text-sm text-gray-500 mt-1">{course.tengiangvien || course.TenGiangVien || 'Chưa có GV'}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            {course.sotinchi || course.SoTinChi || 0} TC
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {getWeekdayLabel(course.thu || course.Thu)} - Tiết {course.matietbatdau || course.MaTietBatDau}-{(course.matietbatdau || course.MaTietBatDau) + (course.sotiet || course.SoTiet) - 1}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {course.tenphong || course.TenPhong || 'Chưa có'}
                          </span>
                          <span className={`flex items-center gap-1 ${conLai <= 10 ? 'text-red-500 font-medium' : ''}`}>
                            <Users size={12} />
                            Còn {conLai} chỗ
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRegister(course)}
                        disabled={alreadyRegistered || isFull || enrolling === courseId}
                        className={`p-2 rounded-lg transition-colors ${
                          alreadyRegistered
                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                            : isFull
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : enrolling === courseId
                            ? 'bg-blue-100 text-blue-400'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {enrolling === courseId ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Check size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Registered Courses */}
        <div className="flex flex-col min-h-0">
          <h2 className="font-semibold text-gray-800 mb-4 shrink-0">
            Học phần đã đăng ký ({registeredCourses.length})
          </h2>
          
          <div className="space-y-3 overflow-y-auto flex-1">
            {registeredCourses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p>Chưa đăng ký học phần nào</p>
              </div>
            ) : (
              registeredCourses.map((course) => {
                const courseId = course.malop || course.MaLop;
                const courseStatus = course.trangthai || course.TrangThai;
                const canCancel = courseStatus === 'MO_DANG_KY';
                
                return (
                  <div key={courseId} className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            {courseId}
                          </span>
                          {!canCancel && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              Đang học
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-800 mt-2">{course.tenmon || course.TenMon}</h3>
                        <p className="text-sm text-gray-500 mt-1">{course.tengiangvien || course.TenGiangVien}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen size={12} />
                            {course.sotinchi || course.SoTinChi || 0} TC
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {getWeekdayLabel(course.thu || course.Thu)} - Tiết {course.matietbatdau || course.MaTietBatDau}-{(course.matietbatdau || course.MaTietBatDau) + (course.sotiet || course.SoTiet) - 1}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            {course.tenphong || course.TenPhong || 'Chưa có'}
                          </span>
                        </div>
                      </div>
                      {canCancel && (
                        <button
                          onClick={() => handleUnregister(course)}
                          disabled={cancelling === courseId}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {cancelling === courseId ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <X size={20} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

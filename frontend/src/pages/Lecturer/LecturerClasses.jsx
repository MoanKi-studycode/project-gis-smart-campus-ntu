import React, { useState, useEffect } from 'react';
import { Users, Search, BookOpen, UserCheck, Clock, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../services/api';

/**
 * Lecturer Classes Page
 * View list of classes assigned to the lecturer - Database-driven
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

const STATUS_LABELS = {
  'CHO_XAC_NHAN': { label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-600' },
  'DA_XAC_NHAN': { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-600' },
  'MO_DANG_KY': { label: 'Mở đăng ký', color: 'bg-green-50 text-green-600' },
  'DANG_HOC': { label: 'Đang học', color: 'bg-purple-50 text-purple-600' },
  'DA_DONG': { label: 'Đã đóng', color: 'bg-gray-50 text-gray-600' }
};

export default function LecturerClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    const lecturerId = user?.MaNguoiDung || user?.id || user?.MaSo;
    if (!lecturerId) return;
    
    setLoading(true);
    try {
      const response = await coursesApi.getByLecturer(lecturerId);
      const classesData = response.success ? (response.data || []) : (Array.isArray(response) ? response : []);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekdayLabel = (value) => {
    const day = WEEKDAYS.find(d => d.value === value);
    return day ? day.label : `T${value}`;
  };

  const getStatusInfo = (status) => {
    return STATUS_LABELS[status] || { label: status, color: 'bg-gray-50 text-gray-600' };
  };

  const filteredClasses = classes.filter(cls => {
    const tenMon = cls.tenmon || cls.TenMon || '';
    const maLop = cls.malop || cls.MaLop || '';
    return tenMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           maLop.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-gray-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách lớp giảng dạy</h1>
          <p className="text-sm text-gray-500">{classes.length} lớp học phần</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy lớp học</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => {
            const statusInfo = getStatusInfo(cls.trangthai || cls.TrangThai);
            return (
              <div key={cls.malop || cls.MaLop} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {cls.malop || cls.MaLop}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2">{cls.tenmon || cls.TenMon}</h3>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} />
                    <span>Sĩ số: <strong>{cls.sosinhvien || cls.SoSinhVien || 0}/{cls.sisotoida || cls.SiSoToiDa || 50}</strong> SV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{getWeekdayLabel(cls.thu || cls.Thu)} - Tiết {cls.matietbatdau || cls.MaTietBatDau}-{(cls.matietbatdau || cls.MaTietBatDau) + (cls.sotiet || cls.SoTiet) - 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{cls.tenphong || cls.TenPhong || 'Chưa có phòng'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} />
                    <span>{cls.sotinchi || cls.SoTinChi || 0} tín chỉ</span>
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, MapPin, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { coursesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useMap } from '../../contexts/MapContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * Lecturer - Assigned Courses Page (View Only)
 * Database-driven course list
 */

const WEEKDAY_MAP = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật'
};

export default function LecturerScheduleCourses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { flyToDirectly } = useMap();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const maSo = user?.MaSo || user?.maso;
      const response = await coursesApi.getByLecturer(maSo);
      const coursesData = response.data || response || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnMap = (course) => {
    const buildingName = course.tentoanha || course.TenToaNha || 'G6';
    const coords = getBuildingCoords(buildingName);
    const roomName = course.tenphong || course.TenPhong || '';
    
    flyToDirectly({
      lat: coords.lat,
      lng: coords.lng,
      name: `${buildingName} - ${roomName}`,
      buildingId: buildingName,
    }, navigate);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'DANG_HOC':
      case 'DA_MO': return 'bg-green-50 text-green-600';
      case 'MO_DANG_KY': return 'bg-blue-50 text-blue-600';
      case 'DA_XAC_NHAN': return 'bg-blue-50 text-blue-600';
      case 'CHO_XAC_NHAN': return 'bg-yellow-50 text-yellow-600';
      case 'DA_DONG': return 'bg-gray-50 text-gray-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'DANG_HOC': return 'Đang học';
      case 'DA_MO': return 'Đang học';
      case 'MO_DANG_KY': return 'Mở đăng ký';
      case 'DA_XAC_NHAN': return 'Đã xác nhận';
      case 'CHO_XAC_NHAN': return 'Chờ xác nhận';
      case 'DA_DONG': return 'Đã đóng';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50">
            <BookOpen className="text-purple-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lớp phụ trách</h1>
            <p className="text-sm text-gray-500">{courses.length} lớp học phần</p>
          </div>
        </div>
        <button 
          onClick={loadCourses}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Chưa được phân công lớp nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const maLop = course.malop || course.MaLop;
            const tenMon = course.tenmon || course.TenMon;
            const thu = course.thu || course.Thu;
            const tietBD = course.matietbatdau || course.MaTietBatDau;
            const soTiet = course.sotiet || course.SoTiet;
            const tenPhong = course.tenphong || course.TenPhong;
            const tenToaNha = course.tentoanha || course.TenToaNha;
            const siSo = course.soluongsv || course.SoLuongSV || course.sisotoida || course.SiSoToiDa || 0;
            const trangThai = course.trangthai || course.TrangThai;
            
            return (
              <div key={maLop} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {maLop}
                    </span>
                    <h3 className="font-semibold text-gray-800 mt-2 text-lg">{tenMon}</h3>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(trangThai)}`}>
                    {getStatusLabel(trangThai)}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <span>Sĩ số: <strong>{siSo}</strong> sinh viên</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{WEEKDAY_MAP[thu] || `Thứ ${thu}`} - Tiết {tietBD}-{tietBD + soTiet - 1}</span>
                  </div>
                  {(tenToaNha || tenPhong) && (
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-gray-400" />
                      <span>Phòng {tenToaNha} - {tenPhong}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleViewOnMap(course)}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    <MapPin size={16} />
                    Xem trên bản đồ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

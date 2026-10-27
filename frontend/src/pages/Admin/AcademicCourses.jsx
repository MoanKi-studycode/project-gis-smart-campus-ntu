import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Search, Plus, Edit, Trash2, MapPin, X, Loader2, Users, Calendar, Clock } from 'lucide-react';
import { coursesApi, subjectsApi, referenceApi } from '../../services/api';
import { useMap } from '../../contexts/MapContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

/**
 * Admin - Academic Courses (Lớp học phần) Management
 * CRUD operations for course sections - Database-driven
 */

const STATUS_OPTIONS = [
  { value: 'CHO_XAC_NHAN', label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-600' },
  { value: 'DA_XAC_NHAN', label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-600' },
  { value: 'MO_DANG_KY', label: 'Mở đăng ký', color: 'bg-green-50 text-green-600' },
  { value: 'DANG_HOC', label: 'Đang học', color: 'bg-purple-50 text-purple-600' },
  { value: 'DA_DONG', label: 'Đã đóng', color: 'bg-gray-50 text-gray-600' }
];

const WEEKDAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' }
];

export default function AcademicCourses() {
  const navigate = useNavigate();
  const { flyToDirectly } = useMap();
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [majors, setMajors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Filter states
  const [filterMaNganh, setFilterMaNganh] = useState('');
  const [filterTrangThai, setFilterTrangThai] = useState('');
  const [filterHocKy, setFilterHocKy] = useState('');

  const [formData, setFormData] = useState({
    maLop: '',
    maMon: '',
    maGiangVien: '',
    hocKy: 1,
    namHoc: '',
    thu: 2,
    maTietBatDau: 1,
    soTiet: 3,
    maPhong: '',
    siSoToiDa: 50,
    trangThai: 'CHO_XAC_NHAN',
    hanDangKy: ''
  });

  // Selected building for cascading room dropdown
  const [selectedBuilding, setSelectedBuilding] = useState('');

  useEffect(() => {
    loadReferenceData();
    loadCourses();
  }, []);

  // Reload courses when filters change
  useEffect(() => {
    loadCourses();
  }, [filterMaNganh, filterTrangThai, filterHocKy]);

  // Load rooms when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      referenceApi.getClassrooms(selectedBuilding).then(res => {
        setRooms(res || []);
      });
    }
  }, [selectedBuilding]);

  const loadReferenceData = async () => {
    try {
      const [subjectsRes, lecturersRes, roomsRes, periodsRes, majorsRes, buildingsRes] = await Promise.all([
        subjectsApi.getForDropdown(),
        referenceApi.getLecturersDropdown(),
        referenceApi.getClassrooms(),
        referenceApi.getPeriods(),
        referenceApi.getMajors(),
        referenceApi.getBuildings()
      ]);
      
      setSubjects(subjectsRes || []);
      setLecturers(lecturersRes || []);
      setRooms(roomsRes || []);
      setPeriods(periodsRes || []);
      setMajors(majorsRes || []);
      setBuildings(buildingsRes || []);
    } catch (error) {
      console.error('Failed to load reference data', error);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 }; // Get more courses
      if (filterMaNganh) params.maNganh = filterMaNganh;
      if (filterTrangThai) params.trangThai = filterTrangThai;
      if (filterHocKy) params.hocKy = filterHocKy;
      
      const coursesRes = await coursesApi.getAll(params);
      // Handle paginated response: { data: [...], pagination: {...} }
      const coursesData = coursesRes.data || coursesRes || [];
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Failed to load courses', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmed = await confirmDelete('lớp học phần này');
    if (confirmed) {
      try {
        await coursesApi.delete(courseId);
        toast.success('Thành công', 'Đã xóa lớp học phần');
        loadCourses();
      } catch (error) {
        toast.error('Xóa thất bại', error.message);
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedBuilding('');
    setFormData({
      maLop: '',
      maMon: '',
      maGiangVien: '',
      hocKy: 1,
      namHoc: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      thu: 2,
      maTietBatDau: 1,
      soTiet: 3,
      maPhong: '',
      siSoToiDa: 50,
      trangThai: 'CHO_XAC_NHAN',
      hanDangKy: ''
    });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setModalMode('edit');
    setSelectedCourse(course);
    // Set building for room dropdown
    setSelectedBuilding(course.matoanha || course.MaToaNha || '');
    setFormData({
      maLop: course.malop || course.MaLop || '',
      maMon: course.mamon || course.MaMon || '',
      maGiangVien: course.magiangvien || course.MaGiangVien || '',
      hocKy: course.hocky || course.HocKy || 1,
      namHoc: course.namhoc || course.NamHoc || '',
      thu: course.thu || course.Thu || 2,
      maTietBatDau: course.matietbatdau || course.MaTietBatDau || 1,
      soTiet: course.sotiet || course.SoTiet || 3,
      maPhong: course.maphong || course.MaPhong || '',
      siSoToiDa: course.sisotoida || course.SiSoToiDa || 50,
      trangThai: course.trangthai || course.TrangThai || 'CHO_XAC_NHAN',
      hanDangKy: course.handangky || course.HanDangKy || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await coursesApi.create(formData);
        toast.success('Thành công', 'Đã thêm lớp học phần mới');
      } else {
        const courseId = selectedCourse.malop || selectedCourse.MaLop;
        await coursesApi.update(courseId, formData);
        toast.success('Thành công', 'Đã cập nhật lớp học phần');
      }
      setShowModal(false);
      loadCourses();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Thêm' : 'Cập nhật') + ' thất bại', error.message);
    } finally {
      setSaving(false);
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

  const filteredCourses = courses.filter(c => {
    const tenMon = c.tenmon || c.TenMon || '';
    const maLop = c.malop || c.MaLop || '';
    const tenGV = c.tengiangvien || c.TenGiangVien || '';
    return tenMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           maLop.toLowerCase().includes(searchTerm.toLowerCase()) ||
           tenGV.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusStyle = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.color : 'bg-gray-50 text-gray-600';
  };

  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label : status;
  };

  const getWeekdayLabel = (value) => {
    const day = WEEKDAYS.find(d => d.value === value);
    return day ? day.label : `Thứ ${value}`;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50">
            <Layers className="text-orange-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Lớp học phần</h1>
            <p className="text-sm text-gray-500">{courses.length} lớp học phần</p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm lớp HP
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm lớp học phần..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Major filter */}
        <select
          value={filterMaNganh}
          onChange={(e) => setFilterMaNganh(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[160px]"
        >
          <option value="">Tất cả ngành</option>
          {majors.map(m => (
            <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>
              {m.tennganh || m.TenNganh}
            </option>
          ))}
        </select>
        
        {/* Status filter */}
        <select
          value={filterTrangThai}
          onChange={(e) => setFilterTrangThai(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[140px]"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {/* Semester filter */}
        <select
          value={filterHocKy}
          onChange={(e) => setFilterHocKy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[130px]"
        >
          <option value="">Tất cả kỳ</option>
          <option value="1">Học kỳ 1</option>
          <option value="2">Học kỳ 2</option>
          <option value="3">Học kỳ hè</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Mã LHP</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tên môn học</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Giảng viên</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Thời gian</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Phòng</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy lớp học phần nào' : 'Chưa có lớp học phần nào'}
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => {
                  const maLop = course.malop || course.MaLop;
                  const tenMon = course.tenmon || course.TenMon;
                  const tenGV = course.tengiangvien || course.TenGiangVien;
                  const thu = course.thu || course.Thu;
                  const tietBD = course.matietbatdau || course.MaTietBatDau;
                  const soTiet = course.sotiet || course.SoTiet;
                  const tenPhong = course.tenphong || course.TenPhong;
                  const tenToaNha = course.tentoanha || course.TenToaNha;
                  const trangThai = course.trangthai || course.TrangThai;
                  
                  return (
                    <tr key={maLop} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{maLop}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{tenMon}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tenGV || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getWeekdayLabel(thu)}, Tiết {tietBD}-{tietBD + soTiet - 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tenToaNha && tenPhong ? `${tenToaNha} - ${tenPhong}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(trangThai)}`}>
                          {getStatusLabel(trangThai)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewOnMap(course)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Xem trên bản đồ"
                          >
                            <MapPin size={16} />
                          </button>
                          <button 
                            onClick={() => openEditModal(course)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(maLop)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'add' ? 'Thêm lớp học phần' : 'Chỉnh sửa lớp học phần'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã lớp HP *</label>
                  <input
                    type="text"
                    value={formData.maLop}
                    onChange={(e) => setFormData({ ...formData, maLop: e.target.value })}
                    disabled={modalMode === 'edit'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Môn học *</label>
                  <select
                    value={formData.maMon}
                    onChange={(e) => setFormData({ ...formData, maMon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Chọn môn --</option>
                    {subjects.map(s => (
                      <option key={s.mamon || s.MaMon} value={s.mamon || s.MaMon}>
                        {s.tenmon || s.TenMon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                  <select
                    value={formData.maGiangVien}
                    onChange={(e) => setFormData({ ...formData, maGiangVien: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn giảng viên --</option>
                    {lecturers.map(l => (
                      <option key={l.MaSo || l.maso} value={l.MaSo || l.maso}>
                        {l.HoTen || l.hoten}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sĩ số tối đa</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.siSoToiDa}
                    onChange={(e) => setFormData({ ...formData, siSoToiDa: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Location: Building and Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tòa nhà</label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => {
                      setSelectedBuilding(e.target.value);
                      setFormData({ ...formData, maPhong: '' });
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {buildings.map(b => (
                      <option key={b.matoanha || b.MaToaNha} value={b.matoanha || b.MaToaNha}>
                        {b.tentoanha || b.TenToaNha}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phòng học</label>
                  <select
                    value={formData.maPhong}
                    onChange={(e) => setFormData({ ...formData, maPhong: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedBuilding}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => (
                      <option key={r.MaPhong || r.maphong} value={r.MaPhong || r.maphong}>
                        {r.TenPhong || r.tenphong} (Tầng {r.SoTang || r.sotang})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ *</label>
                  <select
                    value={formData.hocKy}
                    onChange={(e) => setFormData({ ...formData, hocKy: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={1}>Học kỳ 1</option>
                    <option value={2}>Học kỳ 2</option>
                    <option value={3}>Học kỳ hè</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm học *</label>
                  <input
                    type="text"
                    value={formData.namHoc}
                    onChange={(e) => setFormData({ ...formData, namHoc: e.target.value })}
                    placeholder="VD: 2024-2025"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hạn đăng ký</label>
                  <input
                    type="datetime-local"
                    value={formData.hanDangKy ? formData.hanDangKy.slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, hanDangKy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thứ *</label>
                  <select
                    value={formData.thu}
                    onChange={(e) => setFormData({ ...formData, thu: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {WEEKDAYS.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiết bắt đầu *</label>
                  <select
                    value={formData.maTietBatDau}
                    onChange={(e) => setFormData({ ...formData, maTietBatDau: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {periods.map(p => (
                      <option key={p.MaTiet || p.matiet} value={p.MaTiet || p.matiet}>
                        Tiết {p.MaTiet || p.matiet} ({p.GioBatDau || p.giobatdau})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiết *</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.soTiet}
                    onChange={(e) => setFormData({ ...formData, soTiet: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.trangThai}
                  onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === 'add' ? 'Thêm' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

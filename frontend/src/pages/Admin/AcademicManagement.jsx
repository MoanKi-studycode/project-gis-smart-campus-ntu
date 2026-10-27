import React, { useState, useEffect } from 'react';
import { subjectsApi, coursesApi, referenceApi } from '../../services/api';
import { Plus, Trash2, Search, Book, Users, Edit, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_LABELS = {
  CHO_XAC_NHAN: { label: 'Chờ xác nhận', color: 'bg-yellow-50 text-yellow-700' },
  CHO_DUYET: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-700' },
  DA_XAC_NHAN: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700' },
  DA_DUYET: { label: 'Đã duyệt', color: 'bg-blue-50 text-blue-700' },
  MO_DANG_KY: { label: 'Mở đăng ký', color: 'bg-cyan-50 text-cyan-700' },
  DANG_HOC: { label: 'Đang học', color: 'bg-green-50 text-green-700' },
  DA_MO: { label: 'Đang mở', color: 'bg-green-50 text-green-700' },
  DA_DONG: { label: 'Đã đóng', color: 'bg-gray-50 text-gray-700' }
};

export default function AcademicManagement() {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);

  // Reference data
  const [lecturers, setLecturers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    maMon: '', tenMon: '', soTinChi: 3
  });

  const [courseForm, setCourseForm] = useState({
    maLop: '', maMonHoc: '', maGiangVien: '', maPhong: '',
    thu: 2, maTietBatDau: 1, soTiet: 3,
    hocKy: 1, namHoc: '2025-2026', siSoToiDa: 40
  });

  useEffect(() => {
    loadData();
    loadReferenceData();
  }, [activeTab]);

  const loadReferenceData = async () => {
    try {
      const [lecturersData, classroomsData, periodsData, subjectsData] = await Promise.all([
        referenceApi.getLecturersDropdown(),
        referenceApi.getClassrooms(),
        referenceApi.getPeriods(),
        referenceApi.getSubjectsDropdown()
      ]);
      setLecturers(lecturersData);
      setClassrooms(classroomsData);
      setPeriods(periodsData);
      setSubjectOptions(subjectsData);
    } catch (error) {
      console.error('Failed to load reference data', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'subjects') {
        const data = await subjectsApi.getAll();
        setSubjects(data);
      } else {
        const data = await coursesApi.getAll();
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(activeTab === 'subjects' ? 'môn học này' : 'lớp học phần này');
    if (!confirmed) return;
    
    try {
      if (activeTab === 'subjects') {
        await subjectsApi.delete(id);
      } else {
        await coursesApi.delete(id);
      }
      toast.success('Thành công', 'Đã xóa thành công');
      loadData();
    } catch (error) {
      toast.error('Xóa thất bại', error.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedItem(null);
    if (activeTab === 'subjects') {
      setSubjectForm({ maMon: '', tenMon: '', soTinChi: 3 });
    } else {
      setCourseForm({
        maLop: '', maMonHoc: '', maGiangVien: '', maPhong: '',
        thu: 2, maTietBatDau: 1, soTiet: 3,
        hocKy: 1, namHoc: '2025-2026', siSoToiDa: 40
      });
    }
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setSelectedItem(item);
    if (activeTab === 'subjects') {
      setSubjectForm({
        maMon: item.MaMon,
        tenMon: item.TenMon,
        soTinChi: item.SoTinChi
      });
    } else {
      setCourseForm({
        maLop: item.MaLop,
        maMonHoc: item.MaMonHoc,
        maGiangVien: item.MaGiangVien,
        maPhong: item.MaPhong,
        thu: item.Thu,
        maTietBatDau: item.MaTietBatDau,
        soTiet: item.SoTiet,
        hocKy: item.HocKy,
        namHoc: item.NamHoc,
        siSoToiDa: item.SiSoToiDa
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'subjects') {
        if (modalMode === 'add') {
          await subjectsApi.create(subjectForm);
        } else {
          await subjectsApi.update(selectedItem.MaMonHoc, subjectForm);
        }
      } else {
        if (modalMode === 'add') {
          await coursesApi.create(courseForm);
        } else {
          await coursesApi.update(selectedItem.MaLopHoc, courseForm);
        }
      }
      setShowModal(false);
      toast.success('Thành công', modalMode === 'add' ? 'Đã thêm thành công' : 'Đã cập nhật thành công');
      loadData();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Thêm' : 'Cập nhật') + ' thất bại', error.message);
    }
  };

  const filteredData = activeTab === 'subjects' 
    ? subjects.filter(s => 
        s.TenMon?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.MaMon?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : courses.filter(c => 
        c.MaLop?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.TenMon?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const weekdays = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
  ];

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đào tạo</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Thêm {activeTab === 'subjects' ? 'môn học' : 'lớp học phần'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 shrink-0">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'subjects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Book size={16} /> Môn học
          <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{subjects.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} /> Lớp học phần
          <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{courses.length}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder={activeTab === 'subjects' ? "Tìm môn học..." : "Tìm lớp học phần..."}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left relative">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                {activeTab === 'subjects' ? (
                  <>
                    <th className="px-6 py-4 font-semibold text-gray-600">Mã môn</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Tên môn</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Số tín chỉ</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 font-semibold text-gray-600">Mã lớp</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Môn học</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Giảng viên</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Lịch học</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Sĩ số</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Trạng thái</th>
                  </>
                )}
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Không có dữ liệu</td></tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={activeTab === 'subjects' ? item.MaMonHoc : item.MaLopHoc} className="hover:bg-gray-50">
                    {activeTab === 'subjects' ? (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.MaMon}</td>
                        <td className="px-6 py-4">{item.TenMon}</td>
                        <td className="px-6 py-4">{item.SoTinChi}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-medium text-gray-900">{item.MaLop}</td>
                        <td className="px-6 py-4">{item.TenMon}</td>
                        <td className="px-6 py-4">{item.TenGiangVien || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                            {weekdays.find(w => w.value === item.Thu)?.label || `Thứ ${item.Thu}`}, 
                            Tiết {item.MaTietBatDau}-{item.MaTietBatDau + item.SoTiet - 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">{item.SoSinhVien || 0}/{item.SiSoToiDa}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_LABELS[item.TrangThai]?.color || 'bg-gray-50 text-gray-700'}`}>
                            {STATUS_LABELS[item.TrangThai]?.label || item.TrangThai}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-right space-x-1">
                      <button 
                        onClick={() => openEditModal(item)}
                        className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Sửa"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(activeTab === 'subjects' ? item.MaMonHoc : item.MaLopHoc)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Thêm' : 'Sửa'} {activeTab === 'subjects' ? 'môn học' : 'lớp học phần'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'subjects' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn *</label>
                    <input 
                      required 
                      disabled={modalMode === 'edit'}
                      className="w-full p-2 border rounded-lg disabled:bg-gray-100" 
                      value={subjectForm.maMon} 
                      onChange={e => setSubjectForm({...subjectForm, maMon: e.target.value})} 
                      placeholder="VD: IT001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn *</label>
                    <input 
                      required 
                      className="w-full p-2 border rounded-lg" 
                      value={subjectForm.tenMon} 
                      onChange={e => setSubjectForm({...subjectForm, tenMon: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tín chỉ *</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10"
                      required 
                      className="w-full p-2 border rounded-lg" 
                      value={subjectForm.soTinChi} 
                      onChange={e => setSubjectForm({...subjectForm, soTinChi: parseInt(e.target.value)})} 
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mã lớp *</label>
                      <input 
                        required 
                        disabled={modalMode === 'edit'}
                        className="w-full p-2 border rounded-lg disabled:bg-gray-100" 
                        value={courseForm.maLop} 
                        onChange={e => setCourseForm({...courseForm, maLop: e.target.value})} 
                        placeholder="VD: IT001.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Môn học *</label>
                      <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.maMonHoc}
                        onChange={e => setCourseForm({...courseForm, maMonHoc: e.target.value})}
                      >
                        <option value="">-- Chọn môn --</option>
                        {subjectOptions.map(s => (
                          <option key={s.MaMonHoc} value={s.MaMonHoc}>{s.MaMon} - {s.TenMon}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên *</label>
                      <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.maGiangVien}
                        onChange={e => setCourseForm({...courseForm, maGiangVien: e.target.value})}
                      >
                        <option value="">-- Chọn giảng viên --</option>
                        {lecturers.map(l => (
                          <option key={l.MaNguoiDung} value={l.MaNguoiDung}>{l.MaSo} - {l.HoTen}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phòng học *</label>
                      <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.maPhong}
                        onChange={e => setCourseForm({...courseForm, maPhong: e.target.value})}
                      >
                        <option value="">-- Chọn phòng --</option>
                        {classrooms.map(r => (
                          <option key={r.MaPhong} value={r.MaPhong}>{r.TenPhong}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thứ *</label>
                      <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.thu}
                        onChange={e => setCourseForm({...courseForm, thu: parseInt(e.target.value)})}
                      >
                        {weekdays.map(w => (
                          <option key={w.value} value={w.value}>{w.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tiết bắt đầu *</label>
                      <select 
                        required
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.maTietBatDau}
                        onChange={e => setCourseForm({...courseForm, maTietBatDau: parseInt(e.target.value)})}
                      >
                        {periods.map(p => (
                          <option key={p.MaTiet} value={p.MaTiet}>Tiết {p.MaTiet} ({p.GioBatDau})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số tiết *</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="5"
                        required 
                        className="w-full p-2 border rounded-lg" 
                        value={courseForm.soTiet} 
                        onChange={e => setCourseForm({...courseForm, soTiet: parseInt(e.target.value)})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Học kỳ</label>
                      <select 
                        className="w-full p-2 border rounded-lg"
                        value={courseForm.hocKy}
                        onChange={e => setCourseForm({...courseForm, hocKy: parseInt(e.target.value)})}
                      >
                        <option value={1}>Học kỳ 1</option>
                        <option value={2}>Học kỳ 2</option>
                        <option value={3}>Học kỳ hè</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                      <input 
                        className="w-full p-2 border rounded-lg" 
                        value={courseForm.namHoc} 
                        onChange={e => setCourseForm({...courseForm, namHoc: e.target.value})} 
                        placeholder="2025-2026"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sĩ số tối đa</label>
                      <input 
                        type="number" 
                        min="10" 
                        max="200"
                        className="w-full p-2 border rounded-lg" 
                        value={courseForm.siSoToiDa} 
                        onChange={e => setCourseForm({...courseForm, siSoToiDa: parseInt(e.target.value)})} 
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalMode === 'add' ? 'Thêm' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

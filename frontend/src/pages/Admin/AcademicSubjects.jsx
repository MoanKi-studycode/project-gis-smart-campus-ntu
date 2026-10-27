import React, { useState, useEffect } from 'react';
import { BookMarked, Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { subjectsApi, referenceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

/**
 * Admin - Academic Subjects Management
 * CRUD operations for subjects (MonHoc) - Database-driven
 */

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang mở', color: 'bg-green-50 text-green-600' },
  { value: 'INACTIVE', label: 'Ngừng mở', color: 'bg-gray-50 text-gray-600' }
];

export default function AcademicSubjects() {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [majors, setMajors] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Filter states
  const [filterMajor, setFilterMajor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState({
    maMon: '',
    tenMon: '',
    soTinChi: 3,
    maNganh: '',
    namHoc: '',
    moTa: '',
    trangThai: 'ACTIVE'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, majorsRes] = await Promise.all([
        subjectsApi.getAll(),
        referenceApi.getMajors()
      ]);
      const subjectsData = subjectsRes.data || subjectsRes || [];
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setMajors(majorsRes || []);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId) => {
    const confirmed = await confirmDelete('môn học này');
    if (confirmed) {
      try {
        await subjectsApi.delete(subjectId);
        toast.success('Thành công', 'Đã xóa môn học');
        loadData();
      } catch (error) {
        toast.error('Xóa thất bại', error.message);
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      maMon: '',
      tenMon: '',
      soTinChi: 3,
      maNganh: '',
      namHoc: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      moTa: '',
      trangThai: 'ACTIVE'
    });
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setModalMode('edit');
    setSelectedSubject(subject);
    setFormData({
      maMon: subject.mamon || subject.MaMon || '',
      tenMon: subject.tenmon || subject.TenMon || '',
      soTinChi: subject.sotinchi || subject.SoTinChi || 3,
      maNganh: subject.manganh || subject.MaNganh || '',
      namHoc: subject.namhoc || subject.NamHoc || '',
      moTa: subject.mota || subject.MoTa || '',
      trangThai: subject.trangthai || subject.TrangThai || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await subjectsApi.create(formData);
        toast.success('Thành công', 'Đã thêm môn học mới');
      } else {
        const subjectId = selectedSubject.mamon || selectedSubject.MaMon;
        await subjectsApi.update(subjectId, formData);
        toast.success('Thành công', 'Đã cập nhật môn học');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Thêm' : 'Cập nhật') + ' thất bại', error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(s => {
    const tenMon = s.tenmon || s.TenMon || '';
    const maMon = s.mamon || s.MaMon || '';
    const maNganh = s.manganh || s.MaNganh || '';
    const trangThai = s.trangthai || s.TrangThai || '';
    
    // Search filter
    const matchSearch = tenMon.toLowerCase().includes(searchTerm.toLowerCase()) ||
           maMon.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Major filter
    const matchMajor = !filterMajor || maNganh === filterMajor;
    
    // Status filter
    const matchStatus = !filterStatus || trangThai === filterStatus;
    
    return matchSearch && matchMajor && matchStatus;
  });

  const getStatusStyle = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.color : 'bg-gray-50 text-gray-600';
  };

  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label : status;
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
          <div className="p-2 rounded-xl bg-indigo-50">
            <BookMarked className="text-indigo-600" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quản lý Môn học</h1>
            <p className="text-sm text-gray-500">{subjects.length} môn học</p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm môn học
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Filter by Major */}
        <select
          value={filterMajor}
          onChange={(e) => setFilterMajor(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tất cả ngành</option>
          {majors.map(m => (
            <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>
              {m.tennganh || m.TenNganh}
            </option>
          ))}
        </select>
        
        {/* Filter by Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        
        {/* Clear filters */}
        {(filterMajor || filterStatus || searchTerm) && (
          <button
            onClick={() => {
              setFilterMajor('');
              setFilterStatus('');
              setSearchTerm('');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Mã MH</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Tên môn học</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Số tín chỉ</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ngành</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Năm học</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy môn học nào' : 'Chưa có môn học nào'}
                </td>
              </tr>
            ) : (
              filteredSubjects.map((subject) => {
                const maMon = subject.mamon || subject.MaMon;
                const tenMon = subject.tenmon || subject.TenMon;
                const soTinChi = subject.sotinchi || subject.SoTinChi;
                const maNganh = subject.manganh || subject.MaNganh;
                const namHoc = subject.namhoc || subject.NamHoc;
                const trangThai = subject.trangthai || subject.TrangThai;
                
                return (
                  <tr key={maMon} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{maMon}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{tenMon}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{soTinChi}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{maNganh || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{namHoc || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(trangThai)}`}>
                        {getStatusLabel(trangThai)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(subject)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(maMon)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {modalMode === 'add' ? 'Thêm môn học' : 'Chỉnh sửa môn học'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã môn học *</label>
                  <input
                    type="text"
                    value={formData.maMon}
                    onChange={(e) => setFormData({ ...formData, maMon: e.target.value })}
                    disabled={modalMode === 'edit'}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tín chỉ *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.soTinChi}
                    onChange={(e) => setFormData({ ...formData, soTinChi: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên môn học *</label>
                <input
                  type="text"
                  value={formData.tenMon}
                  onChange={(e) => setFormData({ ...formData, tenMon: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
                  <select
                    value={formData.maNganh}
                    onChange={(e) => setFormData({ ...formData, maNganh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn ngành --</option>
                    {majors.map(m => (
                      <option key={m.MaNganh || m.manganh} value={m.MaNganh || m.manganh}>
                        {m.TenNganh || m.tennganh}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={formData.namHoc}
                    onChange={(e) => setFormData({ ...formData, namHoc: e.target.value })}
                    placeholder="VD: 2024-2025"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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

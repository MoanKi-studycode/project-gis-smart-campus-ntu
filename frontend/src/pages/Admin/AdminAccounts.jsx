import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, UserCog, GraduationCap, UserCheck, Search, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { usersApi, referenceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

/**
 * Admin Accounts Management Page
 * Handles: Admins, Lecturers, Students based on URL param
 * Database-driven with full CRUD
 */

const ACCOUNT_CONFIG = {
  admins: {
    title: 'Quản lý Quản trị viên',
    icon: UserCog,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    roleCode: 'ADMIN',
  },
  lecturers: {
    title: 'Quản lý Giảng viên',
    icon: GraduationCap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    roleCode: 'LECTURER',
  },
  students: {
    title: 'Quản lý Sinh viên',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    roleCode: 'STUDENT',
  },
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Hoạt động', color: 'bg-green-50 text-green-600' },
  { value: 'INACTIVE', label: 'Vô hiệu', color: 'bg-gray-100 text-gray-500' },
  { value: 'SUSPENDED', label: 'Tạm khóa', color: 'bg-red-50 text-red-600' },
];

export default function AdminAccounts() {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const { type } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [majors, setMajors] = useState([]);
  const [studentYears, setStudentYears] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Filter states
  const [filterNienKhoa, setFilterNienKhoa] = useState('');
  const [filterMaNganh, setFilterMaNganh] = useState('');
  
  const config = ACCOUNT_CONFIG[type] || ACCOUNT_CONFIG.students;
  const Icon = config.icon;

  const [formData, setFormData] = useState({
    MaSo: '',
    HoTen: '',
    Email: '',
    MatKhau: '',
    MaNganh: '',
    NienKhoa: '',
    TrangThai: 'ACTIVE'
  });

  useEffect(() => {
    // Reset filters when type changes
    setFilterNienKhoa('');
    setFilterMaNganh('');
    loadReferenceData();
    loadData();
  }, [type]);

  // Reload when filters change
  useEffect(() => {
    loadData();
  }, [filterNienKhoa, filterMaNganh]);

  const loadReferenceData = async () => {
    try {
      // Load majors for dropdown
      const majorsRes = await referenceApi.getMajors();
      setMajors(majorsRes || []);
      
      // Load student years for filter
      const yearsRes = await referenceApi.getStudentYears();
      setStudentYears(yearsRes || []);
    } catch (error) {
      console.error('Failed to load reference data:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterNienKhoa) params.nienKhoa = filterNienKhoa;
      if (filterMaNganh) params.maNganh = filterMaNganh;
      
      let response;
      switch (type) {
        case 'admins':
          response = await usersApi.getAdmins(params);
          break;
        case 'lecturers':
          response = await usersApi.getLecturers(params);
          break;
        case 'students':
          response = await usersApi.getStudents(params);
          break;
        default:
          response = await usersApi.getAll(params);
      }
      
      const data = response.data || response || [];
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      MaSo: '',
      HoTen: '',
      Email: '',
      MatKhau: '',
      MaNganh: '',
      NienKhoa: '',
      TrangThai: 'ACTIVE'
    });
    setShowModal(true);
  };

  const openEditModal = (account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setFormData({
      MaSo: account.maso || account.MaSo || '',
      HoTen: account.hoten || account.HoTen || '',
      Email: account.email || account.Email || '',
      MatKhau: '',
      MaNganh: account.manganh || account.MaNganh || '',
      NienKhoa: account.nienkhoa || account.NienKhoa || '',
      TrangThai: account.trangthai || account.TrangThai || 'ACTIVE'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        MaVaiTro: config.roleCode
      };
      
      // Remove empty password on edit
      if (modalMode === 'edit' && !payload.MatKhau) {
        delete payload.MatKhau;
      }
      
      if (modalMode === 'add') {
        await usersApi.create(payload);
      } else {
        const userId = selectedAccount.maso || selectedAccount.MaSo;
        await usersApi.update(userId, payload);
      }
      setShowModal(false);
      toast.success('Thành công', modalMode === 'add' ? 'Đã thêm tài khoản' : 'Đã cập nhật tài khoản');
      loadData();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Thêm' : 'Cập nhật') + ' thất bại', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    const confirmed = await confirmDelete('tài khoản này');
    if (confirmed) {
      try {
        await usersApi.delete(accountId);
        toast.success('Thành công', 'Đã xóa tài khoản');
        loadData();
      } catch (error) {
        toast.error('Xóa thất bại', error.message);
      }
    }
  };

  const getStatusStyle = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.color : 'bg-gray-100 text-gray-500';
  };

  const getStatusLabel = (status) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.label : status;
  };

  const filteredData = accounts.filter(item => {
    const hoTen = item.hoten || item.HoTen || '';
    const maSo = item.maso || item.MaSo || '';
    const email = item.email || item.Email || '';
    return hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
           maSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          <div className={`p-2 rounded-xl ${config.bgColor}`}>
            <Icon className={config.color} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
            <p className="text-sm text-gray-500">{accounts.length} tài khoản</p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Thêm mới
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Year filter - only for students */}
        {type === 'students' && (
          <select
            value={filterNienKhoa}
            onChange={(e) => setFilterNienKhoa(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
          >
            <option value="">Tất cả khóa</option>
            {studentYears.map(year => (
              <option key={year} value={year}>Khóa {year}</option>
            ))}
          </select>
        )}
        
        {/* Major filter - for students and lecturers */}
        {(type === 'students' || type === 'lecturers') && (
          <select
            value={filterMaNganh}
            onChange={(e) => setFilterMaNganh(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
          >
            <option value="">Tất cả ngành</option>
            {majors.map(m => (
              <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>
                {m.tennganh || m.TenNganh}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Mã số</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Họ tên</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
              {type === 'lecturers' && <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Khoa</th>}
              {type === 'students' && <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Khóa</th>}
              {type === 'students' && <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ngành</th>}
              {type === 'lecturers' && <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Ngành</th>}
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Trạng thái</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={type === 'admins' ? 5 : 7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy tài khoản nào' : 'Chưa có tài khoản nào'}
                </td>
              </tr>
            ) : (
              filteredData.map((item) => {
                const maSo = item.maso || item.MaSo;
                const hoTen = item.hoten || item.HoTen;
                const email = item.email || item.Email;
                const tenKhoa = item.tenkhoa || item.TenKhoa;
                const tenNganh = item.tennganh || item.TenNganh;
                const nienKhoa = item.nienkhoa || item.NienKhoa;
                const trangThai = item.trangthai || item.TrangThai;
                
                return (
                  <tr key={maSo} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{maSo}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{hoTen}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{email}</td>
                    {type === 'lecturers' && <td className="px-6 py-4 text-sm text-gray-500">{tenKhoa || '-'}</td>}
                    {type === 'students' && <td className="px-6 py-4 text-sm text-gray-500">{nienKhoa ? `K${nienKhoa}` : '-'}</td>}
                    {type === 'students' && <td className="px-6 py-4 text-sm text-gray-500">{tenNganh || '-'}</td>}
                    {type === 'lecturers' && <td className="px-6 py-4 text-sm text-gray-500">{tenNganh || '-'}</td>}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(trangThai)}`}>
                        {getStatusLabel(trangThai)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(maSo)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                {modalMode === 'add' ? `Thêm ${config.title.replace('Quản lý ', '')}` : 'Chỉnh sửa tài khoản'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã số *</label>
                <input
                  type="text"
                  value={formData.MaSo}
                  onChange={(e) => setFormData({ ...formData, MaSo: e.target.value })}
                  disabled={modalMode === 'edit'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                <input
                  type="text"
                  value={formData.HoTen}
                  onChange={(e) => setFormData({ ...formData, HoTen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modalMode === 'add' ? 'Mật khẩu *' : 'Mật khẩu mới (để trống nếu không đổi)'}
                </label>
                <input
                  type="password"
                  value={formData.MatKhau}
                  onChange={(e) => setFormData({ ...formData, MatKhau: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={modalMode === 'add'}
                />
              </div>
              
              {(type === 'lecturers' || type === 'students') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
                  <select
                    value={formData.MaNganh}
                    onChange={(e) => setFormData({ ...formData, MaNganh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn ngành --</option>
                    {majors.map(m => (
                      <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>
                        {m.tennganh || m.TenNganh}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {type === 'students' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Khóa (Niên khóa)</label>
                  <select
                    value={formData.NienKhoa}
                    onChange={(e) => setFormData({ ...formData, NienKhoa: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn khóa --</option>
                    {studentYears.map(year => (
                      <option key={year} value={year}>Khóa {year}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={formData.TrangThai}
                  onChange={(e) => setFormData({ ...formData, TrangThai: e.target.value })}
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

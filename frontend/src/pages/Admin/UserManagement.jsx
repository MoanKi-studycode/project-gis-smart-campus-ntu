import React, { useState, useEffect } from 'react';
import { usersApi, referenceApi } from '../../services/api';
import { Plus, Trash2, Search, Edit, Shield, GraduationCap, BookOpen, X, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const ROLE_MAP = {
  admin: 1,
  lecturer: 2,
  student: 3
};

const ROLE_LABELS = {
  1: 'Quản trị viên',
  2: 'Giảng viên',
  3: 'Sinh viên'
};

export default function UserManagement() {
  const toast = useToast();
  const { confirmDelete } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('admin');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add | edit
  const [selectedUser, setSelectedUser] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [allMajors, setAllMajors] = useState([]); // All majors for filter dropdown
  const [showPassword, setShowPassword] = useState(false);
  
  // Filter states
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  
  const [formData, setFormData] = useState({
    maSo: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    maVaiTro: 3,
    maKhoa: '',
    maNganh: '',
    matKhau: ''
  });

  useEffect(() => {
    loadUsers();
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (formData.maKhoa) {
      loadMajors(formData.maKhoa);
    } else {
      setMajors([]);
    }
  }, [formData.maKhoa]);

  const loadReferenceData = async () => {
    try {
      const [facultiesData, allMajorsData] = await Promise.all([
        referenceApi.getFaculties(),
        referenceApi.getMajors() // Get all majors without faculty filter
      ]);
      setFaculties(facultiesData);
      setAllMajors(allMajorsData || []);
    } catch (error) {
      console.error('Failed to load reference data', error);
    }
  };

  const loadMajors = async (facultyId) => {
    try {
      const majorsData = await referenceApi.getMajors(facultyId);
      setMajors(majorsData);
    } catch (error) {
      console.error('Failed to load majors', error);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll({ limit: 200 }); // Get more users
      // Handle paginated response: { data: [...], pagination: {...} }
      const userData = response.data || response || [];
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error('Failed to load users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = await confirmDelete('người dùng này');
    if (confirmed) {
      try {
        await usersApi.delete(userId);
        toast.success('Thành công', 'Đã xóa người dùng');
        loadUsers();
      } catch (error) {
        toast.error('Xóa thất bại', error.message);
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      maSo: '',
      hoTen: '',
      email: '',
      soDienThoai: '',
      maVaiTro: ROLE_MAP[activeTab],
      maKhoa: '',
      maNganh: '',
      matKhau: ''
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormData({
      maSo: user.maso || user.MaSo || '',
      hoTen: user.hoten || user.HoTen || '',
      email: user.email || user.Email || '',
      soDienThoai: user.sodienthoai || user.SoDienThoai || '',
      maVaiTro: user.mavaitro || user.MaVaiTro,
      maKhoa: user.makhoa || user.MaKhoa || '',
      maNganh: user.manganh || user.MaNganh || '',
      matKhau: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await usersApi.create(formData);
        toast.success('Thành công', 'Đã thêm người dùng mới');
      } else {
        const userId = selectedUser.maso || selectedUser.MaSo;
        await usersApi.update(userId, formData);
        toast.success('Thành công', 'Đã cập nhật thông tin');
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Thêm' : 'Cập nhật') + ' thất bại', error.message);
    }
  };

  const filteredUsers = users.filter(u => {
    const hoTen = u.hoten || u.HoTen || '';
    const maSo = u.maso || u.MaSo || '';
    const email = u.email || u.Email || '';
    const maVaiTro = u.mavaitro || u.MaVaiTro;
    const maKhoa = u.makhoa || u.MaKhoa || '';
    const maNganh = u.manganh || u.MaNganh || '';
    
    const matchesSearch = 
      hoTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      maSo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = maVaiTro === ROLE_MAP[activeTab];
    
    // Faculty filter (only for lecturers and students)
    const matchesFaculty = !filterFaculty || maKhoa === filterFaculty;
    
    // Major filter (only for students)
    const matchesMajor = !filterMajor || maNganh === filterMajor;
    
    return matchesSearch && matchesRole && matchesFaculty && matchesMajor;
  });

  const tabs = [
    { id: 'admin', label: 'Quản trị viên', icon: Shield, roleId: 1 },
    { id: 'lecturer', label: 'Giảng viên', icon: BookOpen, roleId: 2 },
    { id: 'student', label: 'Sinh viên', icon: GraduationCap, roleId: 3 },
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Thêm {currentTab?.label.toLowerCase()}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${
              activeTab === tab.id 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {users.filter(u => (u.mavaitro || u.MaVaiTro) === tab.roleId).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, mã số hoặc email..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Faculty filter (show for lecturers and students) */}
        {(activeTab === 'lecturer' || activeTab === 'student') && (
          <select
            value={filterFaculty}
            onChange={(e) => {
              setFilterFaculty(e.target.value);
              setFilterMajor(''); // Reset major when faculty changes
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả khoa</option>
            {faculties.map(f => (
              <option key={f.makhoa || f.MaKhoa} value={f.makhoa || f.MaKhoa}>
                {f.tenkhoa || f.TenKhoa}
              </option>
            ))}
          </select>
        )}
        
        {/* Major filter (show only for students) */}
        {activeTab === 'student' && (
          <select
            value={filterMajor}
            onChange={(e) => setFilterMajor(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả ngành</option>
            {(filterFaculty 
              ? allMajors.filter(m => (m.makhoa || m.MaKhoa) === filterFaculty)
              : allMajors
            ).map(m => (
              <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>
                {m.tennganh || m.TenNganh}
              </option>
            ))}
          </select>
        )}
        
        {/* Clear filters */}
        {(filterFaculty || filterMajor || searchTerm) && (
          <button
            onClick={() => {
              setFilterFaculty('');
              setFilterMajor('');
              setSearchTerm('');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left relative">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600">Mã số</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Họ tên</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Số điện thoại</th>
                {activeTab !== 'admin' && (
                  <th className="px-6 py-4 font-semibold text-gray-600">Khoa</th>
                )}
                <th className="px-6 py-4 font-semibold text-gray-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Đang tải...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Không tìm thấy người dùng</td></tr>
              ) : (
                filteredUsers.map((user) => {
                  const maSo = user.maso || user.MaSo || '';
                  const hoTen = user.hoten || user.HoTen || '';
                  const email = user.email || user.Email || '';
                  const soDienThoai = user.sodienthoai || user.SoDienThoai || '';
                  const tenKhoa = user.tenkhoa || user.TenKhoa || '';
                  return (
                    <tr key={maSo} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{maSo}</td>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {hoTen.charAt(0) || '?'}
                        </div>
                        {hoTen}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{email}</td>
                      <td className="px-6 py-4 text-gray-500">{soDienThoai || '-'}</td>
                      {activeTab !== 'admin' && (
                        <td className="px-6 py-4 text-gray-500">{tenKhoa || '-'}</td>
                      )}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(maSo)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Thêm' : 'Sửa'} {currentTab?.label.toLowerCase()}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã số *</label>
                  <input 
                    required
                    disabled={modalMode === 'edit'}
                    className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    value={formData.maSo}
                    onChange={e => setFormData({...formData, maSo: e.target.value})}
                    placeholder={activeTab === 'student' ? 'VD: 62133123' : 'VD: GV001'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input 
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={formData.hoTen}
                    onChange={e => setFormData({...formData, hoTen: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email"
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input 
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={formData.soDienThoai}
                    onChange={e => setFormData({...formData, soDienThoai: e.target.value})}
                  />
                </div>
              </div>

              {activeTab !== 'admin' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Khoa</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={formData.maKhoa}
                      onChange={e => setFormData({...formData, maKhoa: e.target.value, maNganh: ''})}
                    >
                      <option value="">-- Chọn khoa --</option>
                      {faculties.map(f => (
                        <option key={f.makhoa || f.MaKhoa} value={f.makhoa || f.MaKhoa}>{f.tenkhoa || f.TenKhoa}</option>
                      ))}
                    </select>
                  </div>
                  {activeTab === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngành</label>
                      <select 
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={formData.maNganh}
                        onChange={e => setFormData({...formData, maNganh: e.target.value})}
                        disabled={!formData.maKhoa}
                      >
                        <option value="">-- Chọn ngành --</option>
                        {majors.map(m => (
                          <option key={m.manganh || m.MaNganh} value={m.manganh || m.MaNganh}>{m.tennganh || m.TenNganh}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {modalMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full p-2 pr-10 border border-gray-300 rounded-lg"
                      value={formData.matKhau}
                      onChange={e => setFormData({...formData, matKhau: e.target.value})}
                      placeholder="Mật khẩu đăng nhập"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
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

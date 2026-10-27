import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Hash, BookOpen, Shield, Phone, Building, Edit, X, Eye, EyeOff, Key, Save, Camera, Upload } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function UserProfile() {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lỗi', 'Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Lỗi', 'Kích thước ảnh tối đa 2MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
      setEditData(prev => ({ ...prev, avatar: base64 }));
    } catch (error) {
      toast.error('Lỗi', 'Không thể đọc file ảnh');
    }
  };

  // Quick avatar upload without opening edit modal
  const handleQuickAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Lỗi', 'Vui lòng chọn file ảnh (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Lỗi', 'Kích thước ảnh tối đa 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await updateProfile({ avatar: base64 });
      if (result.success) {
        toast.success('Thành công', 'Cập nhật ảnh đại diện thành công!');
      } else {
        toast.error('Lỗi', result.error || 'Không thể cập nhật ảnh đại diện');
      }
    } catch (error) {
      toast.error('Lỗi', 'Không thể tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'lecturer': return 'Giảng viên';
      case 'student': return 'Sinh viên';
      default: return role;
    }
  };

  const openEditModal = () => {
    setEditData({
      hoTen: user.HoTen || '',
      email: user.Email || '',
      soDienThoai: user.SoDienThoai || '',
      avatar: user.Avatar || ''
    });
    setAvatarPreview(user.Avatar || null);
    setShowEditModal(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProfile(editData);
      if (result.success) {
        toast.success('Cập nhật thành công', 'Thông tin đã được lưu');
        setShowEditModal(false);
      } else {
        toast.error('Cập nhật thất bại', result.error || 'Lỗi không xác định');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.warning('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    setLoading(true);
    try {
      const result = await changePassword(passwordData.oldPassword, passwordData.newPassword);
      if (result.success) {
        toast.success('Thành công', 'Đổi mật khẩu thành công!');
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error('Đổi mật khẩu thất bại', result.error || 'Mật khẩu cũ không đúng');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
        <div className="flex gap-2">
          <button
            onClick={openEditModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Edit size={18} /> Chỉnh sửa
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200"
          >
            <Key size={18} /> Đổi mật khẩu
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar & Name */}
          <div className="relative flex items-end -mt-12 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                {user.Avatar ? (
                  <img 
                    src={user.Avatar} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user.HoTen?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {/* Upload button overlay */}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQuickAvatarUpload}
                  className="hidden"
                />
                {uploadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera size={24} className="text-white" />
                )}
              </label>
            </div>
            <div className="ml-4 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{user.HoTen}</h2>
              <p className="text-gray-500 font-medium">{getRoleLabel(user.role)}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <Hash size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Mã số</p>
                  <p className="font-medium text-gray-900">{user.MaSo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-600 shadow-sm">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                  <p className="font-medium text-gray-900">{user.Email || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-cyan-600 shadow-sm">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Số điện thoại</p>
                  <p className="font-medium text-gray-900">{user.SoDienThoai || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-purple-600 shadow-sm">
                  <Building size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Khoa</p>
                  <p className="font-medium text-gray-900">{user.TenKhoa || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {user.role === 'student' && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-pink-600 shadow-sm">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Ngành</p>
                    <p className="font-medium text-gray-900">{user.TenNganh || 'Chưa cập nhật'}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-orange-600 shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vai trò</p>
                  <p className="font-medium text-gray-900">{getRoleLabel(user.role)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Chỉnh sửa hồ sơ</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-gray-700 mb-2 self-start">Ảnh đại diện</label>
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                        {user.HoTen?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Camera size={24} className="text-white" />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">Click vào ảnh để đổi (tối đa 2MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  required
                  className="w-full p-2 border rounded-lg"
                  value={editData.hoTen}
                  onChange={e => setEditData({ ...editData, hoTen: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border rounded-lg"
                  value={editData.email}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full p-2 border rounded-lg"
                  value={editData.soDienThoai}
                  onChange={e => setEditData({ ...editData, soDienThoai: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Đổi mật khẩu</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    required
                    className="w-full p-2 pr-10 border rounded-lg"
                    value={passwordData.oldPassword}
                    onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="w-full p-2 pr-10 border rounded-lg"
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="w-full p-2 pr-10 border rounded-lg"
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, referenceApi } from '../../services/api';
import { Plus, Trash2, Calendar, Clock, Edit, X, Users, MapPin, Eye, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { getBuildingCoords } from '../../constants/buildingCoords';

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'Toàn trường' },
  { value: 'LECTURER', label: 'Giảng viên' },
  { value: 'STUDENT', label: 'Sinh viên' }
];

// Status computed automatically based on time
const STATUS_OPTIONS = [
  { value: 'UPCOMING', label: 'Sắp diễn ra', color: 'bg-blue-100 text-blue-700' },
  { value: 'ACTIVE', label: 'Đang diễn ra', color: 'bg-green-100 text-green-700' },
  { value: 'COMPLETED', label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-700' },
  { value: 'CANCELLED', label: 'Đã hủy', color: 'bg-red-100 text-red-700' }
];

export default function EventManagement() {
  const navigate = useNavigate();
  const { flyToDirectly } = useMap();
  const toast = useToast();
  const { confirmDelete, confirmWarning, confirmAction } = useConfirm();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTarget, setFilterTarget] = useState(''); // Add target filter
  
  // Reference data for location selection
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  
  const [formData, setFormData] = useState({
    tieuDe: '',
    moTa: '',
    maDiaDiem: '',
    loaiDiaDiem: 'BUILDING', // BUILDING or ROOM
    tenDiaDiem: '',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    doiTuongMucTieu: 'ALL'
  });

  // Load reference data
  useEffect(() => {
    loadReferenceData();
    loadEvents();
  }, []);
  
  // Load rooms when building changes
  useEffect(() => {
    if (selectedBuilding) {
      referenceApi.getClassrooms(selectedBuilding).then(res => {
        setRooms(res || []);
      });
    } else {
      setRooms([]);
    }
  }, [selectedBuilding]);

  const loadReferenceData = async () => {
    try {
      const buildingsRes = await referenceApi.getBuildings();
      setBuildings(buildingsRes || []);
    } catch (error) {
      console.error('Failed to load buildings', error);
    }
  };

  // Handle view location on map - directly fly to location
  const handleViewLocation = (event) => {
    const locationName = event.TenDiaDiem || event.DiaDiem;
    if (locationName) {
      // Use getBuildingCoords which handles "Tòa nhà G6", "G6-201", etc.
      const coords = getBuildingCoords(locationName);
      
      flyToDirectly({
        lat: coords.lat,
        lng: coords.lng,
        name: locationName,
        buildingId: event.MaDiaDiem || locationName,
      }, navigate);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await eventsApi.getAll();
      // Response can be { data: [...], pagination: {...} } or just an array
      const eventsData = response.data || response;
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to load events', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('sự kiện này');
    if (confirmed) {
      try {
        setActionLoading(id);
        await eventsApi.delete(id);
        toast.success('Thành công', 'Đã xóa sự kiện');
        loadEvents();
      } catch (error) {
        toast.error('Xóa thất bại', error.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCancel = async (id) => {
    const confirmed = await confirmWarning(
      'Sự kiện sẽ được đánh dấu là "Đã hủy" nhưng vẫn được lưu trữ.',
      'Hủy sự kiện này?'
    );
    if (confirmed) {
      try {
        setActionLoading(id);
        await eventsApi.cancel(id);
        toast.success('Thành công', 'Đã hủy sự kiện');
        loadEvents();
      } catch (error) {
        toast.error('Hủy thất bại', error.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleRestore = async (id) => {
    const confirmed = await confirmAction(
      'Trạng thái sẽ được tính toán lại dựa trên thời gian.',
      'Khôi phục sự kiện?'
    );
    if (confirmed) {
      try {
        setActionLoading(id);
        await eventsApi.restore(id);
        toast.success('Thành công', 'Đã khôi phục sự kiện');
        loadEvents();
      } catch (error) {
        toast.error('Khôi phục thất bại', error.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setSelectedEvent(null);
    setSelectedBuilding('');
    setFormData({
      tieuDe: '',
      moTa: '',
      maDiaDiem: '',
      loaiDiaDiem: 'BUILDING',
      tenDiaDiem: '',
      thoiGianBatDau: '',
      thoiGianKetThuc: '',
      doiTuongMucTieu: 'ALL'
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEvent(event);
    // Set building for room dropdown if location type is ROOM
    if (event.LoaiDiaDiem === 'ROOM' && event.MaDiaDiem) {
      // Find room to get its building
      const room = rooms.find(r => (r.MaPhong || r.maphong) === event.MaDiaDiem);
      if (room) {
        setSelectedBuilding(room.MaToaNha || room.matoanha || '');
      }
    } else if (event.LoaiDiaDiem === 'BUILDING') {
      setSelectedBuilding(event.MaDiaDiem || '');
    }
    setFormData({
      tieuDe: event.TieuDe || event.tieude || '',
      moTa: event.MoTa || event.mota || '',
      maDiaDiem: event.MaDiaDiem || event.maDiaDiem || '',
      loaiDiaDiem: event.LoaiDiaDiem || event.loaidiadiem || 'BUILDING',
      tenDiaDiem: event.TenDiaDiem || event.tendiadiem || '',
      thoiGianBatDau: event.ThoiGianBatDau ? new Date(event.ThoiGianBatDau).toISOString().slice(0, 16) : '',
      thoiGianKetThuc: event.ThoiGianKetThuc ? new Date(event.ThoiGianKetThuc).toISOString().slice(0, 16) : '',
      doiTuongMucTieu: event.DoiTuongMucTieu || event.doituongmuctieu || 'ALL'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await eventsApi.create(formData);
        toast.success('Thành công', 'Đã tạo sự kiện mới');
      } else {
        await eventsApi.update(selectedEvent.MaSuKien, formData);
        toast.success('Thành công', 'Đã cập nhật sự kiện');
      }
      setShowModal(false);
      loadEvents();
    } catch (error) {
      toast.error((modalMode === 'add' ? 'Tạo' : 'Cập nhật') + ' thất bại', error.message);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getTargetLabel = (target) => {
    return TARGET_OPTIONS.find(t => t.value === target)?.label || target;
  };

  return (
    <div className="p-6 space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý sự kiện</h1>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Tạo sự kiện
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Đang tải...
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Chưa có sự kiện nào
        </div>
      ) : (
        <>
          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 shrink-0">
            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tất cả ({events.length})
              </button>
              {STATUS_OPTIONS.map(status => {
                const count = events.filter(e => e.TrangThai === status.value).length;
                return (
                  <button
                    key={status.value}
                    onClick={() => setFilterStatus(status.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      filterStatus === status.value ? 'bg-blue-600 text-white' : `${status.color} hover:opacity-80`
                    }`}
                  >
                    {status.label} ({count})
                  </button>
                );
              })}
            </div>
            
            {/* Target filter */}
            <select
              value={filterTarget}
              onChange={(e) => setFilterTarget(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả đối tượng</option>
              {TARGET_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto flex-1">
            {events
              .filter(event => !filterStatus || event.TrangThai === filterStatus)
              .filter(event => !filterTarget || event.DoiTuongMucTieu === filterTarget)
              .map(event => {
              const statusInfo = getStatusInfo(event.TrangThai);
              const isLoading = actionLoading === event.MaSuKien;
              const isCancelled = event.TrangThai === 'CANCELLED';
              return (
                <div 
                  key={event.MaSuKien} 
                  className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${
                    isCancelled ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        {getTargetLabel(event.DoiTuongMucTieu)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(event.TenDiaDiem || event.DiaDiem) && (
                        <button 
                          onClick={() => handleViewLocation(event)} 
                          className="text-gray-400 hover:text-green-500 p-1"
                          title="Xem vị trí"
                          disabled={isLoading}
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      {!isCancelled && (
                        <button 
                          onClick={() => openEditModal(event)} 
                          className="text-gray-400 hover:text-blue-500 p-1"
                          title="Chỉnh sửa"
                          disabled={isLoading}
                        >
                          <Edit size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className={`font-bold text-lg text-gray-900 mb-2 ${isCancelled ? 'line-through' : ''}`}>
                    {event.TieuDe}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.MoTa || 'Không có mô tả'}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    {(event.TenDiaDiem || event.DiaDiem) && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        {event.TenDiaDiem || event.DiaDiem}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      {formatDateTime(event.ThoiGianBatDau)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {formatDateTime(event.ThoiGianKetThuc)}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                    {isCancelled ? (
                      <>
                        <button
                          onClick={() => handleRestore(event.MaSuKien)}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                          Khôi phục
                        </button>
                        <button
                          onClick={() => handleDelete(event.MaSuKien)}
                          disabled={isLoading}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
                          title="Xóa vĩnh viễn"
                        >
                          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancel(event.MaSuKien)}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Hủy sự kiện
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Tạo sự kiện mới' : 'Chỉnh sửa sự kiện'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input 
                  required 
                  className="w-full border rounded-lg px-3 py-2" 
                  value={formData.tieuDe} 
                  onChange={e => setFormData({...formData, tieuDe: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea 
                  className="w-full border rounded-lg px-3 py-2 h-24" 
                  value={formData.moTa} 
                  onChange={e => setFormData({...formData, moTa: e.target.value})} 
                />
              </div>

              {/* Location Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Địa điểm</label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tòa nhà</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      value={selectedBuilding}
                      onChange={e => {
                        setSelectedBuilding(e.target.value);
                        // If only building selected (no room), set building as location
                        const building = buildings.find(b => (b.matoanha || b.MaToaNha) === e.target.value);
                        if (building) {
                          setFormData({
                            ...formData, 
                            maDiaDiem: e.target.value,
                            loaiDiaDiem: 'BUILDING',
                            tenDiaDiem: building.tentoanha || building.TenToaNha
                          });
                        }
                      }}
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
                    <label className="block text-xs text-gray-500 mb-1">Phòng (tùy chọn)</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      value={formData.loaiDiaDiem === 'ROOM' ? formData.maDiaDiem : ''}
                      onChange={e => {
                        if (e.target.value) {
                          const room = rooms.find(r => (r.MaPhong || r.maphong) === e.target.value);
                          if (room) {
                            const building = buildings.find(b => (b.matoanha || b.MaToaNha) === selectedBuilding);
                            const buildingName = building ? (building.tentoanha || building.TenToaNha) : '';
                            setFormData({
                              ...formData, 
                              maDiaDiem: e.target.value,
                              loaiDiaDiem: 'ROOM',
                              tenDiaDiem: `${buildingName} - ${room.TenPhong || room.tenphong}`
                            });
                          }
                        } else {
                          // Clear room selection, revert to building
                          const building = buildings.find(b => (b.matoanha || b.MaToaNha) === selectedBuilding);
                          if (building) {
                            setFormData({
                              ...formData, 
                              maDiaDiem: selectedBuilding,
                              loaiDiaDiem: 'BUILDING',
                              tenDiaDiem: building.tentoanha || building.TenToaNha
                            });
                          }
                        }
                      }}
                      disabled={!selectedBuilding}
                    >
                      <option value="">-- Không chọn phòng --</option>
                      {rooms.map(r => (
                        <option key={r.MaPhong || r.maphong} value={r.MaPhong || r.maphong}>
                          {r.TenPhong || r.tenphong} (Tầng {r.SoTang || r.sotang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {formData.tenDiaDiem && (
                  <p className="text-xs text-gray-500">
                    Địa điểm đã chọn: <span className="font-medium text-gray-700">{formData.tenDiaDiem}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bắt đầu *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    className="w-full border rounded-lg px-3 py-2" 
                    value={formData.thoiGianBatDau} 
                    onChange={e => setFormData({...formData, thoiGianBatDau: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kết thúc *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    className="w-full border rounded-lg px-3 py-2" 
                    value={formData.thoiGianKetThuc} 
                    onChange={e => setFormData({...formData, thoiGianKetThuc: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Đối tượng</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.doiTuongMucTieu} 
                  onChange={e => setFormData({...formData, doiTuongMucTieu: e.target.value})}
                >
                  {TARGET_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Status info note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Trạng thái sự kiện được tự động xác định dựa trên thời gian:
                </p>
                <ul className="text-xs text-blue-700 mt-1 ml-4 list-disc">
                  <li><strong>Sắp diễn ra:</strong> Trước thời gian bắt đầu</li>
                  <li><strong>Đang diễn ra:</strong> Trong khoảng thời gian sự kiện</li>
                  <li><strong>Đã kết thúc:</strong> Sau thời gian kết thúc</li>
                  <li><strong>Đã hủy:</strong> Sử dụng nút "Hủy sự kiện" để hủy</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {modalMode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

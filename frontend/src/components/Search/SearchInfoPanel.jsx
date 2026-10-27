/**
 * SearchInfoPanel.jsx
 * Information panel that appears when selecting a building from search
 * Shows building image, description, and classroom search functionality
 * Width matches SearchBar (350px), height matches sidebar
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, MapPin, Building2, Search, ChevronDown, 
  Loader2, Info, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import buildingApi from '../../services/buildingApi';

// Extension descriptions (manual data for non-building items)
const EXTENSION_INFO = {
  'PTC': { name: 'Tiệm Photocopy', description: 'Dịch vụ photocopy, in ấn, đóng sách phục vụ sinh viên và cán bộ. Giờ mở cửa: 7:00 - 21:00.' },
  'TB': { name: 'Tháp Bút', description: 'Biểu tượng kiến trúc của trường, nằm ở trung tâm khuôn viên.' },
  'SBR': { name: 'Sân Bóng Rổ', description: 'Sân bóng rổ tiêu chuẩn, mở cửa tự do cho sinh viên.' },
  'SBC': { name: 'Sân Bóng Chuyền', description: 'Sân bóng chuyền ngoài trời, tổ chức các giải đấu định kỳ.' },
  'SBD': { name: 'Sân Tập Bóng Đá', description: 'Sân bóng đá mini cỏ nhân tạo phục vụ hoạt động thể thao.' },
  'SCC': { name: 'Sân Chào Cờ', description: 'Sân trung tâm tổ chức lễ chào cờ và các sự kiện lớn.' },
  'ATM': { name: 'Trạm ATM', description: 'Trạm ATM Vietcombank phục vụ rút tiền 24/7.' },
  'CTT': { name: 'Căn Tin', description: 'Khu vực ăn uống với nhiều quầy hàng đa dạng. Giờ mở: 6:30 - 21:00.' },
  'STTD': { name: 'Sân Tập Thể Dục', description: 'Khu vực tập thể dục ngoài trời với các dụng cụ tập luyện.' },
  'TV': { name: 'Thư Viện', description: 'Thư viện trung tâm với hàng nghìn đầu sách và phòng đọc yên tĩnh.' },
  'P1': { name: 'Bãi Đỗ Xe Trước Cổng', description: 'Bãi đỗ xe máy dành cho sinh viên, sức chứa 500 xe.' },
  'P2': { name: 'Bãi Đỗ Xe HT3', description: 'Bãi đỗ xe dành cho khu vực HT3 và Viện Thủy Sản.' },
  'P3': { name: 'Bãi Đỗ Xe Dưới Hầm', description: 'Bãi đỗ xe tầng hầm sân bóng, có mái che.' },
};

// Default building image when no image from DB
const DEFAULT_BUILDING_IMAGE = 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=60';

export default function SearchInfoPanel({ 
  building, 
  onClose, 
  onRoomSearch,
  isExtension = false 
}) {
  const [buildingData, setBuildingData] = useState(null);
  const [floors, setFloors] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch building data from API
  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!building?.id) return;
      
      // Check if this is an extension (amenity)
      if (building.type === 'extension' || isExtension) {
        const extInfo = EXTENSION_INFO[building.id] || {
          name: building.name,
          description: 'Thông tin đang được cập nhật.'
        };
        setBuildingData({
          matoanha: building.id,
          tentoanha: extInfo.name || building.name,
          mota: extInfo.description,
          hinhanh: null,
          isExtension: true
        });
        setFloors([]);
        setClassrooms([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch building details
        const data = await buildingApi.getBuildingByMapKey(building.id);
        setBuildingData(data);

        // Fetch floors
        const floorsData = await buildingApi.getFloors(building.id);
        setFloors(floorsData);
        
        if (floorsData.length > 0) {
          setSelectedFloor(floorsData[0]);
        }
      } catch (err) {
        console.error('Failed to fetch building data:', err);
        // Fallback to local data
        setBuildingData({
          matoanha: building.id,
          tentoanha: building.name,
          mota: 'Đang cập nhật thông tin tòa nhà...',
          hinhanh: null
        });
        setError('Không thể tải thông tin từ máy chủ');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingData();
  }, [building, isExtension]);

  // Fetch classrooms when floor changes
  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!building?.id || !selectedFloor || buildingData?.isExtension) {
        setClassrooms([]);
        return;
      }

      try {
        const data = await buildingApi.getClassrooms(building.id, selectedFloor);
        setClassrooms(data);
        setSelectedRoom(null);
      } catch (err) {
        console.error('Failed to fetch classrooms:', err);
        setClassrooms([]);
      }
    };

    fetchClassrooms();
  }, [building?.id, selectedFloor, buildingData?.isExtension]);

  // Handle room search button click
  const handleRoomSearch = useCallback(() => {
    if (!selectedRoom || !onRoomSearch) return;
    
    onRoomSearch({
      building: buildingData,
      room: selectedRoom,
      location: building.location
    });
  }, [selectedRoom, buildingData, building, onRoomSearch]);

  if (!building) return null;

  const imageUrl = buildingData?.hinhanh || DEFAULT_BUILDING_IMAGE;
  const isExtensionType = buildingData?.isExtension || building.type === 'extension';

  return (
    <div className="w-[350px] h-[calc(100vh-140px)] max-h-[600px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in slide-in-from-top-2 duration-300">
      {/* Header Image */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={buildingData?.tentoanha || building.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = DEFAULT_BUILDING_IMAGE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
        >
          <X size={18} />
        </button>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-xl font-bold text-white leading-tight drop-shadow-lg">
            {buildingData?.tentoanha || building.name}
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium">
              <MapPin size={12} />
              {buildingData?.matoanha || building.id}
            </span>
            {isExtensionType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/80 backdrop-blur-sm rounded-full text-white text-xs font-medium">
                Tiện ích
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-500">Đang tải...</span>
          </div>
        ) : (
          <>
            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <Info size={16} className="text-blue-500" />
                Thông tin
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-6">
                {buildingData?.mota || 'Đang cập nhật thông tin...'}
              </p>
            </div>

            {/* Classroom Search Section - Only for buildings */}
            {!isExtensionType && floors.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-3">
                  <Building2 size={16} className="text-blue-500" />
                  Tìm phòng học
                </div>

                {/* Floor & Room Selectors */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Floor Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Tầng
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFloor || ''}
                        onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
                        className="w-full appearance-none px-3 py-2.5 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        {floors.map(floor => (
                          <option key={floor} value={floor}>Tầng {floor}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Room Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Phòng
                    </label>
                    <div className="relative">
                      <select
                        value={selectedRoom?.maphong || ''}
                        onChange={(e) => {
                          const room = classrooms.find(r => r.maphong === e.target.value);
                          setSelectedRoom(room);
                        }}
                        className="w-full appearance-none px-3 py-2.5 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={classrooms.length === 0}
                      >
                        <option value="">Chọn phòng...</option>
                        {classrooms.map(room => (
                          <option key={room.maphong} value={room.maphong}>
                            {room.tenphong}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleRoomSearch}
                  disabled={!selectedRoom}
                  className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <Search size={16} />
                  Xem trạng thái phòng
                </button>

                {/* No classrooms message */}
                {selectedFloor && classrooms.length === 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Tầng này chưa có dữ liệu phòng học trong hệ thống.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Extension-only message */}
            {isExtensionType && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Đang hoạt động
                </p>
              </div>
            )}

            {/* No floors message for buildings */}
            {!isExtensionType && floors.length === 0 && !loading && (
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center">
                <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Chưa có dữ liệu phòng học</p>
                <p className="text-xs text-gray-400 mt-1">Thông tin đang được cập nhật</p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

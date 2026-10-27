import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Info, Users, AlertCircle, Loader2 } from 'lucide-react';
import buildingsGeoJson from '../../data/building.json';
import { roomStatusApi, referenceApi } from '../../services/api';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Compute a stable center without keeping GeoJSON Feature objects around.
// Uses bbox center of geometry coordinates (works well for building polygons).
function computeGeometryBboxCenterLngLat(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  const points = [];
  const visit = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      points.push(node);
      return;
    }
    for (const child of node) visit(child);
  };

  visit(geometry.coordinates);
  if (points.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const p of points) {
    const lng = p[0];
    const lat = p[1];
    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) continue;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  if (!isFiniteNumber(minLng) || !isFiniteNumber(maxLng) || !isFiniteNumber(minLat) || !isFiniteNumber(maxLat)) {
    return null;
  }

  return { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 };
}

export default function BuildingSearch({ onSelectBuilding }) {

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [buildings, setBuildings] = useState([]);
  
  // Dynamic Status State
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomStatus, setRoomStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    try {
      const items = (buildingsGeoJson?.features || []).map((f) => {
          const props = f?.properties || {};
          const id = props.MaToaNha || props.MapKey;
          const name = props.TenToaNha || props.Ten || props.Name || props.name || props.MapKey || id;
          const key = props.MaToaNha || props.MapKey;

          const center = computeGeometryBboxCenterLngLat(f?.geometry);
          if (!center) {
            console.warn('[BuildingSearch] centroid/bbox center missing for building', { id, name, geometryType: f?.geometry?.type });
          }

          return {
            id,
            name,
            key,
            location: center ? { lng: center.lng, lat: center.lat } : null,
          };
        });
      setBuildings(items);
    } catch (error) {
      console.error('Failed to load buildings', error);
      setBuildings([]);
    }
  }, []);

  // Load rooms when building is selected
  useEffect(() => {
    if (selectedBuilding) {
      loadBuildingRooms(selectedBuilding.id);
    } else {
      setRooms([]);
      setFloors([]);
    }
  }, [selectedBuilding]);

  const loadBuildingRooms = async (buildingId) => {
    try {
      const roomsData = await referenceApi.getClassrooms(buildingId);
      const roomsList = roomsData || [];
      setRooms(roomsList);
      
      // Extract unique floors
      const uniqueFloors = [...new Set(roomsList.map(r => r.Tang || r.tang || 1))].sort((a, b) => a - b);
      setFloors(uniqueFloors.length > 0 ? uniqueFloors : [1, 2, 3]);
    } catch (error) {
      console.error('Failed to load rooms', error);
      setRooms([]);
      setFloors([1, 2, 3]);
    }
  };

  // Fetch real room status from API
  useEffect(() => {
    if (selectedRoom) {
      fetchRoomStatus(selectedRoom);
    } else {
      setRoomStatus(null);
    }
  }, [selectedRoom]);

  const fetchRoomStatus = async (roomCode) => {
    setLoadingStatus(true);
    try {
      const statusData = await roomStatusApi.getByRoom(roomCode);
      if (statusData) {
        // Map API response to display format
        const statusMap = {
          'EMPTY': { status: 'Empty', label: 'Phòng trống', color: 'text-gray-600 bg-gray-50' },
          'UPCOMING': { status: 'Upcoming', label: 'Sắp bắt đầu', color: 'text-yellow-600 bg-yellow-50' },
          'IN_PROGRESS': { status: 'Occupied', label: statusData.currentClass?.TenMon || 'Đang học', color: 'text-green-600 bg-green-50' },
          'ENDING_SOON': { status: 'EndingSoon', label: 'Sắp kết thúc', color: 'text-orange-600 bg-orange-50' },
          'MAINTENANCE': { status: 'Maintenance', label: 'Đang bảo trì', color: 'text-red-600 bg-red-50' }
        };
        const mapped = statusMap[statusData.status] || statusMap['EMPTY'];
        setRoomStatus({
          ...mapped,
          classInfo: statusData.currentClass,
          nextClass: statusData.nextClass
        });
      } else {
        setRoomStatus({ status: 'Empty', label: 'Phòng trống', color: 'text-gray-600 bg-gray-50' });
      }
    } catch (error) {
      console.error('Failed to fetch room status', error);
      setRoomStatus({ status: 'Empty', label: 'Phòng trống', color: 'text-gray-600 bg-gray-50' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 0) {
      const filtered = buildings.filter(b => 
        (b.name || '').toLowerCase().includes(value.toLowerCase()) || 
        (b.id || '').toString().toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (building) => {
    setQuery(building.name);
    setIsOpen(false);
    setSelectedBuilding(building);
    onSelectBuilding({
      id: building?.id,
      name: building?.name,
      location: building?.location ? { lng: building.location.lng, lat: building.location.lat } : null,
    });
    
    // Reset room selection when building changes
    setSelectedRoom(null);
  };

  // Handle room selection from floor buttons
  const handleFloorSelect = (floor) => {
    // Find first room on this floor
    const floorRooms = rooms.filter(r => (r.Tang || r.tang) === floor);
    if (floorRooms.length > 0) {
      const room = floorRooms[0];
      const roomCode = room.MaPhong || room.maphong;
      setSelectedRoom(roomCode);
    } else {
      // Fallback: construct room code
      const roomCode = `${selectedBuilding?.id}-${floor}01`;
      setSelectedRoom(roomCode);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className="relative w-[350px]">
        <div className="bg-white rounded-xl shadow-md flex items-center px-4 h-12 border border-gray-200">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            placeholder="Tìm tòa nhà, lớp học..."
            className="flex-1 outline-none text-gray-700 placeholder-gray-400"
            value={query}
            onChange={handleSearch}
            onFocus={() => query && setIsOpen(true)}
          />
          {query && (
              <button onClick={() => {setQuery(''); setIsOpen(false); setSelectedRoom(null); setSelectedBuilding(null);}} className="text-gray-400 hover:text-gray-600">
                  <span className="text-xs">✕</span>
              </button>
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 max-h-[300px] overflow-y-auto z-50">
            {results.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">Tòa nhà {item.id}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Status Box (Only shows when a building is selected) */}
      {selectedBuilding && !isOpen && (
        <div className="w-[350px] bg-white rounded-xl shadow-md border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Trạng thái phòng</h3>
            {/* Floor Selector */}
            <div className="flex gap-1">
               {floors.slice(0, 5).map(f => (
                 <button 
                    key={f} 
                    onClick={() => handleFloorSelect(f)}
                    className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                      selectedRoom?.includes(`-${f}`) 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600'
                    }`}
                 >
                   {f}
                 </button>
               ))}
            </div>
          </div>

          {loadingStatus ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          ) : selectedRoom ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{selectedRoom}</span>
                {roomStatus && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${roomStatus.color}`}>
                    {roomStatus.label}
                  </span>
                )}
              </div>
              
              {roomStatus?.classInfo && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <Users size={14} />
                  <span>
                    {roomStatus.classInfo.TenMon} • GV: {roomStatus.classInfo.TenGiangVien || 'N/A'}
                  </span>
                </div>
              )}
              
              {roomStatus?.nextClass && (
                <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>Tiếp theo: {roomStatus.nextClass.TenMon} lúc {roomStatus.nextClass.GioBatDau}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400 italic">
              <Info size={16} />
              <span>Chọn tầng để xem trạng thái phòng</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

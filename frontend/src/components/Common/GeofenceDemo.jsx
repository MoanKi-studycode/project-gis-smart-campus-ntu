import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, XCircle, Navigation, Building2, AlertTriangle, Loader } from 'lucide-react';
import { checkPointInBuildingZone, findNearestBuilding, validateAttendanceLocation, PRE_BUFFERED_METERS } from '../../services/geofenceService';
// Using buildinglogic.json - already pre-buffered 15m for GPS tolerance
import buildingsGeoJson from '../../data/buildinglogic.json';

/**
 * GeofenceDemo - Interactive demonstration of GPS-based attendance geofencing
 * 
 * IMPORTANT: Uses buildinglogic.json which has pre-buffered polygons (+15m)
 * This buffer accounts for GPS accuracy errors
 * 
 * Shows:
 * 1. Real-time GPS tracking
 * 2. Building buffer zone visualization (15m pre-buffered)
 * 3. Check-in validation logic
 * 4. Distance to buildings calculation
 */
export default function GeofenceDemo() {
  const [gpsLocation, setGpsLocation] = useState({ lat: null, lng: null, status: 'loading' });
  const [selectedBuilding, setSelectedBuilding] = useState('G7');
  const [checkResult, setCheckResult] = useState(null);
  const [nearestResult, setNearestResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // List of buildings from GeoJSON
  const buildings = buildingsGeoJson.features.map(f => ({
    code: f.properties.MaToaNha,
    name: f.properties.TenToaNha
  }));

  // GPS Location tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsLocation({ lat: null, lng: null, status: 'GPS không được hỗ trợ' });
      return;
    }

    setGpsLocation(prev => ({ ...prev, status: 'loading' }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          status: 'active'
        });
      },
      (error) => {
        let errorMsg = 'Lỗi GPS';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'GPS bị từ chối quyền truy cập';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Không có tín hiệu GPS';
            break;
          case error.TIMEOUT:
            errorMsg = 'GPS timeout';
            break;
        }
        setGpsLocation({ lat: null, lng: null, status: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Auto-check nearest building when GPS updates
  useEffect(() => {
    if (gpsLocation.lat && gpsLocation.lng) {
      const result = findNearestBuilding(gpsLocation.lat, gpsLocation.lng);
      setNearestResult(result);
    }
  }, [gpsLocation.lat, gpsLocation.lng]);

  // Handle check-in button click
  const handleCheckIn = () => {
    if (!gpsLocation.lat || !gpsLocation.lng) {
      setCheckResult({
        valid: false,
        message: 'Không có tọa độ GPS. Vui lòng bật định vị.',
        error: 'GPS_UNAVAILABLE'
      });
      return;
    }

    setIsChecking(true);
    
    // Simulate network delay
    setTimeout(() => {
      const result = validateAttendanceLocation({
        lat: gpsLocation.lat,
        lng: gpsLocation.lng,
        buildingCode: selectedBuilding
      });
      setCheckResult(result);
      setIsChecking(false);
    }, 800);
  };

  // Test with specific coordinates (for demo without real GPS)
  const handleTestLocation = (lat, lng, name) => {
    const result = checkPointInBuildingZone(lat, lng, selectedBuilding);
    setCheckResult({
      valid: result.isInside,
      message: result.message,
      details: {
        testLocation: name,
        distance: result.distance,
        buildingCode: selectedBuilding,
        buildingName: result.buildingName
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Navigation className="w-6 h-6" />
          Demo Điểm Danh GPS - Geofencing
        </h1>
        <p className="mt-2 opacity-90">
          Hệ thống kiểm tra vị trí GPS của sinh viên có nằm trong vùng buffer ({PRE_BUFFERED_METERS}m - đã buffer sẵn trong buildinglogic.json) 
          của tòa nhà hay không trước khi cho phép điểm danh.
        </p>
      </div>

      {/* GPS Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Vị Trí GPS Của Bạn
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Trạng thái</p>
            <p className={`font-medium ${gpsLocation.status === 'active' ? 'text-green-600' : 'text-orange-500'}`}>
              {gpsLocation.status === 'loading' && (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Đang lấy vị trí...
                </span>
              )}
              {gpsLocation.status === 'active' && '✓ GPS Hoạt động'}
              {gpsLocation.status !== 'loading' && gpsLocation.status !== 'active' && gpsLocation.status}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Vĩ độ (Latitude)</p>
            <p className="font-mono font-medium">
              {gpsLocation.lat?.toFixed(6) || '---'}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Kinh độ (Longitude)</p>
            <p className="font-mono font-medium">
              {gpsLocation.lng?.toFixed(6) || '---'}
            </p>
          </div>
        </div>

        {gpsLocation.accuracy && (
          <p className="mt-3 text-sm text-gray-500">
            Độ chính xác GPS: ±{Math.round(gpsLocation.accuracy)}m
          </p>
        )}
      </div>

      {/* Nearest Building Detection */}
      {nearestResult && (
        <div className={`rounded-lg shadow-md p-6 ${nearestResult.isInsideZone ? 'bg-green-50 border-2 border-green-200' : 'bg-yellow-50 border-2 border-yellow-200'}`}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Tòa Nhà Gần Nhất
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xl font-bold">
                {nearestResult.nearestBuilding?.TenToaNha || 'N/A'}
              </p>
              <p className="text-gray-600">
                Mã: {nearestResult.nearestBuilding?.MaToaNha || 'N/A'}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold">
                {nearestResult.distance}m
              </p>
              <p className={`text-sm ${nearestResult.isInsideZone ? 'text-green-600' : 'text-yellow-600'}`}>
                {nearestResult.isInsideZone 
                  ? '✓ Trong vùng điểm danh' 
                  : `⚠ Ngoài vùng buffer ${PRE_BUFFERED_METERS}m`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Building Selection & Check-in */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Kiểm Tra Điểm Danh
        </h2>

        <div className="space-y-4">
          {/* Building Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn tòa nhà cần điểm danh:
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {buildings.map(b => (
                <option key={b.code} value={b.code}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Check-in Button */}
          <button
            onClick={handleCheckIn}
            disabled={isChecking || gpsLocation.status !== 'active'}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              isChecking || gpsLocation.status !== 'active'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98'
            }`}
          >
            {isChecking ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Đang kiểm tra vị trí...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Điểm Danh Tại {selectedBuilding}
              </>
            )}
          </button>

          {/* Result Display */}
          {checkResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              checkResult.valid 
                ? 'bg-green-100 border-2 border-green-300' 
                : 'bg-red-100 border-2 border-red-300'
            }`}>
              <div className="flex items-start gap-3">
                {checkResult.valid ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-semibold ${checkResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {checkResult.valid ? 'ĐIỂM DANH THÀNH CÔNG!' : 'KHÔNG THỂ ĐIỂM DANH'}
                  </p>
                  <p className={`mt-1 ${checkResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                    {checkResult.message}
                  </p>
                  {checkResult.details && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Khoảng cách: {checkResult.details.distance}m</p>
                      <p>Bán kính buffer (buildinglogic.json): {PRE_BUFFERED_METERS}m</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test with Sample Locations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Test Với Tọa Độ Mẫu
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Click để test với các vị trí mẫu (không cần GPS thật)
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Inside G7 */}
          <button
            onClick={() => handleTestLocation(12.267686, 109.199725, 'Trong G7')}
            className="p-3 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
          >
            <p className="font-medium text-green-800">📍 Trong tòa G7</p>
            <p className="text-xs text-green-600">12.267686, 109.199725</p>
          </button>

          {/* Inside Nhà Đa Năng */}
          <button
            onClick={() => handleTestLocation(12.267213, 109.199890, 'Trong Nhà Đa Năng')}
            className="p-3 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
          >
            <p className="font-medium text-green-800">📍 Trong Nhà Đa Năng</p>
            <p className="text-xs text-green-600">12.267213, 109.199890</p>
          </button>

          {/* Outside - Beach */}
          <button
            onClick={() => handleTestLocation(12.269500, 109.205000, 'Ngoài campus')}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors"
          >
            <p className="font-medium text-red-800">📍 Ngoài campus</p>
            <p className="text-xs text-red-600">12.269500, 109.205000</p>
          </button>

          {/* Edge case - 40m from G7 */}
          <button
            onClick={() => handleTestLocation(12.267900, 109.199900, 'Gần G7 (~40m)')}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
          >
            <p className="font-medium text-yellow-800">📍 Gần G7 (~40m)</p>
            <p className="text-xs text-yellow-600">12.267900, 109.199900</p>
          </button>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">🔧 Cách Hoạt Động</h2>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
            <span><strong>Giảng viên bắt đầu phiên điểm danh</strong> - Chọn lớp học và phòng học (nằm trong một tòa nhà)</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
            <span><strong>Sinh viên nhấn "Điểm danh"</strong> - Hệ thống lấy tọa độ GPS hiện tại</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
            <span><strong>Sử dụng vùng buffer sẵn có</strong> - File buildinglogic.json đã chứa polygon buffer +{PRE_BUFFERED_METERS}m để giảm sai số GPS</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
            <span><strong>Kiểm tra Point-in-Polygon</strong> - Dùng <code className="bg-gray-200 px-1 rounded">booleanPointInPolygon()</code> để check GPS có nằm trong buffer không</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">5</span>
            <span><strong>Kết quả</strong> - Nếu trong vùng → cho phép điểm danh; Nếu ngoài → từ chối kèm thông báo khoảng cách</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

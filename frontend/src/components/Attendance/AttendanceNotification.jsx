import React, { useState, useCallback, useEffect } from 'react';
import { useAttendance } from '../../context/AttendanceContext';
import { validateAttendanceLocation, findNearestBuilding } from '../../services/geofenceService';

const AttendanceNotification = () => {
  const { 
    activeSessions, 
    studentCheckIn, 
    checkInStatus, 
    checkInMessage,
    resetCheckInStatus 
  } = useAttendance();
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [checkedInSessions, setCheckedInSessions] = useState(new Set()); // Track locally checked-in sessions
  const [hidingSession, setHidingSession] = useState(null); // Track which session is being hidden

  // Auto-hide popup after successful check-in
  useEffect(() => {
    if (checkInStatus === 'success' && selectedSession) {
      const sessionId = selectedSession.maphien || selectedSession.MaPhien;
      // Mark as checked in locally
      setCheckedInSessions(prev => new Set([...prev, sessionId]));
      // Start hiding animation after 2 seconds
      const timer = setTimeout(() => {
        setHidingSession(sessionId);
        // Actually hide after animation completes
        setTimeout(() => {
          resetCheckInStatus();
          setSelectedSession(null);
          setLocationError('');
        }, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [checkInStatus, selectedSession, resetCheckInStatus]);

  /**
   * Get current GPS location with fallback
   */
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'));
        return;
      }
      
      console.log('[GPS] Getting location...');
      
      const tryGetPosition = (highAccuracy, timeoutMs) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('[GPS] Success:', position.coords.latitude, position.coords.longitude);
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('[GPS] Error:', error.code, error.message);
            // If high accuracy failed with timeout, retry with low accuracy
            if (highAccuracy && error.code === error.TIMEOUT) {
              console.log('[GPS] Retrying with low accuracy...');
              tryGetPosition(false, 10000);
            } else {
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  reject(new Error('Vui lòng cấp quyền truy cập vị trí'));
                  break;
                case error.POSITION_UNAVAILABLE:
                  reject(new Error('Không thể xác định vị trí'));
                  break;
                case error.TIMEOUT:
                  reject(new Error('Hết thời gian chờ lấy vị trí. Hãy thử lại.'));
                  break;
                default:
                  reject(new Error('Lỗi GPS: ' + error.message));
              }
            }
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: timeoutMs,
            maximumAge: 60000 // Allow cached position (helps DevTools simulation)
          }
        );
      };
      
      tryGetPosition(true, 10000);
    });
  };

  /**
   * Handle check-in button click
   */
  const handleCheckIn = useCallback(async (session) => {
    setSelectedSession(session);
    setLocationError('');
    setIsGettingLocation(true);
    
    try {
      // Get current GPS location
      const location = await getCurrentLocation();
      console.log('[CheckIn] GPS location:', location);
      console.log('[CheckIn] Session:', session);
      
      // Get room and building info from session
      const roomCode = session.phong || session.maphong || session.MaPhong;
      const buildingCode = roomCode?.split('.')[0]; // Extract building code (e.g., G7 from G7.101)
      
      console.log('[CheckIn] Room:', roomCode, 'Building:', buildingCode);
      
      if (!buildingCode) {
        setLocationError('Không xác định được phòng học');
        setIsGettingLocation(false);
        return;
      }
      
      // Validate GPS location against building zone
      const validation = validateAttendanceLocation({
        lat: location.lat,
        lng: location.lng,
        buildingCode: buildingCode,
        roomCode: roomCode
      });
      
      console.log('[CheckIn] Validation result:', validation);
      
      if (!validation.valid) {
        // Find nearest building to show helpful info
        const nearest = findNearestBuilding(location.lat, location.lng);
        
        let errorMsg = `Không ở đúng tòa nhà ${buildingCode}!`;
        if (nearest.nearestBuilding) {
          if (nearest.isInsideZone) {
            errorMsg = `Bạn đang ở tòa ${nearest.nearestBuilding.MaToaNha || nearest.nearestBuilding.TenToaNha}, không phải ${buildingCode}`;
          } else {
            errorMsg = `Bạn cách tòa ${buildingCode} khoảng ${validation.details?.distance || nearest.distance}m. Hãy đến gần hơn.`;
          }
        }
        
        setLocationError(errorMsg);
        setIsGettingLocation(false);
        return;
      }
      
      // Get session ID
      const sessionId = session.maphien || session.MaPhien;
      if (!sessionId) {
        setLocationError('Không tìm thấy mã phiên điểm danh');
        setIsGettingLocation(false);
        return;
      }
      
      // Proceed with check-in
      setIsGettingLocation(false);
      await studentCheckIn(sessionId, location);
      
    } catch (error) {
      console.error('[CheckIn] Error:', error);
      setLocationError(error.message || 'Không thể lấy vị trí GPS');
      setIsGettingLocation(false);
    }
  }, [studentCheckIn]);

  /**
   * Close notification after successful check-in
   */
  const handleClose = () => {
    resetCheckInStatus();
    setSelectedSession(null);
    setLocationError('');
  };

  // Don't render if no active sessions
  if (!activeSessions || activeSessions.length === 0) {
    return null;
  }

  return (
    // Position: bottom-right, below GPS box (z-index 40 to be below GPS box at z-50)
    <div className="fixed bottom-4 right-4 z-40 space-y-3 max-w-sm">
      {activeSessions.map((session) => {
        const sessionId = session.maphien || session.MaPhien;
        const isCheckedIn = checkedInSessions.has(sessionId) || session.dadiemdanh || session.DaDiemDanh;
        const isHiding = hidingSession === sessionId;
        const isThisSession = selectedSession?.maphien === sessionId || selectedSession?.MaPhien === sessionId;
        
        return (
        <div 
          key={sessionId}
          className={`bg-white rounded-lg shadow-xl border-l-4 overflow-hidden transition-all duration-300 ${
            isCheckedIn ? 'border-green-500' : 'border-blue-500'
          } ${isHiding ? 'animate-slideOut opacity-0' : 'animate-slideIn'}`}
        >
          {/* Header */}
          <div className={`${isCheckedIn ? 'bg-green-500' : 'bg-blue-500'} text-white px-4 py-2 flex items-center justify-between transition-colors`}>
            <div className="flex items-center gap-2">
              {isCheckedIn ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
              <span className="font-semibold">{isCheckedIn ? 'Đã điểm danh' : 'Điểm danh'}</span>
            </div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
              {session.tenmon || session.maLop}
            </span>
          </div>
          
          {/* Content */}
          <div className="p-4">
            <div className="space-y-2 mb-4">
              <p className="text-gray-800 font-medium">
                🎓 {session.tenmon || 'Môn học'}
              </p>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Phòng: {session.phong || session.maPhong || 'N/A'}
              </p>
              <p className="text-gray-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                GV: {session.tenGV || session.maGiangVien || 'N/A'}
              </p>
            </div>
            
            {/* Error message */}
            {locationError && isThisSession && !isCheckedIn && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                ⚠️ {locationError}
              </div>
            )}
            
            {/* Check-in status message - only show when checking */}
            {checkInStatus && isThisSession && checkInStatus !== 'success' && (
              <div className={`mb-3 p-2 rounded text-sm ${
                checkInStatus === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-600'
                  : 'bg-blue-50 border border-blue-200 text-blue-600'
              }`}>
                {checkInStatus === 'error' && '❌ '}
                {checkInStatus === 'checking' && '⏳ '}
                {checkInMessage}
              </div>
            )}
            
            {/* Actions */}
            {isCheckedIn ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Đã điểm danh</span>
              </button>
            ) : (
              <button
                onClick={() => handleCheckIn(session)}
                disabled={isGettingLocation || checkInStatus === 'checking'}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition flex items-center justify-center gap-2"
              >
                {isGettingLocation || checkInStatus === 'checking' ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Điểm danh ngay</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        );
      })}
      
      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(100%);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-slideOut {
          animation: slideOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
};

export default AttendanceNotification;

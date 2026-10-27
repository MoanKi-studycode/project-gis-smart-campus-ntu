import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosClient';

const AttendanceContext = createContext(null);

// Polling interval: check for active sessions every 5 seconds
const POLLING_INTERVAL = 5000;

export const AttendanceProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State for active attendance sessions (for students)
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for current check-in process
  const [checkInStatus, setCheckInStatus] = useState(null); // null | 'checking' | 'success' | 'error'
  const [checkInMessage, setCheckInMessage] = useState('');
  const [checkInResult, setCheckInResult] = useState(null);
  
  // State for lecturer's open session
  const [lecturerOpenSession, setLecturerOpenSession] = useState(null);

  /**
   * Fetch active attendance sessions for current student
   */
  const fetchActiveSessionsForStudent = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    
    try {
      const response = await api.get('/attendance/student/active');
      // axiosClient returns data directly (not wrapped in response.data)
      if (response.success) {
        setActiveSessions(response.data || []);
      }
    } catch (error) {
      console.error('[Attendance] Error fetching active sessions:', error);
    }
  }, [user]);

  /**
   * Fetch lecturer's open sessions
   */
  const fetchLecturerOpenSessions = useCallback(async () => {
    if (!user || user.role !== 'lecturer') return;
    
    try {
      const response = await api.get('/attendance/lecturer/open');
      // axiosClient returns data directly
      if (Array.isArray(response) && response.length > 0) {
        setLecturerOpenSession(response[0]);
      } else {
        setLecturerOpenSession(null);
      }
    } catch (error) {
      console.error('[Attendance] Error fetching lecturer sessions:', error);
    }
  }, [user]);

  /**
   * Start attendance session (Lecturer)
   */
  const startAttendanceSession = async (maLop, duration = 15) => {
    try {
      setIsLoading(true);
      const response = await api.post('/attendance/sessions', { maLop, duration });
      
      // axiosClient returns data directly
      if (response.success) {
        setLecturerOpenSession(response.session);
        return { success: true, session: response.session };
      }
      return { success: false, error: 'Không thể bắt đầu phiên điểm danh' };
    } catch (error) {
      console.error('[Attendance] Start session error:', error);
      return { success: false, error: error.error || 'Lỗi hệ thống' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close attendance session (Lecturer)
   */
  const closeAttendanceSession = async (maPhien) => {
    try {
      setIsLoading(true);
      const response = await api.put(`/attendance/sessions/${maPhien}/close`);
      
      // axiosClient returns data directly
      if (response.success) {
        setLecturerOpenSession(null);
        return { success: true };
      }
      return { success: false, error: 'Không thể đóng phiên điểm danh' };
    } catch (error) {
      console.error('[Attendance] Close session error:', error);
      return { success: false, error: error.error || 'Lỗi hệ thống' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Student check-in with GPS validation
   */
  const studentCheckIn = async (maPhien, gpsLocation) => {
    try {
      setCheckInStatus('checking');
      setCheckInMessage('Đang xác nhận vị trí...');
      
      const response = await api.post('/attendance/checkin', {
        maPhien,
        viTri: gpsLocation ? {
          lat: gpsLocation.lat,
          lng: gpsLocation.lng,
          accuracy: gpsLocation.accuracy
        } : null
      });
      
      // axiosClient returns data directly
      if (response.success) {
        setCheckInStatus('success');
        setCheckInMessage(response.message || 'Điểm danh thành công!');
        setCheckInResult(response.record);
        
        // Refresh active sessions
        await fetchActiveSessionsForStudent();
        
        return { success: true, record: response.record };
      }
      
      setCheckInStatus('error');
      setCheckInMessage(response.error || 'Điểm danh thất bại');
      return { success: false, error: response.error };
    } catch (error) {
      console.error('[Attendance] Check-in error:', error);
      setCheckInStatus('error');
      setCheckInMessage(error.error || 'Lỗi hệ thống');
      return { success: false, error: error.error || 'Lỗi hệ thống' };
    }
  };

  /**
   * Reset check-in status
   */
  const resetCheckInStatus = () => {
    setCheckInStatus(null);
    setCheckInMessage('');
    setCheckInResult(null);
  };

  /**
   * Dismiss a session notification (hide from UI without affecting server)
   */
  const dismissSession = (sessionId) => {
    setActiveSessions(prev => prev.filter(s => s.maphien !== sessionId));
  };

  // Polling for active sessions
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    if (user.role === 'student') {
      fetchActiveSessionsForStudent();
    } else if (user.role === 'lecturer') {
      fetchLecturerOpenSessions();
    }
    
    // Set up polling
    const interval = setInterval(() => {
      if (user.role === 'student') {
        fetchActiveSessionsForStudent();
      } else if (user.role === 'lecturer') {
        fetchLecturerOpenSessions();
      }
    }, POLLING_INTERVAL);
    
    return () => clearInterval(interval);
  }, [user, fetchActiveSessionsForStudent, fetchLecturerOpenSessions]);

  // Log active sessions change
  useEffect(() => {
    if (activeSessions.length > 0) {
      console.log('[Attendance] Active sessions:', activeSessions.length);
    }
  }, [activeSessions]);

  return (
    <AttendanceContext.Provider value={{
      // Student state
      activeSessions,
      checkInStatus,
      checkInMessage,
      checkInResult,
      
      // Lecturer state
      lecturerOpenSession,
      
      // Loading
      isLoading,
      
      // Actions
      startAttendanceSession,
      closeAttendanceSession,
      studentCheckIn,
      resetCheckInStatus,
      dismissSession,
      
      // Manual refresh
      refreshSessions: user?.role === 'student' ? fetchActiveSessionsForStudent : fetchLecturerOpenSessions
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};

export default AttendanceContext;

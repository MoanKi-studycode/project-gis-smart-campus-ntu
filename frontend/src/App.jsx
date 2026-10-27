import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { UIProvider } from './context/UIContext';
import { MapProvider } from './contexts/MapContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Layouts
import MainLayout from './layouts/MainLayout';

// Auth
import LoginPage from './pages/LoginPage';

// Common Components
import SessionStatusBox from './components/Common/SessionStatusBox';
import AttendanceNotification from './components/Attendance/AttendanceNotification';

// Map - Always mounted in background
import CampusViewer from './views/CampusViewer';
import LocationPreviewModal from './components/Map/LocationPreviewModal';

// Shared Pages
import UserProfile from './pages/Shared/UserProfile';
import SettingsPage from './pages/SettingsPage';

// Admin Pages
import AdminAccounts from './pages/Admin/AdminAccounts';
import AcademicSubjects from './pages/Admin/AcademicSubjects';
import AcademicCourses from './pages/Admin/AcademicCourses';
import EventManagement from './pages/Admin/EventManagement';

// Lecturer Pages
import LecturerScheduleWeekly from './pages/Lecturer/LecturerScheduleWeekly';
import WeeklySchedule from './pages/Lecturer/WeeklySchedule';
import LecturerScheduleCourses from './pages/Lecturer/LecturerScheduleCourses';
import LecturerAttendance from './pages/Lecturer/LecturerAttendance';
import LecturerEvents from './pages/Lecturer/LecturerEvents';
import LecturerStatistics from './pages/Lecturer/Statistics'; // Updated to use new Statistics component

// Student Pages
import StudentSchedule from './pages/Student/StudentSchedule';
import StudentRegister from './pages/Student/StudentRegister';
import StudentAttendance from './pages/Student/StudentAttendance';
import StudentEvents from './pages/Student/StudentEvents';

// ============================================
// Protected Route Wrapper
// ============================================
function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// ============================================
// Role-based Route Wrapper
// ============================================
function RequireRole({ roles, children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ============================================
// App Routes Component
// ============================================
function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* ============================================
          BACKGROUND: CesiumViewer (Always Mounted)
          z-index: 0 - Never unmounts
          ============================================ */}
      {user && (
        <div className="absolute inset-0 z-0">
          <CampusViewer />
        </div>
      )}

      {/* Session Status Box - Top Right (Only when logged in) */}
      {user && <SessionStatusBox />}

      {/* Attendance Notification - Bottom Right (Only for students) */}
      {user && user.role === 'student' && <AttendanceNotification />}

      {/* Location Preview Modal - Global */}
      <LocationPreviewModal />

      {/* ============================================
          FOREGROUND: Routes
          ============================================ */}
      <Routes>
        {/* Public Route: Login */}
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" replace />}
        />

        {/* Protected Routes with MainLayout */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          {/* ============================================
              SHARED ROUTES - All Roles
              ============================================ */}
          <Route path="/" element={null} /> {/* Map page - no overlay */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* ============================================
              ADMIN ROUTES
              ============================================ */}
          <Route
            path="/admin/accounts/:type"
            element={
              <RequireRole roles={['admin']}>
                <AdminAccounts />
              </RequireRole>
            }
          />
          <Route
            path="/admin/academic/subjects"
            element={
              <RequireRole roles={['admin']}>
                <AcademicSubjects />
              </RequireRole>
            }
          />
          <Route
            path="/admin/academic/courses"
            element={
              <RequireRole roles={['admin']}>
                <AcademicCourses />
              </RequireRole>
            }
          />
          <Route
            path="/admin/events"
            element={
              <RequireRole roles={['admin']}>
                <EventManagement />
              </RequireRole>
            }
          />

          {/* ============================================
              LECTURER ROUTES
              ============================================ */}
          <Route
            path="/lecturer/schedule/weekly"
            element={
              <RequireRole roles={['lecturer']}>
                <LecturerScheduleWeekly />
              </RequireRole>
            }
          />
          <Route
            path="/lecturer/schedule/courses"
            element={
              <RequireRole roles={['lecturer']}>
                <LecturerScheduleCourses />
              </RequireRole>
            }
          />
          <Route
            path="/lecturer/attendance"
            element={
              <RequireRole roles={['lecturer']}>
                <LecturerAttendance />
              </RequireRole>
            }
          />
          <Route
            path="/lecturer/events"
            element={
              <RequireRole roles={['lecturer']}>
                <LecturerEvents />
              </RequireRole>
            }
          />
          <Route
            path="/lecturer/statistics"
            element={
              <RequireRole roles={['lecturer']}>
                <LecturerStatistics />
              </RequireRole>
            }
          />

          {/* ============================================
              STUDENT ROUTES
              ============================================ */}
          <Route
            path="/student/schedule"
            element={
              <RequireRole roles={['student']}>
                <StudentSchedule />
              </RequireRole>
            }
          />
          <Route
            path="/student/register"
            element={
              <RequireRole roles={['student']}>
                <StudentRegister />
              </RequireRole>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <RequireRole roles={['student']}>
                <StudentAttendance />
              </RequireRole>
            }
          />
          <Route
            path="/student/events"
            element={
              <RequireRole roles={['student']}>
                <StudentEvents />
              </RequireRole>
            }
          />
        </Route>

        {/* Catch All - Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// ============================================
// Main App Component
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AttendanceProvider>
            <UIProvider>
              <MapProvider>
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </MapProvider>
            </UIProvider>
          </AttendanceProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

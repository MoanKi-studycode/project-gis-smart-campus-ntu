import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useMap } from '../contexts/MapContext';
import Sidebar from '../components/ui/Sidebar';
import SearchBar from '../components/ui/SearchBar';
import SearchInfoPanel from '../components/Search/SearchInfoPanel';
import RoomInfoWindow from '../components/map/RoomInfoWindow';
import LayerControl from '../components/ui/LayerControl';
import FloatingButtons from '../components/ui/FloatingButtons';
import AttendanceNotification from '../components/Attendance/AttendanceNotification';
import { isMapPath } from '../config/menuConfig';

/**
 * MainLayout - The Orchestrator Component
 * 
 * Implements the "Push" Layout Strategy:
 * - Sidebar fixed left (80px collapsed, 280px expanded)
 * - Map controls pushed right when sidebar expands
 * - Business pages render with white overlay background
 * - CesiumViewer is always mounted in App.jsx (never here)
 */

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { flyToDirectly } = useMap();
  
  // Sidebar state - collapsed by default
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Search Info Panel state
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [roomInfoData, setRoomInfoData] = useState(null);
  
  // Get UI context for map controls
  const { is3d, toggle3d, layers, toggleLayer } = useUI();

  // Check if current route is map page
  const isMapPage = isMapPath(location.pathname);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  // Handle search selection - fly to building AND show info panel
  const handleSearchSelect = useCallback((building) => {
    flyToDirectly(building, navigate);
    setSelectedBuilding(building);
    setShowInfoPanel(true);
    setRoomInfoData(null); // Close any existing room info window
  }, [flyToDirectly, navigate]);

  // Handle closing the info panel
  const handleCloseInfoPanel = useCallback(() => {
    setShowInfoPanel(false);
    setSelectedBuilding(null);
    setRoomInfoData(null);
  }, []);

  // Handle room search from SearchInfoPanel
  const handleRoomSearch = useCallback((roomData) => {
    setRoomInfoData(roomData);
  }, []);

  // Handle closing the room info window
  const handleCloseRoomInfo = useCallback(() => {
    setRoomInfoData(null);
  }, []);

  // Handle home button (reset map view)
  const handleHome = () => {
    // Fly to default campus view
    flyToDirectly({
      id: 'campus-center',
      name: 'Campus Center',
      lng: 109.202347,
      lat: 12.268143,
    }, null); // Don't navigate, just fly
  };

  // Dynamic positioning based on sidebar state
  const sidebarWidth = isSidebarExpanded ? 280 : 80;
  const controlsLeft = sidebarWidth + 10;

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${isMapPage ? 'pointer-events-none' : ''}`}>
      {/* ============================================
          LAYER 1: SIDEBAR (Fixed Left, z-20)
          ============================================ */}
      <div className="pointer-events-auto">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* ============================================
          LAYER 2: MAP CONTROLS (Only on Map Pages)
          Fixed positioning with dynamic left offset
          ============================================ */}
      {isMapPage && (
        <>
          {/* Search Bar - Top */}
          <div 
            className="fixed top-4 z-10 transition-all duration-300 ease-in-out pointer-events-auto"
            style={{ left: `${controlsLeft}px` }}
          >
            <div className="w-96 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
              <SearchBar onSelectBuilding={handleSearchSelect} />
            </div>
          </div>

          {/* Search Info Panel - Appears when building is selected from search */}
          {showInfoPanel && selectedBuilding && (
            <div 
              className="fixed top-20 z-20 transition-all duration-300 ease-in-out pointer-events-auto"
              style={{ left: `${controlsLeft}px` }}
            >
              <SearchInfoPanel
                building={selectedBuilding}
                onClose={handleCloseInfoPanel}
                onRoomSearch={handleRoomSearch}
                isExtension={selectedBuilding.type === 'extension'}
              />
            </div>
          )}

          {/* Room Info Window - Appears when room is searched */}
          {roomInfoData && (
            <div 
              className="fixed top-20 z-20 pointer-events-auto"
              style={{ left: `${controlsLeft + 370}px` }}
            >
              <RoomInfoWindow
                roomData={roomInfoData}
                onClose={handleCloseRoomInfo}
              />
            </div>
          )}

          {/* Bottom Controls - Layer & Floating Buttons */}
          <div 
            className="fixed bottom-4 z-10 flex flex-col gap-3 transition-all duration-300 ease-in-out pointer-events-auto"
            style={{ left: `${controlsLeft}px` }}
          >
            <LayerControl layers={layers} onToggle={toggleLayer} />
            <FloatingButtons onHome={handleHome} is3d={is3d} onToggle3d={toggle3d} />
          </div>
        </>
      )}

      {/* ============================================
          LAYER 3: BUSINESS PAGE CONTENT (Non-Map Pages)
          Positioned to the right of sidebar
          ============================================ */}
      {!isMapPage && (
        <div 
          className="absolute top-0 h-full bg-gray-50 overflow-auto transition-all duration-300 ease-in-out pointer-events-auto"
          style={{ 
            left: `${sidebarWidth}px`, 
            width: `calc(100vw - ${sidebarWidth}px)` 
          }}
        >
          <Outlet />
        </div>
      )}

      {/* ============================================
          LAYER 4: ATTENDANCE NOTIFICATION (Students)
          Shows when lecturer starts attendance session
          ============================================ */}
      <div className="pointer-events-auto">
        <AttendanceNotification />
      </div>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import CesiumMap from '../map/CesiumMap';
import Sidebar from '../ui/Sidebar';
import SearchBar from '../ui/SearchBar';
import SearchInfoPanel from '../Search/SearchInfoPanel';
import RoomInfoWindow from '../map/RoomInfoWindow';
import LayerControl from '../ui/LayerControl';
import { User, LogOut, Menu } from 'lucide-react';

export default function MapLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [roomInfoData, setRoomInfoData] = useState(null);
  const [is3d, setIs3d] = useState(true);
  const [viewer, setViewer] = useState(null);
  const [layers, setLayers] = useState({
    buildings: true,
    streets: true,
    trees: true,
    extensions: true,
  });

  // Handle building selection from SearchBar
  // This triggers camera fly-to AND shows info panel
  const handleBuildingSelect = useCallback((building) => {
    setSelectedBuilding(building);
    setShowInfoPanel(true);
    setRoomInfoData(null); // Close any existing room info window
  }, []);

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

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Map Layer (Z-0) */}
      <div className="absolute inset-0 z-0">
        <CesiumMap
          selectedBuilding={selectedBuilding}
          is3d={is3d}
          layers={layers}
          onBuildingSelect={setSelectedBuilding}
          onViewerReady={setViewer}
        />
      </div>

      {/* UI Overlays */}

      {/* 1. Sidebar Overlay (Z-40) - Higher than widgets */}
      <div 
        className={`absolute top-0 left-0 bottom-0 w-[280px] z-40 transition-transform duration-300 ease-in-out shadow-2xl ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* 2. Top Bar Controls (Z-30) */}
      {/* Menu Toggle Button */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto">
        <button 
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-200 transition-transform hover:scale-105"
        >
            <Menu size={20} />
        </button>
      </div>

      {/* Search Bar - Shifted right to accommodate menu button */}
      <div className="absolute top-4 left-16 z-30 pointer-events-auto shadow-lg rounded-xl">
          <SearchBar 
            onSelectBuilding={handleBuildingSelect} 
            viewer={viewer} 
          />
      </div>

      {/* Search Info Panel - Appears when building is selected from search */}
      {showInfoPanel && selectedBuilding && (
        <div className="absolute top-20 left-16 z-30 pointer-events-auto">
          <SearchInfoPanel
            building={selectedBuilding}
            onClose={handleCloseInfoPanel}
            onRoomSearch={handleRoomSearch}
            isExtension={selectedBuilding.type === 'extension'}
          />
        </div>
      )}

      {/* Room Info Window - Appears on building center when room is searched */}
      {roomInfoData && (
        <RoomInfoWindow
          roomData={roomInfoData}
          onClose={handleCloseRoomInfo}
          style={{
            // Position at top-right of the info panel
            left: '430px',
            top: '80px'
          }}
        />
      )}

      {/* User Profile */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto">
         <div className="group relative">
           <button className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all hover:scale-105">
             <User size={20} />
           </button>
           <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 hidden group-hover:block border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
             <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
               <p className="text-sm font-semibold text-gray-900">{user.name}</p>
               <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role}</p>
             </div>
             <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
               <LogOut size={16} /> 
               <span>Đăng xuất</span>
             </button>
           </div>
         </div>
      </div>

      {/* 3. Info Panel (Z-20) - OLD Panel, keeping for map click selection */}
      {/* Note: This is shown when clicking on map, while SearchInfoPanel is for search */}
      {/* If you want to unify them, remove this and always use SearchInfoPanel */}

      {/* 4. Bottom Left Widgets (Z-20) - Lower than Sidebar (Z-40) */}
      <div className="absolute bottom-8 left-4 z-20 flex flex-col-reverse gap-3 pointer-events-auto">
        {/* Layer Control (Expands Upwards) */}
        <LayerControl layers={layers} onToggle={(key) => setLayers(prev => ({...prev, [key]: !prev[key]}))} />
        
        {/* 3D/2D Toggle */}
        <button 
          onClick={() => setIs3d(!is3d)}
          className={`w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-all border border-gray-200 hover:scale-105 ${is3d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          title={is3d ? "Chuyển sang 2D" : "Chuyển sang 3D"}
        >
          <span className="font-bold text-xs">{is3d ? '3D' : '2D'}</span>
        </button>
      </div>

    </div>
  );
}

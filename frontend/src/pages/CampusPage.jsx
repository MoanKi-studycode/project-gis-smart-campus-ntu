import React, { useState } from 'react';
import CesiumMap from '../components/map/CesiumMap';
import SearchBar from '../components/ui/SearchBar';
import InfoPanel from '../components/ui/InfoPanel';
import RoomInfoBox from '../components/map/RoomInfoBox';
import LayerControl from '../components/ui/LayerControl';

export default function CampusPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [is3d, setIs3d] = useState(true);
  const [layers, setLayers] = useState({
    buildings: true,
    streets: true,
    trees: true,
    extensions: true,
  });

  // Mock function to handle search selection
  const handleSearchSelect = (item) => {
    if (item?.type === 'room') {
      setSelectedRoom(item.id);
      setSelectedBuilding(null);
    } else {
      setSelectedBuilding(item);
      setSelectedRoom(null);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {/* Map Layer (Z-0) */}
      <div className="absolute inset-0 z-0">
        <CesiumMap
          selectedBuilding={selectedBuilding}
          is3d={is3d}
          layers={layers}
          onBuildingSelect={setSelectedBuilding}
        />
      </div>

      {/* UI Overlays */}

      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-30 pointer-events-auto shadow-lg rounded-xl w-80">
          <SearchBar 
            onSelectBuilding={handleSearchSelect} 
          />
      </div>

      {/* Info Panel (Z-20) */}
      {selectedBuilding && (
        <div className="absolute top-20 left-4 z-20 pointer-events-auto max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
           <InfoPanel building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />
        </div>
      )}

      {/* Room Info Box (Z-40) */}
      {selectedRoom && (
        <RoomInfoBox roomId={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}

      {/* Bottom Left Widgets (Z-20) */}
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

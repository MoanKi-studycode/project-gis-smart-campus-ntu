import React, { useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { useMap } from '../contexts/MapContext';
import CesiumMap from '../components/map/CesiumMap';

/**
 * CampusViewer - Pure Map Component
 * 
 * This component ONLY renders the CesiumMap.
 * All navigation (Sidebar) and controls are handled by MainLayout.
 * The map is always mounted in background (never unmounts).
 * 
 * Connects to MapContext to receive:
 * - targetLocation: Where to fly camera
 * - selectedBuilding: Currently selected building
 */

export default function CampusViewer() {
  const { is3d, layers } = useUI();
  const { targetLocation, selectedBuilding, selectBuilding } = useMap();

  // Handle building selection from map click
  const handleSelectBuilding = useCallback((target) => {
    selectBuilding(target);
  }, [selectBuilding]);

  return (
    <div className="absolute inset-0 z-0">
      <CesiumMap 
        selectedBuilding={targetLocation || selectedBuilding} 
        layers={layers} 
        is3d={is3d} 
        onBuildingSelect={handleSelectBuilding}
      />
    </div>
  );
}

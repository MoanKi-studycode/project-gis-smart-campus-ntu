import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * MapContext - Bridge between Business Pages and CesiumViewer
 * 
 * Provides:
 * - targetLocation: Current location to fly to
 * - triggerFlyTo: Function to initiate camera flight
 * - clearTarget: Reset target after flight completes
 * - selectedBuilding: Currently selected building for CesiumMap
 */

const MapContext = createContext(null);

export function MapProvider({ children }) {
  // Target location state - used by CameraManager
  const [targetLocation, setTargetLocation] = useState(null);
  
  // Selected building state - used by CesiumMap
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  // Preview modal state
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  /**
   * Open location preview modal before flying
   * @param {object} locationData - { lat, lng, name, buildingId, roomId, imageUrl }
   */
  const openLocationPreview = useCallback((locationData) => {
    setPreviewData(locationData);
    setIsPreviewOpen(true);
  }, []);

  /**
   * Trigger camera flight to target location
   * Called when user confirms in preview modal
   * @param {function} navigate - React Router navigate function
   */
  const triggerFlyTo = useCallback((locationData, navigate) => {
    const target = locationData || previewData;
    if (target) {
      const normalizedTarget = {
        id: target.buildingId || target.id,
        name: target.name,
        location: { 
          lng: target.lng || target.location?.lng, 
          lat: target.lat || target.location?.lat 
        },
        timestamp: Date.now(),
      };
      
      setTargetLocation(normalizedTarget);
      setSelectedBuilding(normalizedTarget);
      setIsPreviewOpen(false);
      setPreviewData(null);
      
      // Navigate to map page if navigate function provided
      if (navigate) {
        navigate('/');
      }
    }
  }, [previewData]);

  /**
   * Close preview modal without flying
   */
  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewData(null);
  }, []);

  /**
   * Clear target after flight completes
   * Called by CesiumViewer after animation
   */
  const clearTarget = useCallback(() => {
    setTargetLocation(null);
  }, []);

  /**
   * Direct fly without preview (for Search)
   * For programmatic navigation
   */
  const flyToDirectly = useCallback((locationData, navigate) => {
    const normalizedTarget = {
      id: locationData.buildingId || locationData.id,
      name: locationData.name,
      location: { 
        lng: locationData.lng || locationData.location?.lng, 
        lat: locationData.lat || locationData.location?.lat 
      },
      timestamp: Date.now(),
    };
    
    setTargetLocation(normalizedTarget);
    setSelectedBuilding(normalizedTarget);
    
    // Navigate to map page if not already there
    if (navigate) {
      navigate('/');
    }
  }, []);

  /**
   * Select building from map click
   */
  const selectBuilding = useCallback((building) => {
    setSelectedBuilding(building);
    if (building) {
      setTargetLocation({
        ...building,
        timestamp: Date.now(),
      });
    }
  }, []);

  const value = {
    // State
    targetLocation,
    selectedBuilding,
    previewData,
    isPreviewOpen,
    
    // Actions
    openLocationPreview,
    triggerFlyTo,
    closePreview,
    clearTarget,
    flyToDirectly,
    selectBuilding,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

/**
 * Hook to access map context
 */
export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}

export default MapContext;

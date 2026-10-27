import * as Turf from '@turf/turf';
import { buildings, buildingLogic } from '../data';

export const buildingService = {
  getAllBuildings: () => {
    try {
      // 1. Safe feature extraction
      // Supports both array and FeatureCollection format
      const rawFeatures = buildings?.features || (Array.isArray(buildings) ? buildings : []);
      
      if (!Array.isArray(rawFeatures)) {
        console.error("buildingService: Invalid building.json structure. Expected array or FeatureCollection.");
        return [];
      }

      // 2. Map data to create search index and enriched objects
      return rawFeatures.map((feature, index) => {
        const props = feature.properties || {};
        
        // Default location (Nha Trang University)
        let location = { lng: 109.2023, lat: 12.2681 }; 

        // 3. Calculate Centroid using Turf
        try {
          const centroid = Turf.centroid(feature);
          if (centroid?.geometry?.coordinates) {
             const [lng, lat] = centroid.geometry.coordinates;
             location = { lng, lat };
          }
        } catch (err) {
          console.warn(`buildingService: Centroid calculation failed for ${props.TenToaNha || 'Unknown Building'}`, err);
        }

        // 4. Merge with Logic Data (Schedule, etc.)
        // Expects buildingLogic to be a map: { [MaToaNha]: {...} }
        const logicInfo = (buildingLogic && props.MaToaNha && buildingLogic[props.MaToaNha]) 
          ? buildingLogic[props.MaToaNha] 
          : {};

        return {
          id: props.MaToaNha || `BLD-${index}`,
          name: props.TenToaNha || props.Name || "Unnamed Building",
          description: props.description || "",
          location: location, // Used for CameraManager
          data: feature,      // Original GeoJSON feature
          ...logicInfo        // Merged logic properties
        };
      });

    } catch (error) {
      console.error("buildingService: Critical error loading buildings:", error);
      return []; // Return empty array to prevent crash
    }
  }
};

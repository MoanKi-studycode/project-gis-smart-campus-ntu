// geojsonLoader.js
// Role: Provide paths to GeoJSON files in the public directory.
// Previously handled EsriJSON conversion, but now assumes files are pre-converted or handled by Cesium.

import { buildings, streets, extensions, userviews, buildingLogic } from '../data';

export function loadAllMapLayers() {
  // Return in-memory JSON objects from src/data (single source of truth)
  return {
    building: buildings,
    streets,
    extensions,
    userviews,
    buildinglogic: buildingLogic
  };
}

// Helper to normalize if needed (kept for compatibility if other code uses it)
export function normalizeToGeoJson(data) {
  return data; 
}

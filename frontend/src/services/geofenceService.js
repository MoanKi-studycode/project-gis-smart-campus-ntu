/**
 * Geofence Service - GPS-based attendance verification
 * Uses Turf.js to check if student's GPS location is inside building buffer zones
 * 
 * IMPORTANT: buildinglogic.json already contains pre-buffered polygons (+15m)
 * This 15m buffer accounts for GPS accuracy errors
 * 
 * Flow:
 * 1. Lecturer starts attendance session for a room (in a building)
 * 2. Student clicks "Check-in"
 * 3. System gets student's GPS coordinates
 * 4. System checks if coordinates are inside the building's buffer polygon (pre-buffered 15m)
 * 5. If inside → Allow check-in; If outside → Reject
 */

import * as Turf from '@turf/turf';
// Using buildinglogic.json which has pre-buffered polygons (+15m for GPS tolerance)
import buildingsGeoJson from '../data/buildinglogic.json';
// Original building.json for reference (non-buffered, for accurate distance calculation)
import originalBuildings from '../data/building.json';

// Pre-buffered distance in buildinglogic.json (already applied)
const PRE_BUFFERED_METERS = 15;

/**
 * Get building feature with pre-buffered zone (from buildinglogic.json)
 * No additional buffer needed since buildinglogic.json already has 15m buffer
 * 
 * @param {Object} feature - GeoJSON feature of a building (from buildinglogic.json)
 * @returns {Object} GeoJSON feature (already buffered)
 */
export function generateBuildingBuffer(feature) {
  try {
    // Return the pre-buffered polygon as-is from buildinglogic.json
    return {
      ...feature,
      properties: {
        ...feature.properties,
        bufferRadius: PRE_BUFFERED_METERS,
        isBufferZone: true
      }
    };
  } catch (error) {
    console.error('Error processing building:', feature.properties?.TenToaNha, error);
    return null;
  }
}

/**
 * Generate all building buffer zones
 * @returns {Object} GeoJSON FeatureCollection with all buffered buildings
 */
export function generateAllBuildingBuffers() {
  const bufferedFeatures = buildingsGeoJson.features
    .map(feature => generateBuildingBuffer(feature))
    .filter(Boolean);
  
  return {
    type: 'FeatureCollection',
    features: bufferedFeatures
  };
}

/**
 * Get the original (non-buffered) building polygon for accurate distance calculation
 * @param {string} buildingCode - Building code (e.g., 'G7')
 * @returns {Object|null} Original GeoJSON feature
 */
export function getOriginalBuilding(buildingCode) {
  return originalBuildings.features.find(
    f => f.properties?.MaToaNha === buildingCode
  ) || null;
}

/**
 * Get the building polygon by code (from buildinglogic.json - buffered)
 * @param {string} buildingCode - Building code (e.g., 'G7')
 * @returns {Object|null} GeoJSON feature
 */
export function getBuilding(buildingCode) {
  return buildingsGeoJson.features.find(
    f => f.properties?.MaToaNha === buildingCode
  ) || null;
}

/**
 * Check if a GPS point is inside a building's buffer zone
 * Uses buildinglogic.json which already has 15m buffer for GPS tolerance
 * 
 * @param {number} lat - Latitude of the point
 * @param {number} lng - Longitude of the point  
 * @param {string} buildingCode - Building code (e.g., 'G7', 'G6', 'NTD')
 * @returns {Object} Result object { isInside, building, distance }
 */
export function checkPointInBuildingZone(lat, lng, buildingCode) {
  // Create point from GPS coordinates
  const point = Turf.point([lng, lat]);
  
  // Find the building in buildinglogic.json (pre-buffered 15m)
  const building = buildingsGeoJson.features.find(
    f => f.properties?.MaToaNha === buildingCode
  );
  
  // Get original building for accurate distance calculation
  const originalBuilding = getOriginalBuilding(buildingCode);
  
  if (!building) {
    return {
      isInside: false,
      building: null,
      message: `Không tìm thấy tòa nhà ${buildingCode}`,
      distance: null
    };
  }
  
  // Use the pre-buffered polygon directly (already has 15m buffer)
  const bufferedBuilding = generateBuildingBuffer(building);
  
  if (!bufferedBuilding) {
    return {
      isInside: false,
      building: building.properties,
      message: 'Lỗi xử lý vùng buffer',
      distance: null
    };
  }
  
  // Check if point is inside pre-buffered polygon
  const isInside = Turf.booleanPointInPolygon(point, bufferedBuilding);
  
  // Calculate distance to ORIGINAL building centroid for accurate display
  const centroid = originalBuilding 
    ? Turf.centroid(originalBuilding) 
    : Turf.centroid(building);
  const distance = Turf.distance(point, centroid, { units: 'meters' });
  
  return {
    isInside,
    building: building.properties,
    buildingName: building.properties?.TenToaNha,
    buildingCode: building.properties?.MaToaNha,
    distance: Math.round(distance),
    bufferRadius: PRE_BUFFERED_METERS,
    message: isInside 
      ? `✓ Bạn đang trong vùng điểm danh của ${building.properties?.TenToaNha} (buffer ${PRE_BUFFERED_METERS}m)` 
      : `✗ Bạn cách ${building.properties?.TenToaNha} ${Math.round(distance)}m (vùng buffer: ${PRE_BUFFERED_METERS}m)`
  };
}

/**
 * Check GPS location against any building and return nearest match
 * Useful for automatic building detection
 * Uses buildinglogic.json (pre-buffered 15m)
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Nearest building and whether user is inside any zone
 */
export function findNearestBuilding(lat, lng) {
  const point = Turf.point([lng, lat]);
  let nearestBuilding = null;
  let minDistance = Infinity;
  let isInsideAny = false;
  let insideBuilding = null;
  
  for (const building of buildingsGeoJson.features) {
    // Get original building for accurate distance calculation
    const original = getOriginalBuilding(building.properties?.MaToaNha);
    const centroid = original 
      ? Turf.centroid(original) 
      : Turf.centroid(building);
    const distance = Turf.distance(point, centroid, { units: 'meters' });
    
    // Check if inside buffer zone
    const buffered = generateBuildingBuffer(building);
    if (buffered && Turf.booleanPointInPolygon(point, buffered)) {
      isInsideAny = true;
      if (distance < minDistance) {
        minDistance = distance;
        insideBuilding = building.properties;
      }
    }
    
    // Track nearest building regardless
    if (distance < minDistance) {
      minDistance = distance;
      nearestBuilding = building.properties;
    }
  }
  
  return {
    nearestBuilding: insideBuilding || nearestBuilding,
    distance: Math.round(minDistance),
    isInsideZone: isInsideAny,
    bufferRadius: PRE_BUFFERED_METERS // Using pre-buffered value from buildinglogic.json
  };
}

/**
 * Validate attendance check-in with geofencing
 * Main function to be called when student attempts to check in
 * 
 * @param {Object} params - Check-in parameters
 * @param {number} params.lat - Student's GPS latitude
 * @param {number} params.lng - Student's GPS longitude
 * @param {string} params.buildingCode - Required building code for the class
 * @param {string} params.roomCode - Room code (optional for extra validation)
 * @returns {Object} Validation result
 */
export function validateAttendanceLocation(params) {
  const { lat, lng, buildingCode, roomCode } = params;
  
  // Validate GPS coordinates
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return {
      valid: false,
      error: 'GPS_UNAVAILABLE',
      message: 'Không thể lấy vị trí GPS. Vui lòng bật định vị.'
    };
  }
  
  // Check if inside building zone
  const locationCheck = checkPointInBuildingZone(lat, lng, buildingCode);
  
  if (!locationCheck.isInside) {
    return {
      valid: false,
      error: 'OUT_OF_RANGE',
      message: locationCheck.message,
      details: {
        buildingCode,
        buildingName: locationCheck.buildingName,
        distance: locationCheck.distance,
        requiredRadius: PRE_BUFFERED_METERS // buildinglogic.json has 15m buffer
      }
    };
  }
  
  return {
    valid: true,
    message: locationCheck.message,
    details: {
      buildingCode,
      buildingName: locationCheck.buildingName,
      distance: locationCheck.distance,
      bufferUsed: PRE_BUFFERED_METERS,
      timestamp: new Date().toISOString()
    }
  };
}

export default {
  generateBuildingBuffer,
  generateAllBuildingBuffers,
  getOriginalBuilding,
  getBuilding,
  checkPointInBuildingZone,
  findNearestBuilding,
  validateAttendanceLocation,
  PRE_BUFFERED_METERS
};

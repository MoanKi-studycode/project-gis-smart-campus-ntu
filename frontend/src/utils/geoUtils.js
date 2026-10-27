import { centroid } from '@turf/turf';

export function getFeatureCount(geojson) {
  return geojson?.features?.length || 0
}

export function getFeatureTypes(geojson) {
  const types = new Set()
  geojson?.features?.forEach((f) => f.geometry && types.add(f.geometry.type))
  return Array.from(types)
}

export function safeProp(feature, key, fallback = null) {
  return (feature?.properties && feature.properties[key] !== undefined) ? feature.properties[key] : fallback
}

/**
 * Calculates the centroid (center point) of a GeoJSON geometry using Turf.js.
 * Supports Polygon and MultiPolygon.
 * Returns { lat, lng } or null if invalid.
 */
export function getCentroid(geojsonItem) {
  if (!geojsonItem) return null;

  try {
    // turf.centroid takes a Feature or Geometry
    // If we have a raw geometry object (no type 'Feature'), we might need to wrap it or pass it directly if supported.
    // Turf's centroid supports All GeoJSON.
    
    const center = centroid(geojsonItem);
    const coords = center.geometry.coordinates; // [lng, lat]
    
    return {
      lng: coords[0],
      lat: coords[1]
    };
  } catch (error) {
    console.error("Error calculating centroid with Turf:", error);
    return null;
  }
}

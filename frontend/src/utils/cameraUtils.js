import { Cartesian3, Math as CesiumMath } from 'cesium';

export const CAMERA_CONFIG = {
  height: 300,
  heading: CesiumMath.toRadians(0),
  pitch: CesiumMath.toRadians(-45),
  roll: 0.0,
  duration: 1.5,
};

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Pure helper: returns Cesium flyTo options, but does NOT call viewer.camera.flyTo.
export function makeFlyToOptions(lng, lat, height = CAMERA_CONFIG.height) {
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null;

  return {
    destination: Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: CAMERA_CONFIG.heading,
      pitch: CAMERA_CONFIG.pitch,
      roll: CAMERA_CONFIG.roll,
    },
    duration: CAMERA_CONFIG.duration,
  };
}

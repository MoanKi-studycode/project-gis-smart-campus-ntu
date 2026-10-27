import { useEffect, useRef } from 'react';
import { useCesium } from 'resium';
import { Cartesian3, Math as CesiumMath, SceneMode } from 'cesium';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Default camera settings for 3D mode (with pitch/heading for tilted view)
// Campus: Nha Trang University
const DEFAULT_3D_CENTER = {
  lng: 109.202347- 0.0025,
  lat: 12.268143 + 0.0065,
  height: 250,
};

const DEFAULT_3D_ORIENTATION = {
  heading: CesiumMath.toRadians(160),
  pitch: CesiumMath.toRadians(-30),
  roll: 0,
};

// Default camera settings for 2D mode (top-down view, no pitch/heading)
const DEFAULT_2D_CENTER = {
  lng: 109.202347,
  lat: 12.268143,
  height: 800, // Higher altitude for 2D overview
};

export default function CameraManager({ target, is3d = true }) {
  const { viewer } = useCesium();

  const didInitialFlyRef = useRef(false);
  const lastTargetRef = useRef(null);
  const lastModeRef = useRef(is3d);

  // 1) Initial flyTo (exactly once) - only for 3D mode on first load
  useEffect(() => {
    if (!viewer || didInitialFlyRef.current) return;

    didInitialFlyRef.current = true;

    if (is3d) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          DEFAULT_3D_CENTER.lng,
          DEFAULT_3D_CENTER.lat - 0.002,
          DEFAULT_3D_CENTER.height
        ),
        orientation: DEFAULT_3D_ORIENTATION,
        duration: 2.0,
      });
    } else {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          DEFAULT_2D_CENTER.lng,
          DEFAULT_2D_CENTER.lat,
          DEFAULT_2D_CENTER.height
        ),
        duration: 2.0,
      });
    }
  }, [viewer, is3d]);

  // 2) Handle 2D/3D mode switch - restore appropriate camera position
  useEffect(() => {
    if (!viewer) return;
    
    // Skip if mode hasn't changed
    if (lastModeRef.current === is3d) return;
    lastModeRef.current = is3d;

    // Wait a short moment for scene mode to fully switch
    setTimeout(() => {
      if (is3d) {
        // Switching to 3D: restore tilted view with pitch/heading
        const currentTarget = lastTargetRef.current;
        if (currentTarget) {
          // If we have a selected target, fly to it in 3D style
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              currentTarget.lng - 0.0005,
              currentTarget.lat + 0.0015,
              100
            ),
            orientation: {
              heading: CesiumMath.toRadians(160),
              pitch: CesiumMath.toRadians(-30),
              roll: 0.0,
            },
            duration: 1.0,
          });
        } else {
          // No target, fly to default 3D view
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              DEFAULT_3D_CENTER.lng - 0.003,
              DEFAULT_3D_CENTER.lat + 0.0065,
              DEFAULT_3D_CENTER.height
            ),
            orientation: DEFAULT_3D_ORIENTATION,
            duration: 1.0,
          });
        }
      } else {
        // Switching to 2D: set top-down view (no pitch/heading in 2D mode)
        const currentTarget = lastTargetRef.current;
        if (currentTarget) {
          // If we have a selected target, center on it from above
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              currentTarget.lng,
              currentTarget.lat,
              400 // Lower height for focused 2D view
            ),
            duration: 1.0,
          });
        } else {
          // No target, fly to default 2D overview
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
              DEFAULT_2D_CENTER.lng,
              DEFAULT_2D_CENTER.lat,
              DEFAULT_2D_CENTER.height
            ),
            duration: 1.0,
          });
        }
      }
    }, 100);
  }, [viewer, is3d]);

  // 3) Reactive flyTo on target change
  useEffect(() => {
    if (!viewer || !target) return;
    const lng = target?.location?.lng;
    const lat = target?.location?.lat;
    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return;

    // Prevent duplicate flights to same location
    const last = lastTargetRef.current;
    if (last && Math.abs(last.lng - lng) < 0.000001 && Math.abs(last.lat - lat) < 0.000001) return;

    lastTargetRef.current = { lng, lat };

    // Check current scene mode to determine camera behavior
    const currentMode = viewer.scene.mode;
    
    if (currentMode === SceneMode.SCENE3D) {
      // 3D mode: tilted view with heading/pitch
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lng - 0.0005, lat + 0.0015, 100),
        orientation: {
          heading: CesiumMath.toRadians(160),
          pitch: CesiumMath.toRadians(-30),
          roll: 0.0,
        },
        duration: 1.5,
      });
    } else {
      // 2D mode: top-down view centered on target
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lng, lat, 400),
        duration: 1.5,
      });
    }
  }, [target, viewer]);

  return null;
}

// cesiumHighlight.js
// Role: Apply/revert highlight styling on Cesium Entities.

import * as Cesium from "cesium";

export function captureEntityStyle(entity) {
  const snap = {};

  if (entity?.polygon) {
    snap.polygon = {
      material: entity.polygon.material,
      outline: entity.polygon.outline,
      outlineColor: entity.polygon.outlineColor,
      outlineWidth: entity.polygon.outlineWidth
    };
  }

  if (entity?.polyline) {
    snap.polyline = {
      material: entity.polyline.material,
      width: entity.polyline.width
    };
  }

  if (entity?.point) {
    snap.point = {
      color: entity.point.color,
      pixelSize: entity.point.pixelSize
    };
  }

  if (entity?.billboard) {
    snap.billboard = {
      color: entity.billboard.color,
      scale: entity.billboard.scale
    };
  }

  return snap;
}

export function applyHighlight(entity) {
  if (!entity) return;

  if (entity.polygon) {
    entity.polygon.material = Cesium.Color.YELLOW.withAlpha(0.45);
    entity.polygon.outline = true;
    entity.polygon.outlineColor = Cesium.Color.YELLOW;
    entity.polygon.outlineWidth = 2;
  }

  if (entity.polyline) {
    entity.polyline.material = Cesium.Color.YELLOW;
    entity.polyline.width = 5;
  }

  if (entity.point) {
    entity.point.color = Cesium.Color.YELLOW;
    entity.point.pixelSize = 10;
  }

  if (entity.billboard) {
    entity.billboard.color = Cesium.Color.YELLOW;
    entity.billboard.scale = 1.2;
  }
}

export function restoreEntityStyle(entity, snap) {
  if (!entity || !snap) return;

  if (entity.polygon && snap.polygon) {
    entity.polygon.material = snap.polygon.material;
    entity.polygon.outline = snap.polygon.outline;
    entity.polygon.outlineColor = snap.polygon.outlineColor;
    entity.polygon.outlineWidth = snap.polygon.outlineWidth;
  }

  if (entity.polyline && snap.polyline) {
    entity.polyline.material = snap.polyline.material;
    entity.polyline.width = snap.polyline.width;
  }

  if (entity.point && snap.point) {
    entity.point.color = snap.point.color;
    entity.point.pixelSize = snap.point.pixelSize;
  }

  if (entity.billboard && snap.billboard) {
    entity.billboard.color = snap.billboard.color;
    entity.billboard.scale = snap.billboard.scale;
  }
}

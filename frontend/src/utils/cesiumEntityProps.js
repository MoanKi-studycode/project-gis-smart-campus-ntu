// cesiumEntityProps.js
// Role: Convert Cesium Entity properties (PropertyBag) into a plain JS object for UI.

export function entityPropertiesToObject(entity, time) {
  const props = entity?.properties;
  if (!props || !Array.isArray(props.propertyNames)) return {};

  const out = {};
  for (const name of props.propertyNames) {
    try {
      const p = props[name];
      const v = typeof p?.getValue === "function" ? p.getValue(time) : p;
      out[name] = v;
    } catch {
      // ignore
    }
  }
  return out;
}

export function guessDisplayName(propsObj, entityName) {
  const keys = [
    "TenToaNha",
    "TenTienIch",
    "TenDuong",
    "Name",
    "MaToaNha",
    "MaTienIch",
    "OBJECTID"
  ];

  for (const k of keys) {
    const v = propsObj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }

  if (entityName) return String(entityName);
  return "(unknown)";
}

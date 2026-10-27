import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Building } from 'lucide-react';
import buildingsGeoJson from '../../data/building.json';
import extensionsGeoJson from '../../data/extensions.json';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Stable center: bbox center of geometry coordinates.
function computeGeometryBboxCenterLngLat(geometry) {
  if (!geometry || !geometry.coordinates) return null;

  const points = [];
  const visit = (node) => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === 'number' && typeof node[1] === 'number') {
      points.push(node);
      return;
    }
    for (const child of node) visit(child);
  };

  visit(geometry.coordinates);
  if (points.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const p of points) {
    const lng = p[0];
    const lat = p[1];
    if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) continue;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  if (!isFiniteNumber(minLng) || !isFiniteNumber(maxLng) || !isFiniteNumber(minLat) || !isFiniteNumber(maxLat)) {
    return null;
  }

  return { lng: (minLng + maxLng) / 2, lat: (minLat + maxLat) / 2 };
}

export default function SearchBar({ onSelectBuilding }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Search sources: building.json + extensions.json
  // Search result contract: { id, name, lng, lat, type }
  const items = useMemo(() => {
    const features = buildingsGeoJson?.features || [];
  const buildingItems = features
      .map((feature, index) => {
        const props = feature?.properties || {};
        const id = props.MaToaNha || props.MapKey || `BLD-${index}`;
        const name = props.TenToaNha || props.Ten || props.Name || props.name || id;
        const center = computeGeometryBboxCenterLngLat(feature?.geometry);
        if (!center) return null;
        return { type: 'building', id, name, lng: center.lng, lat: center.lat };
      })
      .filter(Boolean);

  const extFeatures = extensionsGeoJson?.features || [];
  const extensionItems = extFeatures
    .map((feature, index) => {
      const props = feature?.properties || {};
      const id = props.MaTienIch || props.code || props.Code || props.OBJECTID || `EXT-${index}`;
      const name = props.TenTienIch || props.name || props.Name || String(id);
      const geom = feature?.geometry;
      let lng = null;
      let lat = null;
      if (geom?.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
        lng = Number(geom.coordinates[0]);
        lat = Number(geom.coordinates[1]);
      } else {
        lng = Number(props.ToaDoX);
        lat = Number(props.ToaDoY);
      }
      if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null;
      return { type: 'extension', id, name, lng, lat };
    })
    .filter(Boolean);

  return [...buildingItems, ...extensionItems];
  }, []);

  // Filter logic
  useEffect(() => {
    if (!query.trim() || !items.length) {
      setResults([]);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = items.filter(b => 
      (b.name?.toLowerCase() || '').includes(lower) || 
      (b.id?.toString().toLowerCase() || '').includes(lower)
    );
    setResults(filtered);
    setIsOpen(true);
  }, [query, items]);

  // Click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (building) => {
    setQuery(building.name);
    setIsOpen(false);
    if (onSelectBuilding) {
      onSelectBuilding({
        id: building.id,
        name: building.name,
        type: building.type,
        location: { lng: building.lng, lat: building.lat },
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-[350px] font-sans">
      {/* Input Container */}
      <div className="bg-white rounded-xl shadow-lg flex items-center px-4 h-12 border border-gray-200 transition-shadow hover:shadow-xl">
        <Search className="text-gray-400 mr-3" size={20} />
        <input
          type="text"
          placeholder="Tìm kiếm tòa nhà / tiện ích..."
          className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-14 left-0 w-full bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((building, index) => (
            <button
              key={building.id || index}
              onClick={() => handleSelect(building)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
            >
              <div className="mt-1 p-2 rounded-lg bg-blue-100 text-blue-600">
                <Building size={18} />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{building.name}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{building.id}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

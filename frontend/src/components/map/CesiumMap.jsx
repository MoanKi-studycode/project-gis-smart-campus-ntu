import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Viewer, ImageryLayer } from 'resium';
import {
	UrlTemplateImageryProvider,
	SceneMode,
	Credit,
	Cartographic,
	Math as CesiumMath,
	JulianDate,
	EllipsoidTerrainProvider,
} from 'cesium';

import CameraManager from './CameraManager';
import RenderLayers from './RenderLayers';
import buildingsGeoJson from '../../data/building.json';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Compute the bounding-box center (lng, lat) from geometry coordinates.
 * Works for Polygon, MultiPolygon, LineString, etc.
 */
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

/**
 * Normalize any target-like object to a consistent { id, name, location } shape.
 */
function normalizeTarget(targetLike) {
	if (!targetLike) return null;
	const id = targetLike.id ?? targetLike.key ?? targetLike.MaToaNha ?? null;
	const name = targetLike.name ?? targetLike.TenToaNha ?? id;

	const lng = targetLike?.location?.lng ?? targetLike?.lng;
	const lat = targetLike?.location?.lat ?? targetLike?.lat;
	if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return null;

	return {
		id,
		name,
		location: { lng, lat },
	};
}

/**
 * Extract bbox center from Cesium Entity polygon hierarchy.
 */
function bboxCenterFromEntityPolygon(entity) {
	try {
		const polygon = entity?.polygon;
		const hierarchy = polygon?.hierarchy;
		if (!hierarchy?.getValue) return null;

		const value = hierarchy.getValue(JulianDate.now());
		const positions = value?.positions;
		if (!Array.isArray(positions) || positions.length === 0) return null;

		let minLng = Infinity;
		let maxLng = -Infinity;
		let minLat = Infinity;
		let maxLat = -Infinity;

		for (const pos of positions) {
			const carto = Cartographic.fromCartesian(pos);
			const lng = CesiumMath.toDegrees(carto.longitude);
			const lat = CesiumMath.toDegrees(carto.latitude);
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
	} catch {
		return null;
	}
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CesiumMap({ selectedBuilding, is3d = true, layers, onBuildingSelect, onViewerReady }) {
	const viewerRef = useRef(null);

	// Stable terrain provider (no terrain, just ellipsoid)
	const terrainProvider = useMemo(() => new EllipsoidTerrainProvider(), []);

	// Stable imagery provider - CartoDb Dark tiles
	const imageryProvider = useMemo(() => {
		return new UrlTemplateImageryProvider({
			url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
			subdomains: ['a', 'b', 'c', 'd'],
			credit: new Credit('Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL.')
		});
	}, []);

	/**
	 * Build a stable lookup from building.json for search.
	 * This index is independent of layer visibility - search ALWAYS works.
	 */
	const buildingsIndex = useMemo(() => {
		const features = buildingsGeoJson?.features || [];
		const byId = new Map();
		const byName = new Map();

		for (let i = 0; i < features.length; i++) {
			const f = features[i];
			const props = f?.properties || {};
			const id = props.MaToaNha || props.MapKey || `BLD-${i}`;
			const name = props.TenToaNha || props.Ten || props.Name || props.name || id;
			const center = computeGeometryBboxCenterLngLat(f?.geometry);
			if (!center) continue;
			const target = { id, name, location: { lng: center.lng, lat: center.lat } };
			byId.set(String(id), target);
			byName.set(String(name).toLowerCase(), target);
		}

		return { byId, byName };
	}, []);

	/**
	 * Handle entity selection in the viewer.
	 * Resolves to a normalized target for flyTo / info display.
	 */
	const handleSelectedEntityChange = useCallback((entity) => {
		if (!onBuildingSelect) return;

		if (!entity) {
			onBuildingSelect(null);
			return;
		}

		const props = entity?.properties;
		const idFromProps = props?.MaToaNha?.getValue?.() ?? props?.MapKey?.getValue?.() ?? entity?.id;
		const nameFromProps = props?.TenToaNha?.getValue?.() ?? props?.Ten?.getValue?.() ?? props?.Name?.getValue?.();

		let target = null;

		// Try to find in index by ID
		if (idFromProps != null) {
			target = buildingsIndex.byId.get(String(idFromProps)) || null;
		}

		// Fallback: try by name
		if (!target && nameFromProps) {
			target = buildingsIndex.byName.get(String(nameFromProps).toLowerCase()) || null;
		}

		// Fallback: compute from entity polygon
		if (!target) {
			const center = bboxCenterFromEntityPolygon(entity);
			if (center) {
				target = {
					id: idFromProps ?? null,
					name: nameFromProps ?? idFromProps ?? 'Building',
					location: { lng: center.lng, lat: center.lat },
				};
			}
		}

		onBuildingSelect(normalizeTarget(target));
	}, [buildingsIndex, onBuildingSelect]);

	/**
	 * Initialize viewer settings when mounted or when is3d changes.
	 */
	useEffect(() => {
		const viewer = viewerRef.current?.cesiumElement;
		if (!viewer) return;

		// Set scene mode based on is3d prop
		viewer.scene.mode = is3d ? SceneMode.SCENE3D : SceneMode.SCENE2D;
		viewer.scene.globe.enableLighting = false;

		// Enable all mouse/touch controls for scene navigation
		const controller = viewer.scene.screenSpaceCameraController;
		controller.enableRotate = true;
		controller.enableTranslate = true;
		controller.enableZoom = true;
		controller.enableTilt = true;
		controller.enableLook = true;

		// Notify parent that viewer is ready
		if (onViewerReady) {
			onViewerReady(viewer);
		}
	}, [is3d, onViewerReady]);

	return (
		<Viewer
			ref={viewerRef}
			full
			className="fixed inset-0 z-0"
			animation={false}
			timeline={false}
			baseLayerPicker={false}
			homeButton={false}
			infoBox={false}
			sceneModePicker={false}
			selectionIndicator={true}
			navigationHelpButton={false}
			geocoder={false}
			requestRenderMode={false}
			terrainProvider={terrainProvider}
			onSelectedEntityChange={handleSelectedEntityChange}
			scene3DOnly={false}
			useBrowserRecommendedResolution={true}
		>
			<ImageryLayer imageryProvider={imageryProvider} />

			{/* CameraManager handles initial flyTo, target-based flyTo, and 2D/3D mode switches */}
			<CameraManager target={normalizeTarget(selectedBuilding)} is3d={is3d} />

			{/* RenderLayers handles all GeoJSON layers with conditional visibility */}
			<RenderLayers layers={layers} selectedBuilding={selectedBuilding} />
		</Viewer>
	);
}

import React, { useMemo } from 'react';
import { Entity, GeoJsonDataSource } from 'resium';
import {
	Cartesian2,
	Cartesian3,
	Color,
	HeightReference,
	HorizontalOrigin,
	LabelStyle,
	NearFarScalar,
	VerticalOrigin,
} from 'cesium';

import buildingsGeoJson from '../../data/building.json';
import streetsGeoJson from '../../data/streets.json';
import treesGeoJson from '../../data/userviews.json';
import extensionsGeoJson from '../../data/extensions.json';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function toLowerSafe(value) {
	if (value == null) return '';
	return String(value).toLowerCase();
}

function getPointLngLatFromFeature(feature) {
	const geom = feature?.geometry;
	if (geom?.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
		const [lng, lat] = geom.coordinates;
		if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
	}
	// Fallback to properties
	const props = feature?.properties || {};
	const lng = Number(props.ToaDoX);
	const lat = Number(props.ToaDoY);
	if (Number.isFinite(lng) && Number.isFinite(lat)) return { lng, lat };
	return null;
}

function flattenLngLatPairs(coordinates) {
	if (!Array.isArray(coordinates)) return [];
	const out = [];
	for (const c of coordinates) {
		if (!Array.isArray(c) || c.length < 2) continue;
		const lng = c[0];
		const lat = c[1];
		if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
		out.push(lng, lat);
	}
	return out;
}

function extractLineStrings(feature) {
	const geom = feature?.geometry;
	if (!geom) return [];
	if (geom.type === 'LineString') return [geom.coordinates];
	if (geom.type === 'MultiLineString') return geom.coordinates || [];
	return [];
}

function pickExtensionModel({ maTienIch, tenTienIch }) {
	const ma = toLowerSafe(maTienIch);
	const ten = toLowerSafe(tenTienIch);

	if (ma.includes('atm') || ten.includes('atm')) {
		return { uri: '/icons/card_reader.glb', scale: 1.5 };
	}
	if (ma.includes('ct') || ten.includes('can tin') || ten.includes('cantin') || ten.includes('cafe') || ten.includes('coffee')) {
		return { uri: '/icons/low_poly_fast_food.glb', scale: 1.5 };
	}
	if (ten.includes('thu vien') || ten.includes('thư viện') || ma.includes('tv')) {
		return { uri: '/icons/old_book_wldocam_low.glb', scale: 1.5 };
	}
	return { uri: '/icons/11_location.glb', scale: 1.5 };
}

// ============================================================
// LAYER COMPONENTS (ISOLATED)
// ============================================================

/**
 * BuildingsLayer - Uses GeoJsonDataSource for Polygon/MultiPolygon
 * Styles: Extruded, with name label only for selected building
 * Non-selected buildings are grayed out when a building is selected
 */
function BuildingsLayer({ selectedBuilding }) {
	const selectedId = selectedBuilding?.id || selectedBuilding?.MaToaNha || null;
	const selectedName = selectedBuilding?.name || selectedBuilding?.TenToaNha || null;

	// Create label entity ONLY for selected building
	const selectedBuildingLabel = useMemo(() => {
		if (!selectedId && !selectedName) return null;

		const features = buildingsGeoJson?.features || [];
		
		for (let i = 0; i < features.length; i++) {
			const f = features[i];
			const props = f?.properties || {};
			const buildingId = props.MaToaNha || '';
			const buildingName = props.TenToaNha || '';

			// Check if this is the selected building
			const isSelected = 
				(selectedId && buildingId === selectedId) ||
				(selectedName && buildingName === selectedName);

			if (!isSelected) continue;

			// Calculate center of building polygon
			const geom = f?.geometry;
			if (!geom || !geom.coordinates) continue;

			let allCoords = [];
			const collectCoords = (arr) => {
				if (!Array.isArray(arr)) return;
				if (arr.length >= 2 && typeof arr[0] === 'number') {
					allCoords.push(arr);
					return;
				}
				for (const item of arr) collectCoords(item);
			};
			collectCoords(geom.coordinates);

			if (allCoords.length === 0) continue;

			// Calculate bounding box center
			let minLng = Infinity, maxLng = -Infinity;
			let minLat = Infinity, maxLat = -Infinity;
			for (const c of allCoords) {
				if (c[0] < minLng) minLng = c[0];
				if (c[0] > maxLng) maxLng = c[0];
				if (c[1] < minLat) minLat = c[1];
				if (c[1] > maxLat) maxLat = c[1];
			}
			const centerLng = (minLng + maxLng) / 2;
			const centerLat = (minLat + maxLat) / 2;

			// Label height = ChieuCao + 2
			const chieuCao = Number(props.ChieuCao) || 12;
			const labelHeight = chieuCao + 2;

			return (
				<Entity
					key={`building-label-selected`}
					position={Cartesian3.fromDegrees(centerLng, centerLat, labelHeight)}
					label={{
						text: buildingName || buildingId,
						font: 'bold 16px sans-serif',
						style: LabelStyle.FILL_AND_OUTLINE,
						fillColor: Color.fromCssColorString('#1f2937'),
						outlineColor: Color.WHITE,
						outlineWidth: 2,
						showBackground: true,
						backgroundColor: Color.fromCssColorString('#ffffff').withAlpha(0.95),
						backgroundPadding: new Cartesian2(10, 6),
						heightReference: HeightReference.RELATIVE_TO_GROUND,
						verticalOrigin: VerticalOrigin.BOTTOM,
						horizontalOrigin: HorizontalOrigin.CENTER,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
						scaleByDistance: new NearFarScalar(50, 1.2, 1000, 0.5),
					}}
				/>
			);
		}
		return null;
	}, [selectedId, selectedName]);

	// Colors for buildings
	const normalFill = useMemo(() => Color.fromCssColorString('#8E9397').withAlpha(1.0), []);
	const grayedOutFill = useMemo(() => Color.fromCssColorString('#4a4a4a').withAlpha(0.6), []);
	const highlightFill = useMemo(() => Color.fromCssColorString('#555555ff').withAlpha(1.0), []);
	const outline = useMemo(() => Color.fromCssColorString('#E5E7E9'), []);
	const highlightOutline = useMemo(() => Color.fromCssColorString('#c9c9c9ff'), []);

	const handleLoad = (dataSource) => {
		dataSource.entities.values.forEach((entity) => {
			if (!entity?.polygon) return;

			const height = Math.max(0, (Number(entity.properties?.ChieuCao?.getValue?.()) || 12) - 5);
			const buildingId = entity.properties?.MaToaNha?.getValue?.() || '';
			const buildingName = entity.properties?.TenToaNha?.getValue?.() || '';

			// Determine if this building is selected
			const isSelected = 
				(selectedId && buildingId === selectedId) ||
				(selectedName && buildingName === selectedName);

			// Set colors based on selection state
			if (selectedId || selectedName) {
				// A building is selected - highlight it, gray out others
				if (isSelected) {
					entity.polygon.material = highlightFill;
					entity.polygon.outlineColor = highlightOutline;
				} else {
					entity.polygon.material = grayedOutFill;
					entity.polygon.outlineColor = outline;
				}
			} else {
				// No building selected - normal colors
				entity.polygon.material = normalFill;
				entity.polygon.outlineColor = outline;
			}

			entity.polygon.outline = true;
			entity.polygon.extrudedHeight = height;
			entity.polygon.heightReference = HeightReference.RELATIVE_TO_GROUND;

			if ('extrudedHeightReference' in entity.polygon) {
				entity.polygon.extrudedHeightReference = HeightReference.RELATIVE_TO_GROUND;
			}
		});
	};

	// Key changes when selection changes to force re-render of GeoJsonDataSource
	const dataSourceKey = `buildings-${selectedId || 'none'}-${selectedName || 'none'}`;

	return (
		<>
			<GeoJsonDataSource
				key={dataSourceKey}
				data={buildingsGeoJson}
				clampToGround={false}
				onLoad={handleLoad}
			/>
			{selectedBuildingLabel}
		</>
	);
}

/**
 * StreetsLayer - Polyline entities from LineString/MultiLineString
 * Styles: Light gray, clamped to ground
 */
function StreetsLayer() {
	const streetEntities = useMemo(() => {
		const features = streetsGeoJson?.features || [];
		const material = Color.fromCssColorString('#D5D8DC');
		const entities = [];

		for (let i = 0; i < features.length; i++) {
			const f = features[i];
			const props = f?.properties || {};
			const name = props.TenDuong || props.name || props.Name || `Street ${i + 1}`;
			const lines = extractLineStrings(f);

			for (let j = 0; j < lines.length; j++) {
				const degrees = flattenLngLatPairs(lines[j]);
				if (degrees.length < 4) continue; // Need at least 2 points (4 values)

				entities.push(
					<Entity
						key={`street-${f?.id ?? i}-${j}`}
						name={name}
						polyline={{
							positions: Cartesian3.fromDegreesArray(degrees),
							width: 3,
							material,
							clampToGround: true,
						}}
					/>
				);
			}
		}
		return entities;
	}, []);

	return <>{streetEntities}</>;
}

/**
 * TreesLayer - 3D Model entities from Point geometries
 * Uses .glb model for realistic 3D trees
 */
function TreesLayer() {
	const treeEntities = useMemo(() => {
		const features = treesGeoJson?.features || [];
		const entities = [];

		for (let i = 0; i < features.length; i++) {
			const f = features[i];
			const p = getPointLngLatFromFeature(f);
			if (!p) continue;

			// Get tree height from properties or use default
			const treeHeight = f?.properties?.height || 15;
			// Scale factor based on tree height (smaller scale for compact trees)
			const scale = (treeHeight / 15) * 0.1;

			entities.push(
				<Entity
					key={`tree-${f?.id ?? i}`}
					name={f?.properties?.Name || 'Tree'}
					position={Cartesian3.fromDegrees(p.lng, p.lat, 0)}
					model={{
						uri: '/images/quick_treeit_tree.glb',
						scale: scale,
						minimumPixelSize: 4,
						maximumScale: 8,
						heightReference: HeightReference.CLAMP_TO_GROUND,
					}}
				/>
			);
		}
		return entities;
	}, []);

	return <>{treeEntities}</>;
}

/**
 * ExtensionsLayer - 3D Model + Label entities from Point geometries
 * Styles: 3D model based on type, with floating label
 */
function ExtensionsLayer() {
	const extensionEntities = useMemo(() => {
		const features = extensionsGeoJson?.features || [];
		const entities = [];

		for (let i = 0; i < features.length; i++) {
			const f = features[i];
			const props = f?.properties || {};
			const p = getPointLngLatFromFeature(f);
			if (!p) continue;

			const tenTienIch = props.TenTienIch || props.name || props.Name || '';
			const maTienIch = props.MaTienIch || props.code || props.Code || '';
			const modelConfig = pickExtensionModel({ maTienIch, tenTienIch });

			// Set height above ground to place icons on top of buildings
			const heightAboveGround = 5; // meters above ground level

			entities.push(
				<Entity
					key={`ext-${f?.id ?? i}`}
					name={tenTienIch || maTienIch || `Extension ${i + 1}`}
					position={Cartesian3.fromDegrees(p.lng, p.lat, heightAboveGround)}
					model={{
						uri: modelConfig.uri,
						scale: modelConfig.scale,
						minimumPixelSize: 24,
						maximumScale: 15,
						heightReference: HeightReference.RELATIVE_TO_GROUND,
					}}
					label={{
						text: tenTienIch || maTienIch,
						font: '12px sans-serif',
						fillColor: Color.fromCssColorString('#1f2937'),
						outlineColor: Color.WHITE,
						outlineWidth: 1,
						showBackground: true,
						backgroundColor: Color.fromCssColorString('#ffffff').withAlpha(0.9),
						pixelOffset: new Cartesian2(0, -60),
						heightReference: HeightReference.RELATIVE_TO_GROUND,
						verticalOrigin: VerticalOrigin.BOTTOM,
						horizontalOrigin: HorizontalOrigin.CENTER,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
						scaleByDistance: new NearFarScalar(50, 1.0, 2000, 0.3),
					}}
				/>
			);
		}
		return entities;
	}, []);

	return <>{extensionEntities}</>;
}

// ============================================================
// MAIN COMPONENT - CONDITIONAL JSX RENDERING
// ============================================================

export default function RenderLayers({ layers, selectedBuilding }) {
	return (
		<>
			{/* BUILDINGS: Conditionally rendered via JSX */}
			{layers?.buildings && <BuildingsLayer selectedBuilding={selectedBuilding} />}

			{/* STREETS: Conditionally rendered via JSX */}
			{layers?.streets && <StreetsLayer />}

			{/* TREES: Conditionally rendered via JSX */}
			{layers?.trees && <TreesLayer />}

			{/* EXTENSIONS: Conditionally rendered via JSX */}
			{layers?.extensions && <ExtensionsLayer />}
		</>
	);
}

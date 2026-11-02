import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { INDIAN_STUDY_BASINS_GEOJSON } from '../../data/indiaGeologicalBasins';
import {
  Layers,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Compass,
  Maximize2,
  Minimize2,
  Satellite,
  Globe as GlobeIcon,
  RotateCcw,
  ShieldCheck,
  Activity
} from 'lucide-react';

/**
 * Safely initialize 3D Tileset for subsurface or surface features
 * according to CesiumJS 1.129+ official specification.
 */
export async function loadSubsurface3DTileset(
  viewer: Cesium.Viewer,
  tilesetUrl: string
): Promise<Cesium.Cesium3DTileset | null> {
  if (!viewer || viewer.isDestroyed()) return null;
  try {
    const tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      maximumScreenSpaceError: 16,
      skipLevelOfDetail: true
    });
    if (!viewer.isDestroyed()) {
      viewer.scene.primitives.add(tileset);
      return tileset;
    }
  } catch (err: any) {
    console.warn('[Cesium3DTileset] Optional 3D tileset unavailable, continuing with satellite terrain:', err.message);
  }
  return null;
}

/**
 * Safely create terrain provider with zero paid requirements.
 * Falls back to EllipsoidTerrainProvider if no Cesium Ion token or network fails.
 */
async function createSafeTerrainProvider(): Promise<Cesium.TerrainProvider> {
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (token && typeof token === 'string' && token.trim().length > 15) {
    try {
      Cesium.Ion.defaultAccessToken = token.trim();
      return await Cesium.createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true
      });
    } catch (e: any) {
      console.warn('[Cesium Terrain] World terrain failed, using Ellipsoid fallback:', e.message);
    }
  }
  return new Cesium.EllipsoidTerrainProvider();
}

/**
 * Create base satellite imagery layer using open ArcGIS World Imagery
 * requiring zero subscriptions or API keys.
 */
function createSatelliteImageryLayer(): Cesium.ImageryLayer {
  const provider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    credit: new Cesium.Credit('Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community')
  });

  return new Cesium.ImageryLayer(provider, {
    brightness: 1.08,
    contrast: 1.12,
    gamma: 1.0
  });
}

export const CesiumGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markersRef = useRef<Cesium.Entity[]>([]);
  const footprintEntityRef = useRef<Cesium.Entity | null>(null);
  const calloutEntityRef = useRef<Cesium.Entity | null>(null);
  const basinDataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  const {
    selectedLocation,
    setSelectedLocation,
    currentTimeIndex,
    layers
  } = useTerranexusStore();

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number; height: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [imageryMode, setImageryMode] = useState<'satellite' | 'osm'>('satellite');
  const [showFootprint, setShowFootprint] = useState<boolean>(true);
  const [showBasins, setShowBasins] = useState<boolean>(true);

  // Initialize Cesium Viewer with high-performance official settings
  useEffect(() => {
    if (!containerRef.current) return;

    let isSubscribed = true;

    // Optional Cesium Ion token configuration
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (token && typeof token === 'string' && token.trim().length > 15) {
      Cesium.Ion.defaultAccessToken = token.trim();
    }

    // Initialize Viewer with primary Satellite ImageryLayer
    const baseImageryLayer = createSatelliteImageryLayer();

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      orderIndependentTranslucency: true,
      contextOptions: {
        webgl: {
          preserveDrawingBuffer: true
        }
      },
      baseLayer: baseImageryLayer
    });

    viewerRef.current = viewer;

    // Configure 4D Clock & JulianDate spanning the 11-year observation timeline (2014-01-01 to 2024-12-31)
    const startDate = new Date('2014-01-01T00:00:00Z');
    const stopDate = new Date('2024-12-31T23:59:59Z');
    viewer.clock.startTime = Cesium.JulianDate.fromDate(startDate);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(stopDate);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2024-05-15T12:00:00Z'));
    viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    viewer.clock.multiplier = 1.0;
    viewer.clock.shouldAnimate = false;

    // Atmospheric Rendering & Photorealistic Earth Configuration
    const scene = viewer.scene;
    const globe = scene.globe;

    globe.enableLighting = true; // Renders realistic solar illumination from Clock
    globe.showGroundAtmosphere = true; // Atmosphere glow around Earth limb
    globe.atmosphereLightIntensity = 12.0;
    globe.depthTestAgainstTerrain = false; // Prevents markers from clipping
    globe.baseColor = Cesium.Color.fromCssColorString('#030712');
    scene.backgroundColor = Cesium.Color.fromCssColorString('#030712');

    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = true;
      scene.skyAtmosphere.brightnessShift = 0.1;
      scene.skyAtmosphere.saturationShift = 0.15;
    }

    // Attempt safe terrain provider initialization asynchronously
    createSafeTerrainProvider().then(terrainProvider => {
      if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.terrainProvider = terrainProvider;
      }
    });

    // Ingest Regional Geological Basins via Cesium.GeoJsonDataSource
    Cesium.GeoJsonDataSource.load(INDIAN_STUDY_BASINS_GEOJSON, {
      stroke: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
      fill: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.08),
      strokeWidth: 2,
      clampToGround: true
    }).then(dataSource => {
      if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
        basinDataSourceRef.current = dataSource;
        viewerRef.current.dataSources.add(dataSource);
      }
    }).catch(err => {
      console.warn('[GeoJsonDataSource] Basin loading error:', err);
    });

    // Add High-Tech Pin Entities for all 7 Indian Regional Study Loci
    markersRef.current = [];
    INDIA_LOCATIONS.forEach((loc) => {
      const isSelected = loc.id === selectedLocation.id;
      const entity = viewer.entities.add({
        id: loc.id,
        name: loc.name,
        position: Cesium.Cartesian3.fromDegrees(loc.longitude, loc.latitude, 500),
        point: {
          pixelSize: isSelected ? 16 : 12,
          color: Cesium.Color.fromCssColorString(isSelected ? '#f59e0b' : '#00e5ff'),
          outlineColor: Cesium.Color.fromCssColorString('#030712'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `${loc.name.split(' - ')[0]}\n(${loc.district})`,
          font: '11px "JetBrains Mono", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2.5,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      markersRef.current.push(entity);
    });

    // Add Interactive Regional Callout Pin matching reference UI: "India - Explore Region >"
    const callout = viewer.entities.add({
      id: 'india-regional-callout-pin',
      name: 'India - National Digital Twin Center',
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 1200),
      label: {
        text: `📍 ${selectedLocation.name.split(' - ')[0]} • Explore Region >`,
        font: 'bold 12px sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString('#e0f2fe'),
        outlineColor: Cesium.Color.fromCssColorString('#0284c7'),
        outlineWidth: 3,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#082f49').withAlpha(0.85),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    calloutEntityRef.current = callout;

    // Add Scientific ~300 km Gaussian Smoothing Footprint Ellipse Entity
    const footprint = viewer.entities.add({
      id: 'spatial-footprint-300km',
      name: `Illustrative ~300 km Spatial Smoothing Footprint (${selectedLocation.name})`,
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude),
      ellipse: {
        semiMajorAxis: 300000.0, // 300 km radius in meters
        semiMinorAxis: 300000.0,
        height: 500.0,
        material: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.12),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.75),
        outlineWidth: 2
      },
      label: {
        text: `Illustrative ~300 km Footprint\nNominal Envelope ~282,743 km²\n(Non-Discrete Radial Response)`,
        font: '10px "JetBrains Mono", monospace',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        fillColor: Cesium.Color.fromCssColorString('#00e5ff'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    footprintEntityRef.current = footprint;

    // Initial Camera Flight to Pan-India Orbital View
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 900000),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-80.0),
        roll: 0.0
      },
      duration: 1.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });

    // Setup ScreenSpaceEventHandler for Mouse Hover and Left Click
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    // Real-Time Cursor Coordinates HUD Readout
    handler.setInputAction((movement: any) => {
      if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
      const ray = viewer.camera.getPickRay(movement.endPosition);
      if (ray) {
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          setMouseCoords({
            lat: Cesium.Math.toDegrees(cartographic.latitude),
            lon: Cesium.Math.toDegrees(cartographic.longitude),
            height: Math.round(cartographic.height)
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Interactive Object Picking on Globe (Entity Locus or GeoJSON Basin)
    handler.setInputAction((click: any) => {
      if (!viewerRef.current || viewerRef.current.isDestroyed()) return;
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        // Direct marker entity clicked
        const pickedId = pickedObject.id.id || pickedObject.id;
        const matchedLoc = INDIA_LOCATIONS.find(l => l.id === pickedId);
        if (matchedLoc) {
          setSelectedLocation(matchedLoc);
          return;
        }

        // GeoJSON basin feature clicked
        if (pickedObject.id.properties) {
          const basinLocusId = pickedObject.id.properties.id?.getValue();
          const matchedBasinLoc = INDIA_LOCATIONS.find(l => l.id === basinLocusId);
          if (matchedBasinLoc) {
            setSelectedLocation(matchedBasinLoc);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Clean Component Lifecycle Cleanup
    return () => {
      isSubscribed = false;
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (basinDataSourceRef.current && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.dataSources.remove(basinDataSourceRef.current, true);
        basinDataSourceRef.current = null;
      }
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Synchronize Cesium Clock & Solar Lighting when Time Slider changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const timeLabel = TIME_STEPS[currentTimeIndex] || '2024-05';
    const match = timeLabel.match(/^(\d{4})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const simDate = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(simDate);
    }
  }, [currentTimeIndex]);

  // Synchronize Camera, Markers, Footprint, and Callout Pin when selectedLocation changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Smooth Camera Transition to Active Locus
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 450000),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-72.0),
        roll: 0.0
      },
      duration: 1.8,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });

    // Update marker styling and selection highlight
    markersRef.current.forEach((entity) => {
      if (entity.point) {
        const isSelected = entity.id === selectedLocation.id;
        entity.point.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(isSelected ? '#f59e0b' : '#00e5ff')
        );
        entity.point.pixelSize = new Cesium.ConstantProperty(isSelected ? 16 : 12);
      }
    });

    // Update Scientific Footprint Entity Position & Label
    if (footprintEntityRef.current) {
      footprintEntityRef.current.position = new Cesium.ConstantPositionProperty(
        Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude)
      );
      if (footprintEntityRef.current.label) {
        footprintEntityRef.current.label.text = new Cesium.ConstantProperty(
          `~300 km GRACE Footprint\n${selectedLocation.district} (${selectedLocation.state})\nArea: ~282,743 km²`
        );
      }
    }

    // Update Callout Entity Position & Text
    if (calloutEntityRef.current) {
      calloutEntityRef.current.position = new Cesium.ConstantPositionProperty(
        Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 1200)
      );
      if (calloutEntityRef.current.label) {
        calloutEntityRef.current.label.text = new Cesium.ConstantProperty(
          `📍 ${selectedLocation.name.split(' - ')[0]} • Explore Region >`
        );
      }
    }
  }, [selectedLocation]);

  // Toggle ~300 km Footprint Visibility
  useEffect(() => {
    if (footprintEntityRef.current) {
      footprintEntityRef.current.show = showFootprint;
    }
  }, [showFootprint]);

  // Toggle Geological Basins Visibility
  useEffect(() => {
    if (basinDataSourceRef.current) {
      basinDataSourceRef.current.show = showBasins;
    }
  }, [showBasins]);

  // Imagery Layer Switcher (Satellite vs OSM)
  const toggleImagery = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const layers = viewer.imageryLayers;
    layers.removeAll();

    if (imageryMode === 'satellite') {
      const osmProvider = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://tile.openstreetmap.org/'
      });
      layers.addImageryProvider(osmProvider);
      setImageryMode('osm');
    } else {
      const satLayer = createSatelliteImageryLayer();
      layers.add(satLayer);
      setImageryMode('satellite');
    }
  }, [imageryMode]);

  // Camera Controls
  const handleZoomIn = () => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      const height = viewer.camera.positionCartographic.height;
      viewer.camera.zoomIn(height * 0.35);
    }
  };

  const handleZoomOut = () => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      const height = viewer.camera.positionCartographic.height;
      viewer.camera.zoomOut(height * 0.35);
    }
  };

  const handleResetPanIndia = () => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 5800000),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-88.0),
          roll: 0.0
        },
        duration: 1.8,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    }
  };

  const handleResetCompassNorth = () => {
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: viewer.camera.position,
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: viewer.camera.pitch,
          roll: 0.0
        },
        duration: 0.8
      });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030712] select-none">
      {/* 3D Cesium Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Top-Left: Map Overlay Status & Provenance Card */}
      <div className="absolute top-4 left-4 bg-slate-950/85 border border-slate-800/90 rounded-xl p-3 backdrop-blur z-10 shadow-2xl max-w-xs text-xs flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold">
            <GlobeIcon className="w-3.5 h-3.5" />
            <span>CESIUMJS 4D DIGITAL TWIN</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            AUTHENTIC
          </span>
        </div>

        <div className="flex flex-col gap-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Base Imagery:
            </span>
            <span className="font-mono text-cyan-300 text-[10px]">
              {imageryMode === 'satellite' ? 'Esri World Imagery (ArcGIS Terms)' : 'OpenStreetMap (ODbL)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Active Locus:
            </span>
            <span className="font-mono text-amber-300 text-[10px] font-semibold">
              {selectedLocation.name.split(' - ')[0]}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              GRACE Footprint:
            </span>
            <span className="font-mono text-purple-300 text-[10px]">~300 km Illustrative Envelope</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Terrain Surface:
            </span>
            <span className="font-mono text-slate-400 text-[10px]">WGS84 Ellipsoid (Flat)</span>
          </div>
        </div>

        {/* Layer Quick Toggles */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setShowFootprint(!showFootprint)}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-all ${
              showFootprint
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Toggle illustrative ~300 km Gaussian smoothing footprint disc"
          >
            <Activity className="w-3 h-3" />
            Footprint Disc
          </button>

          <button
            onClick={() => setShowBasins(!showBasins)}
            className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-all ${
              showBasins
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Toggle Geological Basin GeoJSON boundaries (Demonstration/Approximations)"
          >
            <Layers className="w-3 h-3" />
            Basin Outlines
          </button>

          <button
            onClick={toggleImagery}
            className="px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-300 transition-all"
            title="Toggle between Satellite and OpenStreetMap base imagery"
          >
            <Satellite className="w-3 h-3 text-cyan-400" />
            Map Mode
          </button>
        </div>
      </div>

      {/* Real-Time Coordinate HUD (Positioned cleanly above bottom timeline deck) */}
      <div className="absolute bottom-16 left-20 bg-slate-950/85 border border-slate-800 rounded-lg px-3 py-1 font-mono text-xs text-slate-300 backdrop-blur z-10 flex items-center gap-2.5 shadow-xl pointer-events-none">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400">COORDINATES:</span>
        </div>
        {mouseCoords ? (
          <span className="text-cyan-300 font-semibold text-[11px]">
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lon.toFixed(4)}°E ({mouseCoords.height}m ASL)
          </span>
        ) : (
          <span className="text-slate-500 text-[11px]">Hover cursor over globe</span>
        )}
      </div>

      {/* Bottom-Right: High-Precision Camera Navigation Deck (Matching Reference UI) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-10 bg-slate-950/85 border border-slate-800/90 p-1.5 rounded-xl backdrop-blur shadow-2xl">
        <button
          onClick={handleResetCompassNorth}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Orient Compass North (Heading 0°)"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={handleResetPanIndia}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
          title="Reset to All-India Orbital Overview"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

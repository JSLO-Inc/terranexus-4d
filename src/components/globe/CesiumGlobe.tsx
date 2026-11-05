import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { INDIAN_STUDY_BASINS_GEOJSON } from '../../data/indiaGeologicalBasins';
import { NATIONWIDE_HIERARCHICAL_LABELS } from '../../data/nationwideLabels';
import { reverseGeocodeMapClick } from '../../services/locationResolver';
import { AVAILABLE_HYDRO_HEATMAP_LAYERS } from '../hydro/HeatmapLayerSelector';
import { getCartoRasterTileUrl, CARTO_ATTRIBUTION } from '../../services/cartoBasemapService';
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
  Activity,
  MapPin,
  Target,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Check
} from 'lucide-react';

/**
 * Generates Cartesian3 positions for a circle clamped to ground/terrain
 * Eliminates Cesium geometry outline warnings on terrain
 */
function generateCirclePositions(centerLon: number, centerLat: number, radiusMeters: number, points: number = 64): Cesium.Cartesian3[] {
  const positions: Cesium.Cartesian3[] = [];
  const radiusDegLat = radiusMeters / 111320;
  const radiusDegLon = radiusMeters / (111320 * Math.max(0.1, Math.cos((centerLat * Math.PI) / 180)));
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = centerLat + radiusDegLat * Math.sin(angle);
    const lon = centerLon + radiusDegLon * Math.cos(angle);
    positions.push(Cesium.Cartesian3.fromDegrees(lon, lat));
  }
  return positions;
}

/**
 * Calculates thematic color for gridded scientific heatmaps
 */
function getHeatmapColor(
  layerId: string,
  value: number,
  minScale: number,
  maxScale: number,
  opacity: number
): Cesium.Color {
  const norm = Math.max(0, Math.min(1, (value - minScale) / (maxScale - minScale || 1)));
  if (layerId === 'layer-grace-twsa') {
    // Diverging: negative (red/orange) -> 0 (pale white) -> positive (cyan/blue)
    const zeroNorm = (0 - minScale) / (maxScale - minScale);
    if (norm < zeroNorm) {
      const t = norm / (zeroNorm || 0.001);
      const r = 239;
      const g = Math.round(68 + t * (240 - 68));
      const b = Math.round(68 + t * (240 - 68));
      return Cesium.Color.fromBytes(r, g, b, Math.round(opacity * 200));
    } else {
      const t = (norm - zeroNorm) / (1 - zeroNorm || 0.001);
      const r = Math.round(240 - t * 240);
      const g = Math.round(240 - t * (240 - 180));
      const b = 255;
      return Cesium.Color.fromBytes(r, g, b, Math.round(opacity * 200));
    }
  } else if (layerId === 'layer-groundwater-depth' || layerId === 'layer-water-quality-tds') {
    // Green (low/good) -> Yellow (mid) -> Red (high/critical)
    let r = 0, g = 0, b = 0;
    if (norm < 0.5) {
      const t = norm / 0.5;
      r = Math.round(16 + t * (245 - 16));
      g = Math.round(185 + t * (158 - 185));
      b = Math.round(129 - t * 100);
    } else {
      const t = (norm - 0.5) / 0.5;
      r = Math.round(245 + t * (239 - 245));
      g = Math.round(158 - t * 110);
      b = Math.round(29 - t * 29);
    }
    return Cesium.Color.fromBytes(r, g, b, Math.round(opacity * 200));
  } else {
    // Sequential Blue (Rainfall, Recharge)
    const r = Math.round(186 - norm * (186 - 14));
    const g = Math.round(230 - norm * (230 - 116));
    const b = Math.round(253 - norm * (253 - 144));
    return Cesium.Color.fromBytes(r, g, b, Math.round(opacity * 200));
  }
}

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
 * Safely attach error event recovery to imagery provider to handle CDN 429 throttling
 */
function attachImageryErrorRecovery(layer: Cesium.ImageryLayer): Cesium.ImageryLayer {
  const provider = layer.imageryProvider;
  if (provider && provider.errorEvent) {
    provider.errorEvent.addEventListener((event: any) => {
      if (event && typeof event.retry === 'boolean') {
        if (event.timesRetried < 2) {
          event.retry = true;
        } else {
          event.retry = false;
        }
      }
    });
  }
  return layer;
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

  const layer = new Cesium.ImageryLayer(provider, {
    brightness: 1.08,
    contrast: 1.12,
    gamma: 1.0
  });

  return attachImageryErrorRecovery(layer);
}

/**
 * Creates high-fidelity imagery layer based on selected basemap mode
 * Supports CARTO Dark Matter, Voyager, Positron, Esri Satellite, and Topo Shaded Relief
 */
function createBasemapLayer(mode: string): Cesium.ImageryLayer {
  if (mode === 'terrain') {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      credit: new Cesium.Credit('Esri, USGS, NOAA')
    });
    return attachImageryErrorRecovery(new Cesium.ImageryLayer(provider, { brightness: 1.05, contrast: 1.18 }));
  } else if (mode === 'carto' || mode === 'dark-matter') {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: getCartoRasterTileUrl('dark-matter'),
      subdomains: ['a', 'b', 'c', 'd'],
      credit: new Cesium.Credit(CARTO_ATTRIBUTION.plainText)
    });
    return attachImageryErrorRecovery(new Cesium.ImageryLayer(provider, { brightness: 1.05, contrast: 1.25 }));
  } else if (mode === 'voyager') {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: getCartoRasterTileUrl('voyager'),
      subdomains: ['a', 'b', 'c', 'd'],
      credit: new Cesium.Credit(CARTO_ATTRIBUTION.plainText)
    });
    return attachImageryErrorRecovery(new Cesium.ImageryLayer(provider, { brightness: 1.05, contrast: 1.15 }));
  } else if (mode === 'positron') {
    const provider = new Cesium.UrlTemplateImageryProvider({
      url: getCartoRasterTileUrl('positron'),
      subdomains: ['a', 'b', 'c', 'd'],
      credit: new Cesium.Credit(CARTO_ATTRIBUTION.plainText)
    });
    return attachImageryErrorRecovery(new Cesium.ImageryLayer(provider, { brightness: 1.05, contrast: 1.15 }));
  } else {
    // Default: High-Resolution Satellite
    return createSatelliteImageryLayer();
  }
}

const MIN_CONTAINER_SIZE = 50;

/**
 * Defensive check verifying an HTML element is connected, visible, and has measurable dimensions >= 50px.
 */
function isElementMeasurable(el: HTMLElement | null): boolean {
  if (!el || !el.isConnected) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width < MIN_CONTAINER_SIZE || rect.height < MIN_CONTAINER_SIZE) return false;
  if (el.clientWidth < MIN_CONTAINER_SIZE || el.clientHeight < MIN_CONTAINER_SIZE) return false;
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  } catch {
    // getComputedStyle safe fallback in synthetic test environments
  }
  return true;
}

/**
 * Verifies that Cesium viewer, container, and WebGL drawing canvas are fully measurable and ready to render.
 */
function isViewerRenderable(viewer: Cesium.Viewer | null, container: HTMLElement | null): boolean {
  if (!viewer || viewer.isDestroyed() || !container) return false;
  if (!isElementMeasurable(container)) return false;
  const canvas = viewer.canvas;
  if (!canvas || !canvas.isConnected) return false;
  const cRect = canvas.getBoundingClientRect();
  if (cRect.width < MIN_CONTAINER_SIZE || cRect.height < MIN_CONTAINER_SIZE) return false;
  if (canvas.clientWidth < MIN_CONTAINER_SIZE || canvas.clientHeight < MIN_CONTAINER_SIZE) return false;
  return true;
}

export const CesiumGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markersRef = useRef<Cesium.Entity[]>([]);
  const footprintEntityRef = useRef<Cesium.Entity | null>(null);
  const cutawayFootprintRef = useRef<Cesium.Entity | null>(null);
  const calloutEntityRef = useRef<Cesium.Entity | null>(null);
  const basinDataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  const selectedPinEntityRef = useRef<Cesium.Entity | null>(null);
  const areaAnalysisCircleRef = useRef<Cesium.Entity | null>(null);
  const heatmapEntitiesRef = useRef<Cesium.Entity[]>([]);
  const labelEntitiesRef = useRef<Cesium.Entity[]>([]);
  const resumeRenderLoopRef = useRef<(() => void) | null>(null);
  const handleContextLostRef = useRef<((e: Event) => void) | null>(null);
  const handleContextRestoredRef = useRef<(() => void) | null>(null);

  const {
    selectedLocation,
    setSelectedLocation,
    currentTimeIndex,
    layers,
    heatmapConfig,
    setHeatmapConfig,
    isAreaAnalysisOpen,
    explorationExtentKm,
    viewMode,
    globeBasemap,
    setGlobeBasemap
  } = useTerranexusStore();

  const isFirstMountRef = useRef<boolean>(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number; height: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [basemapMode, setBasemapMode] = useState<string>(globeBasemap || 'satellite');
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);
  const [showLayersMenu, setShowLayersMenu] = useState<boolean>(false);
  const [showFootprint, setShowFootprint] = useState<boolean>(false);
  const [showBasins, setShowBasins] = useState<boolean>(true);
  const [showNationwideLabels, setShowNationwideLabels] = useState<boolean>(true);
  const [hasRenderError, setHasRenderError] = useState<boolean>(false);
  const [viewerKey, setViewerKey] = useState<number>(0);
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const basemapMenuRef = useRef<HTMLDivElement>(null);
  const layersMenuRef = useRef<HTMLDivElement>(null);

  // Close popup menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (basemapMenuRef.current && !basemapMenuRef.current.contains(e.target as Node)) {
        setShowBasemapMenu(false);
      }
      if (layersMenuRef.current && !layersMenuRef.current.contains(e.target as Node)) {
        setShowLayersMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Cesium Viewer with high-performance official settings
  useEffect(() => {
    if (!containerRef.current) return;

    let isSubscribed = true;
    let isInitializing = false;
    let renderFrameId: number | null = null;
    let initFrameId: number | null = null;
    let resizeFrameId: number | null = null;

    // Cesium's default loop calls resize internally. During React/CSS layout
    // transitions that can happen after a size check but before Cesium renders,
    // which is the source of the zero-width framebuffer error. Keep ownership
    // of rendering here so both resize and render share the same size gate.
    const renderWhenReady = () => {
      const viewer = viewerRef.current;
      const container = containerRef.current;
      if (!isSubscribed || !viewer || viewer.isDestroyed() || !container) {
        renderFrameId = null;
        return;
      }

      const isGlobeVisible = viewModeRef.current === 'globe' || viewModeRef.current === 'split';
      if (!isGlobeVisible) {
        // Decouple & pause RAF loop while globe is hidden to eliminate CPU/GPU consumption
        renderFrameId = null;
        return;
      }

      if (container.clientWidth >= 50 && container.clientHeight >= 50 && isViewerRenderable(viewer, container)) {
        try {
          viewer.render();
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.warn('[Cesium] Render skipped during a viewport transition:', msg);
          if (!msg.includes('width') && !msg.includes('height') && !msg.includes('0')) {
            setHasRenderError(true);
            renderFrameId = null;
            return;
          }
        }
      }
      renderFrameId = requestAnimationFrame(renderWhenReady);
    };

    resumeRenderLoopRef.current = () => {
      if (!renderFrameId && isSubscribed) {
        renderFrameId = requestAnimationFrame(renderWhenReady);
      }
    };

    const initViewer = () => {
      if (!isSubscribed || isInitializing || !containerRef.current || viewerRef.current) return;

      const clientW = containerRef.current.clientWidth;
      const clientH = containerRef.current.clientHeight;

      // STRICT ZERO-WIDTH GUARD: Never initialize Cesium Viewer on a 0-dimension container
      if (clientW < 50 || clientH < 50 || !isElementMeasurable(containerRef.current)) {
        return;
      }

      isInitializing = true;

      // Optional Cesium Ion token configuration
      const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
      if (token && typeof token === 'string' && token.trim().length > 15) {
        Cesium.Ion.defaultAccessToken = token.trim();
      }

      // Initialize Viewer with High-Resolution Satellite Imagery as default (or active preference)
      const baseImageryLayer = createBasemapLayer(globeBasemap || 'satellite');

      const viewer = new Cesium.Viewer(containerRef.current, {
        // Do not let Cesium resize/render asynchronously outside our dimension
        // checks. renderWhenReady below drives the scene only when safe.
        useDefaultRenderLoop: false,
        requestRenderMode: true,
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
        showRenderLoopErrors: false, // CRITICAL: Suppress Cesium default error popup
        contextOptions: {
          webgl: {
            preserveDrawingBuffer: true
          }
        },
        baseLayer: baseImageryLayer
      });

      viewerRef.current = viewer;

      if (viewer.scene?.globe) {
        viewer.scene.globe.tileCacheSize = 250;
        viewer.scene.globe.loadingDescendantLimit = 16;
        viewer.scene.globe.maximumScreenSpaceError = 2.0;
      }

      // WebGL Context Loss & Restoration Handlers (QA-03)
      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.warn('[Cesium WebGL] Context lost event intercepted. Preventing default termination.');
        if (viewerRef.current?.cesiumWidget) {
          (viewerRef.current.cesiumWidget as any)._canRender = false;
        }
      };

      const handleContextRestored = () => {
        console.info('[Cesium WebGL] Context restored. Re-enabling rendering pipeline.');
        if (viewerRef.current?.cesiumWidget) {
          (viewerRef.current.cesiumWidget as any)._canRender = true;
        }
        viewerRef.current?.scene?.requestRender();
      };

      handleContextLostRef.current = handleContextLost;
      handleContextRestoredRef.current = handleContextRestored;

      viewer.canvas.addEventListener('webglcontextlost', handleContextLost, false);
      viewer.canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

      // DEFENSIVE SIZING ARCHITECTURE:
      // Intercept cesiumWidget.resize so internal postUpdate never zeroes canvas.width during layout reflows or transitions
      const widget = viewer.cesiumWidget;
      if (widget) {
        const originalWidgetResize = widget.resize.bind(widget);
        widget.resize = function() {
          const canvas = widget.canvas;
          const container = widget.container;
          if (
            !canvas ||
            !container ||
            canvas.clientWidth < MIN_CONTAINER_SIZE ||
            canvas.clientHeight < MIN_CONTAINER_SIZE ||
            container.clientWidth < MIN_CONTAINER_SIZE ||
            container.clientHeight < MIN_CONTAINER_SIZE
          ) {
            (widget as any)._canRender = false;
            return;
          }
          originalWidgetResize();
        };
      }

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

      globe.enableLighting = false; // Keeps high-resolution satellite imagery true-color and crisp across all latitudes
      globe.showGroundAtmosphere = true; // Atmosphere glow around Earth limb
      globe.atmosphereLightIntensity = 10.0;
      globe.depthTestAgainstTerrain = false; // Prevents markers from clipping
      globe.baseColor = Cesium.Color.fromCssColorString('#030712');
      scene.backgroundColor = Cesium.Color.fromCssColorString('#030712');

      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = true;
        scene.skyAtmosphere.brightnessShift = 0.1;
        scene.skyAtmosphere.saturationShift = 0.15;
      }

      // Prevent uncaught DeveloperError during 0-width layout transitions
      scene.rethrowRenderErrors = false;

      // Intercept and handle transient resize / render errors gracefully
      scene.renderError.addEventListener((_sc, error) => {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn('[Cesium RenderError Intercepted]:', msg);
        if (msg.includes('width') || msg.includes('height') || msg.includes('0')) {
          const w = viewerRef.current?.cesiumWidget;
          if (w) {
            (w as any)._canRender = false;
          }
          return;
        }
        setHasRenderError(true);
      });

      // Attempt safe terrain provider initialization asynchronously
      createSafeTerrainProvider().then(terrainProvider => {
        if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.terrainProvider = terrainProvider;
        }
      });

    // Ingest Official 25 CWC / India-WRIS River Basins via Cesium.GeoJsonDataSource (GEO-03)
    Cesium.GeoJsonDataSource.load('/data/cwc_basins.geojson', {
      stroke: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
      fill: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.08),
      strokeWidth: 2,
      clampToGround: true
    }).then(dataSource => {
      if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
        basinDataSourceRef.current = dataSource;
        viewerRef.current.dataSources.add(dataSource);
        
        // Scientific Thematic Palette across all 25 CWC River Basins
        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          if (entity.polygon) {
            const hue = (i * 14.4) % 360;
            const basinColor = Cesium.Color.fromHsl(hue / 360, 0.75, 0.45, 0.12);
            const outlineColor = Cesium.Color.fromHsl(hue / 360, 0.85, 0.65, 0.85);
            entity.polygon.material = new Cesium.ColorMaterialProperty(basinColor);
            entity.polygon.outline = new Cesium.ConstantProperty(true);
            entity.polygon.outlineColor = new Cesium.ConstantProperty(outlineColor);
            entity.polygon.outlineWidth = new Cesium.ConstantProperty(2);
            entity.polygon.heightReference = new Cesium.ConstantProperty(Cesium.HeightReference.CLAMP_TO_GROUND);
            entity.polygon.classificationType = new Cesium.ConstantProperty(Cesium.ClassificationType.TERRAIN);
          }
        }
      }
    }).catch(err => {
      console.warn('[GeoJsonDataSource] Official CWC Basins fetch failed, falling back to local study basins:', err);
      if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
        Cesium.GeoJsonDataSource.load(INDIAN_STUDY_BASINS_GEOJSON, {
          stroke: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.65),
          fill: Cesium.Color.fromCssColorString('#00e5ff').withAlpha(0.08),
          strokeWidth: 2,
          clampToGround: true
        }).then(fallbackSource => {
          if (isSubscribed && viewerRef.current && !viewerRef.current.isDestroyed()) {
            basinDataSourceRef.current = fallbackSource;
            viewerRef.current.dataSources.add(fallbackSource);
          }
        });
      }
    });

    // Ingest Nationwide Hierarchical Place Labels (States, Cities, Districts, Field Stations)
    labelEntitiesRef.current = [];
    NATIONWIDE_HIERARCHICAL_LABELS.forEach((lbl) => {
      const color = lbl.type === 'STATE'
        ? Cesium.Color.fromCssColorString('#38bdf8') // Sky blue
        : lbl.type === 'CITY'
        ? Cesium.Color.fromCssColorString('#facc15') // Amber/Yellow
        : lbl.type === 'TOWN'
        ? Cesium.Color.fromCssColorString('#34d399') // Emerald
        : Cesium.Color.fromCssColorString('#a78bfa'); // Purple

      const ent = viewer.entities.add({
        id: `geo-lbl-${lbl.id}`,
        name: lbl.name,
        position: Cesium.Cartesian3.fromDegrees(lbl.longitude, lbl.latitude, 200),
        point: {
          pixelSize: lbl.type === 'STATE' ? 6 : lbl.type === 'CITY' ? 5 : 4,
          color: color.withAlpha(0.85),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 1.5,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(lbl.minAltitudeMeters, lbl.maxAltitudeMeters),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: lbl.name,
          font: lbl.type === 'STATE'
            ? 'bold 11px "JetBrains Mono", sans-serif'
            : lbl.type === 'CITY'
            ? 'bold 11px sans-serif'
            : '10px "JetBrains Mono", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2.5,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -6),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(lbl.minAltitudeMeters, lbl.maxAltitudeMeters),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      labelEntitiesRef.current.push(ent);
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
          pixelSize: isSelected ? 14 : 8,
          color: Cesium.Color.fromCssColorString(isSelected ? '#f59e0b' : '#38bdf8'),
          outlineColor: Cesium.Color.fromCssColorString('#020617'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: isSelected
            ? `${loc.name.split(' - ')[0]}  |  ${loc.district}`
            : loc.name.split(' - ')[0],
          font: isSelected ? 'bold 12px "JetBrains Mono", sans-serif' : '10px "JetBrains Mono", sans-serif',
          style: isSelected ? Cesium.LabelStyle.FILL : Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString(isSelected ? '#f8fafc' : '#94a3b8'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          showBackground: isSelected,
          backgroundColor: Cesium.Color.fromCssColorString('#020617').withAlpha(0.92),
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, isSelected ? -22 : -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      markersRef.current.push(entity);
    });

    // Dedicated callout reference - hidden by default to avoid duplicate overlapping text with unified pin badge
    const callout = viewer.entities.add({
      id: 'india-regional-callout-pin',
      name: 'India - National Digital Twin Center',
      show: false,
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 1200)
    });
    calloutEntityRef.current = callout;

    // Scientific ~300 km Gaussian Smoothing Footprint (Zero cyan wash, subtle boundary stroke, center label suppressed to prevent collision)
    const footprint = viewer.entities.add({
      id: 'spatial-footprint-300km',
      name: `Illustrative ~300 km Spatial Smoothing Footprint (${selectedLocation.name})`,
      show: showFootprint,
      position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude),
      ellipse: {
        semiMajorAxis: 300000.0, // 300 km radius in meters
        semiMinorAxis: 300000.0,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        classificationType: Cesium.ClassificationType.TERRAIN,
        material: Cesium.Color.TRANSPARENT,
        outline: false
      },
      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return generateCirclePositions(selectedLocation.longitude, selectedLocation.latitude, 300000.0);
        }, false),
        clampToGround: true,
        width: 1.5,
        material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.4)
      }
    });
    footprintEntityRef.current = footprint;

    // Initial Camera Setup: Optimised Earth view showing true planetary curvature and the subcontinent
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude - 8.0, 3800000),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-62.0),
        roll: 0.0
      }
    });

    // Smooth orbital transition into the selected regional locus on initial load
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 650000),
      orientation: {
        heading: Cesium.Math.toRadians(0.0),
        pitch: Cesium.Math.toRadians(-72.0),
        roll: 0.0
      },
      duration: 2.4,
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

    // Interactive Object Picking on Globe (Entity Locus, GeoJSON Basin, Geo-Label, or Map Click)
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
            return;
          }
        }

        // Hierarchical geo-label clicked
        if (typeof pickedId === 'string' && pickedId.startsWith('geo-lbl-')) {
          const rawId = pickedId.replace('geo-lbl-', '');
          const matchedLabel = NATIONWIDE_HIERARCHICAL_LABELS.find(lbl => lbl.id === rawId);
          if (matchedLabel) {
            reverseGeocodeMapClick(matchedLabel.latitude, matchedLabel.longitude).then(resolved => {
              if (resolved) {
                setSelectedLocation(resolved);
              }
            });
            return;
          }
        }
      }

      // Universal Click-to-Inspect anywhere on Indian globe territory
      const ray = viewer.camera.getPickRay(click.position);
      if (ray) {
        const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const clickLat = Cesium.Math.toDegrees(cartographic.latitude);
          const clickLon = Cesium.Math.toDegrees(cartographic.longitude);
          // Check if coordinate is strictly within India territory bounds (Lat 6.0–38.0°N, Lon 67.0–98.0°E)
          if (clickLat >= 6.0 && clickLat <= 38.0 && clickLon >= 67.0 && clickLon <= 98.0) {
            reverseGeocodeMapClick(clickLat, clickLon).then(resolved => {
              if (resolved) {
                setSelectedLocation(resolved);
              }
            });
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    renderWhenReady();
    };

    // Safe resize executor with dimension verification
    const performSafeResize = () => {
      const viewer = viewerRef.current;
      const container = containerRef.current;
      if (!isSubscribed || !viewer || viewer.isDestroyed() || !container) return;

      if (!isElementMeasurable(container)) {
        if (viewer.cesiumWidget) {
          (viewer.cesiumWidget as any)._canRender = false;
        }
        return;
      }

      const canvas = viewer.canvas;
      if (!canvas || canvas.clientWidth < MIN_CONTAINER_SIZE || canvas.clientHeight < MIN_CONTAINER_SIZE) {
        if (viewer.cesiumWidget) {
          (viewer.cesiumWidget as any)._canRender = false;
        }
        return;
      }

      try {
        viewer.resize();
        if (viewer.cesiumWidget) {
          (viewer.cesiumWidget as any)._canRender = true;
        }
        viewer.scene.requestRender();
      } catch (err) {
        console.warn('[Cesium] Safe resize skipped during layout shift:', err);
      }
    };

    // Responsive Canvas Resize Observer (Prevents 0-width DeveloperError)
    const handleResize = () => {
      if (!isSubscribed) return;
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
      }
      resizeFrameId = requestAnimationFrame(() => {
        resizeFrameId = null;
        if (!isSubscribed) return;

        // If viewer is not yet created and container became measurable, initialize it
        if (!viewerRef.current && !isInitializing) {
          if (containerRef.current && isElementMeasurable(containerRef.current)) {
            initViewer();
          }
          return;
        }

        const w = containerRef.current?.clientWidth ?? 0;
        const h = containerRef.current?.clientHeight ?? 0;
        if (w > 50 && h > 50) {
          performSafeResize();
        }
      });
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(containerRef.current);

    // Passive window resize listener as robust fallback
    const onWindowResize = () => {
      handleResize();
    };
    window.addEventListener('resize', onWindowResize, { passive: true });

    // Defer construction until the browser has committed the surrounding
    // flex/grid layout; a non-zero measurement in the same React commit is
    // otherwise not enough to guarantee Cesium receives a usable canvas.
    if (isElementMeasurable(containerRef.current)) {
      initFrameId = requestAnimationFrame(initViewer);
    }

    // Clean Component Lifecycle Cleanup
    return () => {
      isSubscribed = false;
      isInitializing = false;
      resumeRenderLoopRef.current = null;
      window.removeEventListener('resize', onWindowResize);
      if (initFrameId !== null) {
        cancelAnimationFrame(initFrameId);
        initFrameId = null;
      }
      if (renderFrameId !== null) {
        cancelAnimationFrame(renderFrameId);
        renderFrameId = null;
      }
      if (resizeFrameId !== null) {
        cancelAnimationFrame(resizeFrameId);
        resizeFrameId = null;
      }
      ro.disconnect();
      if (handlerRef.current && !handlerRef.current.isDestroyed()) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (basinDataSourceRef.current && viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.dataSources.remove(basinDataSourceRef.current, true);
        basinDataSourceRef.current = null;
      }
      heatmapEntitiesRef.current.forEach(e => {
        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.entities.remove(e);
        }
      });
      heatmapEntitiesRef.current = [];
      labelEntitiesRef.current = [];
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        if (viewerRef.current.canvas) {
          if (handleContextLostRef.current) viewerRef.current.canvas.removeEventListener('webglcontextlost', handleContextLostRef.current, false);
          if (handleContextRestoredRef.current) viewerRef.current.canvas.removeEventListener('webglcontextrestored', handleContextRestoredRef.current, false);
        }
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [viewerKey]);

  // Mode Transition Handler: Restore on visible (Globe vs Split vs Cutaway)
  useEffect(() => {
    viewModeRef.current = viewMode;
    const isGlobeVisible = viewMode === 'globe' || viewMode === 'split';
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (!isGlobeVisible) {
      if (viewer.cesiumWidget) {
        (viewer.cesiumWidget as any)._canRender = false;
      }
      return;
    }

    // Globe became visible again: resume render loop and refresh viewport
    resumeRenderLoopRef.current?.();

    // Wait for layout commit, then verify dimensions, resize safely, and request render
    const frameId = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!viewer || viewer.isDestroyed() || !container) return;

      if (isViewerRenderable(viewer, container)) {
        try {
          viewer.resize();
          if (viewer.cesiumWidget) {
            (viewer.cesiumWidget as any)._canRender = true;
          }
          viewer.scene.requestRender();
        } catch (err) {
          console.warn('[Cesium] Restore on visible resize skipped:', err);
        }
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [viewMode]);

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

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
    } else {
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
    }

    // Update marker styling and selection highlight
    const isStandardLocus = INDIA_LOCATIONS.some(l => l.id === selectedLocation.id);
    markersRef.current.forEach((entity) => {
      const isSelected = entity.id === selectedLocation.id;
      if (entity.point) {
        entity.point.color = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(isSelected ? '#f59e0b' : '#38bdf8')
        );
        entity.point.pixelSize = new Cesium.ConstantProperty(isSelected ? 14 : 8);
      }
      if (entity.label) {
        const loc = INDIA_LOCATIONS.find(l => l.id === entity.id);
        const name = loc ? loc.name.split(' - ')[0] : entity.id;
        const district = loc?.district || '';
        entity.label.text = new Cesium.ConstantProperty(
          isSelected ? `${name}  |  ${district}` : name
        );
        entity.label.font = new Cesium.ConstantProperty(
          isSelected ? 'bold 12px "JetBrains Mono", sans-serif' : '10px "JetBrains Mono", sans-serif'
        );
        entity.label.fillColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString(isSelected ? '#f8fafc' : '#94a3b8')
        );
        entity.label.showBackground = new Cesium.ConstantProperty(isSelected);
        entity.label.backgroundColor = new Cesium.ConstantProperty(
          Cesium.Color.fromCssColorString('#020617').withAlpha(0.92)
        );
        entity.label.pixelOffset = new Cesium.ConstantProperty(
          new Cesium.Cartesian2(0, isSelected ? -22 : -12)
        );
      }
    });

    // If selected location is an arbitrary nationwide point (not standard 7), maintain dedicated pin
    if (!isStandardLocus) {
      if (!selectedPinEntityRef.current) {
        selectedPinEntityRef.current = viewer.entities.add({
          id: 'dynamic-selected-location-pin',
          name: selectedLocation.name,
          position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 600),
          point: {
            pixelSize: 16,
            color: Cesium.Color.fromCssColorString('#f59e0b'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: {
            text: `${selectedLocation.name.split(' - ')[0]}  |  ${selectedLocation.district || selectedLocation.state}`,
            font: 'bold 12px "JetBrains Mono", sans-serif',
            style: Cesium.LabelStyle.FILL,
            fillColor: Cesium.Color.fromCssColorString('#f8fafc'),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#020617').withAlpha(0.92),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
      } else {
        selectedPinEntityRef.current.position = new Cesium.ConstantPositionProperty(
          Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 600)
        );
        if (selectedPinEntityRef.current.label) {
          selectedPinEntityRef.current.label.text = new Cesium.ConstantProperty(
            `${selectedLocation.name.split(' - ')[0]}  |  ${selectedLocation.district || selectedLocation.state}`
          );
        }
        selectedPinEntityRef.current.show = true;
      }
    } else {
      if (selectedPinEntityRef.current) {
        selectedPinEntityRef.current.show = false;
      }
    }

    // Update Scientific Footprint Entity Position (suppress center label to prevent marker collision)
    if (footprintEntityRef.current) {
      footprintEntityRef.current.position = new Cesium.ConstantPositionProperty(
        Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude)
      );
      if (footprintEntityRef.current.label) {
        footprintEntityRef.current.label.show = new Cesium.ConstantProperty(false);
      }
    }

    // Callout entity remains hidden to prevent text collisions
    if (calloutEntityRef.current) {
      calloutEntityRef.current.show = false;
    }

    // Update 3D Subsurface Cutaway Geographic Footprint Rectangle
    const extentKm = explorationExtentKm || 5;
    const latSpan = extentKm / 111.0;
    const cosLat = Math.cos((selectedLocation.latitude * Math.PI) / 180);
    const lonSpan = extentKm / (111.0 * (Math.abs(cosLat) > 0.1 ? cosLat : 1.0));

    const minLon = selectedLocation.longitude - lonSpan / 2;
    const maxLon = selectedLocation.longitude + lonSpan / 2;
    const minLat = selectedLocation.latitude - latSpan / 2;
    const maxLat = selectedLocation.latitude + latSpan / 2;
    const rectCoords = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat);

    if (!cutawayFootprintRef.current) {
      cutawayFootprintRef.current = viewer.entities.add({
        id: 'cutaway-block-footprint',
        name: `3D Cutaway Subsurface Block Footprint (${extentKm} km × ${extentKm} km)`,
        rectangle: {
          coordinates: new Cesium.ConstantProperty(rectCoords),
          material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.20),
          outline: false,
          height: 100.0
        },
        polyline: {
          positions: new Cesium.CallbackProperty(() => {
            const ext = explorationExtentKm || 5;
            const lSpan = ext / 111.0;
            const cLat = Math.cos((selectedLocation.latitude * Math.PI) / 180);
            const lnSpan = ext / (111.0 * (Math.abs(cLat) > 0.1 ? cLat : 1.0));
            const x0 = selectedLocation.longitude - lnSpan / 2;
            const x1 = selectedLocation.longitude + lnSpan / 2;
            const y0 = selectedLocation.latitude - lSpan / 2;
            const y1 = selectedLocation.latitude + lSpan / 2;
            return Cesium.Cartesian3.fromDegreesArray([
              x0, y0,
              x1, y0,
              x1, y1,
              x0, y1,
              x0, y0
            ]);
          }, false),
          clampToGround: true,
          width: 2.5,
          material: Cesium.Color.fromCssColorString('#f59e0b').withAlpha(0.95)
        },
        label: {
          text: `3D CUTAWAY: ${extentKm} km × ${extentKm} km`,
          font: 'bold 10px "JetBrains Mono", monospace',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.fromCssColorString('#fde68a'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
    } else {
      if (cutawayFootprintRef.current.rectangle) {
        cutawayFootprintRef.current.rectangle.coordinates = new Cesium.ConstantProperty(rectCoords);
      }
      if (cutawayFootprintRef.current.label) {
        cutawayFootprintRef.current.label.text = new Cesium.ConstantProperty(`3D CUTAWAY: ${extentKm} km × ${extentKm} km`);
      }
      cutawayFootprintRef.current.show = true;
    }
  }, [selectedLocation, explorationExtentKm]);

  // Toggle Nationwide Labels Visibility
  useEffect(() => {
    labelEntitiesRef.current.forEach(entity => {
      entity.show = showNationwideLabels;
    });
  }, [showNationwideLabels]);

  // Synchronize Thematic Multi-Layer Heatmap Grid
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Clear previous raster cells
    heatmapEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    heatmapEntitiesRef.current = [];

    if (!heatmapConfig.isVisible) return;

    let isSubscribed = true;
    fetch(`/api/hydro/heatmap/grid?layerId=${heatmapConfig.layerId}&timeStep=${heatmapConfig.timeStep}`)
      .then(res => res.json())
      .then(json => {
        if (!isSubscribed || !json?.success || !json?.dataset?.cells) return;
        const dataset = json.dataset;
        const cells = dataset.cells;
        const halfDeg = 0.25;

        cells.forEach((cell: any) => {
          if (cell.value === null || cell.qualityFlag === 'NO_DATA') return;
          const color = getHeatmapColor(
            heatmapConfig.layerId,
            cell.value,
            dataset.minScale,
            dataset.maxScale,
            heatmapConfig.opacity
          );

          const cellEntity = viewer.entities.add({
            id: `heatmap-cell-${cell.latitude}-${cell.longitude}`,
            rectangle: {
              coordinates: Cesium.Rectangle.fromDegrees(
                cell.longitude - halfDeg,
                cell.latitude - halfDeg,
                cell.longitude + halfDeg,
                cell.latitude + halfDeg
              ),
              material: color,
              height: 120.0
            }
          });
          heatmapEntitiesRef.current.push(cellEntity);
        });
      })
      .catch(err => {
        console.warn('[CesiumGlobe] Heatmap raster fetch failed:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [heatmapConfig.layerId, heatmapConfig.isVisible, heatmapConfig.opacity, heatmapConfig.timeStep]);

  // Synchronize Spatial Zonal Area Analysis Circle Entity
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    if (isAreaAnalysisOpen) {
      if (!areaAnalysisCircleRef.current) {
        areaAnalysisCircleRef.current = viewer.entities.add({
          id: 'area-analysis-circle',
          name: 'Spatial Zonal Analysis Area',
          position: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude),
          ellipse: {
            semiMajorAxis: 300000.0,
            semiMinorAxis: 300000.0,
            height: 300.0,
            material: Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.20),
            outline: false
          },
          polyline: {
            positions: new Cesium.CallbackProperty(() => {
              return generateCirclePositions(selectedLocation.longitude, selectedLocation.latitude, 300000.0);
            }, false),
            clampToGround: true,
            width: 2.5,
            material: Cesium.Color.fromCssColorString('#22d3ee').withAlpha(0.9)
          },
          label: {
            text: `Spatial Zonal Analysis Envelope (300 km Radius)\nCenter: ${selectedLocation.name.split(' - ')[0]}`,
            font: '11px "JetBrains Mono", monospace',
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            fillColor: Cesium.Color.fromCssColorString('#22d3ee'),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2.5,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -25),
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          }
        });
      } else {
        areaAnalysisCircleRef.current.position = new Cesium.ConstantPositionProperty(
          Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude)
        );
        if (areaAnalysisCircleRef.current.label) {
          areaAnalysisCircleRef.current.label.text = new Cesium.ConstantProperty(
            `Spatial Zonal Analysis Envelope (300 km Radius)\nCenter: ${selectedLocation.name.split(' - ')[0]}`
          );
        }
        areaAnalysisCircleRef.current.show = true;
      }
    } else {
      if (areaAnalysisCircleRef.current) {
        areaAnalysisCircleRef.current.show = false;
      }
    }
  }, [isAreaAnalysisOpen, selectedLocation]);

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

  // Imagery Layer Switcher (Satellite, CARTO Dark Matter, Voyager, Positron, Terrain)
  const handleSwitchBasemap = useCallback((mode: string) => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const layers = viewer.imageryLayers;
    layers.removeAll();
    const newLayer = createBasemapLayer(mode);
    layers.add(newLayer);
    setBasemapMode(mode);
    setGlobeBasemap(mode as any);
    setShowBasemapMenu(false);
  }, [setGlobeBasemap]);

  // Synchronize external changes to globeBasemap (e.g., Reset to Defaults)
  useEffect(() => {
    if (globeBasemap && globeBasemap !== basemapMode) {
      handleSwitchBasemap(globeBasemap);
    }
  }, [globeBasemap, basemapMode, handleSwitchBasemap]);

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

  const handleToggleTilt = () => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    const currentPitch = Cesium.Math.toDegrees(viewer.camera.pitch);
    const targetPitch = currentPitch < -60 ? -40 : -88;
    viewer.camera.flyTo({
      destination: viewer.camera.position,
      orientation: {
        heading: viewer.camera.heading,
        pitch: Cesium.Math.toRadians(targetPitch),
        roll: 0.0
      },
      duration: 1.0,
      easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
    });
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
    <div className="relative w-full h-full overflow-hidden bg-[#020617] select-none">
      {/* 3D Cesium Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-w-[50px] min-h-[50px]" />

      {/* Zero-Width / WebGL Render Recovery Fallback Card */}
      {hasRenderError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-2xl text-center flex flex-col items-center gap-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 animate-pulse" />
            <h3 className="text-base font-semibold text-slate-100 font-mono">Globe Viewport Suspended</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The 3D Cesium viewport encountered a layout transition or zero-dimension state. The WebGL context was safely preserved.
            </p>
            <button
              onClick={() => {
                setHasRenderError(false);
                setViewerKey(k => k + 1);
              }}
              className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono rounded-lg flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Re-initialize 3D Viewport
            </button>
          </div>
        </div>
      )}

      {/* Top-Left: Minimal Locus & Attribution Pill */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 py-1.5 px-3 rounded-xl glass-panel text-xs pointer-events-none shadow-xl border border-slate-800/80">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-slate-200">{selectedLocation.name.split(' - ')[0]}</span>
        <span className="text-slate-600">•</span>
        <span className="text-[10px] font-mono text-cyan-300/90 hidden sm:inline">{selectedLocation.district}, {selectedLocation.state}</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[9px]">
          RL06 + DEM
        </span>
      </div>

      {/* Top-Right: Floating GIS Controls Dock */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-xl glass-panel shadow-2xl border border-slate-800/80">
        {/* Basemap Picker Dropdown */}
        <div className="relative" ref={basemapMenuRef}>
          <button
            onClick={() => setShowBasemapMenu(!showBasemapMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
            title="Change Basemap Imagery Layer"
          >
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize hidden md:inline">{basemapMode}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showBasemapMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-950/98 border border-slate-800 rounded-xl p-1.5 backdrop-blur-2xl shadow-2xl z-50 flex flex-col gap-1 text-xs font-mono animate-fadeIn">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-1 font-semibold">
                Basemap Imagery
              </span>
              <button
                onClick={() => handleSwitchBasemap('dark-matter')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  basemapMode === 'dark-matter' || basemapMode === 'carto'
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>CARTO Dark Matter</span>
                {(basemapMode === 'dark-matter' || basemapMode === 'carto') && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => handleSwitchBasemap('voyager')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  basemapMode === 'voyager'
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>CARTO Voyager</span>
                {basemapMode === 'voyager' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => handleSwitchBasemap('positron')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  basemapMode === 'positron'
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>CARTO Positron</span>
                {basemapMode === 'positron' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => handleSwitchBasemap('satellite')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  basemapMode === 'satellite'
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>Esri Satellite</span>
                {basemapMode === 'satellite' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              <button
                onClick={() => handleSwitchBasemap('terrain')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  basemapMode === 'terrain'
                    ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <span>Shaded Relief Topo</span>
                {basemapMode === 'terrain' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Layers & Overlays Dropdown */}
        <div className="relative" ref={layersMenuRef}>
          <button
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
            title="Toggle Geospatial Layers & Heatmaps"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Layers</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLayersMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-950/98 border border-slate-800 rounded-xl p-2 backdrop-blur-2xl shadow-2xl z-50 flex flex-col gap-1.5 text-xs font-mono animate-fadeIn">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-0.5 font-semibold">
                Geospatial Overlays
              </span>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
                <span className="text-slate-300">~300km Footprint</span>
                <input
                  type="checkbox"
                  checked={showFootprint}
                  onChange={(e) => setShowFootprint(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
                <span className="text-slate-300">CWC River Basins</span>
                <input
                  type="checkbox"
                  checked={showBasins}
                  onChange={(e) => setShowBasins(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
                <span className="text-slate-300">National Labels</span>
                <input
                  type="checkbox"
                  checked={showNationwideLabels}
                  onChange={(e) => setShowNationwideLabels(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer border-t border-slate-800/80 pt-2">
                <span className="text-purple-300">Scientific Heatmap</span>
                <input
                  type="checkbox"
                  checked={heatmapConfig.isVisible}
                  onChange={(e) => setHeatmapConfig({ isVisible: e.target.checked })}
                  className="rounded border-slate-700 text-purple-500 focus:ring-0 accent-purple-400 cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Left: Real-Time Coordinate & Telemetry HUD */}
      <div className="absolute bottom-3 left-3 z-10 glass-pill px-3 py-1 font-mono text-xs text-slate-300 flex items-center gap-2.5 shadow-xl pointer-events-none">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider text-slate-400">COORDINATES:</span>
        </div>
        {mouseCoords ? (
          <span className="text-cyan-300 font-semibold text-[11px]">
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lon.toFixed(4)}°E ({mouseCoords.height}m ASL)
          </span>
        ) : (
          <span className="text-slate-500 text-[11px]">Point cursor to read coordinates</span>
        )}
      </div>

      {/* Bottom-Right: High-Precision Camera Navigation Deck */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 z-10 glass-panel p-1 rounded-xl shadow-2xl border border-slate-800/80">
        <button
          onClick={handleResetCompassNorth}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          title="Orient Compass North (Heading 0°)"
          aria-label="Orient Compass North"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={handleToggleTilt}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer text-xs font-mono font-bold"
          title="Toggle 3D Oblique Tilt Angle (-40° / -88°)"
          aria-label="Toggle 3D Tilt"
        >
          3D
        </button>

        <button
          onClick={handleResetPanIndia}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          title="Reset to All-India Overview"
          aria-label="Reset to All-India Overview"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      {/* Persistent Basemap Licensing Attribution */}
      <div className="absolute bottom-1 right-28 z-10 text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-auto backdrop-blur-sm">
        {basemapMode === 'satellite' ? (
          <span>Imagery &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS</span>
        ) : basemapMode === 'terrain' ? (
          <span>Relief &copy; Esri, USGS, NOAA</span>
        ) : (
          <span dangerouslySetInnerHTML={{ __html: CARTO_ATTRIBUTION.html }} />
        )}
      </div>
    </div>
  );
};

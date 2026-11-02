import React, { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { Layers, Crosshair, ZoomIn, ZoomOut, Compass } from 'lucide-react';

export const CesiumGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markersRef = useRef<Cesium.Entity[]>([]);

  const {
    selectedLocation,
    setSelectedLocation,
    layers
  } = useTerranexusStore();

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Optional Cesium Ion token
    const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
    if (token) {
      Cesium.Ion.defaultAccessToken = token;
    }

    // Initialize Cesium Viewer with open base imagery
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
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/'
        })
      )
    });

    // Dark atmosphere and scientific space background
    viewer.scene.globe.enableLighting = false;
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#080c14');
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0f172a');

    // Add Indian Locations Markers
    INDIA_LOCATIONS.forEach((loc) => {
      const entity = viewer.entities.add({
        id: loc.id,
        name: loc.name,
        position: Cesium.Cartesian3.fromDegrees(loc.longitude, loc.latitude, 500),
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString('#00e5ff'),
          outlineColor: Cesium.Color.fromCssColorString('#080c14'),
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: loc.name,
          font: '11px JetBrains Mono, sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      });
      markersRef.current.push(entity);
    });

    // Fly camera initially to India
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 850000),
      duration: 1.5
    });

    // Handle mouse move for real-time coordinate readout
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
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

    // Handle click selection on globe
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.id) {
        const loc = INDIA_LOCATIONS.find(l => l.id === pickedObject.id.id);
        if (loc) {
          setSelectedLocation(loc);
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
    };
  }, []);

  // Sync camera when selectedLocation changes
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(selectedLocation.longitude, selectedLocation.latitude, 350000),
      duration: 1.8
    });

    // Highlight selected marker
    markersRef.current.forEach((entity) => {
      if (entity.point) {
        if (entity.id === selectedLocation.id) {
          entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#f59e0b'));
          entity.point.pixelSize = new Cesium.ConstantProperty(16);
        } else {
          entity.point.color = new Cesium.ConstantProperty(Cesium.Color.fromCssColorString('#00e5ff'));
          entity.point.pixelSize = new Cesium.ConstantProperty(12);
        }
      }
    });
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#080c14]">
      {/* Cesium Viewer Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Coordinate HUD */}
      <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-slate-300 backdrop-blur z-10 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span>CURSOR:</span>
        </div>
        {mouseCoords ? (
          <span>
            {mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lon.toFixed(4)}°E ({mouseCoords.height}m)
          </span>
        ) : (
          <span className="text-slate-500">Hover over globe</span>
        )}
      </div>

      {/* On-Map Quick Camera Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => {
            const viewer = viewerRef.current;
            if (viewer) {
              const currentCameraHeight = viewer.camera.positionCartographic.height;
              viewer.camera.zoomIn(currentCameraHeight * 0.4);
            }
          }}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const viewer = viewerRef.current;
            if (viewer) {
              const currentCameraHeight = viewer.camera.positionCartographic.height;
              viewer.camera.zoomOut(currentCameraHeight * 0.5);
            }
          }}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const viewer = viewerRef.current;
            if (viewer) {
              viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 2800000), // All-India View
                duration: 1.5
              });
            }
          }}
          className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:bg-slate-800 text-cyan-300 transition-colors shadow-lg"
          title="Reset to Pan-India Overview"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Active Layer Legend Indicator */}
      <div className="absolute top-4 left-4 bg-slate-950/85 border border-slate-800/90 rounded-xl p-2.5 backdrop-blur z-10 shadow-xl max-w-xs text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] mb-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAP OVERLAY STATUS</span>
        </div>
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Verified Borehole Network
            </span>
            <span className="font-mono text-cyan-300 text-[10px]">CGWB / GSI</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Active Locus Anchor
            </span>
            <span className="font-mono text-amber-300 text-[10px]">{selectedLocation.name.split(' ')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

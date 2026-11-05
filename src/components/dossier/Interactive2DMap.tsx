import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radio,
  Info,
  Layers,
  Check,
  ChevronDown,
  Compass
} from 'lucide-react';
import { CGWB_NATIONAL_STATION_NETWORK, GroundwaterStationRecord } from '../../data/cgwbStations';
import {
  CWC_OFFICIAL_BASIN_VECTORS,
  CWC_ISLAND_VECTORS,
  MAJOR_RIVER_VECTORS,
  STATE_BOUNDARY_LINES
} from '../../data/indiaVectorMapData';
import {
  getCartoVectorStyleUrl,
  getCartoApiKey,
  CARTO_ATTRIBUTION,
  CartoBasemapStyle,
  CARTO_STYLES
} from '../../services/cartoBasemapService';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Interactive2DMapProps {
  className?: string;
}

/**
 * Helper generating GeoJSON circle polygon for AOI envelopes
 */
function createGeoJsonCircle(
  lon: number,
  lat: number,
  radiusKm: number,
  id: string,
  points: number = 64
) {
  const coords: [number, number][] = [];
  const radLat = radiusKm / 111.32;
  const radLon = radiusKm / (111.32 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  for (let i = 0; i <= points; i++) {
    const theta = (i / points) * 2 * Math.PI;
    coords.push([
      lon + radLon * Math.sin(theta),
      lat + radLat * Math.cos(theta)
    ]);
  }
  return {
    type: 'Feature' as const,
    properties: { id, radiusKm },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coords]
    }
  };
}

export const Interactive2DMap: React.FC<Interactive2DMapProps> = ({ className = '' }) => {
  const {
    selectedLocation,
    setSelectedLocation,
    currentDossier,
    fetchLocationDossier,
    isDossierLoading,
    activeBasemap,
    setActiveBasemap
  } = useTerranexusStore();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const targetMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [useSvgFallback, setUseSvgFallback] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showBasemapMenu, setShowBasemapMenu] = useState<boolean>(false);
  const [hoveredStation, setHoveredStation] = useState<GroundwaterStationRecord | null>(null);
  const [hoveredBasin, setHoveredBasin] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // SVG Fallback projection states
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const currentCartoStyle: CartoBasemapStyle =
    activeBasemap === 'voyager' || activeBasemap === 'positron'
      ? activeBasemap
      : 'dark-matter';

  const targetLat = selectedLocation?.latitude ?? 18.5204;
  const targetLon = selectedLocation?.longitude ?? 73.8567;

  // Extents for Indian Subcontinent in Equirectangular projection (SVG Fallback)
  const MIN_LON = 67.0;
  const MAX_LON = 98.0;
  const MIN_LAT = 6.0;
  const MAX_LAT = 38.0;
  const WIDTH = 800;
  const HEIGHT = 850;

  const project = (lat: number, lon: number): [number, number] => {
    const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * WIDTH;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * HEIGHT;
    return [x, y];
  };

  const unproject = (x: number, y: number): [number, number] => {
    const lon = MIN_LON + (x / WIDTH) * (MAX_LON - MIN_LON);
    const lat = MAX_LAT - (y / HEIGHT) * (MAX_LAT - MIN_LAT);
    return [Math.round(lat * 10000) / 10000, Math.round(lon * 10000) / 10000];
  };

  const [targetX, targetY] = project(targetLat, targetLon);
  const pxPerKm = (HEIGHT / (MAX_LAT - MIN_LAT)) / 111;
  const aoi1KmPx = Math.max(1 * pxPerKm * zoom, 4);
  const aoi10KmPx = Math.max(10 * pxPerKm * zoom, 16);
  const aoi50KmPx = Math.max(50 * pxPerKm * zoom, 45);

  // Initialize MapLibre GL with CARTO Vector style
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check WebGL availability
    const isWebGLSupported = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    })();

    if (!isWebGLSupported) {
      setUseSvgFallback(true);
      return;
    }

    let mapInstance: maplibregl.Map | null = null;

    try {
      mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: getCartoVectorStyleUrl(currentCartoStyle),
        center: [targetLon, targetLat],
        zoom: 6,
        attributionControl: false,
        transformRequest: (url: string) => {
          const cartoKey = getCartoApiKey();
          if (cartoKey && url.includes('cartocdn.com') && !url.includes('key=') && !url.includes('api_key=')) {
            const separator = url.includes('?') ? '&' : '?';
            return {
              url: `${url}${separator}key=${encodeURIComponent(cartoKey)}&api_key=${encodeURIComponent(cartoKey)}`
            };
          }
          return { url };
        }
      });

      mapRef.current = mapInstance;

      mapInstance.on('load', () => {
        setMapLoaded(true);

        // 1. Add CWC River Basins GeoJSON
        mapInstance?.addSource('cwc-basins', {
          type: 'geojson',
          data: '/data/cwc_basins.geojson'
        });

        mapInstance?.addLayer({
          id: 'cwc-basins-fill',
          type: 'fill',
          source: 'cwc-basins',
          paint: {
            'fill-color': '#0284c7',
            'fill-opacity': 0.12
          }
        });

        mapInstance?.addLayer({
          id: 'cwc-basins-line',
          type: 'line',
          source: 'cwc-basins',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 1.2,
            'line-opacity': 0.7
          }
        });

        // 2. Add CGWB National Groundwater Stations GeoJSON
        const stationsGeoJson = {
          type: 'FeatureCollection' as const,
          features: CGWB_NATIONAL_STATION_NETWORK.map((st) => ({
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [st.longitude, st.latitude]
            },
            properties: {
              stationCode: st.stationCode,
              stationName: st.stationName,
              latestDepthMbgl: st.latestDepthMbgl,
              latestObservationDate: st.latestObservationDate,
              aquiferSystem: st.aquiferSystem,
              agency: st.agency,
              state: st.state,
              district: st.district
            }
          }))
        };

        mapInstance?.addSource('cgwb-stations', {
          type: 'geojson',
          data: stationsGeoJson
        });

        mapInstance?.addLayer({
          id: 'cgwb-stations-glow',
          type: 'circle',
          source: 'cgwb-stations',
          paint: {
            'circle-radius': 8,
            'circle-color': '#10b981',
            'circle-opacity': 0.25
          }
        });

        mapInstance?.addLayer({
          id: 'cgwb-stations-circle',
          type: 'circle',
          source: 'cgwb-stations',
          paint: {
            'circle-radius': 4.5,
            'circle-color': '#10b981',
            'circle-stroke-color': '#022c22',
            'circle-stroke-width': 1.5
          }
        });

        // 3. Add 3 Canonical AOI Rings GeoJSON (1km, 10km, 50km)
        const aoisGeoJson = {
          type: 'FeatureCollection' as const,
          features: [
            createGeoJsonCircle(targetLon, targetLat, 50, 'aoi-50km'),
            createGeoJsonCircle(targetLon, targetLat, 10, 'aoi-10km'),
            createGeoJsonCircle(targetLon, targetLat, 1, 'aoi-1km')
          ]
        };

        mapInstance?.addSource('aoi-rings', {
          type: 'geojson',
          data: aoisGeoJson
        });

        mapInstance?.addLayer({
          id: 'aoi-rings-fill',
          type: 'fill',
          source: 'aoi-rings',
          paint: {
            'fill-color': [
              'match',
              ['get', 'id'],
              'aoi-1km', '#10b981',
              'aoi-10km', '#38bdf8',
              'aoi-50km', '#f59e0b',
              '#38bdf8'
            ],
            'fill-opacity': [
              'match',
              ['get', 'id'],
              'aoi-1km', 0.22,
              'aoi-10km', 0.10,
              'aoi-50km', 0.05,
              0.1
            ]
          }
        });

        mapInstance?.addLayer({
          id: 'aoi-rings-line',
          type: 'line',
          source: 'aoi-rings',
          paint: {
            'line-color': [
              'match',
              ['get', 'id'],
              'aoi-1km', '#10b981',
              'aoi-10km', '#38bdf8',
              'aoi-50km', '#f59e0b',
              '#38bdf8'
            ],
            'line-width': 1.8,
            'line-dasharray': [2, 2]
          }
        });

        // 4. Custom Pin Marker
        const pinEl = document.createElement('div');
        pinEl.className = 'w-6 h-6 flex items-center justify-center cursor-pointer pointer-events-none';
        pinEl.innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-red-500/30 animate-ping absolute"></div>
            <div class="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-lg relative"></div>
          </div>
        `;

        targetMarkerRef.current = new maplibregl.Marker({ element: pinEl })
          .setLngLat([targetLon, targetLat])
          .addTo(mapInstance!);

        // Click to drop pin
        mapInstance?.on('click', (e) => {
          const lat = Number(e.lngLat.lat.toFixed(4));
          const lon = Number(e.lngLat.lng.toFixed(4));

          setSelectedLocation({
            id: `custom-pin-${Date.now()}`,
            name: `Pin (${lat}°N, ${lon}°E)`,
            state: lat >= 6 && lat <= 38 && lon >= 67 && lon <= 98 ? 'India' : 'Global Locus',
            district: 'Inspected Locus',
            latitude: lat,
            longitude: lon,
            elevationMeters: 250,
            basin: 'Regional Catchment Basin',
            geologicalProvince: 'Lithological Formation',
            description: 'Pin-dropped geographic locus for regional evidence analysis'
          });
        });

        // Hover tooltip over CGWB Stations
        mapInstance?.on('mouseenter', 'cgwb-stations-circle', (e) => {
          if (!mapInstance) return;
          mapInstance.getCanvas().style.cursor = 'pointer';
          const feat = e.features?.[0];
          if (feat && feat.properties) {
            setHoveredStation(feat.properties as any);
            setTooltipPos({ x: e.point.x, y: e.point.y });
          }
        });

        mapInstance?.on('mouseleave', 'cgwb-stations-circle', () => {
          if (!mapInstance) return;
          mapInstance.getCanvas().style.cursor = '';
          setHoveredStation(null);
        });

        // Hover tooltip over CWC River Basins
        mapInstance?.on('mouseenter', 'cwc-basins-fill', (e) => {
          const feat = e.features?.[0];
          const bName = feat?.properties?.Basin_Name || feat?.properties?.name || 'CWC River Basin';
          setHoveredBasin(bName);
          setTooltipPos({ x: e.point.x, y: e.point.y });
        });

        mapInstance?.on('mouseleave', 'cwc-basins-fill', () => {
          setHoveredBasin(null);
        });
      });

      mapInstance.on('error', (err) => {
        console.warn('[MapLibre GL] Basemap render notice, fallback available:', err.error?.message || err);
      });
    } catch (e: any) {
      console.warn('[MapLibre GL] Init failed, engaging SVG fallback:', e.message);
      setUseSvgFallback(true);
    }

    return () => {
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Synchronize Map Center, Marker & AOI Rings when selectedLocation changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    map.flyTo({
      center: [targetLon, targetLat],
      zoom: Math.max(map.getZoom(), 7.2),
      duration: 1200,
      essential: true
    });

    if (targetMarkerRef.current) {
      targetMarkerRef.current.setLngLat([targetLon, targetLat]);
    }

    // Update AOI circles source
    const aoiSource = map.getSource('aoi-rings') as maplibregl.GeoJSONSource | undefined;
    if (aoiSource) {
      aoiSource.setData({
        type: 'FeatureCollection',
        features: [
          createGeoJsonCircle(targetLon, targetLat, 50, 'aoi-50km'),
          createGeoJsonCircle(targetLon, targetLat, 10, 'aoi-10km'),
          createGeoJsonCircle(targetLon, targetLat, 1, 'aoi-1km')
        ]
      });
    }
  }, [targetLat, targetLon, mapLoaded]);

  // Handle Basemap Style Switching
  const handleStyleSwitch = useCallback((style: CartoBasemapStyle) => {
    setActiveBasemap(style);
    setShowBasemapMenu(false);
    const map = mapRef.current;
    if (map) {
      const url = getCartoVectorStyleUrl(style);
      map.setStyle(url);
    }
  }, [setActiveBasemap]);

  // Reset view to Pan-India
  const handleResetPanIndia = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [78.9629, 22.5937],
        zoom: 4.8,
        duration: 1000
      });
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div className={`relative flex flex-col h-full w-full bg-[#040814] overflow-hidden select-none border-l border-slate-800/80 ${className}`}>
      {/* 2D Map Control Bar */}
      <div className="h-10 border-b border-slate-800/80 bg-slate-950/95 px-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200">2D Geospatial Evidence Canvas</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (CARTO {CARTO_STYLES[currentCartoStyle].name} • Click to drop pin)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* CARTO Basemap Style Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs font-mono text-cyan-300 transition-colors shadow-sm cursor-pointer"
              title="Switch CARTO Basemap Style"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{CARTO_STYLES[currentCartoStyle].name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showBasemapMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-950/98 border border-slate-800 rounded-xl p-1.5 backdrop-blur-2xl shadow-2xl z-50 flex flex-col gap-1 text-xs font-mono animate-fadeIn">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 px-2 py-0.5 font-semibold">
                  CARTO Basemap Style
                </span>
                {(['dark-matter', 'voyager', 'positron'] as const).map((styleId) => {
                  const styleMeta = CARTO_STYLES[styleId];
                  const isSelected = currentCartoStyle === styleId;
                  return (
                    <button
                      key={styleId}
                      onClick={() => handleStyleSwitch(styleId)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-bold'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{styleMeta.name}</div>
                        <div className="text-[9px] text-slate-400 leading-tight">{styleMeta.description}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Zoom & Reset Controls */}
          <button
            onClick={() => {
              if (mapRef.current) mapRef.current.zoomIn();
              else setZoom((z) => Math.min(z + 0.3, 4));
            }}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In 2D Map"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (mapRef.current) mapRef.current.zoomOut();
              else setZoom((z) => Math.max(z - 0.3, 0.8));
            }}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out 2D Map"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetPanIndia}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs cursor-pointer"
            title="Reset Pan-India View"
            aria-label="Reset 2D Map View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Viewport (MapLibre GL or SVG Fallback) */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* MapLibre GL WebGL Map Container */}
        <div
          ref={mapContainerRef}
          className={`absolute inset-0 w-full h-full ${useSvgFallback ? 'hidden' : 'block'}`}
        />

        {/* Resilient Pure SVG Fallback (rendered if WebGL is unsupported) */}
        {useSvgFallback && (
          <div
            className="w-full h-full cursor-crosshair overflow-hidden"
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              setIsDragging(true);
              setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-full"
              onClick={(e) => {
                if (isDragging) return;
                const svg = svgRef.current;
                if (!svg) return;
                const ctm = svg.getScreenCTM();
                if (!ctm) return;
                const pt = svg.createSVGPoint();
                pt.x = e.clientX;
                pt.y = e.clientY;
                const screenSvg = pt.matrixTransform(ctm.inverse());
                const svgX = (screenSvg.x - pan.x - WIDTH / 2) / zoom + WIDTH / 2;
                const svgY = (screenSvg.y - pan.y - HEIGHT / 2) / zoom + HEIGHT / 2;
                const [clickedLat, clickedLon] = unproject(svgX, svgY);

                if (clickedLat >= 6 && clickedLat <= 38 && clickedLon >= 67 && clickedLon <= 98) {
                  setSelectedLocation({
                    id: `custom-pin-${Date.now()}`,
                    name: `Pin (${clickedLat.toFixed(4)}°N, ${clickedLon.toFixed(4)}°E)`,
                    state: 'India',
                    district: 'Regional Locus',
                    latitude: clickedLat,
                    longitude: clickedLon,
                    elevationMeters: 250,
                    basin: 'Indian Catchment Basin',
                    geologicalProvince: 'Peninsular Basin',
                    description: 'Pin-dropped geographic locus for regional evidence analysis'
                  });
                }
              }}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) translate(${WIDTH / 2}, ${HEIGHT / 2}) scale(${zoom}) translate(${-WIDTH / 2}, ${-HEIGHT / 2})`}>
                <defs>
                  <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
                  </pattern>
                </defs>
                <rect width={WIDTH} height={HEIGHT} fill="url(#grid-pattern)" />

                {/* CWC River Basins */}
                {CWC_OFFICIAL_BASIN_VECTORS.map((b) => (
                  <path
                    key={b.code}
                    d={b.path}
                    fill={b.color}
                    stroke="#1e3a8a"
                    strokeWidth="0.9"
                    strokeOpacity="0.75"
                    className="transition-colors hover:fill-blue-900/60 cursor-pointer"
                  />
                ))}

                {/* Island Groups */}
                {CWC_ISLAND_VECTORS.map((isl) => (
                  <path
                    key={isl.code}
                    d={isl.path}
                    fill="#164e63"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeOpacity="0.9"
                  />
                ))}

                {/* Major Rivers */}
                {MAJOR_RIVER_VECTORS.map((r) => (
                  <path
                    key={r.name}
                    d={r.path}
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth="1.5"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* State Boundary Lines */}
                {STATE_BOUNDARY_LINES.map((line) => (
                  <path
                    key={line.id}
                    d={line.path}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.6"
                    strokeDasharray="4,3"
                    strokeOpacity="0.9"
                  />
                ))}

                {/* CGWB Stations */}
                {CGWB_NATIONAL_STATION_NETWORK.map((st) => {
                  const [sx, sy] = project(st.latitude, st.longitude);
                  return (
                    <g key={st.stationCode}>
                      <circle cx={sx} cy={sy} r="4" fill="#10b981" stroke="#022c22" strokeWidth="1.5" />
                    </g>
                  );
                })}

                {/* AOI Circles */}
                <circle cx={targetX} cy={targetY} r={aoi50KmPx} fill="#f59e0b" fillOpacity="0.04" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,4" />
                <circle cx={targetX} cy={targetY} r={aoi10KmPx} fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2,2" />
                <circle cx={targetX} cy={targetY} r={aoi1KmPx} fill="#10b981" fillOpacity="0.25" stroke="#10b981" strokeWidth="2" />

                {/* Target Pin */}
                <g transform={`translate(${targetX - 12}, ${targetY - 24})`}>
                  <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                </g>
              </g>
            </svg>
          </div>
        )}

        {/* Hovered Station Tooltip */}
        {hoveredStation && (
          <div
            className="absolute z-30 p-2.5 rounded-lg bg-slate-900/95 border border-emerald-500/50 shadow-2xl text-xs font-mono text-slate-200 pointer-events-none"
            style={{
              left: Math.max(10, Math.min(tooltipPos.x + 12, 400)),
              top: Math.max(10, tooltipPos.y - 120)
            }}
          >
            <div className="font-bold text-emerald-400 text-xs mb-1">{hoveredStation.stationName}</div>
            <div className="text-[11px] text-slate-300">Code: {hoveredStation.stationCode} ({hoveredStation.agency})</div>
            <div className="text-[11px] text-slate-300">
              Water Depth: <span className="text-cyan-400 font-bold">{hoveredStation.latestDepthMbgl} mbgl</span> ({hoveredStation.latestObservationDate})
            </div>
            <div className="text-[11px] text-slate-400">Aquifer: {hoveredStation.aquiferSystem}</div>
          </div>
        )}

        {/* Hovered Basin Tooltip */}
        {!hoveredStation && hoveredBasin && (
          <div
            className="absolute z-30 p-2 rounded-lg bg-slate-900/95 border border-cyan-500/50 shadow-2xl text-xs font-mono text-slate-200 pointer-events-none"
            style={{
              left: Math.max(10, Math.min(tooltipPos.x + 12, 400)),
              top: Math.max(10, tooltipPos.y - 70)
            }}
          >
            <div className="font-bold text-cyan-400 text-xs">{hoveredBasin}</div>
            <div className="text-[10px] text-slate-400">Central Water Commission (CWC) Official Basin</div>
          </div>
        )}

        {/* Bottom Floating Map Legend */}
        <div className="absolute bottom-3 left-3 z-20 bg-slate-950/90 border border-slate-800/80 rounded-xl p-2.5 shadow-xl text-[11px] font-mono backdrop-blur">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-cyan-400" />
            <span>Map Layers & AOIs</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-300">Target Locus</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-950/60" />
              <span className="text-slate-300">1 km Local AOI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-sky-400 border-dashed" />
              <span className="text-slate-300">10 km Context AOI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border border-amber-400 border-dashed" />
              <span className="text-slate-300">50 km Regional AOI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">CGWB Telemetric Wells</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-cyan-400" />
              <span className="text-slate-300">CWC River Basins</span>
            </div>
          </div>
        </div>

        {/* Persistent, Compliant CARTO & OpenStreetMap Attribution */}
        <div className="absolute bottom-2 right-2 z-20 bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-md shadow-lg pointer-events-auto">
          <span dangerouslySetInnerHTML={{ __html: CARTO_ATTRIBUTION.html }} />
        </div>

        {/* Loading Indicator */}
        {isDossierLoading && (
          <div className="absolute top-3 right-3 z-20 bg-slate-900/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Synthesizing Evidence Dossier...</span>
          </div>
        )}
      </div>
    </div>
  );
};

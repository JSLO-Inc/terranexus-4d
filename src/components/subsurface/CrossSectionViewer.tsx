import React, { useState } from 'react';
import { GeologicalFormation, BoreholeRecord, GeoLocation } from '../../types';
import { SelectedLocation } from '../../types/location';
import { AquiferLayer } from '../../data/hydroData';
import { ElevationGridData } from '../../state/useTerranexusStore';
import { StatusBadge } from '../common/StatusBadge';
import {
  Compass,
  X,
  Droplet,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Info,
  Radio
} from 'lucide-react';
import { TerraneStructuralAttitude } from './geologicalMaterials';

interface CrossSectionViewerProps {
  location: SelectedLocation | GeoLocation;
  formations: GeologicalFormation[];
  aquifers: AquiferLayer[];
  borehole?: BoreholeRecord;
  waterTableDepthMbgl: number | null;
  isWaterTableObserved: boolean;
  elevationGrid: ElevationGridData | null;
  structuralAttitude: TerraneStructuralAttitude;
  onClose: () => void;
}

export const CrossSectionViewer: React.FC<CrossSectionViewerProps> = ({
  location,
  formations,
  aquifers,
  borehole,
  waterTableDepthMbgl,
  isWaterTableObserved,
  elevationGrid,
  structuralAttitude,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredStratum, setHoveredStratum] = useState<GeologicalFormation | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; depthM: number } | null>(null);

  // SVG Canvas dimensions
  const svgWidth = 840;
  const svgHeight = 420;
  const padding = { top: 50, right: 60, bottom: 65, left: 75 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Elevation Profile derivation
  const numProfilePoints = 32;
  const profileX: number[] = [];
  const profileElevations: number[] = [];

  const baseEle = location.elevationMeters || 200;
  const minGridEle = elevationGrid?.minElevationM ?? (baseEle - 15);
  const maxGridEle = elevationGrid?.maxElevationM ?? (baseEle + 15);
  const eleSpan = Math.max(maxGridEle - minGridEle, 20);

  for (let i = 0; i < numProfilePoints; i++) {
    const t = i / (numProfilePoints - 1);
    profileX.push(padding.left + t * plotWidth);

    if (elevationGrid && elevationGrid.elevations.length > 0) {
      // Sample diagonally across grid from (0, 0) to (R-1, C-1)
      const r = Math.min(Math.floor(t * (elevationGrid.elevations.length - 1)), elevationGrid.elevations.length - 1);
      const c = Math.min(Math.floor(t * (elevationGrid.elevations[0].length - 1)), elevationGrid.elevations[0].length - 1);
      profileElevations.push(elevationGrid.elevations[r][c]);
    } else {
      // Benchmark topographic relief wave
      const wave = Math.sin(t * Math.PI * 2) * 6 + Math.cos(t * Math.PI * 3.5) * 3;
      profileElevations.push(baseEle + wave);
    }
  }

  // Vertical scale mapping: Top of plot corresponds to surface elevation, bottom to max depth
  const totalSubsurfaceDepthM = formations.reduce((sum, f) => sum + f.typicalThicknessMeters, 0) + 50;
  const maxDisplayDepthM = Math.min(Math.max(totalSubsurfaceDepthM, 300), 2500);

  // Map depth to Y coordinate
  const depthToY = (depthM: number, xFraction: number = 0.5) => {
    // Apparent dip tilt offset along the section line (A -> A')
    const dipRad = (structuralAttitude.dipDeg * Math.PI) / 180;
    const dipOffsetM = (xFraction - 0.5) * Math.tan(dipRad) * 450;
    const normalizedY = (depthM + dipOffsetM) / maxDisplayDepthM;
    return padding.top + 20 + Math.min(Math.max(normalizedY, 0), 1) * (plotHeight - 20);
  };

  // Build Topography Path (Top ground line)
  const topoPoints = profileX.map((px, i) => {
    const ele = profileElevations[i];
    const normEle = (ele - minGridEle) / eleSpan;
    const py = padding.top + 25 - normEle * 20;
    return `${px},${py}`;
  });
  const topoPath = `M ${topoPoints.join(' L ')}`;

  // Stratum layer polygons
  let cumulativeDepth = 0;
  const stratumPolygons = formations.map((formation, idx) => {
    const topDepth = cumulativeDepth;
    const botDepth = topDepth + formation.typicalThicknessMeters;
    cumulativeDepth = botDepth;

    // Top boundary points
    const topPts = profileX.map((px, i) => {
      const frac = i / (profileX.length - 1);
      const y = idx === 0
        ? parseFloat(topoPoints[i].split(',')[1]) // layer 0 top is surface
        : depthToY(topDepth, frac);
      return `${px},${y}`;
    });

    // Bottom boundary points (reversed for closed polygon)
    const botPts = [...profileX].reverse().map((px, i) => {
      const frac = (profileX.length - 1 - i) / (profileX.length - 1);
      const y = depthToY(botDepth, frac);
      return `${px},${y}`;
    });

    const pathData = `M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;

    return {
      formation,
      topDepth,
      botDepth,
      pathData,
      colorHex: formation.colorHex
    };
  });

  // Hydrogeological Aquifer System horizons
  const aquiferPolygons = (aquifers || []).map((aq) => {
    const topPts = profileX.map((px, i) => {
      const frac = i / (profileX.length - 1);
      const y = depthToY(aq.topDepthM, frac);
      return `${px},${y}`;
    });
    const botPts = [...profileX].reverse().map((px, i) => {
      const frac = (profileX.length - 1 - i) / (profileX.length - 1);
      const y = depthToY(aq.bottomDepthM, frac);
      return `${px},${y}`;
    });
    const pathData = `M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;
    return { aquifer: aq, pathData };
  });

  // Water table line path (guarded when evidence is withheld)
  const hasWaterTable = waterTableDepthMbgl !== null;
  const waterTablePts = hasWaterTable ? profileX.map((px, i) => {
    const frac = i / (profileX.length - 1);
    const surfY = parseFloat(topoPoints[i].split(',')[1]);
    const wtY = surfY + (waterTableDepthMbgl! / maxDisplayDepthM) * (plotHeight * 0.85);
    return `${px},${wtY}`;
  }) : [];
  const waterTablePath = hasWaterTable && waterTablePts.length > 0 ? `M ${waterTablePts.join(' L ')}` : '';

  // Borehole location along section line (positioned around x = 40%)
  const boreholeFrac = 0.42;
  const boreholeX = padding.left + boreholeFrac * plotWidth;
  const boreholeSurfY = parseFloat(topoPoints[Math.floor(boreholeFrac * (topoPoints.length - 1))].split(',')[1]);
  const boreholeBotY = borehole
    ? Math.min(boreholeSurfY + (borehole.totalDepthMeters / maxDisplayDepthM) * plotHeight, padding.top + plotHeight)
    : boreholeSurfY + 120;
  const boreholeWaterStrikeY = borehole
    ? boreholeSurfY + (borehole.waterTableDepthMeters / maxDisplayDepthM) * plotHeight
    : boreholeSurfY + 40;

  // Handle mousemove over cross-section for depth tracking
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (
      clientX >= padding.left &&
      clientX <= padding.left + plotWidth &&
      clientY >= padding.top &&
      clientY <= padding.top + plotHeight
    ) {
      const depthRatio = (clientY - padding.top) / plotHeight;
      const calculatedDepth = Math.round(depthRatio * maxDisplayDepthM);
      setCursorPos({ x: clientX, y: clientY, depthM: calculatedDepth });
    } else {
      setCursorPos(null);
    }
  };

  // Keyboard Escape listener for accessible modal dismissal (QA-02)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="2D Geological Cross-Section Profile"
      className={`glass-panel-elevated rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 border border-slate-700/80 bg-slate-950/95 z-30 ${
        isExpanded ? 'fixed inset-4 md:inset-8 z-50' : 'absolute bottom-2 left-2 right-2 max-h-[88%] md:max-h-[480px]'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-xs text-slate-100 flex items-center gap-2">
            <span>2D Geological Cross-Section Profile: Section A – A'</span>
            <span className="text-slate-500 font-normal">|</span>
            <span className="font-mono text-cyan-300 font-normal text-[11px]">{location.name}</span>
          </h3>
          <StatusBadge status="MODELLED" size="sm" />
        </div>

        {/* Structural Attitude & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Regional Strike: N{structuralAttitude.strikeDeg}°E</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-300">Apparent Dip: {structuralAttitude.dipDeg}° {structuralAttitude.dipDirection}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isExpanded ? 'Restore Size' : 'Expand View'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close Cross-Section"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-[#070b14] relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-full select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
        >
          <defs>
            {/* Standard GSI / USGS Geological Hatch Patterns */}
            {/* 1. Sandstone Stipple Pattern */}
            <pattern id="hatch-sandstone" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.0" fill="#fef08a" opacity="0.4" />
              <circle cx="8" cy="8" r="1.2" fill="#fef08a" opacity="0.4" />
              <circle cx="10" cy="3" r="0.8" fill="#fef08a" opacity="0.3" />
            </pattern>

            {/* 2. Basalt Columnar / Brick Pattern */}
            <pattern id="hatch-basalt" width="16" height="20" patternUnits="userSpaceOnUse">
              <path d="M 0,0 L 0,20 M 8,0 L 8,20 M 16,0 L 16,20 M 0,10 L 8,10 M 8,20 L 16,20" stroke="#090d16" strokeWidth="1.2" opacity="0.5" />
            </pattern>

            {/* 3. Charnockite / Gneiss Metamorphic Foliation Pattern */}
            <pattern id="hatch-charnockite" width="24" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <path d="M 0,4 Q 6,2 12,4 T 24,4 M 0,10 Q 6,8 12,10 T 24,10" stroke="#475569" strokeWidth="1.2" fill="none" opacity="0.45" />
              <circle cx="12" cy="7" r="1.6" fill="#881337" opacity="0.8" />
            </pattern>

            {/* 4. Granite Crystalline Mosaic Pattern */}
            <pattern id="hatch-granite" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 4,2 L 4,6 M 2,4 L 6,4 M 12,10 L 12,14 M 10,12 L 14,12" stroke="#f43f5e" strokeWidth="1.2" opacity="0.5" />
              <circle cx="8" cy="8" r="1.2" fill="#f8fafc" opacity="0.4" />
            </pattern>

            {/* 5. Limestone Brick Pattern */}
            <pattern id="hatch-carbonate" width="18" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0,0 L 18,0 M 0,10 L 18,10 M 9,0 L 9,10" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
            </pattern>

            {/* 6. Alluvium Silt/Clay Laminations */}
            <pattern id="hatch-alluvium" width="16" height="8" patternUnits="userSpaceOnUse">
              <path d="M 1,2 L 7,2 M 9,2 L 15,2 M 3,6 L 11,6" stroke="#ca8a04" strokeWidth="1.0" opacity="0.5" />
            </pattern>

            {/* Glow Filter for Water Table */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Section Border Frame */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotWidth}
            height={plotHeight}
            fill="#060911"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Stratigraphic Formations (Dipping Slabs with Geological Patterns) */}
          {stratumPolygons.map((stratum, idx) => {
            const isHovered = hoveredStratum?.id === stratum.formation.id;
            const lithLower = stratum.formation.primaryLithology.toLowerCase();
            const hatchId = lithLower.includes('basalt')
              ? 'hatch-basalt'
              : lithLower.includes('sandstone')
              ? 'hatch-sandstone'
              : lithLower.includes('charnockite') || lithLower.includes('khondalite')
              ? 'hatch-charnockite'
              : lithLower.includes('granite') || lithLower.includes('gneiss')
              ? 'hatch-granite'
              : lithLower.includes('dolomite') || lithLower.includes('limestone')
              ? 'hatch-carbonate'
              : 'hatch-alluvium';

            return (
              <g
                key={stratum.formation.id || idx}
                onMouseEnter={() => setHoveredStratum(stratum.formation)}
                onMouseLeave={() => setHoveredStratum(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Base Lithology Color Fill */}
                <path
                  d={stratum.pathData}
                  fill={stratum.colorHex}
                  fillOpacity={isHovered ? 0.85 : 0.65}
                  stroke="#334155"
                  strokeWidth="1.2"
                />
                {/* Scientific Hatching Pattern Overlay */}
                <path
                  d={stratum.pathData}
                  fill={`url(#${hatchId})`}
                  pointerEvents="none"
                />
                {/* Formation Label centered in layer */}
                <text
                  x={padding.left + plotWidth * 0.72}
                  y={depthToY((stratum.topDepth + stratum.botDepth) / 2, 0.72)}
                  fill={isHovered ? '#ffffff' : '#cbd5e1'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {stratum.formation.name} (~{stratum.formation.typicalThicknessMeters}m)
                </text>
              </g>
            );
          })}

          {/* Hydrogeological Aquifer Systems Overlay */}
          {aquiferPolygons.map(({ aquifer: aq, pathData }, idx) => (
            <g key={aq.id || idx}>
              <path
                d={pathData}
                fill="#06b6d4"
                fillOpacity="0.14"
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                strokeOpacity="0.8"
              />
              <text
                x={padding.left + 20}
                y={depthToY(aq.topDepthM + Math.max(10, (aq.bottomDepthM - aq.topDepthM) / 2), 0.1)}
                fill="#22d3ee"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                {aq.name} ({aq.aquiferType} • T: {aq.transmissivityM2Day} m²/d)
              </text>
            </g>
          ))}

          {/* Topography Surface Line */}
          <path
            d={topoPath}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
          />

          {/* Phreatic Groundwater Table Line */}
          {hasWaterTable && waterTablePts.length > 1 && (
            <>
              <path
                d={waterTablePath}
                fill="none"
                stroke="#00e5ff"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                filter="url(#cyanGlow)"
              />
              <text
                x={padding.left + 15}
                y={parseFloat(waterTablePts[1].split(',')[1]) - 6}
                fill="#00e5ff"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Phreatic Water Table (-{waterTableDepthMbgl!.toFixed(1)} mbgl)
              </text>
            </>
          )}

          {/* Projected Exploratory Borehole Drill String */}
          <g className="cursor-pointer">
            {/* Rig / Collar Derrick */}
            <path
              d={`M ${boreholeX - 7},${boreholeSurfY} L ${boreholeX},${boreholeSurfY - 14} L ${boreholeX + 7},${boreholeSurfY} Z`}
              fill="#0284c7"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            {/* Core Drill String Stem */}
            <line
              x1={boreholeX}
              y1={boreholeSurfY}
              x2={boreholeX}
              y2={boreholeBotY}
              stroke="#f59e0b"
              strokeWidth="3.5"
            />
            {/* Water Strike Indicator Ring */}
            <circle
              cx={boreholeX}
              cy={boreholeWaterStrikeY}
              r="4.5"
              fill="#00e5ff"
              stroke="#0891b2"
              strokeWidth="1.5"
            />
            <text
              x={boreholeX + 8}
              y={boreholeSurfY - 5}
              fill="#f59e0b"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {borehole?.wellCode || 'EXPL-BH-01'}
            </text>
            <text
              x={boreholeX + 8}
              y={boreholeWaterStrikeY + 3}
              fill="#00e5ff"
              fontSize="8"
              fontFamily="monospace"
            >
              Water Strike: {borehole?.waterTableDepthMeters ? `${borehole.waterTableDepthMeters}m` : waterTableDepthMbgl !== null ? `${waterTableDepthMbgl.toFixed(1)}m` : 'Withheld / Dry'}
            </text>
          </g>

          {/* Section Orientation Indicators: A (NW) -> A' (SE) */}
          <text
            x={padding.left}
            y={padding.top - 12}
            fill="#38bdf8"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
          >
            A (North-West)
          </text>
          <text
            x={padding.left + plotWidth}
            y={padding.top - 12}
            fill="#38bdf8"
            fontSize="12"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            A' (South-East)
          </text>

          {/* Depth Axis Ticks & Scale on Left */}
          {[0, 100, 250, 500, 1000, 1500, 2000].map(dm => {
            if (dm > maxDisplayDepthM) return null;
            const y = depthToY(dm, 0);
            return (
              <g key={dm}>
                <line
                  x1={padding.left - 6}
                  y1={y}
                  x2={padding.left}
                  y2={y}
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  -{dm}m
                </text>
              </g>
            );
          })}

          {/* Distance Scale Bar on Bottom Axis */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight + 15}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight + 15}
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text
            x={padding.left}
            y={padding.top + plotHeight + 30}
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
          >
            0 km
          </text>
          <text
            x={padding.left + plotWidth / 2}
            y={padding.top + plotHeight + 30}
            fill="#94a3b8"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="middle"
          >
            Section Extent (~5.0 km Section Length)
          </text>
          <text
            x={padding.left + plotWidth}
            y={padding.top + plotHeight + 30}
            fill="#64748b"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            5.0 km
          </text>

          {/* Interactive Cursor Tracking Line */}
          {cursorPos && (
            <g pointerEvents="none">
              <line
                x1={cursorPos.x}
                y1={padding.top}
                x2={cursorPos.x}
                y2={padding.top + plotHeight}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={padding.left}
                y1={cursorPos.y}
                x2={padding.left + plotWidth}
                y2={cursorPos.y}
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={cursorPos.x} cy={cursorPos.y} r="3.5" fill="#f59e0b" />
              <rect
                x={cursorPos.x + 8}
                y={cursorPos.y - 20}
                width="84"
                height="18"
                rx="4"
                fill="#0f172a"
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <text
                x={cursorPos.x + 14}
                y={cursorPos.y - 7}
                fill="#fbbf24"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Depth: -{cursorPos.depthM}m
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Footer Info Card: Hovered Stratum Attributes */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-3 truncate">
          {hoveredStratum ? (
            <>
              <span className="text-amber-300 font-bold truncate">{hoveredStratum.name}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 truncate">{hoveredStratum.primaryLithology}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300">Porosity: {hoveredStratum.porosityAvg}%</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Density: {hoveredStratum.densityGcm3} g/cm³</span>
            </>
          ) : (
            <span className="text-slate-500">
              Hover over cross-section strata to inspect lithology, porosity, and thickness parameters.
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-400 shrink-0">
          Structural Style: <span className="text-slate-200">{structuralAttitude.structuralStyle}</span>
        </div>
      </div>
    </div>
  );
};

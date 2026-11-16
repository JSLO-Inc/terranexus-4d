import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useTerranexusStore, MineralDisplayMode, TIME_STEPS } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { AQUIFER_SYSTEMS, AquiferLayer } from '../../data/hydroData';
import { MINERAL_INDICATORS, MineralProspectivitySummary } from '../../data/mineralData';
import { GeologicalFormation, GeoLocation } from '../../types';
import { SelectedLocation } from '../../types/location';
import { DossierResponse } from '../../types/dossier';
import { StatusBadge } from '../common/StatusBadge';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { CrossSectionViewer } from './CrossSectionViewer';
import {
  getTerraneStructuralAttitude,
  generateLithologyPbrTextures,
  computeTangentSpaceNormalMapFromHeightCanvas,
  buildDippingStratumGeometry,
  buildCornerCutInternalCappingWalls,
  getGeographicalBoundaryRadius,
  buildIrregularPolygonTerrainGeometry,
  buildIrregularPolygonStratumGeometry,
  computeClampedHydroSurfaceY,
  clampAquiferInterval,
  TerraneStructuralAttitude
} from './geologicalMaterials';
import {
  createGsapCutoutController,
  GsapCutoutController
} from '../../utils/cutoutExtractionKinematics';
import { prefersReducedMotion } from '../../utils/motion';
import {
  Box,
  RotateCcw,
  Droplet,
  Layers,
  Gem,
  Cpu,
  Compass,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Scissors,
  AlertTriangle,
  Play,
  Square,
  Globe,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface Subsurface3DProps {
  className?: string;
  isCompact?: boolean;
}

/**
 * Real DEM Hillshade, Hypsometric Relief & Satellite Optical Surface Texture Generator
 * Builds surface albedo, normal, and roughness maps directly from the location's
 * Copernicus GLO-90 DEM elevation grid and drapes real Esri World Imagery satellite tiles.
 */
function generateTerrainTexture(
  locationId: string,
  mineralMode: MineralDisplayMode,
  locContext?: {
    latitude?: number;
    longitude?: number;
    geologicalProvince?: string;
    basin?: string;
    aquiferDetails?: any;
    geologicalTerrane?: any;
  },
  terrainGrid?: {
    elevations: number[][];
    minElevationM: number;
    maxElevationM: number;
    meanElevationM: number;
  } | null,
  extentKm: number = 10,
  soilData?: DossierResponse['soil'] | null,
  climateData?: DossierResponse['climate'] | null,
  onTextureUpdated?: () => void
): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const isAutomated = typeof navigator !== 'undefined' && Boolean(navigator.webdriver);
  const texSize = isAutomated ? 256 : 512;
  const satSize = isAutomated ? 512 : 1024;
  const canvas = document.createElement('canvas');
  canvas.width = satSize;
  canvas.height = satSize;
  const ctx = canvas.getContext('2d');

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = texSize;
  heightCanvas.height = texSize;
  const hCtx = heightCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = texSize;
  roughCanvas.height = texSize;
  const rCtx = roughCanvas.getContext('2d');

  if (!ctx || !hCtx || !rCtx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.flipY = false;
    return { map: fallback, normalMap: fallback, roughnessMap: fallback };
  }

  hCtx.fillStyle = 'rgb(128,128,128)';
  hCtx.fillRect(0, 0, texSize, texSize);
  rCtx.fillStyle = 'rgb(212,212,212)';
  rCtx.fillRect(0, 0, texSize, texSize);

  const prov = (locContext?.geologicalProvince || '').toLowerCase();
  const lith = ((locContext?.aquiferDetails?.lithologyType || '') + ' ' + (locContext?.geologicalTerrane?.primaryLithology || '')).toLowerCase();
  const id = locationId.toLowerCase();
  const latAbs = Math.abs(locContext?.latitude ?? 20);
  const meanElev = terrainGrid?.meanElevationM ?? 250;
  const rain30 = climateData?.rainfall30dMm ?? 45;
  const tempC = climateData?.meanTempC ?? 22;

  const isAlpine = meanElev > 1650 || latAbs > 60;
  const isTrulyArid = prov.includes('desert') || prov.includes('sahara') || prov.includes('thar') || prov.includes('atacama') || prov.includes('gobi') || prov.includes('nubian');
  const isClayey = (soilData?.clayPercent != null && soilData.clayPercent >= 36) || prov.includes('deccan') || prov.includes('basalt') || lith.includes('basalt') || id.includes('pune');
  const isHumic = (soilData?.organicCarbonGKg != null && soilData.organicCarbonGKg >= 20) || tempC < 14 || rain30 >= 70;
  const isAlluvium = prov.includes('alluv') || prov.includes('delta') || prov.includes('coastal') || lith.includes('alluv') || id.includes('ludhiana');
  const isAravalli = prov.includes('aravalli') || prov.includes('fold belt') || prov.includes('delhi') || lith.includes('quartzite') || lith.includes('phyllite') || lith.includes('schist') || id.includes('khetri') || id.includes('zawar');

  // Hypsometric base palette derived from live elevation zone, climate, SoilGrids fractions & lithology
  const lowRgb = isAlpine ? [46, 74, 48] : isTrulyArid ? [142, 116, 78] : isClayey ? [42, 68, 44] : isAravalli ? [54, 78, 48] : (isHumic || isAlluvium) ? [38, 76, 40] : [46, 80, 46];
  const midRgb = isAlpine ? [112, 122, 130] : isTrulyArid ? [168, 140, 96] : isClayey ? [68, 88, 60] : isAravalli ? [82, 100, 62] : (isHumic || isAlluvium) ? [66, 104, 54] : [72, 102, 58];
  const highRgb = isAlpine ? [226, 232, 240] : isTrulyArid ? [192, 164, 118] : isClayey ? [102, 112, 92] : isAravalli ? [118, 122, 88] : (isHumic || isAlluvium) ? [104, 130, 78] : [110, 128, 86];

  const drawMineralOverlay = (targetCtx: CanvasRenderingContext2D) => {
    const s = satSize / 512;
    if (mineralMode === 'surface-spectral') {
      targetCtx.save();
      targetCtx.globalAlpha = 0.55;
      const feGrad = targetCtx.createRadialGradient(310 * s, 210 * s, 5 * s, 310 * s, 210 * s, 65 * s);
      feGrad.addColorStop(0, 'rgba(220, 38, 38, 0.75)');
      feGrad.addColorStop(0.6, 'rgba(185, 28, 28, 0.35)');
      feGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
      targetCtx.fillStyle = feGrad;
      targetCtx.beginPath();
      targetCtx.arc(310 * s, 210 * s, 65 * s, 0, Math.PI * 2);
      targetCtx.fill();

      const clayGrad = targetCtx.createRadialGradient(200 * s, 310 * s, 5 * s, 200 * s, 310 * s, 55 * s);
      clayGrad.addColorStop(0, 'rgba(2, 132, 199, 0.75)');
      clayGrad.addColorStop(0.6, 'rgba(3, 105, 161, 0.35)');
      clayGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');
      targetCtx.fillStyle = clayGrad;
      targetCtx.beginPath();
      targetCtx.arc(200 * s, 310 * s, 55 * s, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    } else if (mineralMode === 'modelled-prospectivity') {
      targetCtx.save();
      targetCtx.globalAlpha = 0.35;
      targetCtx.fillStyle = '#a855f7';
      targetCtx.beginPath();
      targetCtx.ellipse(256 * s, 256 * s, 150 * s, 95 * s, Math.PI / 4, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    }
  };

  // Offscreen base hillshade canvas so satellite tiles composite cleanly without stacking
  const baseHillshadeCanvas = document.createElement('canvas');
  baseHillshadeCanvas.width = texSize;
  baseHillshadeCanvas.height = texSize;
  const bhCtx = baseHillshadeCanvas.getContext('2d');

  if (terrainGrid && terrainGrid.elevations && terrainGrid.elevations.length > 1 && bhCtx) {
    const rows = terrainGrid.elevations.length;
    const cols = terrainGrid.elevations[0].length;
    const minE = terrainGrid.minElevationM;
    const maxE = terrainGrid.maxElevationM;
    const rangeE = Math.max(1.0, maxE - minE);

    const sampleDem = (u: number, v: number): number => {
      const cu = Math.max(0, Math.min(1, u));
      const cv = Math.max(0, Math.min(1, v));
      const rf = cv * (rows - 1);
      const cf = cu * (cols - 1);
      const r0 = Math.floor(rf);
      const r1 = Math.min(rows - 1, r0 + 1);
      const c0 = Math.floor(cf);
      const c1 = Math.min(cols - 1, c0 + 1);
      const fr = rf - r0;
      const fc = cf - c0;
      const e00 = terrainGrid.elevations[r0][c0];
      const e10 = terrainGrid.elevations[r0][c1];
      const e01 = terrainGrid.elevations[r1][c0];
      const e11 = terrainGrid.elevations[r1][c1];
      return (1 - fc) * ((1 - fr) * e00 + fr * e01) + fc * ((1 - fr) * e10 + fr * e11);
    };

    const imgData = bhCtx.createImageData(texSize, texSize);
    const hImgData = hCtx.createImageData(texSize, texSize);
    const rImgData = rCtx.createImageData(texSize, texSize);
    const data = imgData.data;
    const hData = hImgData.data;
    const rData = rImgData.data;

    // Analytical NW sun vector (Azimuth 315 deg, Altitude 45 deg)
    const sunX = -0.5;
    const sunY = -0.5;
    const sunZ = 0.7071;

    for (let py = 0; py < texSize; py++) {
      const v = py / (texSize - 1);
      for (let px = 0; px < texSize; px++) {
        const u = px / (texSize - 1);
        const ele = sampleDem(u, v);
        const normE = Math.max(0, Math.min(1, (ele - minE) / rangeE));

        const dzdx = (sampleDem(u + 0.008, v) - sampleDem(u - 0.008, v)) / Math.max(8, rangeE * 0.18);
        const dzdy = (sampleDem(u, v + 0.008) - sampleDem(u, v - 0.008)) / Math.max(8, rangeE * 0.18);
        const invLen = 1 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
        const nx = -dzdx * invLen;
        const ny = -dzdy * invLen;
        const nz = invLen;

        const hillshade = Math.max(0.35, Math.min(1.18, nx * sunX + ny * sunY + nz * sunZ + 0.28));

        let rC: number;
        let gC: number;
        let bC: number;
        if (normE < 0.5) {
          const t = normE * 2;
          rC = lowRgb[0] + (midRgb[0] - lowRgb[0]) * t;
          gC = lowRgb[1] + (midRgb[1] - lowRgb[1]) * t;
          bC = lowRgb[2] + (midRgb[2] - lowRgb[2]) * t;
        } else {
          const t = (normE - 0.5) * 2;
          rC = midRgb[0] + (highRgb[0] - midRgb[0]) * t;
          gC = midRgb[1] + (highRgb[1] - midRgb[1]) * t;
          bC = midRgb[2] + (highRgb[2] - midRgb[2]) * t;
        }

        const grain = (((px * 193 + py * 251) & 15) - 7.5) * 0.9;
        const idx = (py * texSize + px) * 4;
        data[idx] = Math.max(0, Math.min(255, Math.round(rC * hillshade + grain)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(gC * hillshade + grain)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(bC * hillshade + grain)));
        data[idx + 3] = 255;

        const hVal = Math.max(0, Math.min(255, Math.round(normE * 235 + 10)));
        hData[idx] = hVal;
        hData[idx + 1] = hVal;
        hData[idx + 2] = hVal;
        hData[idx + 3] = 255;

        const slopeMag = Math.min(1, Math.hypot(dzdx, dzdy));
        const rVal = Math.max(150, Math.min(240, Math.round(220 - slopeMag * 45)));
        rData[idx] = rVal;
        rData[idx + 1] = rVal;
        rData[idx + 2] = rVal;
        rData[idx + 3] = 255;
      }
    }

    bhCtx.putImageData(imgData, 0, 0);
    hCtx.putImageData(hImgData, 0, 0);
    rCtx.putImageData(rImgData, 0, 0);
  } else if (bhCtx) {
    const grad = bhCtx.createLinearGradient(0, 0, texSize, texSize);
    grad.addColorStop(0, `rgb(${lowRgb.join(',')})`);
    grad.addColorStop(0.5, `rgb(${midRgb.join(',')})`);
    grad.addColorStop(1, `rgb(${highRgb.join(',')})`);
    bhCtx.fillStyle = grad;
    bhCtx.fillRect(0, 0, texSize, texSize);
  }

  ctx.drawImage(baseHillshadeCanvas, 0, 0, satSize, satSize);
  drawMineralOverlay(ctx);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  const normalMap = computeTangentSpaceNormalMapFromHeightCanvas(heightCanvas, 2.8);
  normalMap.flipY = false;
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.flipY = false;
  roughnessMap.wrapS = THREE.ClampToEdgeWrapping;
  roughnessMap.wrapT = THREE.ClampToEdgeWrapping;

  // Asynchronously drape centered 2x2 real satellite optical tiles (Esri World Imagery) aligned 1:1 with North (-Z)
  if (
    typeof window !== 'undefined' &&
    typeof Image !== 'undefined' &&
    typeof locContext?.latitude === 'number' &&
    typeof locContext?.longitude === 'number'
  ) {
    const lat = locContext.latitude;
    const lon = locContext.longitude;
    const zoom = extentKm <= 2 ? 14 : extentKm <= 5 ? 13 : extentKm <= 10 ? 12 : 11;
    const n = Math.pow(2, zoom);
    const latRad = Math.max(-85, Math.min(85, lat)) * (Math.PI / 180);
    const txFloat = ((lon + 180) / 360) * n;
    const tyFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
    const leftTile = Math.floor(txFloat - 0.5);
    const topTile = Math.floor(tyFloat - 0.5);

    const tileWidthKm = Math.max(0.5, (40075.017 * Math.cos(latRad)) / n);
    const cropPx = Math.max(128, Math.min(480, Math.round((extentKm / tileWidthKm) * 256)));
    const centerPxX = (txFloat - leftTile) * 256;
    const centerPxY = (tyFloat - topTile) * 256;
    const cropX = Math.max(0, Math.min(512 - cropPx, centerPxX - cropPx / 2));
    const cropY = Math.max(0, Math.min(512 - cropPx, centerPxY - cropPx / 2));

    const mosaicCanvas = document.createElement('canvas');
    mosaicCanvas.width = 512;
    mosaicCanvas.height = 512;
    const mCtx = mosaicCanvas.getContext('2d');
    let loadedTiles = 0;
    let settledTiles = 0;

    const flushMosaicToTexture = () => {
      if (!mCtx || loadedTiles === 0) return;
      ctx.clearRect(0, 0, satSize, satSize);
      ctx.drawImage(baseHillshadeCanvas, 0, 0, satSize, satSize);
      ctx.save();
      ctx.globalAlpha = loadedTiles >= 4 ? 0.96 : 0.90;
      ctx.drawImage(mosaicCanvas, cropX, cropY, cropPx, cropPx, 0, 0, satSize, satSize);
      ctx.restore();
      drawMineralOverlay(ctx);
      texture.needsUpdate = true;
      onTextureUpdated?.();
    };

    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        const tileX = ((leftTile + dx) % n + n) % n;
        const tileY = Math.max(0, Math.min(n - 1, topTile + dy));
        const satImg = new Image();
        satImg.crossOrigin = 'anonymous';
        satImg.onload = () => {
          try {
            if (mCtx) {
              mCtx.drawImage(satImg, dx * 256, dy * 256, 256, 256);
              loadedTiles++;
            }
          } catch {
            // Keep DEM hypsometric hillshade if cross-origin canvas draw is restricted
          } finally {
            settledTiles++;
            if (settledTiles >= 4) {
              flushMosaicToTexture();
            }
          }
        };
        satImg.onerror = () => {
          settledTiles++;
          if (settledTiles >= 4) {
            flushMosaicToTexture();
          }
        };
        satImg.src = `/api/providers/imagery/tile/${zoom}/${tileY}/${tileX}`;
      }
    }
  }

  return { map: texture, normalMap, roughnessMap };
}

function inferLithologyColorHex(lithology: string, index: number): string {
  const l = (lithology || '').toLowerCase();
  if (l.includes('ophiolit') || l.includes('peridotit') || l.includes('serpentin') || l.includes('ultramaf') || l.includes('greenschist')) return '#4a5548';
  if (l.includes('basalt') || l.includes('metabasalt') || l.includes('gabbro') || l.includes('mafic') || l.includes('volcan') || l.includes('trachy')) return '#3f4754';
  if (l.includes('granit') || l.includes('rhyolit') || l.includes('monzonite') || l.includes('orthogneiss')) return '#8c786e';
  if (l.includes('gneiss') || l.includes('migmatit') || l.includes('charnockit') || l.includes('crystallin')) return '#646b75';
  if (l.includes('calcschist') || l.includes('bündnerschiefer') || l.includes('marl')) return '#68707a';
  if (l.includes('limestone') || l.includes('dolomit') || l.includes('carbonat') || l.includes('marble') || l.includes('chalk')) return '#98a1ab';
  if (l.includes('sandstone') || l.includes('quartzite') || l.includes('arkose') || l.includes('conglomerate')) return '#b58450';
  if (l.includes('shale') || l.includes('mudstone') || l.includes('siltstone') || l.includes('phyllite') || l.includes('slate') || l.includes('schist')) return '#4e5865';
  if (l.includes('alluv') || l.includes('glacio') || l.includes('moraine') || l.includes('till') || l.includes('sand') || l.includes('gravel') || l.includes('loam') || l.includes('soil')) return '#96825c';
  return index === 0 ? '#96825c' : index === 1 ? '#78716c' : '#4b5563';
}

/**
 * Derive scientifically plausible geological formations for any location on Earth.
 */
export function deriveDynamicFormations(
  loc: SelectedLocation | GeoLocation,
  dossier: DossierResponse | null
): GeologicalFormation[] {
  if (loc.id && GEOLOGICAL_FORMATIONS[loc.id]) {
    return GEOLOGICAL_FORMATIONS[loc.id];
  }

  if (dossier?.geology?.formations && dossier.geology.formations.length > 0) {
    return dossier.geology.formations.map((f, i) => ({
      id: `fmt-dyn-${i}`,
      code: `GEO-${i + 1}`,
      name: f.name,
      supergroup: dossier.geology.province || 'Regional Lithostratigraphic Sequence',
      group: f.name,
      age: f.age || 'Quaternary to Proterozoic',
      primaryLithology: f.lithology,
      secondaryLithology: 'Interbedded strata',
      typicalThicknessMeters: f.thicknessM || (i === 0 ? 50 : i === 1 ? 250 : 1500),
      colorHex: inferLithologyColorHex(`${f.name} ${f.lithology}`, i),
      porosityAvg: f.lithology.toLowerCase().includes('sand') ? 22 : f.lithology.toLowerCase().includes('clay') ? 10 : 2.0,
      densityGcm3: f.densityGcm3 || 2.65,
      hardnessMohs: 4.5,
      status: 'MODELLED' as const
    }));
  }

  const lat = loc.latitude;
  const lon = loc.longitude;
  const state = ('state' in loc && loc.state) ? loc.state : '';

  // Coastal Andhra Pradesh / Krishna-Godavari Delta
  if ((lat >= 14.0 && lat <= 19.5 && lon >= 79.5 && lon <= 84.5) || state.toLowerCase().includes('andhra')) {
    return [
      {
        id: 'fmt-dyn-gk-alv',
        code: 'Q-GK-ALV',
        name: 'Godavari-Krishna Deltaic Alluvium (Coastal Plain)',
        supergroup: 'East Coast Deltaic Fill',
        group: 'Quaternary Fluvial-Marine Deposits',
        age: 'Holocene to Late Pleistocene',
        primaryLithology: 'Fine to medium micaceous quartz sand, silt, and deltaic clay lenses',
        secondaryLithology: 'Deltaic marsh clay with organic matter',
        typicalThicknessMeters: 45,
        colorHex: '#ca8a04',
        porosityAvg: 26.0,
        densityGcm3: 2.05,
        hardnessMohs: 3.0,
        status: 'MODELLED'
      },
      {
        id: 'fmt-dyn-rj-sst',
        code: 'T-RJ-SST',
        name: 'Rajahmundry Sandstone Formation',
        supergroup: 'Coastal Tertiary Sedimentary Belt',
        group: 'Rajahmundry Sandstone Series',
        age: 'Tertiary (Miocene to Pliocene)',
        primaryLithology: 'Ferruginous medium to coarse sandstone with claystone interbeds',
        secondaryLithology: 'Silicified fossiliferous sandstone and clay horizons',
        typicalThicknessMeters: 220,
        colorHex: '#b45309',
        porosityAvg: 16.5,
        densityGcm3: 2.35,
        hardnessMohs: 4.5,
        status: 'MODELLED'
      },
      {
        id: 'fmt-dyn-eg-grn',
        code: 'PR-EG-GRN',
        name: 'Eastern Ghats Granulite Basement (Charnockite & Khondalite)',
        supergroup: 'Eastern Ghats Mobile Belt (EGMB)',
        group: 'High-Grade Metamorphic Basement',
        age: 'Paleoproterozoic to Archean (~1600 Ma)',
        primaryLithology: 'Hypersthene-bearing charnockitic granulite and garnet-sillimanite khondalite',
        secondaryLithology: 'Garnetiferous granite-gneiss and leptynite',
        typicalThicknessMeters: 1400,
        colorHex: '#334155',
        porosityAvg: 1.2,
        densityGcm3: 2.85,
        hardnessMohs: 6.8,
        status: 'MODELLED'
      }
    ];
  }

  // Indo-Gangetic Basin (Punjab, Haryana, UP, Bihar, WB)
  if (lat >= 24.5 && lat <= 32.5 && lon >= 74.0 && lon <= 88.0) {
    return [
      {
        id: 'fmt-dyn-ig-upper',
        code: 'Q-IG-UPR',
        name: 'Upper Gangetic Alluvium (Channel & Silt Facies)',
        supergroup: 'Indo-Gangetic Foredeep Fill',
        group: 'Newer Alluvium (Khadir)',
        age: 'Holocene',
        primaryLithology: 'Micaceous fine-to-medium sand, floodplain silt, and clayey loam',
        secondaryLithology: 'Dispersed calcrete kankar nodules',
        typicalThicknessMeters: 65,
        colorHex: '#ca8a04',
        porosityAvg: 30.0,
        densityGcm3: 1.95,
        hardnessMohs: 2.5,
        status: 'MODELLED'
      },
      {
        id: 'fmt-dyn-ig-lower',
        code: 'Q-IG-LWR',
        name: 'Middle to Lower Alluvium (Coarse Braided Sand Facies)',
        supergroup: 'Indo-Gangetic Foredeep Fill',
        group: 'Older Alluvium (Bhangar)',
        age: 'Late Pleistocene',
        primaryLithology: 'Coarse gravelly quartz sand with thick yellow-brown silty clay lenses',
        secondaryLithology: 'Indurated calcareous paleosols',
        typicalThicknessMeters: 280,
        colorHex: '#d97706',
        porosityAvg: 22.0,
        densityGcm3: 2.15,
        hardnessMohs: 3.5,
        status: 'MODELLED'
      },
      {
        id: 'fmt-dyn-ig-base',
        code: 'PR-DEL-BMT',
        name: 'Sub-Alluvial Basement Ridge (Aravalli-Delhi Extension)',
        supergroup: 'Northern Shield Basement',
        group: 'Delhi Supergroup / Bundelkhand Extension',
        age: 'Mesoproterozoic',
        primaryLithology: 'Massive vitreous quartzite and granite-gneiss',
        secondaryLithology: 'Amphibolite and mica schist',
        typicalThicknessMeters: 1200,
        colorHex: '#475569',
        porosityAvg: 1.5,
        densityGcm3: 2.70,
        hardnessMohs: 7.0,
        status: 'MODELLED'
      }
    ];
  }

  // Default / Global Geological Sequence
  const isWithinIndia = (loc as any).isWithinIndia !== false && (lat >= 6.0 && lat <= 38.0 && lon >= 67.0 && lon <= 98.0);
  if (!isWithinIndia) {
    // Grand Canyon / Colorado Plateau
    if (lat >= 34 && lat <= 41 && lon >= -115 && lon <= -107) {
      return [
        {
          id: 'fmt-glb-gc-kaibab',
          code: 'P-GC-KBB',
          name: 'Kaibab Limestone & Toroweap Formation',
          supergroup: 'Colorado Plateau Upper Paleozoic Sequence',
          group: 'Permian Rim Carbonates',
          age: 'Early Permian (~270 Ma)',
          primaryLithology: 'Fossiliferous cherty limestone, sandy dolomite, and calcareous sandstone',
          secondaryLithology: 'Gypsiferous siltstone interbeds',
          typicalThicknessMeters: 110,
          colorHex: '#d97706',
          porosityAvg: 11.5,
          densityGcm3: 2.58,
          hardnessMohs: 4.2,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-gc-coconino',
          code: 'P-GC-CCN',
          name: 'Coconino Cross-Bedded Aeolian Sandstone & Redwall Limestone',
          supergroup: 'Colorado Plateau Paleozoic Sequence',
          group: 'Coconino-Supai-Redwall Group',
          age: 'Mississippian to Permian (340–275 Ma)',
          primaryLithology: 'Well-sorted quartzose cross-bedded sandstone over karstic marine limestone',
          secondaryLithology: 'Hermit Shale mudstone and siltstone',
          typicalThicknessMeters: 340,
          colorHex: '#b45309',
          porosityAvg: 18.0,
          densityGcm3: 2.42,
          hardnessMohs: 5.5,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-gc-vishnu',
          code: 'PR-GC-VSH',
          name: 'Vishnu Basement Complex (Schist & Zoroaster Granite)',
          supergroup: 'Inner Gorge Crystalline Basement',
          group: 'Vishnu Metamorphic Complex',
          age: 'Paleoproterozoic (~1750 Ma)',
          primaryLithology: 'Mica-hornblende schist intruded by pink granitic pegmatite dykes',
          secondaryLithology: 'Brahma amphibolite and meta-volcanics',
          typicalThicknessMeters: 1400,
          colorHex: '#334155',
          porosityAvg: 1.1,
          densityGcm3: 2.82,
          hardnessMohs: 6.8,
          status: 'MODELLED'
        }
      ];
    }

    // Mount Etna / Volcanic Terranes
    const provLower = (loc.geologicalProvince || '').toLowerCase();
    if (provLower.includes('volcan') || provLower.includes('etna') || provLower.includes('basalt') || provLower.includes('caldera')) {
      return [
        {
          id: 'fmt-glb-vol-tephra',
          code: 'Q-VOL-TPH',
          name: 'Recent Scoria, Tephra & Pahoehoe Lava Mantle',
          supergroup: 'Mongibello Stratovolcanic Construct',
          group: 'Holocene Eruptive Products',
          age: 'Holocene to Recent',
          primaryLithology: 'Vesicular trachybasalt lava flows, scoriaceous lapilli, and volcanic ash',
          secondaryLithology: 'Volcaniclastic breccia and lahars',
          typicalThicknessMeters: 95,
          colorHex: '#475569',
          porosityAvg: 24.0,
          densityGcm3: 2.65,
          hardnessMohs: 5.5,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-vol-edifice',
          code: 'Q-VOL-BSL',
          name: 'Main Stratovolcanic Alkali-Basalt & Dyke Feeder Complex',
          supergroup: 'Valle del Bove Volcanic Succession',
          group: 'Pleistocene Volcanic Centres (Trifoglietto & Ellittico)',
          age: 'Middle to Late Pleistocene',
          primaryLithology: 'Dense porphyritic hawaiite-mugearite lavas and sub-vertical radial feeder dykes',
          secondaryLithology: 'Autobrecciated lava flow bases',
          typicalThicknessMeters: 420,
          colorHex: '#334155',
          porosityAvg: 8.5,
          densityGcm3: 2.86,
          hardnessMohs: 6.2,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-vol-flysch',
          code: 'MZ-SED-BMT',
          name: 'Sub-Volcanic Apennine-Maghrebian Sedimentary Basement',
          supergroup: 'Sicilian Thrust Belt Footwall',
          group: 'Numidian Flysch & Carbonate Platform',
          age: 'Mesozoic to Miocene',
          primaryLithology: 'Quartzarenitic flysch sandstone, marly clay, and platform limestone',
          secondaryLithology: 'Tectonized scaly clay (Argille Scagliose)',
          typicalThicknessMeters: 1400,
          colorHex: '#b45309',
          porosityAvg: 6.0,
          densityGcm3: 2.68,
          hardnessMohs: 5.0,
          status: 'MODELLED'
        }
      ];
    }

    // Andean Cordillera / Atacama Porphyry Copper Belt
    if (lat >= -35 && lat <= -15 && lon >= -72 && lon <= -66) {
      return [
        {
          id: 'fmt-glb-atc-grav',
          code: 'N-ATC-GRV',
          name: 'Atacama Pediment Gravels & Ignimbrite Cover',
          supergroup: 'Central Andean Forearc Fill',
          group: 'Miocene–Pliocene Atacama Gravels',
          age: 'Miocene to Quaternary',
          primaryLithology: 'Hyper-arid alluvial fan gravels, nitrate caliche, and dacitic ignimbrite sheets',
          secondaryLithology: 'Supergene leached jarosite-hematite cap',
          typicalThicknessMeters: 85,
          colorHex: '#d97706',
          porosityAvg: 14.0,
          densityGcm3: 2.30,
          hardnessMohs: 4.0,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-atc-porp',
          code: 'E-ATC-PRP',
          name: 'Domeyko Porphyry Quartz-Monzonite & Supergene Chalcocite Zone',
          supergroup: 'Eocene–Oligocene Porphyry Belt',
          group: 'Domeyko Fault System Intrusives',
          age: 'Eocene–Oligocene (38–31 Ma)',
          primaryLithology: 'Potassic-phyllic altered quartz monzonite porphyry with chalcopyrite-bornite stockwork',
          secondaryLithology: 'Supergene chalcocite enrichment blanket and atacamite oxide zone',
          typicalThicknessMeters: 360,
          colorHex: '#b45309',
          porosityAvg: 5.5,
          densityGcm3: 2.68,
          hardnessMohs: 5.8,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-atc-base',
          code: 'PZ-AND-BMT',
          name: 'Paleozoic Meta-Volcanic & Granitoid Cordilleran Basement',
          supergroup: 'Andean Pre-Mesozoic Basement',
          group: 'Choiyoi & Sierra Castillo Complex',
          age: 'Late Paleozoic to Triassic',
          primaryLithology: 'Rhyolitic meta-volcanics, granodiorite batholiths, and faulted marine sequences',
          secondaryLithology: 'Domeyko mylonitic shear corridors',
          typicalThicknessMeters: 1400,
          colorHex: '#334155',
          porosityAvg: 1.4,
          densityGcm3: 2.78,
          hardnessMohs: 6.5,
          status: 'MODELLED'
        }
      ];
    }

    // Sahara / Nubian Sandstone Megabasin
    if (lat >= 14 && lat <= 32 && lon >= 20 && lon <= 35) {
      return [
        {
          id: 'fmt-glb-nub-aeo',
          code: 'Q-SAH-AEO',
          name: 'Sahara Aeolian Erg Dunes & Playa Sabkha Deposits',
          supergroup: 'Quaternary Desert Cover',
          group: 'Western Desert Erg',
          age: 'Quaternary',
          primaryLithology: 'Well-sorted aeolian quartz dune sand and evaporitic playa silt',
          secondaryLithology: 'Caliche hardpan crusts',
          typicalThicknessMeters: 45,
          colorHex: '#ca8a04',
          porosityAvg: 28.0,
          densityGcm3: 1.92,
          hardnessMohs: 3.2,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-nub-sst',
          code: 'K-NUB-SST',
          name: 'Nubian Continental Quartzose Sandstone Sequence',
          supergroup: 'Nubian Intracratonic Megabasin',
          group: 'Six Hills, Abu Ballas & Sabaya Formations',
          age: 'Paleozoic to Upper Cretaceous',
          primaryLithology: 'Thick cross-bedded fluvial and deltaic quartzose sandstone with kaolinitic mudstone aquitards',
          secondaryLithology: 'Ferruginous oolitic sandstone horizons',
          typicalThicknessMeters: 480,
          colorHex: '#d97706',
          porosityAvg: 23.5,
          densityGcm3: 2.28,
          hardnessMohs: 4.5,
          status: 'MODELLED'
        },
        {
          id: 'fmt-glb-nub-bmt',
          code: 'PR-AFR-BMT',
          name: 'East Saharan Metacraton Gneissic & Granitic Basement',
          supergroup: 'Pan-African & Archean Shield',
          group: 'Uweinat-Bir Safsaf Basement Complex',
          age: 'Neoproterozoic to Archean',
          primaryLithology: 'Biotite-hornblende gneiss, migmatite, and calc-alkaline granite',
          secondaryLithology: 'Fractured Pan-African dyke swarms',
          typicalThicknessMeters: 1300,
          colorHex: '#475569',
          porosityAvg: 1.0,
          densityGcm3: 2.75,
          hardnessMohs: 6.6,
          status: 'MODELLED'
        }
      ];
    }

    // Dossier stratigraphicColumn fallback for any international location
    const stratCol = (dossier?.geology as any)?.stratigraphicColumn;
    if (Array.isArray(stratCol) && stratCol.length > 0) {
      return stratCol.map((u: any, i: number) => ({
        id: `fmt-glb-dos-${i}`,
        code: `GLB-${i + 1}`,
        name: u.unitName || `Stratigraphic Unit ${i + 1}`,
        supergroup: loc.geologicalProvince || 'Regional Lithostratigraphic Sequence',
        group: u.unitName || 'Regional Group',
        age: u.geologicalAge || 'Phanerozoic to Precambrian',
        primaryLithology: u.lithology || 'Consolidated Bedrock',
        secondaryLithology: u.hydrogeologicalRole || 'Subsurface Horizon',
        typicalThicknessMeters: Math.max(25, (u.depthBottomM ?? (i + 1) * 120) - (u.depthTopM ?? i * 80)),
        colorHex: inferLithologyColorHex(`${u.unitName || ''} ${u.lithology || ''}`, i),
        porosityAvg: i === 0 ? 20.0 : i === 1 ? 12.0 : 1.8,
        densityGcm3: i === 0 ? 2.05 : i === 1 ? 2.45 : 2.76,
        hardnessMohs: i === 0 ? 3.5 : i === 1 ? 5.0 : 6.5,
        status: 'MODELLED' as const
      }));
    }
  }

  // Default Cratonic Sequence
  return [
    {
      id: 'fmt-dyn-def-reg',
      code: 'Q-REG-SOIL',
      name: 'Weathered Regolith & Lateritic Soil Mantle',
      supergroup: 'Peninsular Saprolite Mantle',
      group: 'Cenozoic Weathering Crust',
      age: 'Quaternary',
      primaryLithology: 'Humus loam, sandy clay saprolite, and ferruginous gravel',
      secondaryLithology: 'Nodular ferricrete',
      typicalThicknessMeters: 20,
      colorHex: '#ca8a04',
      porosityAvg: 28.0,
      densityGcm3: 1.90,
      hardnessMohs: 2.8,
      status: 'MODELLED'
    },
    {
      id: 'fmt-dyn-def-gneiss',
      code: 'AR-PEN-GNS',
      name: 'Peninsular Gneissic Complex (Regional Basement)',
      supergroup: 'Dharwar-Bundelkhand Cratonic Complex',
      group: 'Archean Tonalite-Trondhjemite-Granodiorite (TTG)',
      age: 'Archean (~3000 Ma)',
      primaryLithology: 'Banded biotite-hornblende gneiss and migmatite',
      secondaryLithology: 'Pegmatite and aplite intrusions',
      typicalThicknessMeters: 1500,
      colorHex: '#475569',
      porosityAvg: 1.0,
      densityGcm3: 2.75,
      hardnessMohs: 6.5,
      status: 'MODELLED'
    }
  ];
}

/**
 * Derive scientifically plausible aquifers for any Indian or global coordinate.
 */
export function deriveDynamicAquifers(
  loc: SelectedLocation | GeoLocation,
  dossier: DossierResponse | null
): AquiferLayer[] {
  if (loc.id && AQUIFER_SYSTEMS[loc.id]) {
    return AQUIFER_SYSTEMS[loc.id];
  }

  const lat = loc.latitude;
  const lon = loc.longitude;
  const state = ('state' in loc && loc.state) ? loc.state : '';
  const locId = loc.id || 'custom-loc';

  const isWithinIndia = (loc as any).isWithinIndia !== false && (lat >= 6.0 && lat <= 38.0 && lon >= 67.0 && lon <= 98.0);
  if (!isWithinIndia) {
    if (dossier?.groundwater?.aquiferContext) {
      const aqCtx = dossier.groundwater.aquiferContext;
      return [
        {
          id: 'aq-glb-whymap-1',
          locationId: locId,
          name: aqCtx.name,
          topDepthM: 18,
          bottomDepthM: 145,
          aquiferType: aqCtx.type.toLowerCase().includes('confined') ? 'Confined' : 'Unconfined',
          principalRock: `${aqCtx.type} (${aqCtx.permeabilityRange})`,
          transmissivityM2Day: 420,
          specificYieldPercent: 8.5,
          waterQualityTdsMgL: 520,
          ecMicrosiemens: 780,
          status: 'MODELLED'
        }
      ];
    }

    // Grand Canyon / Colorado Plateau Regional Karst Aquifer
    if (lat >= 34 && lat <= 41 && lon >= -115 && lon <= -107) {
      return [
        {
          id: 'aq-glb-gc-redwall',
          locationId: locId,
          name: 'Redwall-Muav Deep Karst Carbonate Aquifer (R-Aquifer)',
          topDepthM: 110,
          bottomDepthM: 340,
          aquiferType: 'Confined',
          principalRock: 'Karstified Mississippian Redwall Limestone and Cambrian Muav Dolomite',
          transmissivityM2Day: 680,
          specificYieldPercent: 9.5,
          waterQualityTdsMgL: 390,
          ecMicrosiemens: 585,
          status: 'MODELLED'
        }
      ];
    }
  }

  if ((lat >= 14.0 && lat <= 19.5 && lon >= 79.5 && lon <= 84.5) || state.toLowerCase().includes('andhra')) {
    return [
      {
        id: 'aq-dyn-gk-shallow',
        locationId: locId,
        name: 'Godavari Coastal Unconfined Alluvial Aquifer',
        topDepthM: 2,
        bottomDepthM: 35,
        aquiferType: 'Unconfined',
        principalRock: 'Medium to coarse quartz sand and beach ridge gravels',
        transmissivityM2Day: 850,
        specificYieldPercent: 16.5,
        waterQualityTdsMgL: 680,
        ecMicrosiemens: 1020,
        status: 'MODELLED'
      },
      {
        id: 'aq-dyn-gk-deep',
        locationId: locId,
        name: 'Rajahmundry Sandstone Confined Aquifer',
        topDepthM: 90,
        bottomDepthM: 240,
        aquiferType: 'Confined',
        principalRock: 'Friable ferruginous sandstone with interbedded clay aquitards',
        transmissivityM2Day: 320,
        specificYieldPercent: 4.8,
        waterQualityTdsMgL: 1150,
        ecMicrosiemens: 1725,
        status: 'MODELLED'
      }
    ];
  }

  if (lat >= 24.5 && lat <= 32.5 && lon >= 74.0 && lon <= 88.0) {
    return [
      {
        id: 'aq-dyn-ig-shallow',
        locationId: locId,
        name: 'Upper Gangetic Unconfined Sand Aquifer',
        topDepthM: 5,
        bottomDepthM: 45,
        aquiferType: 'Unconfined',
        principalRock: 'Fine to medium micaceous quartz sand',
        transmissivityM2Day: 1450,
        specificYieldPercent: 18.0,
        waterQualityTdsMgL: 420,
        ecMicrosiemens: 630,
        status: 'MODELLED'
      },
      {
        id: 'aq-dyn-ig-deep',
        locationId: locId,
        name: 'Middle Gangetic Semi-Confined to Confined Deep Aquifer',
        topDepthM: 80,
        bottomDepthM: 260,
        aquiferType: 'Confined',
        principalRock: 'Coarse sand and gravel with clay aquitards',
        transmissivityM2Day: 2200,
        specificYieldPercent: 6.2,
        waterQualityTdsMgL: 580,
        ecMicrosiemens: 870,
        status: 'MODELLED'
      }
    ];
  }

  const isHighland = (dossier?.terrain?.elevationM ?? loc.elevationMeters ?? 0) >= 1400;
  return [
    {
      id: 'aq-dyn-def-weathered',
      locationId: locId,
      name: isHighland ? 'Deep Bedrock Fracture Horizon' : 'Shallow Weathered Regolith Aquifer',
      topDepthM: isHighland ? 34 : 18,
      bottomDepthM: isHighland ? 92 : 48,
      aquiferType: isHighland ? 'Semi-Confined' : 'Unconfined',
      principalRock: isHighland ? 'Jointed crystalline & metamorphic alpine bedrock' : 'Decomposed saprolite and weathered gneiss',
      transmissivityM2Day: isHighland ? 18 : 45,
      specificYieldPercent: isHighland ? 1.8 : 4.5,
      waterQualityTdsMgL: 460,
      ecMicrosiemens: 690,
      status: 'MODELLED'
    },
    {
      id: 'aq-dyn-def-fractured',
      locationId: locId,
      name: 'Deep Fractured Basement Aquifer Zone',
      topDepthM: isHighland ? 120 : 65,
      bottomDepthM: isHighland ? 220 : 165,
      aquiferType: 'Confined',
      principalRock: 'Sheet joints and shear fractures in crystalline gneiss',
      transmissivityM2Day: 28,
      specificYieldPercent: 1.2,
      waterQualityTdsMgL: 780,
      ecMicrosiemens: 1170,
      status: 'MODELLED'
    }
  ];
}

/**
 * Derive mineral prospectivity summary for any Indian or global metallogenic locus.
 */
export function deriveDynamicMinerals(
  loc: SelectedLocation | GeoLocation,
  dossier: DossierResponse | null
): MineralProspectivitySummary | undefined {
  if (loc.id && MINERAL_INDICATORS[loc.id]) {
    return MINERAL_INDICATORS[loc.id];
  }
  const prosp: any = dossier?.geology?.mineralProspectivity;
  if (prosp && prosp.isProspective) {
    return {
      locationId: loc.id || 'custom-loc',
      depositStyle: `${prosp.beltName} (${prosp.depositType})`,
      geologicalHostRock:
        (dossier?.geology as any)?.lithologicalUnit ||
        dossier?.geology?.primaryLithology ||
        loc.geologicalProvince ||
        'Prospective Host Terrane',
      targetCommodities: prosp.commodities || ['Polymetallic Ore'],
      surfaceAlterationFeatures: 'Hydrothermal phyllosilicate & iron-oxide alteration halo with structural shear-zone control',
      regionalProspectivityScore: 'High',
      fieldValidationRequirement: `Mapped by ${prosp.source || 'USGS MRDS / GSI'} (${prosp.distanceKm ?? 0} km proximity). Core drilling required.`,
      spectralIndices: [],
      status: 'MODELLED'
    };
  }
  const combined = `${loc.name || ''} ${loc.geologicalProvince || ''} ${loc.district || ''}`.toLowerCase();
  if (combined.includes('atacama') || combined.includes('escondida') || combined.includes('chuquicamata') || combined.includes('porphyry')) {
    return {
      locationId: loc.id || 'global-atacama',
      depositStyle: 'Andean Supergene-Enriched Porphyry Cu-Mo-Au System',
      geologicalHostRock: 'Eocene-Oligocene Quartz-Monzonite Porphyry & Ignimbrite Cover',
      targetCommodities: ['Copper (Cu)', 'Molybdenum (Mo)', 'Gold (Au)', 'Lithium Brine (Salar)'],
      surfaceAlterationFeatures: 'Jarosite-goethite-hematite leached cap above chalcocite blanket; potassic & phyllic alteration',
      regionalProspectivityScore: 'High',
      fieldValidationRequirement: 'USGS MRDS / SERNAGEOMIN Chile metallogenic province; diamond core & IP geophysics required.',
      spectralIndices: [],
      status: 'MODELLED'
    };
  }
  return undefined;
}

export const Subsurface3D: React.FC<Subsurface3DProps> = ({ className = '', isCompact = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // References for interactive dynamic updates
  const depthClipPlaneRef = useRef<THREE.Plane | null>(null);
  const depthSlicePlaneRef = useRef<THREE.Mesh | null>(null);
  const waterTablePlaneRef = useRef<THREE.Mesh | null>(null);
  const baseWaterTableYRef = useRef<number>(0);
  const aquiferMeshesRef = useRef<THREE.Mesh[]>([]);
  const mineralMeshesRef = useRef<THREE.Mesh[]>([]);
  const strataMeshesRef = useRef<THREE.Mesh[]>([]);
  const strataGroupRef = useRef<THREE.Group | null>(null);

  // Raycasting hover highlight references
  const lastHoveredMeshRef = useRef<THREE.Mesh | null>(null);
  const origEmissiveRef = useRef<THREE.Color | null>(null);
  const origIntensityRef = useRef<number>(0);

  const {
    selectedLocation,
    currentDossier,
    depthMeters,
    waterIntensity,
    waterOpacity,
    activeGroundwaterDepthMbgl,
    isCrossSection2D,
    setIsCrossSection2D,
    showMineralLayers,
    setShowMineralLayers,
    showAquiferLayers,
    setShowAquiferLayers,
    mineralDisplayMode,
    isolatedLayerId,
    setIsolatedLayerId,
    cutawayExaggeration,
    setCutawayExaggeration,
    explorationExtentKm,
    setExplorationExtentKm,
    terrainElevationGrid,
    setTerrainElevationGrid,
    geologicalDisplayMode,
    setGeologicalDisplayMode,
    isPumpingActive,
    setIsPumpingActive,
    cutawayPreset,
    setCutawayPreset,
    currentTimeIndex,
    viewMode,
    setViewMode,
    setExtractionStage
  } = useTerranexusStore();

  // 3D Block Diagram Mode: Full Block vs Corner Cutout vs 3D Stratigraphic Fence Diagram
  // Default to Corner Cut as mandated by platform design standards
  const [cutawayBlockStyle, setCutawayBlockStyle] = useState<'block' | 'corner' | 'fence'>(
    cutawayPreset === 'fence' ? 'fence' : cutawayPreset === 'isometric' ? 'block' : 'corner'
  );

  // Sync with store cutaway preset updates (e.g., Reset to Defaults)
  useEffect(() => {
    const target = cutawayPreset === 'fence' ? 'fence' : cutawayPreset === 'isometric' ? 'block' : 'corner';
    if (target !== cutawayBlockStyle) {
      setCutawayBlockStyle(target);
    }
  }, [cutawayPreset]);

  // Nexus AI Scientific Interpretation Assistant State
  const [aiExplanation, setAiExplanation] = useState<{ entityName: string; reply: string; dataTier: string; isLiveGemini?: boolean; modelUsed?: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [hoveredEntity, setHoveredEntity] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Independent Layer Visibility Toggles (Terrain, Soil/Regolith, Strata) + GSAP Extraction Controller Refs
  const [showSurfaceTerrain, setShowSurfaceTerrain] = useState<boolean>(true);
  const [showSoilRegolith, setShowSoilRegolith] = useState<boolean>(true);
  const [showGeologicalStrata, setShowGeologicalStrata] = useState<boolean>(true);
  const [isReturningToGlobe, setIsReturningToGlobe] = useState<boolean>(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(false);
  const gsapControllerRef = useRef<GsapCutoutController | null>(null);
  const applyPoseAndRenderRef = useRef<(() => void) | null>(null);
  const returnFallbackTimerRef = useRef<number | null>(null);
  const lastExtractedLocationKeyRef = useRef<string>('');
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const regolithMeshesRef = useRef<THREE.Mesh[]>([]);
  const depthMarkerRef = useRef<HTMLDivElement>(null);
  const depthLabelRef = useRef<HTMLSpanElement>(null);
  const waterMarkerRef = useRef<HTMLDivElement>(null);

  const pendingRenderFrameRef = useRef<number | null>(null);
  const requestSceneRender = useCallback(() => {
    if (pendingRenderFrameRef.current !== null) return;
    pendingRenderFrameRef.current = requestAnimationFrame(() => {
      pendingRenderFrameRef.current = null;
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        applyPoseAndRenderRef.current?.();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (returnFallbackTimerRef.current !== null) {
        window.clearTimeout(returnFallbackTimerRef.current);
        returnFallbackTimerRef.current = null;
      }
      if (pendingRenderFrameRef.current !== null) {
        cancelAnimationFrame(pendingRenderFrameRef.current);
        pendingRenderFrameRef.current = null;
      }
    };
  }, []);

  // Ensure cutout pose is cleanly settled and rendered whenever viewMode enters 'cutaway' or 'split'
  useEffect(() => {
    if (viewMode === 'cutaway' || viewMode === 'split') {
      setIsReturningToGlobe(false);
      if (gsapControllerRef.current) {
        gsapControllerRef.current.settleImmediately();
        applyPoseAndRenderRef.current?.();
      }
      requestSceneRender();
    }
  }, [viewMode, requestSceneRender]);

  // Fetch authentic Copernicus GLO-90 DEM grid on coordinate or extent change (skip if already prefetched)
  useEffect(() => {
    const gridMatchesCurrent =
      terrainElevationGrid &&
      Math.abs(terrainElevationGrid.centerLat - selectedLocation.latitude) < 0.002 &&
      Math.abs(terrainElevationGrid.centerLon - selectedLocation.longitude) < 0.002 &&
      terrainElevationGrid.extentKm === explorationExtentKm;
    if (gridMatchesCurrent) return;

    let isMounted = true;
    const fetchGrid = async () => {
      try {
        const url = `/api/providers/elevation/grid?lat=${selectedLocation.latitude}&lon=${selectedLocation.longitude}&extentKm=${explorationExtentKm}&resolution=25`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.grid) {
            setTerrainElevationGrid(json.grid);
          }
        }
      } catch (err) {
        console.warn('[DEM Fetch] Error fetching elevation grid:', err);
      }
    };
    fetchGrid();
    return () => { isMounted = false; };
  }, [selectedLocation.latitude, selectedLocation.longitude, explorationExtentKm, terrainElevationGrid, setTerrainElevationGrid]);

  // Scientific data queries for current location
  const formations = deriveDynamicFormations(selectedLocation, currentDossier);
  const aquifers = deriveDynamicAquifers(selectedLocation, currentDossier);
  const minerals = deriveDynamicMinerals(selectedLocation, currentDossier);
  const borehole = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id);

  // Structural attitude (strike, dip, and tectonic style)
  const structuralAttitude = getTerraneStructuralAttitude(
    selectedLocation.id,
    selectedLocation.latitude,
    selectedLocation.longitude,
    ('state' in selectedLocation && selectedLocation.state) ? selectedLocation.state : ''
  );

  // Vertical scale conversion and expansive landscape dimensions
  const verticalScale = 0.040 * cutawayExaggeration;
  const blockWidth = 44;
  const blockLength = 44;
  const baseDatumY = -34.0 * cutawayExaggeration - 1.0;

  // Water table depth: preserve observed station / borehole depths, or synthesize modelled regional aquifer horizon
  const isWithinIndia = !('isWithinIndia' in selectedLocation) || selectedLocation.isWithinIndia !== false;
  const hasObservedStation = activeGroundwaterDepthMbgl !== null;
  const hasBorehole = !hasObservedStation && !!borehole;
  const hasModelEstimate = isWithinIndia && !hasObservedStation && !hasBorehole && currentDossier?.groundwater?.estimate?.medianDepthMbgl != null;
  const regionalAquiferFallbackDepth = aquifers.length > 0
    ? Math.round((aquifers[0].topDepthM + aquifers[0].bottomDepthM) * 0.35 * 10) / 10
    : 18.5;

  const observedWaterTableDepth: number | null = hasObservedStation
    ? activeGroundwaterDepthMbgl!
    : hasBorehole
      ? borehole!.waterTableDepthMeters
      : hasModelEstimate
        ? currentDossier!.groundwater.estimate.medianDepthMbgl
        : regionalAquiferFallbackDepth;

  // High-precision GSAP Camera View Preset Interpolation
  const applyCameraPreset = useCallback((preset: 'isometric' | 'front' | 'side' | 'top' | 'corner' | 'reset') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    let targetPos = { x: 56, y: 32, z: 56 };
    let targetLook = { x: 0, y: -18, z: 0 };

    switch (preset) {
      case 'front':
        targetPos = { x: 0, y: -8, z: 68 };
        targetLook = { x: 0, y: -18, z: 0 };
        break;
      case 'side':
        targetPos = { x: 68, y: -8, z: 0 };
        targetLook = { x: 0, y: -18, z: 0 };
        break;
      case 'top':
        targetPos = { x: 0, y: 76, z: 0.1 };
        targetLook = { x: 0, y: 0, z: 0 };
        break;
      case 'corner':
        targetPos = { x: 58, y: 30, z: 58 };
        targetLook = { x: 0, y: -18, z: 0 };
        break;
      case 'isometric':
      case 'reset':
      default:
        targetPos = { x: 56, y: 32, z: 56 };
        targetLook = { x: 0, y: -18, z: 0 };
        break;
    }

    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    gsap.to(controls.target, {
      x: targetLook.x,
      y: targetLook.y,
      z: targetLook.z,
      duration: 0.62,
      ease: 'power3.out',
      overwrite: 'auto'
    });

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.62,
      ease: 'power3.out',
      overwrite: 'auto',
      onUpdate: () => {
        camera.lookAt(controls.target);
        controls.update();
        if (rendererRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, camera);
        }
      }
    });
  }, []);

  const handleResetCamera = () => applyCameraPreset('isometric');

  const handleReturnToGlobe = useCallback(() => {
    if (isReturningToGlobe) return;
    setIsReturningToGlobe(true);
    lastExtractedLocationKeyRef.current = '';

    // Clear active Z-axis depth slicing plane immediately so the top surface never flashes while lowering
    if (depthClipPlaneRef.current) {
      depthClipPlaneRef.current.constant = 99999;
    }

    const reduced = prefersReducedMotion();
    const durationSec = reduced ? 0.06 : 0.30;

    if (gsapControllerRef.current) {
      gsapControllerRef.current.startReturnToGlobe({
        durationSec,
        onUpdate: () => {
          applyPoseAndRenderRef.current?.();
          if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
        },
        onComplete: () => {
          setIsReturningToGlobe(false);
        }
      });
    } else {
      setIsReturningToGlobe(false);
    }

    // Trigger unified store transition (atomically sets viewMode='globe' & extractionStage='RETURN_IN_PROGRESS')
    setViewMode('globe');
  }, [isReturningToGlobe, setViewMode]);

  const handleToggle2D = () => {
    setIsCrossSection2D(!isCrossSection2D);
  };

  const handleExplainEntity = async (entity: any) => {
    if (!entity) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const locName = 'displayName' in selectedLocation ? selectedLocation.displayName : selectedLocation.name;
      const prompt = `Explain the geological, hydrological, or metallogenic genesis of: ${entity.name}. Lithology: ${entity.lithology || entity.principalRock || 'N/A'}. Location: ${locName}. Terrane: ${structuralAttitude.structuralStyle}. Depth Range: ${entity.depthRange || 'Surface'}. Data provenance tier: ${entity.dataTier || 'MODELLED'}. Cite relevant GSI / CGWB / USGS literature and physical constraints.`;
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt,
          context: {
            location: selectedLocation,
            depthMeters,
            timeStep: TIME_STEPS[currentTimeIndex] || '2024-11',
            formations,
            aquifers,
            borehole
          }
        })
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Nexus AI returned a non-JSON response (HTTP ${res.status}).`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Nexus AI request failed (HTTP ${res.status}).`);
      }

      if (data?.success && data?.reply) {
        const resMeta = data?.result;
        setAiExplanation({
          entityName: entity.name,
          reply: data.reply,
          dataTier: resMeta?.isLiveGemini ? 'VERIFIED' : (entity.dataTier || 'MODELLED'),
          isLiveGemini: Boolean(resMeta?.isLiveGemini),
          modelUsed: resMeta?.modelUsed
        });
      } else {
        setAiError(data?.error || 'Failed to generate scientific interpretation.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Network error reaching Nexus AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Dispose shared WebGLRenderer only when Subsurface3D unmounts completely
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  // Main Three.js Scene Setup & Re-Render Effect
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer (reuse existing WebGLRenderer across state updates to prevent GPU context churn)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1000);
    cameraRef.current = camera;
    if (cutawayBlockStyle === 'corner') {
      camera.position.set(58, 30, 58);
      camera.lookAt(0, -18, 0);
    } else {
      camera.position.set(56, 32, 56);
      camera.lookAt(0, -18, 0);
    }

    let renderer = rendererRef.current;
    if (!renderer) {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      rendererRef.current = renderer;
    }
    renderer.setSize(width, height);

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const unmaskedRenderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : '';
    const glInfo = `${gl.getParameter(gl.VERSION)} ${gl.getParameter(gl.RENDERER)} ${unmaskedRenderer}`;
    const isSoftwareGl =
      Boolean(typeof navigator !== 'undefined' && navigator.webdriver) ||
      /SwiftShader|llvmpipe|softpipe|Software/i.test(glInfo);

    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // Static land block shadows only need rendering on scene change
    renderer.shadowMap.needsUpdate = !isSoftwareGl;
    renderer.localClippingEnabled = true;
    if (!container.contains(renderer.domElement)) {
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    }

    let envTexture: THREE.Texture | null = null;
    if (!isSoftwareGl) {
      try {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;
        scene.environmentIntensity = 0.65;
        pmremGenerator.dispose();
      } catch {
        // Fallback if PMREM generation fails on constrained contexts
      }
    } else {
      const ew = 16;
      const eh = 8;
      const envData = new Uint8Array(ew * eh * 4);
      for (let y = 0; y < eh; y++) {
        const isUpperHemisphere = y >= eh / 2;
        const t = Math.abs(y - (eh - 1) / 2) / (eh / 2);
        const r = isUpperHemisphere ? Math.round(145 + t * 85) : Math.round(28 + (1 - t) * 32);
        const g = isUpperHemisphere ? Math.round(180 + t * 65) : Math.round(38 + (1 - t) * 40);
        const b = isUpperHemisphere ? Math.round(220 + t * 35) : Math.round(52 + (1 - t) * 45);
        for (let x = 0; x < ew; x++) {
          const i = (y * ew + x) * 4;
          envData[i] = r;
          envData[i + 1] = g;
          envData[i + 2] = b;
          envData[i + 3] = 255;
        }
      }
      const dataEnv = new THREE.DataTexture(envData, ew, eh, THREE.RGBAFormat);
      dataEnv.mapping = THREE.EquirectangularReflectionMapping;
      dataEnv.colorSpace = THREE.SRGBColorSpace;
      dataEnv.needsUpdate = true;
      envTexture = dataEnv;
      scene.environment = envTexture;
      scene.environmentIntensity = 0.72;
    }
    scene.fog = new THREE.FogExp2(0x060911, 0.0028);

    // 2. OrbitControls with clamped zoom and orientation limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    if (typeof window !== 'undefined') {
      (window as any).__subsurfaceCamera = camera;
      (window as any).__subsurfaceControls = controls;
    }
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, -18, 0);
    controls.minDistance = 18;
    controls.maxDistance = 140;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;

    // 3. Three-Point Adaptive Scientific Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.40);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.50);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffef0, 1.45);
    sunLight.position.set(40, 65, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 180;
    sunLight.shadow.camera.left = -35;
    sunLight.shadow.camera.right = 35;
    sunLight.shadow.camera.top = 35;
    sunLight.shadow.camera.bottom = -35;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.20);
    rimLight.position.set(-35, -20, -25);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xf59e0b, 0.15);
    bounceLight.position.set(20, -35, 25);
    scene.add(bounceLight);

    // Geotechnical Datum Platform & Coordinate Grid (SwissTopo / CAD Workstation Standard)
    const gridHelper = new THREE.GridHelper(blockWidth * 1.35, 18, 0x0ea5e9, 0x1e293b);
    gridHelper.position.set(0, baseDatumY, 0);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // Subtle Radial Contact Shadow Disc beneath floating cutout to visually anchor it to the datum
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 124);
      grad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
      grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.25)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(blockWidth * 0.72, 48), shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.set(0, baseDatumY + 0.05, 0);
    scene.add(shadowDisc);

    // 4. Main Stratigraphic Group & Clipping Planes
    const strataGroup = new THREE.Group();
    strataGroupRef.current = strataGroup;
    scene.add(strataGroup);

    // Depth Clipping Plane (horizontal slice; disabled in Corner Cut mode so full surface terrain relief is preserved)
    const depthClipPlane = new THREE.Plane(
      new THREE.Vector3(0, -1, 0),
      depthMeters <= 0 || cutawayBlockStyle === 'corner' ? 99999 : -depthMeters * verticalScale
    );
    depthClipPlaneRef.current = depthClipPlane;

    const activeClippingPlanes: THREE.Plane[] = [depthClipPlane];

    const interactiveObjects: THREE.Object3D[] = [];
    strataMeshesRef.current = [];
    regolithMeshesRef.current = [];
    aquiferMeshesRef.current = [];
    mineralMeshesRef.current = [];
    terrainMeshRef.current = null;
    const regionSeed = Math.abs(Math.round(selectedLocation.latitude * 1000 + selectedLocation.longitude * 1000));
    const polyAngularSegs = isSoftwareGl ? 40 : 96;
    const polyRadialRings = isSoftwareGl ? 10 : 26;
    const isCornerCut = cutawayBlockStyle === 'corner';

    // -------------------------------------------------------------
    // CONTINUOUS SURFACE ELEVATION FUNCTION (REAL COPERNICUS GLO-90 DEM GRID)
    // -------------------------------------------------------------
    const getSurfaceElevation = (x: number, z: number): number => {
      // 1. Real Copernicus GLO-90 DEM Grid Elevation (Bilinear Interpolation)
      if (terrainElevationGrid && terrainElevationGrid.elevations?.length > 0) {
        const grid = terrainElevationGrid;
        const rows = grid.elevations.length;
        const cols = grid.elevations[0].length;
        const meanEle = grid.meanElevationM || 0;
        const reliefRange = Math.max(grid.maxElevationM - grid.minElevationM, 6.0);
        const targetSceneRelief = Math.min(5.8, Math.max(1.8, Math.log10(reliefRange + 1) * 1.9));
        const demScale = (targetSceneRelief / reliefRange) * Math.min(cutawayExaggeration, 2.0);

        const u = Math.max(0, Math.min(1, (x + blockWidth / 2) / blockWidth));
        const v = Math.max(0, Math.min(1, (z + blockLength / 2) / blockLength));

        const rFloat = v * (rows - 1);
        const cFloat = u * (cols - 1);
        const r0 = Math.floor(rFloat);
        const r1 = Math.min(rows - 1, r0 + 1);
        const c0 = Math.floor(cFloat);
        const c1 = Math.min(cols - 1, c0 + 1);
        const fr = rFloat - r0;
        const fc = cFloat - c0;

        const e00 = grid.elevations[r0][c0];
        const e10 = grid.elevations[r0][c1];
        const e01 = grid.elevations[r1][c0];
        const e11 = grid.elevations[r1][c1];

        const ele = (1 - fc) * ((1 - fr) * e00 + fr * e01) + fc * ((1 - fr) * e10 + fr * e11);
        return Math.max(-4.5, Math.min(5.5, (ele - meanEle) * demScale));
      }

      // 2. Regional Geomorphological Relief Fallback (only while DEM request is in flight)
      const isAravalli = selectedLocation.id.includes('khetri') || selectedLocation.id.includes('zawar');
      const isDeccan = selectedLocation.id.includes('pune');
      const isCraton = selectedLocation.id.includes('kolar') || selectedLocation.id.includes('singhbhum');

      if (isAravalli) {
        const strikeRad = (structuralAttitude.strikeDeg * Math.PI) / 180;
        const normalCoord = x * Math.cos(strikeRad) + z * Math.sin(strikeRad);
        return (
          Math.sin(normalCoord * 0.22) * 3.8 +
          Math.cos(normalCoord * 0.45) * 1.2 +
          Math.sin(z * 0.15) * 0.7
        ) * cutawayExaggeration;
      }

      if (isDeccan) {
        const rawRelief = Math.sin(x * 0.10) * 3.0 + Math.cos(z * 0.12) * 2.5;
        const terraceStep = Math.floor(rawRelief / 1.6) * 1.1 + (rawRelief % 1.6) * 0.35;
        return terraceStep * cutawayExaggeration;
      }

      if (isCraton) {
        return (
          Math.sin(x * 0.12 + 0.5) * Math.cos(z * 0.10 - 0.4) * 3.2 +
          Math.sin((x + z) * 0.20) * 1.1
        ) * cutawayExaggeration;
      }

      const rollingTerraces =
        Math.sin(x * 0.08 + 0.4) * Math.cos(z * 0.07 - 0.3) * 1.8 +
        Math.sin((x + z) * 0.14) * 0.75 +
        Math.cos((x - z) * 0.16) * 0.5;
      const regionalSlope = -0.03 * x + 0.02 * z;
      return (rollingTerraces + regionalSlope) * cutawayExaggeration;
    };

    // -------------------------------------------------------------
    // A. TOP TERRAIN DISPLACED RELIEF SURFACE MESH (REAL DEM + SATELLITE DRAPERY)
    // -------------------------------------------------------------
    const terrainGeo = buildIrregularPolygonTerrainGeometry(
      getSurfaceElevation,
      blockWidth,
      blockLength,
      polyAngularSegs,
      polyRadialRings,
      regionSeed,
      isCornerCut
    );

    const elevationSourceLabel = terrainElevationGrid?.sourceDataset || 'Copernicus Global 90m DEM (GLO-90)';
    const elevationDataTier = terrainElevationGrid?.status === 'OBSERVED' ? 'OBSERVED' : 'MODELLED';

    const terrainPbr = generateTerrainTexture(
      selectedLocation.id,
      showMineralLayers && minerals ? mineralDisplayMode : ('none' as any),
      selectedLocation as any,
      terrainElevationGrid,
      explorationExtentKm,
      currentDossier?.soil,
      currentDossier?.climate,
      () => {
        if (!isDisposed) {
          requestSceneRender();
        }
      }
    );
    const maxAniso = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    terrainPbr.map.anisotropy = maxAniso;
    terrainPbr.normalMap.anisotropy = maxAniso;
    terrainPbr.roughnessMap.anisotropy = maxAniso;

    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainPbr.map,
      normalMap: terrainPbr.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: terrainPbr.roughnessMap,
      roughness: 0.88,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: false,
      side: THREE.DoubleSide
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = 0.05;
    terrainMesh.visible = showSurfaceTerrain;
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    const meanEleDisplay = terrainElevationGrid
      ? Math.round(terrainElevationGrid.meanElevationM)
      : (selectedLocation.elevationMeters ?? 0);
    terrainMesh.userData = {
      type: 'SURFACE_TERRAIN',
      name: 'Earth Surface & Topographic Relief',
      description: `Mean Elevation: ${meanEleDisplay}m ASL (Block Relief: ${terrainElevationGrid ? `${terrainElevationGrid.minElevationM}m – ${terrainElevationGrid.maxElevationM}m` : 'Awaiting DEM'}). Derived from ${elevationSourceLabel} with analytical hillshading & Esri optical imagery (${explorationExtentKm}km extent).`,
      sourceDataset: elevationSourceLabel,
      depthRange: '0m Surface',
      dataTier: elevationDataTier
    };
    strataGroup.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;
    interactiveObjects.push(terrainMesh);

    // Subtle Geotechnical Cut Boundary Rim
    const rimPoints: THREE.Vector3[] = [];
    const startAngle = isCornerCut ? Math.PI * 0.5 : 0;
    const endAngle = Math.PI * 2;
    const rimRadiusBase = Math.min(blockWidth, blockLength) * 0.49;
    for (let s = 0; s <= polyAngularSegs; s++) {
      const t = s / polyAngularSegs;
      const theta = startAngle + t * (endAngle - startAngle);
      const rScale = getGeographicalBoundaryRadius(theta, regionSeed);
      const rx = Math.cos(theta) * rimRadiusBase * rScale;
      const rz = Math.sin(theta) * rimRadiusBase * rScale;
      rimPoints.push(new THREE.Vector3(rx, getSurfaceElevation(rx, rz) + 0.14, rz));
    }
    if (isCornerCut) {
      for (let r = polyRadialRings; r >= 0; r--) {
        const frac = r / polyRadialRings;
        const rScaleEnd = getGeographicalBoundaryRadius(endAngle, regionSeed);
        const rx = frac * rimRadiusBase * rScaleEnd;
        rimPoints.push(new THREE.Vector3(rx, getSurfaceElevation(rx, 0) + 0.14, 0));
      }
      for (let r = 1; r <= polyRadialRings; r++) {
        const frac = r / polyRadialRings;
        const rScaleStart = getGeographicalBoundaryRadius(startAngle, regionSeed);
        const rz = frac * rimRadiusBase * rScaleStart;
        rimPoints.push(new THREE.Vector3(0, getSurfaceElevation(0, rz) + 0.14, rz));
      }
    }
    const rimGeo = new THREE.BufferGeometry().setFromPoints(rimPoints);
    const rimMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.52
    });
    const rimLine = new THREE.Line(rimGeo, rimMat);
    strataGroup.add(rimLine);

    // -------------------------------------------------------------
    // B. STRUCTURAL ATTITUDE & CONTACT BOUNDARY FUNCTIONS
    // -------------------------------------------------------------
    const dipDirectionAzimuths: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    const dipRad = (structuralAttitude.dipDeg * Math.PI) / 180;
    const dipAzimuthDeg = dipDirectionAzimuths[structuralAttitude.dipDirection] ?? ((structuralAttitude.strikeDeg + 90) % 360);
    const dipAzimuth = (dipAzimuthDeg * Math.PI) / 180;
    const sinDipAz = Math.sin(dipAzimuth);
    const cosDipAz = Math.cos(dipAzimuth);
    const dipSlope = Math.tan(dipRad);

    const dipScale = 0.70 * cutawayExaggeration;
    const undulScale = structuralAttitude.undulationAmplitude * 0.25 * cutawayExaggeration;

    const getDipOffset = (x: number, z: number) => {
      const distAlongDip = x * sinDipAz - z * cosDipAz;
      return -distAlongDip * dipSlope * dipScale;
    };

    const getUndulation = (x: number, z: number, phase: number) => {
      return (
        Math.sin(x * 0.16 + phase) * Math.cos(z * 0.14 + phase * 0.7) * 0.75 +
        Math.sin((x + z) * 0.24 + phase * 1.2) * 0.40
      ) * undulScale;
    };

    // -------------------------------------------------------------
    // C. VOLUMETRIC REGOLITH LAYER (PEDOLOGICAL SOIL PROFILE)
    // -------------------------------------------------------------
    const regolithThk = (x: number, z: number) => {
      const ele = getSurfaceElevation(x, z);
      return Math.max(1.2, 2.2 - ele * 0.25) * cutawayExaggeration;
    };
    const regolithTopFunc = (x: number, z: number) => getSurfaceElevation(x, z);
    const regolithBotFunc = (x: number, z: number) => getSurfaceElevation(x, z) - regolithThk(x, z);

    const regolithGeo = buildIrregularPolygonStratumGeometry(
      regolithTopFunc,
      regolithBotFunc,
      blockWidth,
      blockLength,
      polyAngularSegs,
      polyRadialRings,
      4.0,
      regionSeed,
      isCornerCut
    );
    const soil = currentDossier?.soil;
    const soilColorHex = soil
      ? soil.sandPercent >= 60
        ? '#8f7248'
        : soil.clayPercent >= 36
          ? '#4b3e33'
          : soil.organicCarbonGKg >= 22
            ? '#382c22'
            : (soil.ph ?? 7.0) < 5.8
              ? '#734227'
              : '#5c452d'
      : '#573919';
    const regolithLithDesc = soil
      ? `${soil.textureClass} (Clay ${soil.clayPercent}% · Sand ${soil.sandPercent}% · Silt ${soil.siltPercent}%) · pH ${soil.ph} · SOC ${soil.organicCarbonGKg} g/kg`
      : 'Humus loam, sandy clay saprolite, and organic subsoil';
    const regolithPbr = generateLithologyPbrTextures('Q-SOIL-REG', regolithLithDesc, soilColorHex);
    regolithPbr.map.anisotropy = maxAniso;
    regolithPbr.normalMap.anisotropy = maxAniso;

    const regolithMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: regolithPbr.map,
      normalMap: regolithPbr.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      roughnessMap: regolithPbr.roughnessMap,
      roughness: 0.90,
      metalness: 0.03,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: false,
      side: THREE.DoubleSide
    });
    const regolithMesh = new THREE.Mesh(regolithGeo, regolithMat);
    regolithMesh.visible = showSoilRegolith;
    regolithMesh.receiveShadow = true;
    regolithMesh.castShadow = true;
    regolithMesh.userData = {
      type: 'STRATUM',
      name: soil ? `Topsoil & Regolith (${soil.textureClass})` : 'Weathered Regolith & Soil Overburden',
      lithology: regolithLithDesc,
      age: 'Quaternary / Modern Soil Profile',
      depthRange: '0m – 15m',
      porosity: soil ? `${Math.round(Math.max(18, 48 - soil.bulkDensityGcm3 * 12))}%` : '32.0%',
      density: soil ? `${soil.bulkDensityGcm3} g/cm³` : '1.85 g/cm³',
      thickness: soil ? `${soil.drainageClass} Drainage` : '2m – 15m',
      dataTier: soil?.dataTier || 'MODELLED'
    };
    strataGroup.add(regolithMesh);
    interactiveObjects.push(regolithMesh);
    regolithMeshesRef.current.push(regolithMesh);

    // -------------------------------------------------------------
    // D. WATERTIGHT DIPPING & UNDULATING GEOLOGICAL STRATA STACK
    // -------------------------------------------------------------
    let accumulatedDepth = 2.4 * cutawayExaggeration;
    const contactFuncs: ((x: number, z: number) => number)[] = [];

    // Contact 0: Conforms directly to the bottom of the regolith mantle
    contactFuncs.push(regolithBotFunc);

    formations.forEach((formation, idx) => {
      const baseThickness = Math.max(formation.typicalThicknessMeters * verticalScale, 4.5);
      accumulatedDepth += baseThickness;
      const refY = -accumulatedDepth;
      const phase = (idx + 1) * 1.8;
      const prevContactFunc = contactFuncs[idx];

      if (idx === formations.length - 1) {
        // Deepest bedrock base: flat horizontal bottom datum
        contactFuncs.push((x: number, z: number) => Math.min(prevContactFunc(x, z) - 1.5, baseDatumY));
      } else {
        contactFuncs.push((x: number, z: number) => {
          const dip = getDipOffset(x, z);
          let sedimentPinch = 0;
          if (idx === 0) {
            // Upper formation: gentle basinward thickening
            sedimentPinch = -0.8 * Math.cos(x * 0.08) * Math.cos(z * 0.08);
          } else if (idx === 1) {
            // Middle formation: lenticular bed thickness modulation
            sedimentPinch = -1.0 * Math.sin(x * 0.11 + 0.6) * Math.cos(z * 0.09);
          } else {
            // Basal unconformity: palaeo-erosional relief surface
            sedimentPinch = 1.1 * Math.sin(x * 0.15 + phase) * Math.cos(z * 0.13 - phase * 0.6);
          }
          const undul = getUndulation(x, z, phase);
          return Math.min(prevContactFunc(x, z) - 1.6, refY + dip + sedimentPinch + undul);
        });
      }
    });

    // Create volumetric 3D meshes for each formation
    formations.forEach((formation, idx) => {
      const topFunc = contactFuncs[idx];
      const botFunc = contactFuncs[idx + 1];

      // Procedural PBR materials with meter-anchored UV coordinates and Sobel tangent-space normal maps
      const pbr = generateLithologyPbrTextures(formation.code, formation.primaryLithology, formation.colorHex);
      pbr.map.anisotropy = maxAniso;
      pbr.normalMap.anisotropy = maxAniso;
      pbr.roughnessMap.anisotropy = maxAniso;
      const slabGeo = buildIrregularPolygonStratumGeometry(
        topFunc,
        botFunc,
        blockWidth,
        blockLength,
        polyAngularSegs,
        polyRadialRings,
        4.0,
        regionSeed,
        isCornerCut
      );

      // In fence mode strata blocks become translucent; in 3D Block & Corner Cut modes rock walls stay crisp and opaque
      const isFenceActive = cutawayBlockStyle === 'fence';
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: pbr.map,
        normalMap: pbr.normalMap,
        normalScale: new THREE.Vector2(0.95, 0.95),
        roughnessMap: pbr.roughnessMap,
        roughness: pbr.roughness,
        metalness: pbr.metalness,
        transparent: isFenceActive,
        opacity: isFenceActive ? 0.22 : 1.0,
        depthWrite: !isFenceActive,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: false,
        side: THREE.DoubleSide
      });

      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.visible = showGeologicalStrata;
      slabMesh.receiveShadow = true;
      slabMesh.castShadow = true;

      slabMesh.userData = {
        type: 'STRATUM',
        id: formation.id,
        name: formation.name,
        code: formation.code,
        group: formation.group,
        supergroup: formation.supergroup,
        lithology: formation.primaryLithology,
        secondaryLithology: formation.secondaryLithology,
        age: formation.age,
        porosity: `${formation.porosityAvg}%`,
        density: `${formation.densityGcm3} g/cm³`,
        hardness: `${formation.hardnessMohs} Mohs`,
        thickness: `~${formation.typicalThicknessMeters}m`,
        depthRange: `-${Math.round(idx === 0 ? 15 : formations.slice(0, idx).reduce((s, f) => s + f.typicalThicknessMeters, 0))}m to -${Math.round(formations.slice(0, idx + 1).reduce((s, f) => s + f.typicalThicknessMeters, 0))}m`,
        dataTier: formation.status || 'MODELLED',
        basalDatumDisclosure: idx === formations.length - 1 ? 'Flat basal datum represents a technical model cut-off boundary, not a confirmed geological contact.' : undefined
      };

      strataGroup.add(slabMesh);
      interactiveObjects.push(slabMesh);
      strataMeshesRef.current.push(slabMesh);

      // Boundary wireframe lines only in fence mode so solid rock walls stay photorealistic and smooth
      if (isFenceActive) {
        const wireGeo = new THREE.EdgesGeometry(slabGeo, 28);
        const wireMat = new THREE.LineBasicMaterial({
          color: 0x334155,
          transparent: true,
          opacity: 0.22,
          clippingPlanes: activeClippingPlanes
        });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        strataGroup.add(wireframe);
      }
    });

    // Distinct Geological Contact Seam Lines on Outer Cliff & Internal Cutaway Walls
    {
      const contactLineMat = new THREE.LineBasicMaterial({
        color: 0x0f172a,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.78,
        clippingPlanes: activeClippingPlanes
      });
      const baseR = Math.min(blockWidth, blockLength) * 0.491;
      const startAng = isCornerCut ? Math.PI * 0.5 : 0;
      const endAng = Math.PI * 2;
      const rEndZ = baseR * getGeographicalBoundaryRadius(Math.PI * 0.5, regionSeed);
      const rEndX = baseR * getGeographicalBoundaryRadius(Math.PI * 2, regionSeed);

      contactFuncs.forEach((cFunc) => {
        // Outer perimeter geological contact trace
        const outerPts: THREE.Vector3[] = [];
        for (let s = 0; s <= polyAngularSegs; s++) {
          const theta = startAng + (s / polyAngularSegs) * (endAng - startAng);
          const rad = baseR * getGeographicalBoundaryRadius(theta, regionSeed);
          const cx = Math.cos(theta) * rad;
          const cz = Math.sin(theta) * rad;
          outerPts.push(new THREE.Vector3(cx, cFunc(cx, cz), cz));
        }
        strataGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outerPts), contactLineMat));

        if (isCornerCut) {
          const wall1Pts: THREE.Vector3[] = [];
          for (let s = 0; s <= 32; s++) {
            const z = (s / 32) * rEndZ;
            wall1Pts.push(new THREE.Vector3(0.03, cFunc(0, z), z));
          }
          strataGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wall1Pts), contactLineMat));

          const wall2Pts: THREE.Vector3[] = [];
          for (let s = 0; s <= 32; s++) {
            const x = (s / 32) * rEndX;
            wall2Pts.push(new THREE.Vector3(x, cFunc(x, 0), 0.03));
          }
          strataGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wall2Pts), contactLineMat));
        }
      });
    }

    // -------------------------------------------------------------
    // E. VOLUMETRIC AQUIFERS & GROUNDWATER SATURATION HORIZONS
    // -------------------------------------------------------------
    aquifers.forEach((aquifer) => {
      const topDepthScaled = Math.max(aquifer.topDepthM * verticalScale, 3.6);
      const botDepthScaled = Math.max(aquifer.bottomDepthM * verticalScale, 6.2);
      const topY = -topDepthScaled;
      const botY = -botDepthScaled;

      const aqTopFunc = (x: number, z: number) =>
        clampAquiferInterval(
          getSurfaceElevation(x, z),
          topY + getDipOffset(x, z) * 0.6,
          botY + getDipOffset(x, z) * 0.6,
          3.8
        ).topY;
      const aqBotFunc = (x: number, z: number) =>
        clampAquiferInterval(
          getSurfaceElevation(x, z),
          topY + getDipOffset(x, z) * 0.6,
          botY + getDipOffset(x, z) * 0.6,
          3.8
        ).botY;

      // Recessed slightly inside outer cliff in Corner/Block mode so rock cliffs retain crisp natural lithology textures
      const aqScale = cutawayBlockStyle === 'fence' ? 1.001 : 0.996;
      const aqGeo = buildIrregularPolygonStratumGeometry(
        aqTopFunc,
        aqBotFunc,
        blockWidth * aqScale,
        blockLength * aqScale,
        polyAngularSegs,
        polyRadialRings,
        4.0,
        regionSeed,
        isCornerCut
      );
      const aqMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x0284c7),
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 0.28 * waterIntensity,
        roughness: 0.22,
        metalness: 0.12,
        transparent: true,
        opacity: waterOpacity * (cutawayBlockStyle === 'fence' ? 0.55 : 0.38) * (showAquiferLayers ? 1 : 0),
        depthWrite: false,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: false,
        side: THREE.DoubleSide
      });

      const aqMesh = new THREE.Mesh(aqGeo, aqMat);
      aqMesh.visible = showAquiferLayers && (cutawayBlockStyle === 'fence' || !showGeologicalStrata);
      aqMesh.userData = {
        type: 'AQUIFER',
        id: aquifer.id,
        name: aquifer.name,
        aquiferType: aquifer.aquiferType,
        depthRange: `${aquifer.topDepthM}m – ${aquifer.bottomDepthM}m mbgl`,
        principalRock: aquifer.principalRock,
        transmissivity: `${aquifer.transmissivityM2Day} m²/day`,
        specificYield: `${aquifer.specificYieldPercent}%`,
        waterQualityTds: `${aquifer.waterQualityTdsMgL} mg/L`,
        dataTier: aquifer.status || 'MODELLED'
      };

      strataGroup.add(aqMesh);
      interactiveObjects.push(aqMesh);
      aquiferMeshesRef.current.push(aqMesh);
    });

    // Unified Borehole Position: Placed squarely on solid ground ledge (-5.5, 4.5) in Corner Cut
    // mode so monument & drill string never hover over the carved-out (x > 0, z > 0) void.
    const bhX = borehole ? (isCornerCut ? -5.5 : 8) : 0;
    const bhZ = borehole ? (isCornerCut ? 4.5 : 8) : 0;

    // -------------------------------------------------------------
    // F. PHREATIC WATER TABLE HORIZON & 3D WATER CUTOUT WEDGE
    // -------------------------------------------------------------
    if (observedWaterTableDepth !== null) {
      const waterTableTier: 'OBSERVED' | 'INTERPOLATED' | 'MODELLED' = hasObservedStation
        ? 'OBSERVED'
        : hasBorehole
          ? 'OBSERVED'
          : 'MODELLED';

      const waterTableDescription = hasObservedStation
        ? `Observed piezometric level at -${observedWaterTableDepth.toFixed(1)} mbgl (CGWB/State monitoring well within 50 km).`
        : hasBorehole
          ? `Water table at -${observedWaterTableDepth.toFixed(1)} mbgl from borehole log ${borehole!.wellCode}.`
          : hasModelEstimate
            ? `Modelled statistical water table estimate at -${observedWaterTableDepth.toFixed(1)} mbgl.`
            : `Regional aquifer horizon baseline estimate at -${observedWaterTableDepth.toFixed(1)} mbgl (synthesized from regional hydrogeological domain).`;

      const wtPlaneY = -Math.max(observedWaterTableDepth * verticalScale, 3.4);
      // Physical pumping parameters: Q = 12.0 L/s = 1036.8 m3/day
      const q_m3_day = 1036.8;
      const t_m2_day = (aquifers.length > 0 && aquifers[0].transmissivityM2Day > 0) ? aquifers[0].transmissivityM2Day : 65.0;
      const radiusOfInfluence = 16.5;
      const rWell = 0.6;
      // Thiem drawdown scale factor s_0 = Q / (2 * pi * T)
      const thiemFactor = (q_m3_day / (2 * Math.PI * t_m2_day)) * 0.22 * verticalScale;
      const maxDrawdown = Math.min(Math.max(thiemFactor * Math.log(radiusOfInfluence / rWell), 2.2 * verticalScale), 6.2 * verticalScale);

      const getWaterTableSurface = (vx: number, vz: number): number => {
        const surfaceY = getSurfaceElevation(vx, vz);
        const regionalSlope = surfaceY * 0.18;
        const pumpCenterX = isCornerCut ? 2.2 : bhX;
        const pumpCenterZ = isCornerCut ? 2.2 : bhZ;
        const distToWell = Math.sqrt((vx - pumpCenterX) ** 2 + (vz - pumpCenterZ) ** 2);
        let drawdown = 0;

        if (isPumpingActive && distToWell < radiusOfInfluence) {
          const effectiveR = Math.max(distToWell, rWell);
          const rawDrawdown = maxDrawdown * (Math.log(radiusOfInfluence / effectiveR) / Math.log(radiusOfInfluence / rWell));
          const aquiferH = aquifers.length > 0 ? (aquifers[0].bottomDepthM - aquifers[0].topDepthM) * verticalScale : 0;
          if (aquifers[0]?.aquiferType === 'Unconfined' && aquiferH > 0 && 2 * rawDrawdown < aquiferH) {
            drawdown = aquiferH - Math.sqrt(Math.max(0, aquiferH * aquiferH - 2 * aquiferH * rawDrawdown));
          } else {
            drawdown = rawDrawdown;
          }
        }
        return computeClampedHydroSurfaceY(surfaceY, wtPlaneY + regionalSlope - drawdown, 3.4);
      };

      // Procedural water ripple normal map for realistic specular water highlights
      const rippleCanvas = document.createElement('canvas');
      rippleCanvas.width = 256;
      rippleCanvas.height = 256;
      const ripCtx = rippleCanvas.getContext('2d');
      if (ripCtx) {
        const ripImg = ripCtx.createImageData(256, 256);
        const rData = ripImg.data;
        for (let py = 0; py < 256; py++) {
          for (let px = 0; px < 256; px++) {
            const u = (px / 256) * Math.PI * 2;
            const v = (py / 256) * Math.PI * 2;
            const dx = Math.cos(u * 6 + v * 2) * 0.45 + Math.sin(u * 11 - v * 7) * 0.35;
            const dy = Math.sin(v * 6 - u * 3) * 0.45 + Math.cos(v * 10 + u * 5) * 0.35;
            const idx = (py * 256 + px) * 4;
            rData[idx] = Math.round(128 + dx * 48);
            rData[idx + 1] = Math.round(128 + dy * 48);
            rData[idx + 2] = 248;
            rData[idx + 3] = 255;
          }
        }
        ripCtx.putImageData(ripImg, 0, 0);
      }
      const waterRippleNormalMap = new THREE.CanvasTexture(rippleCanvas);
      waterRippleNormalMap.wrapS = THREE.RepeatWrapping;
      waterRippleNormalMap.wrapT = THREE.RepeatWrapping;
      waterRippleNormalMap.repeat.set(3, 3);

      // Recessed inside the solid block so it never protrudes outside the land perimeter
      const wtPlaneGeo = buildIrregularPolygonTerrainGeometry(
        getWaterTableSurface,
        blockWidth * 0.994,
        blockLength * 0.994,
        polyAngularSegs,
        polyRadialRings,
        regionSeed,
        isCornerCut
      );

      const wtPlaneMat = new THREE.MeshPhysicalMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.26 * waterIntensity,
        normalMap: waterRippleNormalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 0.85,
        clearcoatRoughness: 0.08,
        ior: 1.333,
        reflectivity: 0.9,
        transparent: true,
        opacity: Math.min(waterOpacity, 0.58),
        depthWrite: false,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: false,
        side: THREE.DoubleSide
      });
      const wtPlaneMesh = new THREE.Mesh(wtPlaneGeo, wtPlaneMat);
      wtPlaneMesh.position.y = 0;
      wtPlaneMesh.visible = showAquiferLayers && (cutawayBlockStyle === 'fence' || !showSurfaceTerrain || !showGeologicalStrata);
      baseWaterTableYRef.current = 0;
      const primaryAq = aquifers[0];
      wtPlaneMesh.userData = {
        type: 'WATER_TABLE',
        name: 'Phreatic Water Table Horizon & 3D Water Cutout',
        description: `${waterTableDescription}${isPumpingActive ? ' [Active Pumping Simulation: Thiem Drawdown Cone Active]' : ' [Undisturbed Static Piezometric Surface]'}`,
        depthMbgl: observedWaterTableDepth,
        aquiferType: primaryAq?.aquiferType || 'Unconfined / Semi-Confined',
        principalRock: primaryAq?.principalRock || 'Saturated porous & fractured aquifer horizon',
        transmissivity: primaryAq ? `${primaryAq.transmissivityM2Day} m²/day` : '65 m²/day',
        specificYield: primaryAq ? `${primaryAq.specificYieldPercent}%` : '8.5%',
        waterQualityTds: primaryAq ? `${primaryAq.waterQualityTdsMgL} mg/L` : '480 mg/L',
        dataTier: waterTableTier
      };
      strataGroup.add(wtPlaneMesh);
      waterTablePlaneRef.current = wtPlaneMesh;
      interactiveObjects.push(wtPlaneMesh);

      // 3D CORNER WATER CUTOUT WEDGE: Exposes the saturated phreatic water volume & water table surface
      // directly inside the excavated front-right quadrant (theta in [0, pi/2])
      if (isCornerCut) {
        const wSegs = 32;
        const wRings = 18;
        const wBaseR = Math.min(blockWidth, blockLength) * 0.488;
        const primaryAqBotDepthScaled = aquifers.length > 0
          ? Math.max(aquifers[0].bottomDepthM * verticalScale, Math.abs(wtPlaneY) + 5.2)
          : Math.abs(wtPlaneY) + 6.0;

        const getWaterCutoutBot = (vx: number, vz: number) => {
          const topVal = getWaterTableSurface(vx, vz);
          const rawBot = -primaryAqBotDepthScaled + getDipOffset(vx, vz) * 0.6;
          return Math.max(baseDatumY + 1.2, Math.min(topVal - 3.2, rawBot));
        };

        const wedgePos: number[] = [];
        const wedgeNorm: number[] = [];
        const wedgeUv: number[] = [];
        const wedgeIdx: number[] = [];

        const pushVert = (px: number, py: number, pz: number, nx: number, ny: number, nz: number, u: number, v: number) => {
          const idx = wedgePos.length / 3;
          wedgePos.push(px, py, pz);
          wedgeNorm.push(nx, ny, nz);
          wedgeUv.push(u, v);
          return idx;
        };

        // 1. Top Phreatic Water Table Surface of the Corner Water Cutout (theta in [0, pi/2])
        const topGrid: number[][] = [];
        for (let r = 0; r <= wRings; r++) {
          const row: number[] = [];
          const rFrac = r / wRings;
          for (let s = 0; s <= wSegs; s++) {
            const theta = (s / wSegs) * (Math.PI * 0.5);
            const maxR = wBaseR * getGeographicalBoundaryRadius(theta, regionSeed);
            const rad = rFrac * maxR;
            const wx = Math.cos(theta) * rad;
            const wz = Math.sin(theta) * rad;
            const wy = getWaterTableSurface(wx, wz);
            row.push(pushVert(wx, wy, wz, 0, 1, 0, wx * 0.08 + 0.5, wz * 0.08 + 0.5));
          }
          topGrid.push(row);
        }
        for (let r = 0; r < wRings; r++) {
          for (let s = 0; s < wSegs; s++) {
            const a = topGrid[r][s];
            const b = topGrid[r + 1][s];
            const c = topGrid[r + 1][s + 1];
            const d = topGrid[r][s + 1];
            wedgeIdx.push(a, c, b, a, d, c);
          }
        }

        // 2. Outer Curved Saturated Water Cutout Wall (r = maxR, theta in [0, pi/2])
        for (let s = 0; s < wSegs; s++) {
          const t0 = (s / wSegs) * (Math.PI * 0.5);
          const t1 = ((s + 1) / wSegs) * (Math.PI * 0.5);
          const r0 = wBaseR * getGeographicalBoundaryRadius(t0, regionSeed);
          const r1 = wBaseR * getGeographicalBoundaryRadius(t1, regionSeed);
          const x0 = Math.cos(t0) * r0, z0 = Math.sin(t0) * r0;
          const x1 = Math.cos(t1) * r1, z1 = Math.sin(t1) * r1;
          const nx = Math.cos((t0 + t1) * 0.5), nz = Math.sin((t0 + t1) * 0.5);
          const v00 = pushVert(x0, getWaterTableSurface(x0, z0), z0, nx, 0, nz, s / wSegs, 1);
          const v10 = pushVert(x1, getWaterTableSurface(x1, z1), z1, nx, 0, nz, (s + 1) / wSegs, 1);
          const v01 = pushVert(x0, getWaterCutoutBot(x0, z0), z0, nx, 0, nz, s / wSegs, 0);
          const v11 = pushVert(x1, getWaterCutoutBot(x1, z1), z1, nx, 0, nz, (s + 1) / wSegs, 0);
          wedgeIdx.push(v00, v01, v11, v00, v11, v10);
        }

        // 3. Two Radial Saturated Cross-Section Walls Flush Against the Cut Rock Faces (theta = 0 and theta = pi/2)
        const rMax0 = wBaseR * getGeographicalBoundaryRadius(0, regionSeed);
        const rMax90 = wBaseR * getGeographicalBoundaryRadius(Math.PI * 0.5, regionSeed);
        for (let r = 0; r < wRings; r++) {
          const x0 = (r / wRings) * rMax0;
          const x1 = ((r + 1) / wRings) * rMax0;
          const a = pushVert(x0, getWaterTableSurface(x0, 0), 0.04, 0, 0, 1, r / wRings, 1);
          const b = pushVert(x1, getWaterTableSurface(x1, 0), 0.04, 0, 0, 1, (r + 1) / wRings, 1);
          const c = pushVert(x1, getWaterCutoutBot(x1, 0), 0.04, 0, 0, 1, (r + 1) / wRings, 0);
          const d = pushVert(x0, getWaterCutoutBot(x0, 0), 0.04, 0, 0, 1, r / wRings, 0);
          wedgeIdx.push(a, b, c, a, c, d);

          const z0 = (r / wRings) * rMax90;
          const z1 = ((r + 1) / wRings) * rMax90;
          const e = pushVert(0.04, getWaterTableSurface(0, z0), z0, 1, 0, 0, r / wRings, 1);
          const f = pushVert(0.04, getWaterTableSurface(0, z1), z1, 1, 0, 0, (r + 1) / wRings, 1);
          const g = pushVert(0.04, getWaterCutoutBot(0, z1), z1, 1, 0, 0, (r + 1) / wRings, 0);
          const h = pushVert(0.04, getWaterCutoutBot(0, z0), z0, 1, 0, 0, r / wRings, 0);
          wedgeIdx.push(e, g, f, e, h, g);
        }

        const waterWedgeGeo = new THREE.BufferGeometry();
        waterWedgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(wedgePos, 3));
        waterWedgeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wedgeNorm, 3));
        waterWedgeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wedgeUv, 2));
        waterWedgeGeo.setIndex(wedgeIdx);
        waterWedgeGeo.computeVertexNormals();

        const waterWedgeMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          emissive: 0x0369a1,
          emissiveIntensity: 0.36 * waterIntensity,
          normalMap: waterRippleNormalMap,
          normalScale: new THREE.Vector2(0.45, 0.45),
          roughness: 0.10,
          metalness: 0.08,
          clearcoat: 0.95,
          clearcoatRoughness: 0.06,
          ior: 1.333,
          reflectivity: 0.94,
          transparent: true,
          opacity: Math.min(0.76, waterOpacity * 0.86) * (showAquiferLayers ? 1 : 0),
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          clippingPlanes: activeClippingPlanes,
          clipIntersection: false,
          side: THREE.DoubleSide
        });

        const waterWedgeMesh = new THREE.Mesh(waterWedgeGeo, waterWedgeMat);
        waterWedgeMesh.visible = showAquiferLayers;
        waterWedgeMesh.userData = {
          type: 'WATER_TABLE',
          name: `3D Saturated Water Cutout (${primaryAq?.name || 'Phreatic Aquifer Zone'})`,
          description: `${waterTableDescription} Volumetric 3D water cutout exposing the phreatic water table meniscus (-${observedWaterTableDepth.toFixed(1)} mbgl) and saturated aquifer horizon inside the excavated quadrant.${isPumpingActive ? ' [Thiem Pumping Drawdown Cone Active: Q = 12 L/s]' : ''}`,
          depthMbgl: observedWaterTableDepth,
          aquiferType: primaryAq?.aquiferType || 'Unconfined / Semi-Confined',
          principalRock: primaryAq?.principalRock || 'Saturated porous & fractured aquifer horizon',
          transmissivity: primaryAq ? `${primaryAq.transmissivityM2Day} m²/day` : '65 m²/day',
          specificYield: primaryAq ? `${primaryAq.specificYieldPercent}%` : '8.5%',
          waterQualityTds: primaryAq ? `${primaryAq.waterQualityTdsMgL} mg/L` : '480 mg/L',
          dataTier: waterTableTier
        };
        strataGroup.add(waterWedgeMesh);
        interactiveObjects.push(waterWedgeMesh);
        aquiferMeshesRef.current.push(waterWedgeMesh);

        // Glowing Cyan Phreatic Meniscus Rim & Piezometric Flow Contours on the 3D Water Cutout
        const meniscusMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.95
        });
        const meniscusPts: THREE.Vector3[] = [];
        for (let r = 0; r <= wRings; r++) {
          const wx = (r / wRings) * rMax0;
          meniscusPts.push(new THREE.Vector3(wx, getWaterTableSurface(wx, 0) + 0.06, 0.05));
        }
        for (let s = 0; s <= wSegs; s++) {
          const theta = (s / wSegs) * (Math.PI * 0.5);
          const rad = wBaseR * getGeographicalBoundaryRadius(theta, regionSeed);
          const wx = Math.cos(theta) * rad;
          const wz = Math.sin(theta) * rad;
          meniscusPts.push(new THREE.Vector3(wx, getWaterTableSurface(wx, wz) + 0.06, wz));
        }
        for (let r = wRings; r >= 0; r--) {
          const wz = (r / wRings) * rMax90;
          meniscusPts.push(new THREE.Vector3(0.05, getWaterTableSurface(0, wz) + 0.06, wz));
        }
        const meniscusLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(meniscusPts), meniscusMat);
        meniscusLine.visible = showAquiferLayers;
        strataGroup.add(meniscusLine);

        // Piezometric Equipotential Contours & Pumping Drawdown Rings across the 3D Water Cutout Top Surface
        const contourMat = new THREE.LineBasicMaterial({
          color: isPumpingActive ? 0x7dd3fc : 0x0ea5e9,
          transparent: true,
          opacity: isPumpingActive ? 0.72 : 0.42
        });
        [0.22, 0.44, 0.66, 0.86].forEach((rFrac) => {
          const cPts: THREE.Vector3[] = [];
          for (let s = 0; s <= wSegs; s++) {
            const theta = (s / wSegs) * (Math.PI * 0.5);
            const rad = rFrac * wBaseR * getGeographicalBoundaryRadius(theta, regionSeed);
            const wx = Math.cos(theta) * rad;
            const wz = Math.sin(theta) * rad;
            cPts.push(new THREE.Vector3(wx, getWaterTableSurface(wx, wz) + 0.04, wz));
          }
          const cLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cPts), contourMat);
          cLine.visible = showAquiferLayers;
          strataGroup.add(cLine);
        });
      }

      // Outer Perimeter Phreatic Water Table Horizon Trace Line around the entire 3D Block
      const outerWtPts: THREE.Vector3[] = [];
      const wtBaseR = Math.min(blockWidth, blockLength) * 0.493;
      const wtStartAng = isCornerCut ? Math.PI * 0.5 : 0;
      for (let s = 0; s <= polyAngularSegs; s++) {
        const theta = wtStartAng + (s / polyAngularSegs) * (Math.PI * 2 - wtStartAng);
        const rad = wtBaseR * getGeographicalBoundaryRadius(theta, regionSeed);
        const wx = Math.cos(theta) * rad;
        const wz = Math.sin(theta) * rad;
        outerWtPts.push(new THREE.Vector3(wx, getWaterTableSurface(wx, wz), wz));
      }
      const outerWtLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(outerWtPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88, clippingPlanes: activeClippingPlanes })
      );
      strataGroup.add(outerWtLine);
    } else {
      waterTablePlaneRef.current = null;
    }

    // -------------------------------------------------------------
    // G. MINERAL-BEARING GEOLOGICAL VEINS & GOSSAN CAPS
    // -------------------------------------------------------------
    if (minerals) {
      if (mineralDisplayMode === 'demonstration-veins') {
        const isZinc = minerals.targetCommodities.some(c => c.toLowerCase().includes('zinc') || c.toLowerCase().includes('lead'));
        const isGold = minerals.targetCommodities.some(c => c.toLowerCase().includes('gold'));
        const isUranium = minerals.targetCommodities.some(c => c.toLowerCase().includes('uran'));

        let mineralColor = 0xf59e0b;
        let emissiveColor = 0xb45309;
        if (isZinc) {
          mineralColor = 0x94a3b8;
          emissiveColor = 0x475569;
        } else if (isGold) {
          mineralColor = 0xfacc15;
          emissiveColor = 0xeab308;
        } else if (isUranium) {
          mineralColor = 0x10b981;
          emissiveColor = 0x059669;
        }

        const veinLength = blockWidth * 0.85;
        const veinThickness = 2.4;
        const veinDepth = 14;
        const veinGeo = new THREE.BoxGeometry(veinLength, veinThickness, 5);
        const veinMat = new THREE.MeshStandardMaterial({
          color: mineralColor,
          emissive: emissiveColor,
          emissiveIntensity: 0.35,
          metalness: 0.75,
          roughness: 0.25,
          transparent: true,
          opacity: 0.92,
          clippingPlanes: activeClippingPlanes,
          clipIntersection: cutawayBlockStyle === 'corner',
          side: THREE.DoubleSide
        });

        const veinMesh = new THREE.Mesh(veinGeo, veinMat);
        veinMesh.rotation.z = Math.PI / 6;
        veinMesh.rotation.y = Math.PI / 8;
        veinMesh.position.set(0, -veinDepth, 0);

        veinMesh.userData = {
          type: 'MINERAL_VEIN',
          name: `Demonstration Ore Vein (${minerals.targetCommodities.join(', ')})`,
          depositStyle: minerals.depositStyle,
          hostRock: minerals.geologicalHostRock,
          commodities: minerals.targetCommodities.join(', '),
          prospectivity: minerals.regionalProspectivityScore,
          dataTier: 'DEMONSTRATION',
          scientificDisclaimer: 'SYNTHETIC DEMONSTRATION VEIN ONLY — Remote sensing observes top micrometres of crust; physical diamond core drilling is required for subsurface ore geometry validation.'
        };

        strataGroup.add(veinMesh);
        interactiveObjects.push(veinMesh);
        mineralMeshesRef.current.push(veinMesh);
      }
    }

    // -------------------------------------------------------------
    // H. 3D EXPLORATORY BOREHOLE DRILL STRING & 3D FENCE PANELS
    // -------------------------------------------------------------
    if (borehole) {
      const bhDepthScaled = borehole.totalDepthMeters * verticalScale;
      const bhGroup = new THREE.Group();
      const wellHeadY = getSurfaceElevation(bhX, bhZ) + 0.08;
      bhGroup.position.set(bhX, wellHeadY, bhZ);

      // Composite 7-Part CGWB Piezometer & Telemetry Monitoring Station
      // 1. Reinforced Concrete Plinth Foundation Pad
      const plinthGeo = new THREE.BoxGeometry(1.75, 0.16, 1.75);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.85,
        metalness: 0.08
      });
      const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
      plinthMesh.position.y = 0.08;
      plinthMesh.receiveShadow = true;
      plinthMesh.castShadow = true;
      bhGroup.add(plinthMesh);

      // 2. Precision Brushed Steel Surface Casing Monument
      const collarGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.58, 20);
      const collarMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.88,
        roughness: 0.22
      });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.y = 0.37;
      collarMesh.castShadow = true;
      collarMesh.userData = {
        type: 'WELLHEAD',
        name: `CGWB Piezometer Telemetry Station (${borehole.wellCode})`,
        elevation: `${('elevation' in selectedLocation && selectedLocation.elevation) ? selectedLocation.elevation : 247}m ASL`,
        agency: borehole.sourceAgency
      };
      bhGroup.add(collarMesh);
      interactiveObjects.push(collarMesh);

      // 3. Precision Brass Survey Monument Plaque
      const capPlateGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 20);
      const capPlateMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.92,
        roughness: 0.18
      });
      const capPlateMesh = new THREE.Mesh(capPlateGeo, capPlateMat);
      capPlateMesh.position.y = 0.68;
      bhGroup.add(capPlateMesh);

      // 4. Galvanized Telemetry Mast & 5. Weatherproof NEMA Data Logger Enclosure
      const mastGeo = new THREE.CylinderGeometry(0.055, 0.065, 1.85, 12);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
      const mastMesh = new THREE.Mesh(mastGeo, mastMat);
      mastMesh.position.set(-0.48, 1.0, -0.42);
      mastMesh.castShadow = true;
      bhGroup.add(mastMesh);

      const loggerBoxGeo = new THREE.BoxGeometry(0.42, 0.54, 0.28);
      const loggerBoxMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.45, roughness: 0.35 });
      const loggerBoxMesh = new THREE.Mesh(loggerBoxGeo, loggerBoxMat);
      loggerBoxMesh.position.set(-0.48, 1.05, -0.26);
      loggerBoxMesh.castShadow = true;
      bhGroup.add(loggerBoxMesh);

      // 6. Tilted Monocrystalline Solar Photovoltaic Panel
      const solarGeo = new THREE.BoxGeometry(0.88, 0.05, 0.62);
      const solarMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.25,
        metalness: 0.65,
        roughness: 0.12,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      });
      const solarMesh = new THREE.Mesh(solarGeo, solarMat);
      solarMesh.position.set(-0.48, 1.92, -0.42);
      solarMesh.rotation.x = Math.PI / 6;
      solarMesh.castShadow = true;
      bhGroup.add(solarMesh);

      // 7. Four Safety Bollards & Telemetry Beacon LED
      const bollardGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.52, 10);
      const bollardMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.3, roughness: 0.4 });
      [
        [-0.72, -0.72],
        [0.72, -0.72],
        [-0.72, 0.72],
        [0.72, 0.72]
      ].forEach(([bx, bz]) => {
        const bMesh = new THREE.Mesh(bollardGeo, bollardMat);
        bMesh.position.set(bx, 0.34, bz);
        bhGroup.add(bMesh);
      });

      const beaconGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(-0.48, 2.22, -0.42);
      bhGroup.add(beaconMesh);

      // Multi-Segment Stratigraphic Drill Core Column
      if (borehole.strataIntervals && borehole.strataIntervals.length > 0) {
        borehole.strataIntervals.forEach((interval) => {
          const fromY = -interval.fromDepth * verticalScale;
          const toY = -interval.toDepth * verticalScale;
          const intervalHeight = Math.max(Math.abs(toY - fromY), 0.4);
          const midY = (fromY + toY) / 2;

          const intGeo = new THREE.CylinderGeometry(0.42, 0.42, intervalHeight, 16);
          const intMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(interval.color || 0xd97706),
            metalness: 0.35,
            roughness: 0.65
          });
          const intMesh = new THREE.Mesh(intGeo, intMat);
          intMesh.position.y = midY;
          intMesh.userData = {
            type: 'BOREHOLE_CORE',
            wellCode: borehole.wellCode,
            interval: `${interval.fromDepth}m – ${interval.toDepth}m mbgl`,
            lithology: interval.lithology,
            description: interval.description,
            permeability: interval.permeability,
            dataTier: 'DEMONSTRATION'
          };
          bhGroup.add(intMesh);
          interactiveObjects.push(intMesh);

          // Metallic joint collar between intervals
          const ringGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 16);
          const ringMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            metalness: 0.85,
            roughness: 0.2
          });
          const collarJoint = new THREE.Mesh(ringGeo, ringMat);
          collarJoint.position.y = fromY;
          bhGroup.add(collarJoint);
        });
      } else {
        const pipeGeo = new THREE.CylinderGeometry(0.35, 0.35, bhDepthScaled, 16);
        const pipeMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.65,
          roughness: 0.3
        });
        const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        pipeMesh.position.y = -bhDepthScaled / 2;
        pipeMesh.userData = {
          type: 'BOREHOLE',
          wellCode: borehole.wellCode,
          agency: borehole.sourceAgency,
          totalDepth: `${borehole.totalDepthMeters}m`,
          waterStrike: `${borehole.waterTableDepthMeters} mbgl`,
          status: borehole.status || 'SIMULATED',
          dataTier: 'DEMONSTRATION'
        };
        bhGroup.add(pipeMesh);
        interactiveObjects.push(pipeMesh);
      }

      const waterStrikeRingGeo = new THREE.TorusGeometry(0.7, 0.15, 8, 24);
      const waterStrikeRingMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00bcd4,
        emissiveIntensity: 0.8
      });
      const ringMesh = new THREE.Mesh(waterStrikeRingGeo, waterStrikeRingMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = -borehole.waterTableDepthMeters * verticalScale;
      bhGroup.add(ringMesh);

      strataGroup.add(bhGroup);

      // 3D Stratigraphic Fence Panels — strictly scoped to 'fence' mode and radially clamped inside perimeter
      if (cutawayBlockStyle === 'fence') {
        const clampFenceEndpoint = (tx: number, tz: number) => {
          const theta = Math.atan2(tz, tx);
          const maxR = getGeographicalBoundaryRadius(theta, regionSeed) * Math.min(blockWidth, blockLength) * 0.41;
          const dist = Math.hypot(tx, tz) || 1;
          const s = Math.min(1, maxR / dist);
          return { x: tx * s, z: tz * s };
        };
        const endA = clampFenceEndpoint(-blockWidth * 0.42, -blockLength * 0.42);
        const endB = clampFenceEndpoint(blockWidth * 0.36, -blockLength * 0.42);
        const fenceLines = [
          { x0: bhX, z0: bhZ, x1: endA.x, z1: endA.z, name: "Section A – A'" },
          { x0: bhX, z0: bhZ, x1: endB.x, z1: endB.z, name: "Section B – B'" }
        ];

        fenceLines.forEach((line) => {
          const fenceSegs = 24;
          formations.forEach((formation, fIdx) => {
            const fTop = contactFuncs[fIdx];
            const fBot = contactFuncs[fIdx + 1];
            const fencePositions: number[] = [];
            const fenceUvs: number[] = [];

            for (let s = 0; s < fenceSegs; s++) {
              const t0 = s / fenceSegs;
              const t1 = (s + 1) / fenceSegs;
              const px0 = line.x0 + t0 * (line.x1 - line.x0);
              const pz0 = line.z0 + t0 * (line.z1 - line.z0);
              const px1 = line.x0 + t1 * (line.x1 - line.x0);
              const pz1 = line.z0 + t1 * (line.z1 - line.z0);

              const yTop0 = fTop(px0, pz0);
              const yTop1 = fTop(px1, pz1);
              const yBot0 = fBot(px0, pz0);
              const yBot1 = fBot(px1, pz1);

              fencePositions.push(
                px0, yTop0, pz0,
                px0, yBot0, pz0,
                px1, yTop1, pz1,

                px1, yTop1, pz1,
                px0, yBot0, pz0,
                px1, yBot1, pz1
              );
              fenceUvs.push(
                t0, 1, t0, 0, t1, 1,
                t1, 1, t0, 0, t1, 0
              );
            }

            const fenceGeo = new THREE.BufferGeometry();
            fenceGeo.setAttribute('position', new THREE.Float32BufferAttribute(fencePositions, 3));
            fenceGeo.setAttribute('uv', new THREE.Float32BufferAttribute(fenceUvs, 2));
            fenceGeo.computeVertexNormals();

            const fenceMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(formation.colorHex),
              roughness: 0.7,
              metalness: 0.1,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide
            });
            const fenceMesh = new THREE.Mesh(fenceGeo, fenceMat);
            fenceMesh.userData = {
              type: 'FENCE_PANEL',
              name: `3D Stratigraphic Fence (${line.name}): ${formation.name}`,
              lithology: formation.primaryLithology,
              dataTier: 'MODELLED'
            };
            strataGroup.add(fenceMesh);
            interactiveObjects.push(fenceMesh);
          });
        });
      }
    }

    // -------------------------------------------------------------
    // I. INTERACTIVE DEPTH SLICE HORIZONTAL PLANE (IRREGULAR POLYGON BOUNDED)
    // -------------------------------------------------------------
    const sliceGeo = buildIrregularPolygonTerrainGeometry(
      () => 0,
      blockWidth * 0.998,
      blockLength * 0.998,
      polyAngularSegs,
      polyRadialRings,
      regionSeed,
      isCornerCut
    );
    const sliceMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x78350f,
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      roughness: 0.4,
      metalness: 0.25,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: false,
      side: THREE.DoubleSide
    });
    const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
    sliceMesh.position.y = -depthMeters * verticalScale;
    sliceMesh.visible = cutawayBlockStyle !== 'corner' && depthMeters > 0;
    strataGroup.add(sliceMesh);
    depthSlicePlaneRef.current = sliceMesh;

    // -------------------------------------------------------------
    // J. RAYCASTING INTERACTION
    // -------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      const validIntersects = intersects.filter(hit => {
        if (cutawayBlockStyle === 'corner' && hit.object.userData?.type !== 'WATER_TABLE') {
          if (hit.point.x > 0.05 && hit.point.z > 0.05) return false;
        }
        if (!depthClipPlaneRef.current || depthMeters <= 0 || cutawayBlockStyle === 'corner') return true;
        return depthClipPlaneRef.current.distanceToPoint(hit.point) >= -0.01;
      });

      if (validIntersects.length > 0) {
        const topHit = validIntersects[0].object as THREE.Mesh;
        if (topHit !== lastHoveredMeshRef.current) {
          if (lastHoveredMeshRef.current && lastHoveredMeshRef.current.material) {
            const m = lastHoveredMeshRef.current.material as THREE.MeshStandardMaterial;
            if (m.emissive && origEmissiveRef.current) {
              m.emissive.copy(origEmissiveRef.current);
              m.emissiveIntensity = origIntensityRef.current;
            }
          }
          if (topHit && topHit.material) {
            const m = topHit.material as THREE.MeshStandardMaterial;
            if (m.emissive) {
              origEmissiveRef.current = m.emissive.clone();
              origIntensityRef.current = m.emissiveIntensity || 0;
              const hColor =
                topHit.userData.type === 'AQUIFER' ? 0x00f0ff :
                topHit.userData.type === 'MINERAL_VEIN' ? 0xf43f5e :
                topHit.userData.type === 'BOREHOLE' ? 0x10b981 :
                topHit.userData.type === 'WATER_TABLE' ? 0x38bdf8 : 0xfbbf24;
              m.emissive.setHex(hColor);
              m.emissiveIntensity = 0.55;
            }
            lastHoveredMeshRef.current = topHit;
          }
        }
        if (topHit.userData && topHit.userData.name) {
          setHoveredEntity(topHit.userData);
        }
      } else {
        if (lastHoveredMeshRef.current && lastHoveredMeshRef.current.material) {
          const m = lastHoveredMeshRef.current.material as THREE.MeshStandardMaterial;
          if (m.emissive && origEmissiveRef.current) {
            m.emissive.copy(origEmissiveRef.current);
            m.emissiveIntensity = origIntensityRef.current;
          }
        }
        lastHoveredMeshRef.current = null;
        setHoveredEntity(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(interactiveObjects, true);
      const validIntersects = intersects.filter(hit => {
        if (cutawayBlockStyle === 'corner' && hit.object.userData?.type !== 'WATER_TABLE') {
          if (hit.point.x > 0.05 && hit.point.z > 0.05) return false;
        }
        if (!depthClipPlaneRef.current || depthMeters <= 0 || cutawayBlockStyle === 'corner') return true;
        return depthClipPlaneRef.current.distanceToPoint(hit.point) >= -0.01;
      });

      if (validIntersects.length > 0) {
        const topHit = validIntersects[0].object as THREE.Mesh;
        if (topHit.userData && topHit.userData.name) {
          setSelectedEntity((prev: any) => prev?.name === topHit.userData.name ? null : topHit.userData);
        }
      } else {
        setSelectedEntity(null);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousemove', handlePointerMove);
    domElement.addEventListener('click', handleClick);

    // -------------------------------------------------------------
    // K. GSAP-DRIVEN EXTRACTION + GENTLE FLOATING SUSPENSION LOOP
    // -------------------------------------------------------------
    let isDisposed = false;

    const currentLocationKey = `${selectedLocation.id}_${selectedLocation.latitude.toFixed(4)}_${selectedLocation.longitude.toFixed(4)}`;
    const isFreshLocationExtraction = lastExtractedLocationKeyRef.current !== currentLocationKey;
    if (isFreshLocationExtraction) {
      lastExtractedLocationKeyRef.current = currentLocationKey;
    }

    const reducedMotion = prefersReducedMotion();
    if (gsapControllerRef.current) {
      gsapControllerRef.current.kill();
    }
    const gsapController = createGsapCutoutController(
      isFreshLocationExtraction && !isSoftwareGl && !reducedMotion ? 'extracting' : 'settled'
    );
    gsapControllerRef.current = gsapController;

    const applyPoseAndRender = () => {
      if (isDisposed) return;
      const pose = gsapController.state;
      strataGroup.position.y = pose.cutoutY;
      strataGroup.scale.set(pose.cutoutScale, pose.cutoutScale, pose.cutoutScale);
      strataGroup.rotation.x = pose.cutoutTiltX;
      strataGroup.rotation.z = pose.cutoutRollZ;

      gridHelper.position.y = baseDatumY;
      (gridHelper.material as THREE.Material).opacity = pose.datumGridOpacity;
      shadowDiscMat.opacity = Math.max(0.25, Math.min(0.7, 0.55 - pose.cutoutY * 0.04));
      const shadowScale = Math.max(0.82, Math.min(1.06, 1.0 - Math.abs(pose.cutoutY) * 0.015));
      shadowDisc.scale.set(shadowScale, shadowScale, 1);

      if (waterTablePlaneRef.current) {
        waterTablePlaneRef.current.position.y = baseWaterTableYRef.current;
      }
    };
    applyPoseAndRenderRef.current = applyPoseAndRender;

    if (isSoftwareGl || reducedMotion) {
      gsapController.settleImmediately();
      applyPoseAndRender();
      controls.update();
      renderer.render(scene, camera);
    } else if (isFreshLocationExtraction) {
      gsapController.startExtraction({
        durationSec: 0.92,
        enableFloating: true
      });
    } else {
      gsapController.settleImmediately();
      gsapController.startFloating();
      applyPoseAndRender();
    }

    controls.addEventListener('change', () => {
      if (!isDisposed && isSoftwareGl) {
        applyPoseAndRender();
        renderer.render(scene, camera);
      }
    });

    const animate = () => {
      if (isDisposed) return;
      controls.update();
      applyPoseAndRender();
      renderer.render(scene, camera);
      if (!isSoftwareGl) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    if (!isSoftwareGl) {
      animate();
    }

    // ResizeObserver (guarded with lastW/lastH delta check to prevent layout feedback loops)
    let lastW = width;
    let lastH = height;
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera || isDisposed) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      if (newW > 0 && newH > 0 && (Math.abs(newW - lastW) >= 2 || Math.abs(newH - lastH) >= 2)) {
        lastW = newW;
        lastH = newH;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
        applyPoseAndRender();
        renderer.render(scene, camera);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup & Scene/GSAP Resource Disposal (WebGLRenderer stays alive in rendererRef until unmount)
    return () => {
      isDisposed = true;
      gsapController.kill();
      if (gsapControllerRef.current === gsapController) {
        gsapControllerRef.current = null;
      }
      if (applyPoseAndRenderRef.current === applyPoseAndRender) {
        applyPoseAndRenderRef.current = null;
      }
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controls.target);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousemove', handlePointerMove);
      domElement.removeEventListener('click', handleClick);
      if (typeof window !== 'undefined') {
        delete (window as any).__subsurfaceCamera;
        delete (window as any).__subsurfaceControls;
      }
      if (envTexture) envTexture.dispose();
      controls.dispose();
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          const mat = m.material;
          if (Array.isArray(mat)) {
            mat.forEach(sub => {
              if ((sub as any).map) (sub as any).map.dispose();
              if ((sub as any).bumpMap) (sub as any).bumpMap.dispose();
              if ((sub as any).roughnessMap) (sub as any).roughnessMap.dispose();
              if ((sub as any).normalMap) (sub as any).normalMap.dispose();
              sub.dispose();
            });
          } else {
            if ((mat as any).map) (mat as any).map.dispose();
            if ((mat as any).bumpMap) (mat as any).bumpMap.dispose();
            if ((mat as any).roughnessMap) (mat as any).roughnessMap.dispose();
            if ((mat as any).normalMap) (mat as any).normalMap.dispose();
            mat.dispose();
          }
        }
      });
      scene.clear();
    };
  }, [
    selectedLocation,
    currentDossier,
    activeGroundwaterDepthMbgl,
    cutawayExaggeration,
    explorationExtentKm,
    terrainElevationGrid,
    mineralDisplayMode,
    cutawayBlockStyle,
    geologicalDisplayMode,
    isPumpingActive
  ]);

  // Reactive Effect: Update Depth Slice Plane & HUD Markers dynamically via GSAP
  useEffect(() => {
    const targetConstant = depthMeters <= 0 || cutawayBlockStyle === 'corner' ? 99999 : -depthMeters * verticalScale;
    const targetSliceY = -depthMeters * verticalScale;
    const targetPct = `${Math.min(100, (depthMeters / 1200) * 100)}%`;

    if (depthClipPlaneRef.current) {
      if (targetConstant === 99999 || depthClipPlaneRef.current.constant === 99999) {
        depthClipPlaneRef.current.constant = targetConstant;
      } else {
        gsap.to(depthClipPlaneRef.current, {
          constant: targetConstant,
          duration: 0.22,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    }
    if (depthSlicePlaneRef.current) {
      depthSlicePlaneRef.current.visible = cutawayBlockStyle !== 'corner' && depthMeters > 0;
      gsap.to(depthSlicePlaneRef.current.position, {
        y: targetSliceY,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
    if (depthMarkerRef.current) {
      gsap.to(depthMarkerRef.current, { top: targetPct, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }
    if (depthLabelRef.current) {
      gsap.to(depthLabelRef.current, { top: targetPct, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    }
  }, [depthMeters, verticalScale, cutawayBlockStyle]);

  useEffect(() => {
    if (waterMarkerRef.current && observedWaterTableDepth !== null) {
      const wtPct = `${Math.min(100, (observedWaterTableDepth / 1200) * 100)}%`;
      gsap.to(waterMarkerRef.current, { top: wtPct, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    }
  }, [observedWaterTableDepth]);

  // Reactive Effect: Update Water Saturation Display Intensity & Opacity
  useEffect(() => {
    if (waterTablePlaneRef.current) {
      const mat = waterTablePlaneRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.36 * waterIntensity;
        mat.opacity = Math.min(waterOpacity, 0.58) * (showAquiferLayers ? 1 : 0);
      }
      waterTablePlaneRef.current.visible =
        showAquiferLayers && (cutawayBlockStyle === 'fence' || !showSurfaceTerrain || !showGeologicalStrata);
    }

    aquiferMeshesRef.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isWaterWedge = mesh.userData?.type === 'WATER_TABLE';
      if (mat) {
        mat.emissiveIntensity = (isWaterWedge ? 0.36 : 0.28) * waterIntensity;
        mat.opacity = waterOpacity * (isWaterWedge ? 0.82 : 0.48) * (showAquiferLayers ? 1 : 0);
      }
      mesh.visible = isWaterWedge
        ? showAquiferLayers
        : showAquiferLayers && (cutawayBlockStyle === 'fence' || !showGeologicalStrata);
    });

    requestSceneRender();
  }, [waterIntensity, waterOpacity, showAquiferLayers, cutawayBlockStyle, showSurfaceTerrain, showGeologicalStrata, requestSceneRender]);

  // Reactive Effect: Toggle Mineral, Terrain, Soil, and Strata visibility
  useEffect(() => {
    mineralMeshesRef.current.forEach(mesh => {
      mesh.visible = showMineralLayers;
    });
    requestSceneRender();
  }, [showMineralLayers, requestSceneRender]);

  useEffect(() => {
    if (terrainMeshRef.current) {
      terrainMeshRef.current.visible = showSurfaceTerrain;
    }
    requestSceneRender();
  }, [showSurfaceTerrain, requestSceneRender]);

  useEffect(() => {
    regolithMeshesRef.current.forEach(mesh => {
      mesh.visible = showSoilRegolith;
    });
    requestSceneRender();
  }, [showSoilRegolith, requestSceneRender]);

  useEffect(() => {
    strataMeshesRef.current.forEach(mesh => {
      mesh.visible = showGeologicalStrata;
    });
    requestSceneRender();
  }, [showGeologicalStrata, requestSceneRender]);

  // Reactive Effect: Handle Layer Isolation
  useEffect(() => {
    strataMeshesRef.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isolatedLayerId) {
        if (mesh.userData.id === isolatedLayerId) {
          mat.opacity = 1.0;
          mat.emissive = new THREE.Color(0x38bdf8);
          mat.emissiveIntensity = 0.3;
        } else {
          mat.opacity = 0.18;
          mat.emissiveIntensity = 0.0;
        }
      } else {
        mat.opacity = cutawayBlockStyle === 'fence' ? 0.22 : 0.96;
        mat.emissiveIntensity = 0.0;
      }
    });
    requestSceneRender();
  }, [isolatedLayerId, cutawayBlockStyle, requestSceneRender]);

  const activeInspector = selectedEntity || hoveredEntity;
  const isPinned = Boolean(selectedEntity);

  return (
    <div className={`relative w-full h-full bg-[#060911] select-none overflow-hidden flex flex-col ${className}`}>
      {/* Mode B: Mandatory Scientific Warning Banner */}
      {geologicalDisplayMode === 'ILLUSTRATIVE' && (
        <div className="bg-amber-950/70 border-b border-amber-500/50 px-3 py-1 flex items-center justify-between text-xs font-mono text-amber-200 z-20 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-semibold text-[11px] uppercase tracking-wide">
              ILLUSTRATIVE MODEL — NOT A VERIFIED LOCAL GEOLOGICAL OBSERVATION
            </span>
          </div>
          <span className="text-[10px] text-amber-300/80 hidden sm:inline font-sans">
            Regional cratonic projection synthesized from GSI Bhukosh & NAQUIM frameworks.
          </span>
        </div>
      )}

      {/* Docked Single-Row Studio Toolbar (Zero Clipping / Full Action Visibility) */}
      <div className="shrink-0 bg-[#070b14]/95 border-b border-white/10 px-2.5 py-1.5 flex flex-wrap xl:flex-nowrap items-center justify-between gap-1.5 z-20">
        {/* Left: Return to Globe & Location / Real DEM Provenance */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          {viewMode === 'cutaway' && (
            <button
              type="button"
              onClick={handleReturnToGlobe}
              className="bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 hover:text-white rounded-lg py-1 px-2 text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Lower Extracted Region Back into 3D Planetary Globe"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isReturningToGlobe ? 'Lowering...' : 'Return to Globe'}</span>
            </button>
          )}

          <div className="bg-slate-900/90 border border-white/10 rounded-lg flex items-center gap-1.5 py-1 px-2 text-[11px] font-mono min-w-0">
            <Box className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-slate-100 truncate max-w-[145px] sm:max-w-[200px]">
              {selectedLocation.name.split(' - ')[0]}
            </span>
            <span className="text-slate-700 hidden 2xl:inline">|</span>
            <span className="text-slate-400 text-[10px] truncate max-w-[120px] hidden 2xl:inline">
              {terrainElevationGrid?.sourceDataset || 'Copernicus GLO-90'}
            </span>
            <StatusBadge status={terrainElevationGrid?.status || 'OBSERVED'} size="sm" />

            {isolatedLayerId && (
              <button
                type="button"
                onClick={() => setIsolatedLayerId(null)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 font-mono text-[9px] hover:bg-amber-500/30 transition-colors cursor-pointer whitespace-nowrap"
                title="Click to restore full geological stratigraphy"
              >
                <span>Isolated</span>
                <span className="font-bold">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Primary Style Switcher, Pump Test & Collapsible 3D Controls Drawer */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mode A vs Mode B Scientific Display Mode Toggle (2xl+) */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setGeologicalDisplayMode('EVIDENCE_BASED')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                geologicalDisplayMode === 'EVIDENCE_BASED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mode A (Evidence-Based): Observed wells and borehole horizons"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Evidence</span>
            </button>
            <button
              type="button"
              onClick={() => setGeologicalDisplayMode('ILLUSTRATIVE')}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                geologicalDisplayMode === 'ILLUSTRATIVE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mode B (Illustrative): Full conceptual regional geological cutaway"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Illustrative</span>
            </button>
          </div>

          {/* 3D Cutaway Style Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => {
                setCutawayBlockStyle('block');
                setCutawayPreset('isometric');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                cutawayBlockStyle === 'block' && !isCrossSection2D
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full 3D Block Cutaway"
            >
              Block
            </button>
            <button
              type="button"
              onClick={() => {
                setCutawayBlockStyle('corner');
                setCutawayPreset('corner-cut');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                cutawayBlockStyle === 'corner' && !isCrossSection2D
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Corner Cut Excavation View (Exposes Interior Orthogonal Cut Faces)"
            >
              <Scissors className="w-3 h-3 text-purple-400" />
              <span>Corner Cut</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCutawayBlockStyle('fence');
                setCutawayPreset('fence');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                cutawayBlockStyle === 'fence' && !isCrossSection2D
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Stratigraphic Fence Diagrams"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Fence</span>
            </button>
            <button
              type="button"
              onClick={handleToggle2D}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                isCrossSection2D
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Interactive 2D Cross-Section Profile (Section A – A')"
            >
              2D
            </button>
          </div>

          {/* 3D Water Cutout Quick Toggle */}
          <button
            type="button"
            onClick={() => setShowAquiferLayers(!showAquiferLayers)}
            className={`hidden sm:flex px-2 py-1 rounded-lg text-[10px] font-mono transition-all items-center gap-1 border cursor-pointer whitespace-nowrap ${
              showAquiferLayers
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/70 font-bold'
                : 'bg-slate-900/90 border-white/10 text-slate-400 hover:text-sky-300 hover:border-sky-500/50'
            }`}
            title="Toggle 3D Phreatic Water Cutout & Saturated Aquifer Horizons"
          >
            <Droplet className="w-3 h-3 text-sky-400" />
            <span>Water Cutout</span>
          </button>

          {/* Pumping Test Quick Toggle */}
          <button
            type="button"
            onClick={() => setIsPumpingActive(!isPumpingActive)}
            aria-pressed={isPumpingActive}
            className={`hidden md:flex px-2 py-1 rounded-lg text-[10px] font-mono transition-all items-center gap-1 border cursor-pointer whitespace-nowrap ${
              isPumpingActive
                ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 font-bold'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50'
            }`}
            title={isPumpingActive ? 'Deactivate Pumping Test Simulation' : 'Simulate Pumping Well Drawdown (Thiem 12 L/s)'}
          >
            {isPumpingActive ? <Square className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> : <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
            <span>{isPumpingActive ? 'Pumping' : 'Pump'}</span>
          </button>

          {/* Studio 3D Controls Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            aria-expanded={showControlsDrawer}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              showControlsDrawer
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200'
            }`}
            title="Open Camera Presets, Layers, Vertical Exaggeration & Block Extent"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Controls</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showControlsDrawer ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dedicated Unobstructed 3D Cutout Viewport Container */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Collapsible Floating Studio 3D Controls Drawer (WebGL-safe .liquid-glass-hud) */}
        {showControlsDrawer && (
          <div className="absolute top-3 right-3 z-30 w-72 liquid-glass-hud rounded-2xl p-3.5 shadow-2xl space-y-3 text-[11px] font-mono animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Subsurface Studio Controls</span>
              </span>
              <button
                type="button"
                onClick={() => setShowControlsDrawer(false)}
                className="p-0.5 rounded text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close 3D Controls"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Views */}
            <div className="space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Camera Orientation</div>
              <div className="grid grid-cols-5 gap-1">
                {(['isometric', 'front', 'side', 'top'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => applyCameraPreset(p)}
                    className="py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-200 hover:text-cyan-300 capitalize text-[10px] cursor-pointer"
                  >
                    {p === 'isometric' ? 'Iso' : p}
                  </button>
                ))}
                <button
                  onClick={handleResetCamera}
                  className="py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-cyan-300 flex items-center justify-center cursor-pointer"
                  title="Reset Camera"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Geological Layers */}
            <div className="space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-400">Visible Subsurface Domains</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setShowSurfaceTerrain(!showSurfaceTerrain)}
                  className={`px-2 py-1 rounded-lg text-[10px] border cursor-pointer transition-colors ${
                    showSurfaceTerrain ? 'bg-emerald-500/20 border-emerald-400/70 text-emerald-300 font-semibold' : 'bg-slate-900/80 border-white/10 text-slate-400'
                  }`}
                >
                  Terrain
                </button>
                <button
                  onClick={() => setShowSoilRegolith(!showSoilRegolith)}
                  className={`px-2 py-1 rounded-lg text-[10px] border cursor-pointer transition-colors ${
                    showSoilRegolith ? 'bg-amber-500/20 border-amber-400/70 text-amber-300 font-semibold' : 'bg-slate-900/80 border-white/10 text-slate-400'
                  }`}
                >
                  Soil Regolith
                </button>
                <button
                  onClick={() => setShowGeologicalStrata(!showGeologicalStrata)}
                  className={`px-2 py-1 rounded-lg text-[10px] border cursor-pointer transition-colors ${
                    showGeologicalStrata ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 font-semibold' : 'bg-slate-900/80 border-white/10 text-slate-400'
                  }`}
                >
                  Strata
                </button>
                <button
                  onClick={() => setShowAquiferLayers(!showAquiferLayers)}
                  className={`px-2 py-1 rounded-lg text-[10px] border cursor-pointer flex items-center gap-1 transition-colors ${
                    showAquiferLayers ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 font-semibold' : 'bg-slate-900/80 border-white/10 text-slate-400'
                  }`}
                >
                  <Droplet className="w-3 h-3" />
                  <span>Aquifers</span>
                </button>
                <button
                  onClick={() => setShowMineralLayers(!showMineralLayers)}
                  className={`px-2 py-1 rounded-md text-[10px] border cursor-pointer flex items-center gap-1 transition-colors ${
                    showMineralLayers ? 'bg-slate-800 border-amber-400/70 text-amber-200 font-semibold' : 'bg-slate-900/80 border-white/10 text-slate-400'
                  }`}
                >
                  <Gem className="w-3 h-3" />
                  <span>Minerals</span>
                </button>
              </div>
            </div>

            {/* Vertical Exaggeration & Extent */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-white/10">
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Exaggeration</div>
                <div className="flex gap-1">
                  {[1.0, 1.5, 2.5].map((exag) => (
                    <button
                      key={exag}
                      onClick={() => setCutawayExaggeration(exag)}
                      className={`flex-1 py-1 rounded text-[10px] cursor-pointer ${
                        cutawayExaggeration === exag
                          ? 'bg-cyan-500/25 text-cyan-200 font-bold border border-cyan-400/60'
                          : 'bg-slate-900/80 text-slate-400 border border-white/10'
                      }`}
                    >
                      {exag}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Block Extent</div>
                <div className="grid grid-cols-2 gap-1">
                  {[2, 5, 10, 25].map((km) => (
                    <button
                      key={km}
                      onClick={() => setExplorationExtentKm(km)}
                      className={`py-0.5 rounded text-[10px] cursor-pointer ${
                        explorationExtentKm === km
                          ? 'bg-amber-500/25 text-amber-200 font-bold border border-amber-400/60'
                          : 'bg-slate-900/80 text-slate-400 border border-white/10'
                      }`}
                    >
                      {km}km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display Mode & Pumping on small screens */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setGeologicalDisplayMode(geologicalDisplayMode === 'EVIDENCE_BASED' ? 'ILLUSTRATIVE' : 'EVIDENCE_BASED')}
                className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-[10px] text-slate-200 hover:border-cyan-400/50 cursor-pointer"
              >
                Mode: {geologicalDisplayMode === 'EVIDENCE_BASED' ? 'Evidence' : 'Illustrative'}
              </button>
              <button
                onClick={() => setIsPumpingActive(!isPumpingActive)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] border cursor-pointer flex items-center justify-center gap-1 ${
                  isPumpingActive ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold' : 'bg-slate-900 border-white/10 text-slate-300'
                }`}
              >
                {isPumpingActive ? <Square className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" /> : <Play className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
                <span>{isPumpingActive ? 'Stop Pump' : 'Pump Test'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Slim Left Margin Depth Scale Bar */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
          <div className="liquid-glass-hud py-2.5 px-1.5 rounded-xl flex flex-col items-center">
            <div className="h-40 w-1.5 bg-slate-800/90 rounded-full relative">
              <div className="absolute top-0 -left-1 w-3.5 h-0.5 bg-slate-400" />
              <span className="absolute top-0 left-3 text-[9px] font-mono text-slate-300 -translate-y-1/2 font-semibold">0m</span>

              {/* Depth slice marker (GSAP interpolated) */}
              <div
                ref={depthMarkerRef}
                className="absolute -left-1.5 w-4 h-1.5 bg-amber-400 rounded-sm"
                style={{ top: `${Math.min(100, (depthMeters / 1200) * 100)}%` }}
              />
              <span
                ref={depthLabelRef}
                className="absolute left-3 text-[9px] font-mono font-bold text-amber-300 bg-slate-950/90 px-1 py-0.5 rounded border border-amber-500/50 -translate-y-1/2 whitespace-nowrap tabular-nums"
                style={{ top: `${Math.min(100, (depthMeters / 1200) * 100)}%` }}
              >
                -{depthMeters}m
              </span>

              {/* Water table marker (GSAP interpolated) */}
              {observedWaterTableDepth !== null && (
                <div
                  ref={waterMarkerRef}
                  className="absolute -left-1 w-3.5 h-0.5 bg-cyan-400"
                  style={{ top: `${Math.min(100, (observedWaterTableDepth / 1200) * 100)}%` }}
                  title={`Water table: -${observedWaterTableDepth.toFixed(1)} mbgl`}
                />
              )}

              <div className="absolute bottom-0 -left-1 w-3.5 h-0.5 bg-slate-400" />
              <span className="absolute bottom-0 left-3 text-[9px] font-mono text-slate-400 translate-y-1/2">-1200m</span>
            </div>
          </div>
        </div>

        {/* Interactive 2D Cross-Section Modal Overlay */}
        {isCrossSection2D && (
          <CrossSectionViewer
            location={selectedLocation}
            formations={formations}
            aquifers={aquifers}
            borehole={borehole}
            waterTableDepthMbgl={observedWaterTableDepth}
            isWaterTableObserved={hasObservedStation || hasBorehole}
            elevationGrid={terrainElevationGrid}
            structuralAttitude={structuralAttitude}
            onClose={() => setIsCrossSection2D(false)}
          />
        )}

        {/* Nexus AI Scientific Interpretation Drawer (WebGL-safe .liquid-glass-hud) */}
        {aiExplanation && (
          <div className="absolute top-3 left-14 z-20 liquid-glass-hud rounded-2xl p-4 shadow-2xl max-w-md w-80 sm:w-96 text-xs flex flex-col gap-2.5 max-h-[75%] overflow-hidden pointer-events-auto animate-fadeIn">
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
                <h4 className="font-bold text-slate-100 text-xs">
                  Nexus Geological Interpretation
                </h4>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge status={aiExplanation.dataTier as any || 'MODELLED'} size="sm" />
                <button
                  type="button"
                  onClick={() => setAiExplanation(null)}
                  aria-label="Close Geological Interpretation"
                  className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Close Interpretation"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="shrink-0 font-mono text-[11px] text-sky-300 font-semibold truncate">
              Target Formation: {aiExplanation.entityName}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 text-slate-300 text-[11px] leading-relaxed custom-scrollbar">
              <MarkdownRenderer content={aiExplanation.reply} />
            </div>
            <div className="shrink-0 text-[9px] font-mono text-slate-400 border-t border-white/10 pt-1.5 flex items-center justify-between gap-2">
              <span>Grounded in Macrostrat, SoilGrids &amp; hydrogeological surveys.</span>
              <span className={aiExplanation.isLiveGemini ? 'text-emerald-400' : 'text-amber-400'}>
                {aiExplanation.isLiveGemini ? `Live · ${aiExplanation.modelUsed || 'gemini-4-hydrogen'}` : 'Offline Rules'}
              </span>
            </div>
          </div>
        )}

        {/* On-Demand Hover/Click Inspector Tooltip (Bottom-Right Corner, WebGL-safe .liquid-glass-hud) */}
        {activeInspector && (
          <div className="absolute bottom-3 right-3 z-10 liquid-glass-hud rounded-xl p-3.5 shadow-2xl max-w-sm w-80 text-xs flex flex-col gap-2 pointer-events-auto animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 truncate">
                {activeInspector.type === 'AQUIFER' ? (
                  <Droplet className="w-4 h-4 text-sky-400 shrink-0" />
                ) : activeInspector.type === 'MINERAL_VEIN' ? (
                  <Gem className="w-4 h-4 text-amber-400 shrink-0" />
                ) : activeInspector.type === 'WATER_TABLE' ? (
                  <Droplet className="w-4 h-4 text-blue-400 shrink-0" />
                ) : activeInspector.type === 'FENCE_PANEL' ? (
                  <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{activeInspector.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <StatusBadge status={activeInspector.dataTier || 'MODELLED'} size="sm" />
                {isPinned && (
                  <button
                    type="button"
                    onClick={() => setSelectedEntity(null)}
                    aria-label="Unpin Inspector Card"
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Unpin Card"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Stratum Details */}
            {(activeInspector.type === 'STRATUM' || activeInspector.type === 'FENCE_PANEL') && (
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                <p className="leading-tight text-slate-300 font-medium">
                  {activeInspector.lithology}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <div>Age: <span className="text-slate-200">{activeInspector.age || 'Precambrian'}</span></div>
                  <div>Density: <span className="text-slate-200">{activeInspector.density || '2.65 g/cm³'}</span></div>
                  <div>Porosity: <span className="text-slate-200">{activeInspector.porosity || '2.0%'}</span></div>
                  <div>Thickness: <span className="text-amber-300">{activeInspector.thickness || 'Variable'}</span></div>
                </div>

                {activeInspector.basalDatumDisclosure && (
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono text-amber-300 leading-snug">
                    ⚠️ {activeInspector.basalDatumDisclosure}
                  </div>
                )}

                {activeInspector.id && (
                  <button
                    onClick={() => setIsolatedLayerId(activeInspector.id)}
                    className="mt-1 w-full py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-cyan-300 text-[10px] font-mono font-medium transition-colors"
                  >
                    Isolate This Stratum Layer
                  </button>
                )}
              </div>
            )}

            {/* Aquifer Details */}
            {activeInspector.type === 'AQUIFER' && (
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between text-cyan-300 font-mono text-[10px]">
                  <span>Type: {activeInspector.aquiferType}</span>
                  <span>Depth: {activeInspector.depthRange}</span>
                </div>
                <p className="leading-tight text-slate-400 text-[10px]">
                  {activeInspector.principalRock}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <div>Specific Yield: <span className="text-cyan-300">{activeInspector.specificYield}</span></div>
                  <div>Transmissivity: <span className="text-slate-200">{activeInspector.transmissivity}</span></div>
                  <div className="col-span-2">Water Quality (TDS): <span className="text-slate-200">{activeInspector.waterQualityTds}</span></div>
                </div>
              </div>
            )}

            {/* Water Table & 3D Water Cutout Details */}
            {activeInspector.type === 'WATER_TABLE' && (
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between text-sky-300 font-mono text-[10px]">
                  <span>Type: {activeInspector.aquiferType || 'Phreatic Water Table'}</span>
                  <span>WT: {activeInspector.depthMbgl != null ? `-${activeInspector.depthMbgl.toFixed(1)} mbgl` : 'Regional Horizon'}</span>
                </div>
                <p className="leading-tight text-slate-400 text-[10px]">
                  {activeInspector.description}
                </p>
                {activeInspector.transmissivity && (
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <div>Specific Yield: <span className="text-cyan-300">{activeInspector.specificYield}</span></div>
                    <div>Transmissivity: <span className="text-slate-200">{activeInspector.transmissivity}</span></div>
                    <div className="col-span-2">Water Quality (TDS): <span className="text-slate-200">{activeInspector.waterQualityTds}</span></div>
                  </div>
                )}
              </div>
            )}

            {/* Mineral Vein Details */}
            {activeInspector.type === 'MINERAL_VEIN' && (
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                {activeInspector.commodities && (
                  <div className="font-mono text-amber-300 text-[10px]">
                    Target Commodities: {activeInspector.commodities}
                  </div>
                )}
                <p className="leading-tight text-slate-400 text-[10px]">
                  {activeInspector.depositStyle || activeInspector.description}
                </p>
                <div className="text-[9px] text-slate-500 border-t border-slate-800/80 pt-1">
                  {activeInspector.scientificDisclaimer || 'Physical core drilling required for underground assay verification.'}
                </div>
              </div>
            )}

            {/* Borehole Details */}
            {activeInspector.type === 'BOREHOLE' && (
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
                <div className="text-[10px] font-mono text-amber-300">
                  Well Code: {activeInspector.wellCode}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <div>Total Depth: <span className="text-slate-200">{activeInspector.totalDepth}</span></div>
                  <div>Water Strike: <span className="text-sky-300">{activeInspector.waterStrike}</span></div>
                </div>
              </div>
            )}

            {/* Trigger Nexus AI Scientific Interpretation */}
            <button
              type="button"
              onClick={() => handleExplainEntity(activeInspector)}
              disabled={isAiLoading}
              className="mt-1 w-full py-1.5 px-2 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-slate-600/80 text-slate-100 text-[10px] font-mono font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isAiLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span>Interpreting...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span>Explain Geological Context</span>
                </>
              )}
            </button>

            {aiError && (
              <div className="text-[10px] text-rose-400 bg-rose-950/50 p-1.5 rounded border border-rose-800/60 leading-tight">
                {aiError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subsurface3D;

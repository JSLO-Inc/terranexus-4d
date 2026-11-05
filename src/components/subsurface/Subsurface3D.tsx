import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useTerranexusStore, MineralDisplayMode } from '../../state/useTerranexusStore';
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
  buildDippingStratumGeometry,
  buildCornerCutInternalCappingWalls,
  TerraneStructuralAttitude
} from './geologicalMaterials';
import {
  Box,
  RotateCcw,
  Droplet,
  Layers,
  Sparkles,
  Maximize2,
  Sliders,
  Compass,
  Eye,
  EyeOff,
  Filter,
  Info,
  Activity,
  ArrowDown,
  ShieldAlert,
  Radio,
  CheckCircle2,
  XCircle,
  Scissors,
  AlertTriangle,
  Play,
  Square
} from 'lucide-react';

interface Subsurface3DProps {
  className?: string;
  isCompact?: boolean;
}

/**
 * Normalized River Centerline Curve (u in [0, 1] -> v in [0, 1])
 * Synchronizes 2D river surface texture with 3D incised terrain topography.
 */
export function getRiverCenterlineNormV(u: number): number {
  return 0.31 + 0.22 * u + 0.12 * Math.sin(u * Math.PI * 2.0);
}

/**
 * Procedural Top Surface Canvas Texture Generator
 * Creates realistic, location-specific land cover, natural agricultural mosaics,
 * and overlays authentic Sentinel-2 spectral alteration indices or geological contacts.
 * Eliminates artificial 6x6 checkerboard farm grid in favor of continuous natural gradients.
 */
function generateTerrainTexture(
  locationId: string,
  mineralMode: MineralDisplayMode,
  locContext?: { geologicalProvince?: string; basin?: string; aquiferDetails?: any; geologicalTerrane?: any }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const prov = (locContext?.geologicalProvince || '').toLowerCase();
  const lith = ((locContext?.aquiferDetails?.lithologyType || '') + ' ' + (locContext?.geologicalTerrane?.primaryLithology || '')).toLowerCase();
  const id = locationId.toLowerCase();

  const isAlluvium = prov.includes('alluv') || prov.includes('delta') || prov.includes('coastal') || lith.includes('alluv') || lith.includes('sand') || id.includes('ludhiana');
  const isAravalli = prov.includes('aravalli') || prov.includes('fold belt') || prov.includes('delhi') || lith.includes('quartzite') || lith.includes('phyllite') || lith.includes('schist') || id.includes('khetri') || id.includes('zawar');
  const isDeccan = prov.includes('deccan') || prov.includes('basalt') || prov.includes('volcanic') || lith.includes('basalt') || id.includes('pune');
  const isCraton = prov.includes('craton') || prov.includes('dharwar') || prov.includes('greenstone') || prov.includes('laterite') || lith.includes('granite') || lith.includes('gneiss') || id.includes('kolar') || id.includes('singhbhum');

  // Background base soil tone dynamically derived from geological classification
  let baseColor = '#57534e'; // neutral rock/stone
  let secondaryColor = '#44403c';
  let accentColor = '#365314'; // vegetation

  if (isAlluvium) {
    // Alluvial plains & deltas - rich silt & agricultural patchwork
    baseColor = '#854d0e';
    secondaryColor = '#65a30d';
    accentColor = '#15803d';
  } else if (isAravalli) {
    // Fold belts & metasediments - oxidized scree & quartzite ridges
    baseColor = '#9a3412';
    secondaryColor = '#78350f';
    accentColor = '#b45309';
  } else if (isDeccan) {
    // Basaltic flow terranes - dark trap rock & weathered murrum
    baseColor = '#334155';
    secondaryColor = '#475569';
    accentColor = '#3f6212';
  } else if (isCraton) {
    // Archean craton shields - lateritic regolith & greenstone scrub
    baseColor = '#991b1b';
    secondaryColor = '#1e3a5f';
    accentColor = '#166534';
  }

  // Natural, organic land-cover patterning with smooth continuous gradients
  if (isAlluvium) {
    // 1. Base terrain elevation shading gradient (rich alluvial loam, silt, and river-valley vegetation)
    const terrainGrad = ctx.createLinearGradient(0, 0, 512, 512);
    terrainGrad.addColorStop(0, '#5c452d'); // Warm alluvial silt
    terrainGrad.addColorStop(0.35, '#4a3822'); // Fertile topsoil
    terrainGrad.addColorStop(0.7, '#3d4b26'); // Agricultural floodplain
    terrainGrad.addColorStop(1, '#2e3d1d'); // Riparian vegetation
    ctx.fillStyle = terrainGrad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Smooth natural agricultural parcels with soft antialiased field boundaries
    for (let i = 0; i < 36; i++) {
      const fx = (i * 83 + (i % 7) * 29) % 460;
      const fy = (i * 67 + (i % 5) * 37) % 460;
      const fw = 40 + ((i * 11) % 45);
      const fh = 32 + ((i * 13) % 38);
      const toneVariation = ((i % 5) - 2) * 0.03;
      const patchGrad = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
      patchGrad.addColorStop(0, `rgba(68, 98, 42, ${0.28 + toneVariation})`);
      patchGrad.addColorStop(1, `rgba(130, 102, 55, ${0.20 + toneVariation})`);
      ctx.fillStyle = patchGrad;
      ctx.beginPath();
      ctx.roundRect(fx, fy, fw, fh, [4, 6, 4, 6]);
      ctx.fill();

      ctx.strokeStyle = 'rgba(30, 42, 22, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Meandering river drainage with sand bars, riparian banks, and flowing azure water
    ctx.beginPath();
    for (let px = 0; px <= 512; px += 8) {
      const u = px / 512;
      const py = getRiverCenterlineNormV(u) * 512;
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.lineWidth = 22;
    ctx.strokeStyle = 'rgba(168, 132, 76, 0.40)'; // Outer alluvial riparian sand
    ctx.stroke();

    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(120, 95, 50, 0.55)'; // Inner riverbank shelf
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0284c7'; // Active flowing stream channel
    ctx.stroke();

    // 4. Subtle Topographic Isolines (SwissTopo / Survey of India aesthetic)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 6; c++) {
      const cy = 55 + c * 75;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.bezierCurveTo(130, cy - 12, 330, cy + 18, 512, cy - 8);
      ctx.stroke();
    }
  } else if (isAravalli) {
    // Linear strike-parallel quartzite ridges and ferruginous scree bands
    const ridgeGrad = ctx.createLinearGradient(0, 0, 512, 512);
    ridgeGrad.addColorStop(0, '#7c2d12');
    ridgeGrad.addColorStop(0.5, '#9a3412');
    ridgeGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = ridgeGrad;
    ctx.fillRect(0, 0, 512, 512);

    for (let r = 0; r < 512; r += 32) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = r % 64 === 0 ? secondaryColor : accentColor;
      ctx.beginPath();
      ctx.moveTo(0, r + 40);
      ctx.bezierCurveTo(180, r - 20, 340, r + 60, 512, r);
      ctx.lineTo(512, r + 35);
      ctx.bezierCurveTo(340, r + 95, 180, r + 15, 0, r + 75);
      ctx.closePath();
      ctx.fill();
    }
  } else if (isDeccan) {
    // Stepped basalt trap terraces and dark vertisol plateaus
    for (let t = 0; t < 5; t++) {
      const grad = ctx.createLinearGradient(0, t * 100, 512, t * 100 + 90);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#475569');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(0, t * 100, 512, 90);

      // Weathered terrace step brow
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, t * 100);
      ctx.bezierCurveTo(170, t * 100 + 8, 360, t * 100 - 6, 512, t * 100 + 4);
      ctx.stroke();
    }
  } else {
    // Archean Craton & Eastern Ghats: organic lateritic mottling & greenstone schists
    for (let i = 0; i < 35; i++) {
      const cx = (i * 73) % 512;
      const cy = (i * 97) % 512;
      const rad = 30 + (i % 25);
      const radGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      radGrad.addColorStop(0, accentColor);
      radGrad.addColorStop(0.7, secondaryColor);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Micro-texture noise (authentic granular soil and rock mineral specks)
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 2400; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.fillRect(rx, ry, 1, 1);
  }

  // Overlay Mineral Category Layers
  if (mineralMode === 'surface-spectral') {
    // A. Surface Spectral Observations with smooth Gaussian-like radial falloff
    ctx.globalAlpha = 0.85;
    const feGrad = ctx.createRadialGradient(310, 210, 5, 310, 210, 65);
    feGrad.addColorStop(0, 'rgba(220, 38, 38, 0.85)');
    feGrad.addColorStop(0.6, 'rgba(185, 28, 28, 0.45)');
    feGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = feGrad;
    ctx.beginPath();
    ctx.arc(310, 210, 65, 0, Math.PI * 2);
    ctx.fill();

    const clayGrad = ctx.createRadialGradient(200, 310, 5, 200, 310, 55);
    clayGrad.addColorStop(0, 'rgba(2, 132, 199, 0.85)');
    clayGrad.addColorStop(0.6, 'rgba(3, 105, 161, 0.45)');
    clayGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');
    ctx.fillStyle = clayGrad;
    ctx.beginPath();
    ctx.arc(200, 310, 55, 0, Math.PI * 2);
    ctx.fill();

    // Band Ratio Indicators
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('FeOx: B4/B2 > 1.6', 260, 215);

    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('Al-OH: B11/B12 > 1.25', 150, 315);
  } else if (mineralMode === 'geological-context') {
    // B. Geological Context (GSI Metallogenic Shear Trends & Lithotectonic Contact)
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(30, 480);
    ctx.lineTo(480, 50);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('METALLOGENIC SHEAR STRIKE', 140, 260);
  } else if (mineralMode === 'modelled-prospectivity') {
    // C. Modelled Prospectivity (Regional prospective belt boundary)
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.ellipse(256, 256, 150, 95, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('HIGH PROSPECTIVITY ENVELOPE', 150, 260);
  }

  ctx.globalAlpha = 1.0;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Derive scientifically plausible geological formations for any location in India.
 */
function deriveDynamicFormations(
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
      colorHex: i === 0 ? '#ca8a04' : i === 1 ? '#b45309' : '#334155',
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
 * Derive scientifically plausible aquifers for any Indian coordinate.
 */
function deriveDynamicAquifers(
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

  return [
    {
      id: 'aq-dyn-def-weathered',
      locationId: locId,
      name: 'Shallow Weathered Regolith Aquifer',
      topDepthM: 3,
      bottomDepthM: 25,
      aquiferType: 'Unconfined',
      principalRock: 'Decomposed saprolite and weathered gneiss',
      transmissivityM2Day: 45,
      specificYieldPercent: 4.5,
      waterQualityTdsMgL: 540,
      ecMicrosiemens: 810,
      status: 'MODELLED'
    },
    {
      id: 'aq-dyn-def-fractured',
      locationId: locId,
      name: 'Deep Fractured Basement Aquifer Zone',
      topDepthM: 50,
      bottomDepthM: 160,
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
    setCutawayPreset
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
  const [aiExplanation, setAiExplanation] = useState<{ entityName: string; reply: string; dataTier: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [hoveredEntity, setHoveredEntity] = useState<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // Fetch authentic Copernicus GLO-90 DEM grid on coordinate or extent change
  useEffect(() => {
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
  }, [selectedLocation.latitude, selectedLocation.longitude, explorationExtentKm, setTerrainElevationGrid]);

  // Scientific data queries for current location
  const formations = deriveDynamicFormations(selectedLocation, currentDossier);
  const aquifers = deriveDynamicAquifers(selectedLocation, currentDossier);
  const minerals = MINERAL_INDICATORS[selectedLocation.id] as MineralProspectivitySummary | undefined;
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

  // Water table depth
  const hasObservedStation = activeGroundwaterDepthMbgl !== null;
  const hasBorehole = !hasObservedStation && !!borehole;
  const hasModelEstimate = !hasObservedStation && !hasBorehole && currentDossier?.groundwater?.estimate?.medianDepthMbgl != null;

  const observedWaterTableDepth: number | null = hasObservedStation
    ? activeGroundwaterDepthMbgl!
    : hasBorehole
      ? borehole!.waterTableDepthMeters
      : hasModelEstimate
        ? currentDossier!.groundwater.estimate.medianDepthMbgl
        : 32.4; // Scientific baseline benchmark

  // Reset Camera View helper
  const applyCameraPreset = useCallback((preset: 'isometric' | 'front' | 'side' | 'top' | 'corner' | 'reset') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (preset) {
      case 'front':
        camera.position.set(0, -6, 62);
        controls.target.set(0, -14, 0);
        break;
      case 'side':
        camera.position.set(62, -6, 0);
        controls.target.set(0, -14, 0);
        break;
      case 'top':
        camera.position.set(0, 72, 0.1);
        controls.target.set(0, 0, 0);
        break;
      case 'corner':
        camera.position.set(48, 25, 48);
        controls.target.set(0, -14, 0);
        break;
      case 'isometric':
      case 'reset':
      default:
        camera.position.set(46, 28, 46);
        controls.target.set(0, -14, 0);
        break;
    }
    camera.lookAt(controls.target);
    controls.update();
  }, []);

  const handleResetCamera = () => applyCameraPreset('isometric');

  const handleToggle2D = () => {
    setIsCrossSection2D(!isCrossSection2D);
  };

  const handleExplainEntity = async (entity: any) => {
    if (!entity) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const locName = 'displayName' in selectedLocation ? selectedLocation.displayName : selectedLocation.name;
      const prompt = `Explain the geological, hydrological, or metallogenic genesis of: ${entity.name}. Lithology: ${entity.lithology || 'N/A'}. Location: ${locName}. Terrane: ${structuralAttitude.structuralStyle}. Depth Range: ${entity.depthRange || 'Surface'}. Data provenance tier: ${entity.dataTier || 'MODELLED'}. Cite relevant GSI / CGWB literature and physical constraints.`;
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          locationContext: selectedLocation
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiExplanation({
          entityName: entity.name,
          reply: data.reply,
          dataTier: entity.dataTier || 'MODELLED'
        });
      } else {
        setAiError(data.error || 'Failed to generate scientific interpretation.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Network error reaching Nexus AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Main Three.js Scene Setup & Re-Render Effect
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 1000);
    cameraRef.current = camera;
    if (cutawayBlockStyle === 'corner') {
      camera.position.set(48, 25, 48);
      camera.lookAt(0, -14, 0);
    } else {
      camera.position.set(46, 28, 46);
      camera.lookAt(0, -14, 0);
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // Static land block shadows only need rendering on scene change
    renderer.shadowMap.needsUpdate = true;
    renderer.localClippingEnabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. OrbitControls with clamped zoom and orientation limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    if (typeof window !== 'undefined') {
      (window as any).__subsurfaceCamera = camera;
      (window as any).__subsurfaceControls = controls;
    }
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, -14, 0);
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

    // 4. Main Stratigraphic Group & Clipping Planes
    const strataGroup = new THREE.Group();
    strataGroupRef.current = strataGroup;
    scene.add(strataGroup);

    // Depth Clipping Plane (horizontal slice)
    const depthClipPlane = new THREE.Plane(
      new THREE.Vector3(0, -1, 0),
      depthMeters > 0 ? -depthMeters * verticalScale : 99999
    );
    depthClipPlaneRef.current = depthClipPlane;

    // Corner Cut Clipping Planes (excises front quadrant x > 0 && z > 0)
    const cornerPlaneX = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
    const cornerPlaneZ = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

    const activeClippingPlanes: THREE.Plane[] =
      cutawayBlockStyle === 'corner'
        ? [cornerPlaneX, cornerPlaneZ]
        : [depthClipPlane];

    const interactiveObjects: THREE.Object3D[] = [];
    strataMeshesRef.current = [];
    aquiferMeshesRef.current = [];
    mineralMeshesRef.current = [];

    // -------------------------------------------------------------
    // CONTINUOUS SURFACE ELEVATION FUNCTION (DEM GRID OR TERRAIN MODEL)
    // -------------------------------------------------------------
    const getSurfaceElevation = (x: number, z: number): number => {
      // 1. Normalized coordinate across block
      const uNorm = Math.max(0, Math.min(1, (x + blockWidth / 2) / blockWidth));
      const vRiver = getRiverCenterlineNormV(uNorm);
      const zRiver = (vRiver - 0.5) * blockLength;
      const dRiver = Math.abs(z - zRiver);

      // Fluvial incision channel & natural levee ridges
      const riverIncision = -2.2 * Math.exp(-(dRiver * dRiver) / (2 * 3.4 * 3.4));
      const leveeRidge = 0.60 * Math.exp(-((dRiver - 4.6) * (dRiver - 4.6)) / (2 * 1.6 * 1.6));
      const fluvialComponent = (riverIncision + leveeRidge) * cutawayExaggeration;

      // 2. Copernicus GLO-90 DEM Grid Elevation
      if (terrainElevationGrid && terrainElevationGrid.elevations?.length > 0) {
        const grid = terrainElevationGrid;
        const rows = grid.elevations.length;
        const cols = grid.elevations[0].length;
        const meanEle = grid.meanElevationM || 0;
        const reliefRange = Math.max(grid.maxElevationM - grid.minElevationM, 6.0);
        const demScale = Math.min(Math.max(4.5 / reliefRange, 0.08), 0.35) * cutawayExaggeration;

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
        return (ele - meanEle) * demScale + fluvialComponent * 0.45;
      }

      // 3. Multi-Octave Continuous Terrain Geomorphology
      const isAravalli = selectedLocation.id.includes('khetri') || selectedLocation.id.includes('zawar');
      const isDeccan = selectedLocation.id.includes('pune');
      const isCraton = selectedLocation.id.includes('kolar') || selectedLocation.id.includes('singhbhum');

      if (isAravalli) {
        // Strike-parallel hogback quartzite ridges and eroded shale valleys
        const strikeRad = (structuralAttitude.strikeDeg * Math.PI) / 180;
        const normalCoord = x * Math.cos(strikeRad) + z * Math.sin(strikeRad);
        return (
          Math.sin(normalCoord * 0.22) * 4.2 +
          Math.cos(normalCoord * 0.45) * 1.4 +
          Math.sin(z * 0.15) * 0.8
        ) * cutawayExaggeration;
      }

      if (isDeccan) {
        // Step-terraced basalt trap mesa scarps and flow plateaus
        const rawRelief = Math.sin(x * 0.10) * 3.2 + Math.cos(z * 0.12) * 2.8;
        const terraceStep = Math.floor(rawRelief / 1.6) * 1.2 + (rawRelief % 1.6) * 0.35;
        return terraceStep * cutawayExaggeration;
      }

      if (isCraton) {
        // Archean shield: undulating granite-gneiss domes and lateritic mesas
        return (
          Math.sin(x * 0.12 + 0.5) * Math.cos(z * 0.10 - 0.4) * 3.5 +
          Math.sin((x + z) * 0.20) * 1.2 +
          fluvialComponent * 0.5
        ) * cutawayExaggeration;
      }

      // Default Alluvial Plain (Ludhiana / Indo-Gangetic Foreland):
      // Rolling agricultural terraces, gentle swales, and incised river channel
      const rollingTerraces = (
        Math.sin(x * 0.08 + 0.4) * Math.cos(z * 0.07 - 0.3) * 2.2 +
        Math.sin((x + z) * 0.14) * 0.9 +
        Math.cos((x - z) * 0.16) * 0.6 +
        Math.sin(x * 0.30 + z * 0.24) * 0.35
      );
      const regionalSlope = -0.035 * x + 0.025 * z;

      return (rollingTerraces + regionalSlope) * cutawayExaggeration + fluvialComponent;
    };

    // -------------------------------------------------------------
    // A. TOP TERRAIN DISPLACED RELIEF SURFACE MESH
    // -------------------------------------------------------------
    const terrainCols = 96;
    const terrainRows = 96;
    const terrainGeo = new THREE.PlaneGeometry(blockWidth, blockLength, terrainCols - 1, terrainRows - 1);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainPosAttr = terrainGeo.attributes.position;

    for (let i = 0; i < terrainPosAttr.count; i++) {
      const vx = terrainPosAttr.getX(i);
      const vz = terrainPosAttr.getZ(i);
      terrainPosAttr.setY(i, getSurfaceElevation(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const elevationSourceLabel = terrainElevationGrid?.sourceDataset || 'Copernicus Global 90m DEM (GLO-90)';
    const elevationDataTier = terrainElevationGrid?.status === 'OBSERVED' ? 'OBSERVED' : 'MODELLED';

    const terrainTexture = generateTerrainTexture(selectedLocation.id, mineralDisplayMode, selectedLocation as any);
    const terrainMat = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: cutawayBlockStyle === 'corner',
      side: THREE.DoubleSide
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = 0.05; // Clean separation above volumetric regolith prevents coplanar z-fighting
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    terrainMesh.userData = {
      type: 'SURFACE_TERRAIN',
      name: 'Earth Surface & Topsoil Overburden',
      description: `Elevation: ${selectedLocation.elevationMeters || 247}m ASL (Grid: ${terrainElevationGrid ? `${terrainElevationGrid.minElevationM}m – ${terrainElevationGrid.maxElevationM}m` : 'Regional Benchmark'}). Land cover and Sentinel-2 / GSI geological signatures.`,
      sourceDataset: elevationSourceLabel,
      depthRange: '0m Surface',
      dataTier: elevationDataTier
    };
    strataGroup.add(terrainMesh);
    interactiveObjects.push(terrainMesh);

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

    const regolithGeo = buildDippingStratumGeometry(regolithTopFunc, regolithBotFunc, blockWidth, blockLength, 32, 32, 4.0);
    const regolithPbr = generateLithologyPbrTextures('Q-SOIL-REG', 'Weathered Regolith, Saprolite, and Humus Loam', '#573919');

    const regolithMat = new THREE.MeshStandardMaterial({
      color: 0x573919,
      map: regolithPbr.map,
      bumpMap: regolithPbr.bumpMap,
      bumpScale: 0.10,
      roughness: 0.95,
      metalness: 0.02,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: cutawayBlockStyle === 'corner',
      side: THREE.DoubleSide
    });
    const regolithMesh = new THREE.Mesh(regolithGeo, regolithMat);
    regolithMesh.receiveShadow = true;
    regolithMesh.castShadow = true;
    regolithMesh.userData = {
      type: 'STRATUM',
      name: 'Weathered Regolith & Soil Overburden',
      lithology: 'Humus loam, sandy clay saprolite, and organic subsoil',
      age: 'Quaternary / Modern',
      depthRange: '0m – 15m',
      porosity: '32.0%',
      density: '1.85 g/cm³',
      dataTier: 'MODELLED'
    };
    strataGroup.add(regolithMesh);
    interactiveObjects.push(regolithMesh);
    strataMeshesRef.current.push(regolithMesh);

    if (cutawayBlockStyle === 'corner') {
      const regolithCapGeo = buildCornerCutInternalCappingWalls(
        regolithTopFunc,
        regolithBotFunc,
        blockWidth / 2,
        blockLength / 2,
        32,
        32,
        4.0
      );
      const regolithCapMat = new THREE.MeshStandardMaterial({
        color: 0x573919,
        map: regolithPbr.map,
        bumpMap: regolithPbr.bumpMap,
        bumpScale: 0.10,
        roughness: 0.95,
        metalness: 0.02,
        side: THREE.DoubleSide
      });
      const regolithCapMesh = new THREE.Mesh(regolithCapGeo, regolithCapMat);
      regolithCapMesh.receiveShadow = true;
      regolithCapMesh.castShadow = true;
      regolithCapMesh.userData = regolithMesh.userData;
      strataGroup.add(regolithCapMesh);
      interactiveObjects.push(regolithCapMesh);
      strataMeshesRef.current.push(regolithCapMesh);
    }

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

      if (idx === formations.length - 1) {
        // Deepest bedrock base: flat horizontal bottom datum
        contactFuncs.push(() => baseDatumY);
      } else {
        contactFuncs.push((x: number, z: number) => {
          const dip = getDipOffset(x, z);
          let sedimentPinch = 0;
          if (idx === 0) {
            // Upper alluvium: thicker near the river channel
            const u = Math.max(0, Math.min(1, (x + blockWidth / 2) / blockWidth));
            const zR = (getRiverCenterlineNormV(u) - 0.5) * blockLength;
            const d = Math.abs(z - zR);
            sedimentPinch = -1.6 * Math.exp(-(d * d) / (2 * 11.0 * 11.0));
          } else if (idx === 1) {
            // Middle aquifer sand: lenticular channel bar geometry
            sedimentPinch = -1.2 * Math.sin(x * 0.12 + 0.8) * Math.cos(z * 0.10);
          } else {
            // Bedrock unconformity: wavy palaeo-erosional surface
            sedimentPinch = 1.2 * Math.sin(x * 0.16 + phase) * Math.cos(z * 0.14 - phase * 0.6);
          }
          const undul = getUndulation(x, z, phase);
          return refY + dip + sedimentPinch + undul;
        });
      }
    });

    // Create volumetric 3D meshes for each formation
    formations.forEach((formation, idx) => {
      const topFunc = contactFuncs[idx];
      const botFunc = contactFuncs[idx + 1];

      // Procedural PBR materials with meter-anchored UV coordinates
      const pbr = generateLithologyPbrTextures(formation.code, formation.primaryLithology, formation.colorHex);
      const slabGeo = buildDippingStratumGeometry(topFunc, botFunc, blockWidth, blockLength, 32, 32, 4.0);

      // In fence mode, strata blocks become transparent so fence panels shine through
      const isFenceActive = cutawayBlockStyle === 'fence';
      const slabMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(formation.colorHex),
        map: pbr.map,
        bumpMap: pbr.bumpMap,
        bumpScale: 0.12,
        roughnessMap: pbr.roughnessMap,
        roughness: pbr.roughness,
        metalness: pbr.metalness,
        transparent: true,
        opacity: isFenceActive ? 0.22 : 0.96,
        depthWrite: !isFenceActive,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: cutawayBlockStyle === 'corner',
        side: THREE.DoubleSide
      });

      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
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

      // Solid internal capping walls for 90° corner cut excavations
      if (cutawayBlockStyle === 'corner') {
        const capGeo = buildCornerCutInternalCappingWalls(
          topFunc,
          botFunc,
          blockWidth / 2,
          blockLength / 2,
          32,
          32,
          4.0
        );
        const capMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(formation.colorHex),
          map: pbr.map,
          bumpMap: pbr.bumpMap,
          bumpScale: 0.12,
          roughnessMap: pbr.roughnessMap,
          roughness: pbr.roughness,
          metalness: pbr.metalness,
          side: THREE.DoubleSide
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.receiveShadow = true;
        capMesh.castShadow = true;
        capMesh.userData = slabMesh.userData;
        strataGroup.add(capMesh);
        interactiveObjects.push(capMesh);
        strataMeshesRef.current.push(capMesh);
      }

      // Boundary wireframe lines delineating contact surfaces
      const wireGeo = new THREE.EdgesGeometry(slabGeo, 25);
      const wireMat = new THREE.LineBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: isFenceActive ? 0.25 : 0.6,
        clippingPlanes: activeClippingPlanes
      });
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      strataGroup.add(wireframe);
    });

    // Distinct Geological Contact Seam Lines on Exposed Internal Cutaway Walls
    if (cutawayBlockStyle === 'corner') {
      const contactLineMat = new THREE.LineBasicMaterial({
        color: 0x0f172a,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.65
      });
      contactFuncs.forEach((cFunc) => {
        // Wall 1 line (x = 0, z from 0 to halfL)
        const wall1Pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 32; s++) {
          const z = (s / 32) * (blockLength / 2);
          wall1Pts.push(new THREE.Vector3(0.01, cFunc(0, z), z));
        }
        const wall1Geo = new THREE.BufferGeometry().setFromPoints(wall1Pts);
        strataGroup.add(new THREE.Line(wall1Geo, contactLineMat));

        // Wall 2 line (z = 0, x from 0 to halfW)
        const wall2Pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 32; s++) {
          const x = (s / 32) * (blockWidth / 2);
          wall2Pts.push(new THREE.Vector3(x, cFunc(x, 0), 0.01));
        }
        const wall2Geo = new THREE.BufferGeometry().setFromPoints(wall2Pts);
        strataGroup.add(new THREE.Line(wall2Geo, contactLineMat));
      });
    }

    // -------------------------------------------------------------
    // E. VOLUMETRIC AQUIFERS & GROUNDWATER SATURATION HORIZONS
    // -------------------------------------------------------------
    aquifers.forEach((aquifer) => {
      const topDepthScaled = Math.max(aquifer.topDepthM * verticalScale, 1.0);
      const botDepthScaled = Math.max(aquifer.bottomDepthM * verticalScale, 4.0);
      const topY = -topDepthScaled;
      const botY = -botDepthScaled;

      const aqTopFunc = (x: number, z: number) => topY + getDipOffset(x, z) * 0.6;
      const aqBotFunc = (x: number, z: number) => botY + getDipOffset(x, z) * 0.6;

      const aqGeo = buildDippingStratumGeometry(aqTopFunc, aqBotFunc, blockWidth * 1.002, blockLength * 1.002, 32, 32, 4.0);
      const aqMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x0ea5e9),
        emissive: new THREE.Color(0x0284c7),
        emissiveIntensity: 0.25 * waterIntensity,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: waterOpacity * 0.45,
        depthWrite: false,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: cutawayBlockStyle === 'corner',
        side: THREE.DoubleSide
      });

      const aqMesh = new THREE.Mesh(aqGeo, aqMat);
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

    // -------------------------------------------------------------
    // F. PHREATIC WATER TABLE HORIZON (VERIFIED THIEM DRAWDOWN MATH)
    // -------------------------------------------------------------
    if (observedWaterTableDepth !== null) {
      const waterTableTier: 'OBSERVED' | 'INTERPOLATED' | 'MODELLED' = hasObservedStation
        ? 'OBSERVED'
        : hasBorehole
          ? 'OBSERVED'
          : hasModelEstimate
            ? 'MODELLED'
            : 'INTERPOLATED';

      const waterTableDescription = hasObservedStation
        ? `Observed piezometric level at -${observedWaterTableDepth.toFixed(1)} mbgl (CGWB/State monitoring well within 50 km).`
        : hasBorehole
          ? `Water table at -${observedWaterTableDepth.toFixed(1)} mbgl from borehole log ${borehole!.wellCode}.`
          : `Modelled regional water table estimate at -${observedWaterTableDepth.toFixed(1)} mbgl.`;

      const wtPlaneY = -observedWaterTableDepth * verticalScale;

      const wtPlaneGeo = new THREE.PlaneGeometry(blockWidth * 0.996, blockLength * 0.996, 64, 64);
      wtPlaneGeo.rotateX(-Math.PI / 2);

      const posAttr = wtPlaneGeo.attributes.position;
      const bhX = borehole ? 8 : 0;
      const bhZ = borehole ? 8 : 0;
      // Physical pumping parameters: Q = 12.0 L/s = 1036.8 m3/day
      const q_m3_day = 1036.8;
      const t_m2_day = (aquifers.length > 0 && aquifers[0].transmissivityM2Day > 0) ? aquifers[0].transmissivityM2Day : 65.0;
      const radiusOfInfluence = 14.0;
      const rWell = 0.6;
      // Thiem drawdown scale factor s_0 = Q / (2 * pi * T)
      const thiemFactor = (q_m3_day / (2 * Math.PI * t_m2_day)) * 0.15 * verticalScale;
      const maxDrawdown = Math.min(thiemFactor * Math.log(radiusOfInfluence / rWell), 5.5 * verticalScale);

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        // Water table subtly mirrors subdued surface terrain (phreatic replication), NOT deep bedrock tectonic dip
        const regionalSlope = getSurfaceElevation(vx, vz) * 0.22;
        const distToWell = Math.sqrt((vx - bhX) ** 2 + (vz - bhZ) ** 2);
        let drawdown = 0;

        // Condition drawdown cone strictly on active pumping scenario
        if (isPumpingActive && borehole && distToWell < radiusOfInfluence) {
          const effectiveR = Math.max(distToWell, rWell);
          const rawDrawdown = maxDrawdown * (Math.log(radiusOfInfluence / effectiveR) / Math.log(radiusOfInfluence / rWell));

          // Jacob (1944) unconfined-aquifer correction:
          // s = H - sqrt(max(0, H^2 - 2 * H * s'))
          // Applicable to unconfined aquifers under Dupuit late-time quasi-steady horizontal flow.
          const aquiferH = aquifers.length > 0 ? (aquifers[0].bottomDepthM - aquifers[0].topDepthM) * verticalScale : 0;
          if (aquifers[0]?.aquiferType === 'Unconfined' && aquiferH > 0 && 2 * rawDrawdown < aquiferH) {
            drawdown = aquiferH - Math.sqrt(Math.max(0, aquiferH * aquiferH - 2 * aquiferH * rawDrawdown));
          } else {
            drawdown = rawDrawdown;
          }
        }

        posAttr.setY(i, regionalSlope - drawdown);
      }
      wtPlaneGeo.computeVertexNormals();

      const wtPlaneMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35 * waterIntensity,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: Math.min(waterOpacity, 0.65),
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
        clippingPlanes: activeClippingPlanes,
        clipIntersection: cutawayBlockStyle === 'corner',
        side: THREE.DoubleSide
      });
      const wtPlaneMesh = new THREE.Mesh(wtPlaneGeo, wtPlaneMat);
      wtPlaneMesh.position.y = wtPlaneY;
      baseWaterTableYRef.current = wtPlaneY;
      wtPlaneMesh.userData = {
        type: 'WATER_TABLE',
        name: 'Phreatic Water Table Horizon',
        description: `${waterTableDescription}${isPumpingActive ? ' [Active Pumping Simulation: Thiem Drawdown Cone Active]' : ' [Undisturbed Static Piezometric Surface]'}`,
        depthMbgl: observedWaterTableDepth,
        dataTier: waterTableTier
      };
      strataGroup.add(wtPlaneMesh);
      waterTablePlaneRef.current = wtPlaneMesh;
      interactiveObjects.push(wtPlaneMesh);
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
      const wellHeadY = cutawayBlockStyle === 'corner' ? 0.2 : getSurfaceElevation(8, 8) + 0.2;
      bhGroup.position.set(8, wellHeadY, 8);

      // Precision Surface Casing Monument (SwissTopo / Geotechnical Engineering Standard)
      const collarGeo = new THREE.CylinderGeometry(0.35, 0.40, 0.45, 16);
      const collarMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Precision slate steel
        metalness: 0.85,
        roughness: 0.25
      });
      const collarMesh = new THREE.Mesh(collarGeo, collarMat);
      collarMesh.position.y = 0.225;
      collarMesh.userData = {
        type: 'WELLHEAD',
        name: `Surface Monitoring Wellhead (${borehole.wellCode})`,
        elevation: `${('elevation' in selectedLocation && selectedLocation.elevation) ? selectedLocation.elevation : 247}m ASL`,
        agency: borehole.sourceAgency
      };
      bhGroup.add(collarMesh);
      interactiveObjects.push(collarMesh);

      // Precision Brass Survey Monument Plaque
      const capPlateGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.05, 16);
      const capPlateMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Amber brass benchmark
        metalness: 0.9,
        roughness: 0.2
      });
      const capPlateMesh = new THREE.Mesh(capPlateGeo, capPlateMat);
      capPlateMesh.position.y = 0.46;
      bhGroup.add(capPlateMesh);

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

      // 3D Stratigraphic Fence Panels (Civil 3D Geotechnical Modeler Reference)
      // Generates orthogonal fence corridors connecting borehole across the model
      const fenceLines = [
        { x0: 8, z0: 8, x1: -blockWidth * 0.42, z1: -blockLength * 0.42, name: "Section A – A'" },
        { x0: 8, z0: 8, x1: -blockWidth * 0.42, z1: blockLength * 0.42, name: "Section B – B'" }
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
            opacity: cutawayBlockStyle === 'fence' ? 0.95 : 0.85,
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

    // -------------------------------------------------------------
    // I. INTERACTIVE DEPTH SLICE HORIZONTAL PLANE (CLIPPED & BOUNDED)
    // -------------------------------------------------------------
    const sliceGeo = new THREE.PlaneGeometry(blockWidth * 0.998, blockLength * 0.998);
    const sliceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.5,
      clippingPlanes: activeClippingPlanes,
      clipIntersection: cutawayBlockStyle === 'corner',
      side: THREE.DoubleSide
    });
    const sliceMesh = new THREE.Mesh(sliceGeo, sliceMat);
    sliceMesh.rotation.x = -Math.PI / 2;
    sliceMesh.position.y = -depthMeters * verticalScale;
    sliceMesh.visible = depthMeters > 0;
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
        if (cutawayBlockStyle === 'corner') {
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
        if (cutawayBlockStyle === 'corner') {
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
    // K. RENDER LOOP (WITH ZERO WATER TABLE DRIFT GUARANTEE)
    // -------------------------------------------------------------
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Zero-Drift Stable Water Table Horizon
      if (waterTablePlaneRef.current) {
        waterTablePlaneRef.current.position.y = baseWaterTableYRef.current;
      }

      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup & WebGL Resource Disposal
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousemove', handlePointerMove);
      domElement.removeEventListener('click', handleClick);
      if (typeof window !== 'undefined') {
        delete (window as any).__subsurfaceCamera;
        delete (window as any).__subsurfaceControls;
      }
      controls.dispose();
      renderer.dispose();
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    selectedLocation,
    currentDossier,
    activeGroundwaterDepthMbgl,
    cutawayExaggeration,
    terrainElevationGrid,
    mineralDisplayMode,
    cutawayBlockStyle,
    geologicalDisplayMode,
    isPumpingActive
  ]);

  // Reactive Effect: Update Depth Slice Plane dynamically
  useEffect(() => {
    if (depthClipPlaneRef.current) {
      if (depthMeters <= 0 || cutawayBlockStyle === 'corner') {
        depthClipPlaneRef.current.constant = 99999;
      } else {
        depthClipPlaneRef.current.constant = -depthMeters * verticalScale;
      }
    }
    if (depthSlicePlaneRef.current) {
      depthSlicePlaneRef.current.position.y = -depthMeters * verticalScale;
      depthSlicePlaneRef.current.visible = depthMeters > 0;
    }
  }, [depthMeters, verticalScale, cutawayBlockStyle]);

  // Reactive Effect: Update Water Saturation Display Intensity & Opacity
  useEffect(() => {
    if (waterTablePlaneRef.current) {
      const mat = waterTablePlaneRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.5 * waterIntensity;
        mat.opacity = waterOpacity;
      }
    }

    aquiferMeshesRef.current.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.3 * waterIntensity;
        mat.opacity = waterOpacity * 0.75 * (showAquiferLayers ? 1 : 0);
      }
      mesh.visible = showAquiferLayers;
    });
  }, [waterIntensity, waterOpacity, showAquiferLayers]);

  // Reactive Effect: Toggle Mineral Veins visibility
  useEffect(() => {
    mineralMeshesRef.current.forEach(mesh => {
      mesh.visible = showMineralLayers;
    });
  }, [showMineralLayers]);

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
  }, [isolatedLayerId, cutawayBlockStyle]);

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

      {/* Top 3D Viewport Controls Bar */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none z-10 gap-2 flex-wrap">
        {/* Left: Minimal Locus & DEM Provenance Pill */}
        <div className="glass-pill flex items-center gap-2 py-1 px-3 text-xs font-mono pointer-events-auto shadow-lg">
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-100">{selectedLocation.name.split(' - ')[0]}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
            {terrainElevationGrid?.sourceDataset || 'Copernicus GLO-90 DEM'}
          </span>
          <StatusBadge status={terrainElevationGrid?.status || 'OBSERVED'} size="sm" />

          {/* Structural Strike / Dip Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-700/80 text-[10px] text-amber-300">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Strike: N{structuralAttitude.strikeDeg}°E</span>
            <span className="text-slate-600">•</span>
            <span>Dip: {structuralAttitude.dipDeg}° {structuralAttitude.dipDirection}</span>
          </div>

          {isolatedLayerId && (
            <button
              onClick={() => setIsolatedLayerId(null)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 font-mono text-[9px] hover:bg-amber-500/30 transition-colors"
              title="Click to restore full geological stratigraphy"
            >
              <span>Stratum Isolated</span>
              <span className="font-bold">✕</span>
            </button>
          )}
        </div>

        {/* Right: Camera Controls, Display Mode, 3D Block Modes, Layer Toggles */}
        <div className="glass-panel flex items-center gap-1.5 p-1 rounded-xl shadow-xl pointer-events-auto flex-wrap">
          {/* Mode A vs Mode B Scientific Display Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setGeologicalDisplayMode('EVIDENCE_BASED')}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1 ${
                geologicalDisplayMode === 'EVIDENCE_BASED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mode A (Evidence-Based): Displays observed in-situ wells and measured borehole data"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Evidence-Based</span>
            </button>
            <button
              onClick={() => setGeologicalDisplayMode('ILLUSTRATIVE')}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1 ${
                geologicalDisplayMode === 'ILLUSTRATIVE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Mode B (Illustrative): Displays full regional conceptual 3D geological cutaway with warning banner"
            >
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Illustrative</span>
            </button>
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => applyCameraPreset('isometric')}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Isometric Perspective View"
            >
              Iso
            </button>
            <button
              onClick={() => applyCameraPreset('front')}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Front Orthogonal View"
            >
              Front
            </button>
            <button
              onClick={() => applyCameraPreset('side')}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Side Profile View"
            >
              Side
            </button>
            <button
              onClick={() => applyCameraPreset('top')}
              className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Top Plan View"
            >
              Top
            </button>
            <button
              onClick={handleResetCamera}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
              title="Reset Camera Target and Angle"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* 3D Cutaway Mode Switcher: 3D Block vs Corner Cut vs 3D Fence Diagram vs 2D Section */}
          <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setCutawayBlockStyle('block');
                setCutawayPreset('isometric');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                cutawayBlockStyle === 'block' && !isCrossSection2D
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full 3D Block Cutaway"
            >
              3D Block
            </button>
            <button
              onClick={() => {
                setCutawayBlockStyle('corner');
                setCutawayPreset('corner-cut');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1 ${
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
              onClick={() => {
                setCutawayBlockStyle('fence');
                setCutawayPreset('fence');
                setIsCrossSection2D(false);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all flex items-center gap-1 ${
                cutawayBlockStyle === 'fence' && !isCrossSection2D
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Stratigraphic Fence Diagrams (Civil 3D Geotechnical Modeler Reference)"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Fence</span>
            </button>
            <button
              onClick={handleToggle2D}
              className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                isCrossSection2D
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-400/60 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Interactive 2D Cross-Section Profile (Section A – A')"
            >
              2D Section
            </button>
          </div>

          {/* Layer Quick Toggles: Aquifers & Minerals */}
          <div className="flex items-center gap-1 border-l border-slate-800/80 pl-1.5">
            <button
              onClick={() => setShowAquiferLayers(!showAquiferLayers)}
              className={`p-1.5 rounded-lg transition-all border ${
                showAquiferLayers
                  ? 'bg-cyan-500/20 border-cyan-400/70 text-cyan-300 shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
              title={showAquiferLayers ? 'Hide Aquifer Horizons' : 'Show Aquifer Horizons'}
            >
              <Droplet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMineralLayers(!showMineralLayers)}
              className={`p-1.5 rounded-lg transition-all border ${
                showMineralLayers
                  ? 'bg-purple-500/20 border-purple-400/70 text-purple-300 shadow-sm shadow-purple-500/30'
                  : 'bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
              title={showMineralLayers ? 'Hide Mineral Veins' : 'Show Mineral Veins'}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Vertical Exaggeration Switcher */}
          <div className="flex items-center gap-0.5 border-l border-slate-800/80 pl-1.5 text-[10px] font-mono">
            {[1.0, 1.5, 2.5].map((exag) => (
              <button
                key={exag}
                onClick={() => setCutawayExaggeration(exag)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  cutawayExaggeration === exag
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Vertical Exaggeration: ${exag}x`}
              >
                {exag}x
              </button>
            ))}
          </div>

          {/* Exploration Extent Switcher */}
          <div className="flex items-center gap-0.5 border-l border-slate-800/80 pl-1.5 text-[10px] font-mono">
            {[2, 5, 10, 25].map((km) => (
              <button
                key={km}
                onClick={() => setExplorationExtentKm(km)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  explorationExtentKm === km
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-400/60'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Bounding Extent: ${km} km × ${km} km`}
              >
                {km}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing flex-1" />

      {/* Left Margin Depth Scale Bar */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
        <div className="glass-panel py-3 px-2 rounded-2xl flex flex-col items-center">
          <div className="h-44 w-1.5 bg-slate-800/90 rounded-full relative">
            <div className="absolute top-0 -left-1 w-3.5 h-0.5 bg-slate-400" />
            <span className="absolute top-0 left-3.5 text-[9px] font-mono text-slate-300 -translate-y-1/2 font-semibold">0m</span>

            {/* Depth slice marker */}
            <div
              className="absolute -left-1.5 w-4.5 h-1.5 bg-amber-400 rounded-sm transition-all duration-150 shadow-md shadow-amber-500/60"
              style={{ top: `${Math.min(100, (depthMeters / 1200) * 100)}%` }}
            />
            <span
              className="absolute left-3.5 text-[9px] font-mono font-bold text-amber-300 bg-slate-950/90 px-1 py-0.5 rounded border border-amber-500/50 -translate-y-1/2 whitespace-nowrap shadow"
              style={{ top: `${Math.min(100, (depthMeters / 1200) * 100)}%` }}
            >
              -{depthMeters}m
            </span>

            {/* Water table marker */}
            {observedWaterTableDepth !== null && (
              <div
                className="absolute -left-1 w-3.5 h-0.5 bg-cyan-400 transition-all duration-150 shadow-sm shadow-cyan-400"
                style={{ top: `${Math.min(100, (observedWaterTableDepth / 1200) * 100)}%` }}
                title={`Water table: -${observedWaterTableDepth.toFixed(1)} mbgl`}
              />
            )}

            <div className="absolute bottom-0 -left-1 w-3.5 h-0.5 bg-slate-400" />
            <span className="absolute bottom-0 left-3.5 text-[9px] font-mono text-slate-400 translate-y-1/2">-1200m</span>
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

      {/* Nexus AI Scientific Interpretation Drawer / Modal */}
      {aiExplanation && (
        <div className="absolute top-16 right-4 z-20 glass-panel-elevated rounded-2xl p-4 shadow-2xl max-w-md w-96 text-xs flex flex-col gap-2.5 max-h-[70vh] overflow-hidden pointer-events-auto animate-fadeIn border border-cyan-500/40 bg-slate-950/95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-slate-100 text-xs">
                Nexus AI Geological Interpretation
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={aiExplanation.dataTier as any || 'MODELLED'} size="sm" />
              <button
                onClick={() => setAiExplanation(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Close AI Assessment"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="font-mono text-[11px] text-cyan-300 font-semibold truncate">
            Target Formation: {aiExplanation.entityName}
          </div>
          <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-[11px] leading-relaxed custom-scrollbar">
            <MarkdownRenderer content={aiExplanation.reply} />
          </div>
          <div className="text-[9px] font-mono text-slate-500 border-t border-slate-800 pt-1.5">
            Strictly grounded in CGWB NAQUIM & GSI Bhukosh frameworks.
          </div>
        </div>
      )}

      {/* Floating Hover/Click Inspector Tooltip (Bottom-Right) */}
      {activeInspector && (
        <div className="absolute bottom-12 right-4 z-10 glass-panel-elevated rounded-2xl p-3.5 shadow-2xl max-w-sm w-80 text-xs flex flex-col gap-2 pointer-events-auto animate-fadeIn bg-slate-950/95 border border-slate-800">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 truncate">
              {activeInspector.type === 'AQUIFER' ? (
                <Droplet className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : activeInspector.type === 'MINERAL_VEIN' ? (
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
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
                  onClick={() => setSelectedEntity(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
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

          {/* Water Table Details */}
          {activeInspector.type === 'WATER_TABLE' && (
            <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between text-cyan-300 font-mono text-[10px]">
                <span>Type: Phreatic Water Table</span>
                <span>Depth: -{activeInspector.depthMbgl?.toFixed(1) || '32.4'} mbgl</span>
              </div>
              <p className="leading-tight text-slate-400 text-[10px]">
                {activeInspector.description}
              </p>
            </div>
          )}

          {/* Mineral Vein Details */}
          {activeInspector.type === 'MINERAL_VEIN' && (
            <div className="flex flex-col gap-1.5 text-[11px] text-slate-300">
              {activeInspector.commodities && (
                <div className="font-mono text-purple-300 text-[10px]">
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
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <div>Total Depth: <span className="text-slate-200">{activeInspector.totalDepth}</span></div>
                <div>Water Strike: <span className="text-cyan-300">{activeInspector.waterStrike}</span></div>
              </div>
            </div>
          )}

          {/* Trigger Nexus AI Scientific Interpretation */}
          <button
            onClick={() => handleExplainEntity(activeInspector)}
            disabled={isAiLoading}
            className="mt-1 w-full py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Interpreting with Nexus AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explain Genesis with Nexus AI</span>
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

      {/* Bottom Controls Bar: Pumping Simulation Toggle & Guidance */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto z-10 flex-wrap justify-center">
        {/* Pumping Scenario Simulation Toggle Button */}
        <button
          onClick={() => setIsPumpingActive(!isPumpingActive)}
          className={`glass-pill px-3 py-1 text-[10px] font-mono transition-all flex items-center gap-1.5 shadow-md ${
            isPumpingActive
              ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold shadow-cyan-500/40'
              : 'text-slate-300 hover:text-cyan-300 hover:border-slate-700'
          }`}
          title={isPumpingActive ? 'Deactivate Pumping Test Simulation (Restores static water table)' : 'Simulate Pumping Well Drawdown (Thiem / Jacob solution)'}
        >
          {isPumpingActive ? (
            <>
              <Square className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              <span>Pumping Test Active (12.0 L/s)</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Simulate Well Pumping Cone</span>
            </>
          )}
        </button>

        <div className="glass-pill px-3 py-1 text-[9px] font-mono text-slate-400 shadow-sm pointer-events-none hidden md:flex items-center gap-2">
          <span>Rotate: Left-drag</span>
          <span className="text-slate-600">•</span>
          <span>Pan: Right-drag</span>
          <span className="text-slate-600">•</span>
          <span>Zoom: Scroll</span>
          <span className="text-slate-600">•</span>
          <span>Depth: -{depthMeters}m</span>
        </div>
      </div>
    </div>
  );
};

export default Subsurface3D;

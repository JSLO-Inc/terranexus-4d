import * as THREE from 'three';
import { GeologicalFormation } from '../../types';

export interface TerraneStructuralAttitude {
  strikeDeg: number;       // Azimuth in degrees (0 = North, 90 = East)
  dipDeg: number;          // Dip inclination angle (scaled for 3D block representation)
  dipDirection: string;    // Human-readable direction (e.g. "WNW", "ESE")
  structuralStyle: string; // Tectonic style description
  undulationAmplitude: number; // Vertical waviness amplitude in meters
  undulationWavelength: number;
}

/**
 * Derives authentic structural attitude (strike, dip, and structural style)
 * for any Indian location based on lithotectonic terrane and geological province.
 */
export function getTerraneStructuralAttitude(
  locationId: string,
  lat: number,
  lon: number,
  state: string = ''
): TerraneStructuralAttitude {
  const locLower = (locationId || '').toLowerCase();
  const stateLower = (state || '').toLowerCase();

  // Aravalli-Delhi Fold Belt (Khetri, Zawar, Rajasthan)
  // Characterized by tight isoclinal folding striking NNE-SSW with steep westerly dips
  if (locLower.includes('khetri') || locLower.includes('zawar') || locLower.includes('rajasthan')) {
    return {
      strikeDeg: 28, // N28°E
      dipDeg: 12.5,  // Visually scaled from real 55°-70° for block diagram containment
      dipDirection: 'WNW',
      structuralStyle: 'Aravalli-Delhi Polyphase Fold Belt (Steeply Dipping Axial Planar Foliation)',
      undulationAmplitude: 1.2,
      undulationWavelength: 14.0
    };
  }

  // Deccan Volcanic Province (Pune, Maharashtra, Malwa Plateau)
  // Flat-lying continental flood basalt lava traps with sub-horizontal step-terraces
  if (locLower.includes('pune') || locLower.includes('deccan') || stateLower.includes('maharashtra')) {
    return {
      strikeDeg: 0,  // N-S regional axis
      dipDeg: 2.2,   // Sub-horizontal regional tilt westward towards the Arabian Sea
      dipDirection: 'WSW',
      structuralStyle: 'Sahyadri Trappean Basalt Stack (Sub-Horizontal Lava Flows with Intertrappean Weathering)',
      undulationAmplitude: 0.5,
      undulationWavelength: 22.0
    };
  }

  // Dharwar Craton / Eastern Dharwar Granite-Greenstone (Kolar, Karnataka, AP border)
  // Linear metamorphic greenstone belts surrounded by Archean diapiric gneisses
  if (locLower.includes('kolar') || locLower.includes('dharwar') || stateLower.includes('karnataka')) {
    return {
      strikeDeg: 345, // NNW-SSE greenstone belt trend
      dipDeg: 14.0,   // Steeply dipping greenstone schistosity
      dipDirection: 'ENE',
      structuralStyle: 'Archean Greenstone Keel (Steep Sheared Contacts with Granitoid Diapirs)',
      undulationAmplitude: 1.4,
      undulationWavelength: 12.0
    };
  }

  // Singhbhum Shear Zone / Copper Belt (Singhbhum, Jharkhand, Odisha)
  // Arcuate ductile-brittle thrust belt dipping moderately northward
  if (locLower.includes('singhbhum') || stateLower.includes('jharkhand')) {
    return {
      strikeDeg: 105, // ESE-WNW shear strike
      dipDeg: 11.0,   // Northward dipping thrust plane
      dipDirection: 'NNE',
      structuralStyle: 'Singhbhum Metallogenic Shear Zone (Arcuate Ductile-Brittle Thrust Zone)',
      undulationAmplitude: 1.1,
      undulationWavelength: 15.0
    };
  }

  // Indo-Gangetic Alluvial Basin (Ludhiana, Punjab, UP, Bihar, WB)
  // Deep Quaternary foreland basin flexure gently tilting toward Himalayan Frontal Thrust
  if (locLower.includes('ludhiana') || (lat >= 24.5 && lat <= 32.5 && lon >= 74.0 && lon <= 90.0)) {
    return {
      strikeDeg: 115, // WNW-ESE foredeep axis
      dipDeg: 2.8,    // Gentle flexural dip toward the Himalayan frontal thrust
      dipDirection: 'NNE',
      structuralStyle: 'Himalayan Foreland Alluvial Basin (Channel Scours & Cyclic Aggradation)',
      undulationAmplitude: 0.7,
      undulationWavelength: 18.0
    };
  }

  // Coastal Andhra Pradesh & Krishna-Godavari Delta (Bhimavaram, East/West Godavari, Krishna)
  // Passive continental margin deltaic wedge dipping seaward toward the Bay of Bengal
  if (locLower.includes('bhimavaram') || locLower.includes('godavari') || stateLower.includes('andhra')) {
    return {
      strikeDeg: 55,  // NE-SW East Coast trend
      dipDeg: 4.8,    // Seaward dipping deltaic wedge
      dipDirection: 'SE',
      structuralStyle: 'East Coast Continental Passive Margin (Seaward Dipping Clastic-Granulite Wedge)',
      undulationAmplitude: 0.8,
      undulationWavelength: 20.0
    };
  }

  // General Peninsular Shield / Cratonic Interior
  return {
    strikeDeg: 45,
    dipDeg: 4.0,
    dipDirection: 'SE',
    structuralStyle: 'Precambrian Cratonic Shield (Gneissic Foliation & Sheet Jointing)',
    undulationAmplitude: 0.9,
    undulationWavelength: 16.0
  };
}

/**
 * Creates high-fidelity procedural PBR textures for geological rock strata:
 * - Diffuse Color Map (`map`): Authentic mineralogy, weathering stains, laminae, vesicles
 * - Normal / Bump Map (`bumpMap`): Procedural micro-relief, joint fractures, and crystal grains
 * - Roughness Map (`roughnessMap`): Differential specular reflectivity (vitreous quartz vs dull clay)
 */
export function generateLithologyPbrTextures(
  formationCode: string,
  lithologyText: string,
  baseColorHex: string
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  roughness: number;
  metalness: number;
} {
  const width = 512;
  const height = 512;

  // 1. Setup Canvases
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const roughCtx = roughCanvas.getContext('2d')!;

  // 2. Identify Lithological Family
  const text = (lithologyText + ' ' + formationCode).toLowerCase();
  const isBasalt = text.includes('basalt') || text.includes('trap') || text.includes('dt-') || text.includes('pahoehoe');
  const isSandstone = text.includes('sandstone') || text.includes('arenite') || text.includes('sst') || text.includes('siwalik');
  const isCharnockite = text.includes('charnockite') || text.includes('khondalite') || text.includes('granulite') || text.includes('hypersthene');
  const isGranite = text.includes('granite') || text.includes('gneiss') || text.includes('granitoid') || text.includes('migmatite');
  const isCarbonate = text.includes('limestone') || text.includes('dolomite') || text.includes('calcsilicate') || text.includes('marble');
  const isSchist = text.includes('schist') || text.includes('amphibolite') || text.includes('phyllite') || text.includes('slate');
  const isAlluvium = text.includes('alluvium') || text.includes('silt') || text.includes('clay') || text.includes('loam') || text.includes('sand');

  // Base background fill
  colorCtx.fillStyle = baseColorHex;
  colorCtx.fillRect(0, 0, width, height);

  bumpCtx.fillStyle = '#808080'; // 50% neutral gray for bump
  bumpCtx.fillRect(0, 0, width, height);

  roughCtx.fillStyle = '#b0b0b0'; // default medium-high roughness
  roughCtx.fillRect(0, 0, width, height);

  let materialRoughness = 0.82;
  let materialMetalness = 0.08;

  // -------------------------------------------------------------
  // LITHOLOGY-SPECIFIC PBR TEXTURE SYNTHESIS
  // -------------------------------------------------------------

  if (isBasalt) {
    // A. Basalt & Deccan Trap: Vertical columnar joints, vesicular amygdules, red-bole horizons
    materialRoughness = 0.72;
    materialMetalness = 0.18;

    // Dark microcrystalline basalt background
    colorCtx.fillStyle = '#1e293b';
    colorCtx.fillRect(0, 0, width, height);

    // Vertical columnar cooling joints
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, width, height);

    const numCols = 16;
    const colWidth = width / numCols;
    for (let i = 0; i < numCols; i++) {
      const cx = i * colWidth + (Math.random() - 0.5) * 8;
      // Dark fracture joint in diffuse
      colorCtx.strokeStyle = '#090d16';
      colorCtx.lineWidth = 2.5;
      colorCtx.globalAlpha = 0.7;
      colorCtx.beginPath();
      colorCtx.moveTo(cx, 0);
      for (let y = 0; y <= height; y += 32) {
        colorCtx.lineTo(cx + (Math.random() - 0.5) * 6, y);
      }
      colorCtx.stroke();

      // Deep groove in bump map (black = valley)
      bumpCtx.strokeStyle = '#101010';
      bumpCtx.lineWidth = 3.5;
      bumpCtx.globalAlpha = 0.9;
      bumpCtx.beginPath();
      bumpCtx.moveTo(cx, 0);
      for (let y = 0; y <= height; y += 32) {
        bumpCtx.lineTo(cx + (Math.random() - 0.5) * 6, y);
      }
      bumpCtx.stroke();
    }

    // Horizontal cooling tier fractures
    for (let y = 60; y < height; y += 75 + Math.random() * 20) {
      colorCtx.strokeStyle = '#090d16';
      colorCtx.lineWidth = 2.0;
      colorCtx.globalAlpha = 0.5;
      colorCtx.beginPath();
      colorCtx.moveTo(0, y);
      colorCtx.lineTo(width, y + (Math.random() - 0.5) * 10);
      colorCtx.stroke();

      bumpCtx.strokeStyle = '#202020';
      bumpCtx.lineWidth = 2.5;
      bumpCtx.stroke();
    }

    // Vesicular gas cavities (with white zeolitic fillings)
    for (let v = 0; v < 180; v++) {
      const vx = Math.random() * width;
      const vy = Math.random() * height;
      const vr = 2.5 + Math.random() * 5.0;

      // Dark cavity perimeter
      colorCtx.fillStyle = '#0f172a';
      colorCtx.globalAlpha = 0.9;
      colorCtx.beginPath();
      colorCtx.arc(vx, vy, vr, 0, Math.PI * 2);
      colorCtx.fill();

      // Zeolite / quartz core (white/pale cyan crystalline center)
      if (Math.random() > 0.4) {
        colorCtx.fillStyle = '#e2e8f0';
        colorCtx.globalAlpha = 0.95;
        colorCtx.beginPath();
        colorCtx.arc(vx, vy, vr * 0.55, 0, Math.PI * 2);
        colorCtx.fill();

        // Zeolite is smooth and reflective
        roughCtx.fillStyle = '#202020';
        roughCtx.globalAlpha = 0.8;
        roughCtx.beginPath();
        roughCtx.arc(vx, vy, vr * 0.55, 0, Math.PI * 2);
        roughCtx.fill();
      }

      // Bump depression
      bumpCtx.fillStyle = '#050505';
      bumpCtx.globalAlpha = 0.85;
      bumpCtx.beginPath();
      bumpCtx.arc(vx, vy, vr, 0, Math.PI * 2);
      bumpCtx.fill();
    }

    // Weathered Red-Bole paleosol interbed ribbon (ferruginous alteration)
    colorCtx.fillStyle = '#7f1d1d';
    colorCtx.globalAlpha = 0.45;
    colorCtx.fillRect(0, 180, width, 18);
    colorCtx.fillRect(0, 390, width, 22);

  } else if (isSandstone) {
    // B. Sandstone: Cross-bedding sets, grain micro-texture, ferruginous ribbons
    materialRoughness = 0.88;
    materialMetalness = 0.04;

    colorCtx.fillStyle = baseColorHex;
    colorCtx.fillRect(0, 0, width, height);

    // Dipping cross-bedding laminae
    colorCtx.globalAlpha = 0.35;
    bumpCtx.globalAlpha = 0.55;

    for (let set = 0; set < 4; set++) {
      const baseY = set * 128;
      const dipAngle = (set % 2 === 0 ? 1 : -1) * 22; // cross-set herringbone dip

      for (let lam = 0; lam < 14; lam++) {
        const ly = baseY + lam * 9;
        colorCtx.strokeStyle = lam % 3 === 0 ? '#78350f' : '#fef08a';
        colorCtx.lineWidth = 1.8;
        colorCtx.beginPath();
        colorCtx.moveTo(0, ly);
        colorCtx.lineTo(width, ly + dipAngle);
        colorCtx.stroke();

        // Bedding relief in bump map
        bumpCtx.strokeStyle = lam % 2 === 0 ? '#c0c0c0' : '#404040';
        bumpCtx.lineWidth = 2.0;
        bumpCtx.beginPath();
        bumpCtx.moveTo(0, ly);
        bumpCtx.lineTo(width, ly + dipAngle);
        bumpCtx.stroke();
      }
    }

    // Quartz sand grain stipple
    colorCtx.globalAlpha = 0.25;
    bumpCtx.globalAlpha = 0.4;
    for (let g = 0; g < 4000; g++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gSize = 1.0 + Math.random() * 2.0;
      colorCtx.fillStyle = Math.random() > 0.5 ? '#fde047' : '#713f12';
      colorCtx.fillRect(gx, gy, gSize, gSize);

      bumpCtx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      bumpCtx.fillRect(gx, gy, gSize, gSize);
    }

  } else if (isCharnockite) {
    // C. Charnockite & Granulite (Eastern Ghats): Dark hypersthene matrix, garnet porphyroblasts, sillimanite
    materialRoughness = 0.65;
    materialMetalness = 0.22;

    colorCtx.fillStyle = '#293548'; // greenish-grey waxy charnockite
    colorCtx.fillRect(0, 0, width, height);

    // Metamorphic foliation bands (high-grade ductile deformation)
    colorCtx.globalAlpha = 0.4;
    bumpCtx.globalAlpha = 0.6;
    for (let y = 0; y < height; y += 12 + Math.random() * 8) {
      colorCtx.strokeStyle = Math.random() > 0.5 ? '#1e293b' : '#475569';
      colorCtx.lineWidth = 2.2;
      colorCtx.beginPath();
      colorCtx.moveTo(0, y);
      colorCtx.bezierCurveTo(width * 0.33, y + 15, width * 0.66, y - 10, width, y + 25);
      colorCtx.stroke();

      bumpCtx.strokeStyle = Math.random() > 0.5 ? '#b0b0b0' : '#303030';
      bumpCtx.lineWidth = 2.5;
      bumpCtx.beginPath();
      bumpCtx.moveTo(0, y);
      bumpCtx.bezierCurveTo(width * 0.33, y + 15, width * 0.66, y - 10, width, y + 25);
      bumpCtx.stroke();
    }

    // Almandine-Pyrope Garnet Porphyroblasts (Deep claret red porphyroblastic crystals)
    for (let g = 0; g < 140; g++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gr = 3.0 + Math.random() * 6.5;

      // Dark reaction rim
      colorCtx.fillStyle = '#0f172a';
      colorCtx.globalAlpha = 0.8;
      colorCtx.beginPath();
      colorCtx.arc(gx, gy, gr + 1.5, 0, Math.PI * 2);
      colorCtx.fill();

      // Deep garnet gem crystal
      colorCtx.fillStyle = '#881337'; // claret-rose garnet
      colorCtx.globalAlpha = 0.95;
      colorCtx.beginPath();
      colorCtx.arc(gx, gy, gr, 0, Math.PI * 2);
      colorCtx.fill();

      // Protruding mineral eye in bump map
      bumpCtx.fillStyle = '#ffffff';
      bumpCtx.globalAlpha = 0.85;
      bumpCtx.beginPath();
      bumpCtx.arc(gx, gy, gr, 0, Math.PI * 2);
      bumpCtx.fill();

      // Highly reflective garnet crystal
      roughCtx.fillStyle = '#151515';
      roughCtx.globalAlpha = 0.9;
      roughCtx.beginPath();
      roughCtx.arc(gx, gy, gr, 0, Math.PI * 2);
      roughCtx.fill();
    }

  } else if (isGranite) {
    // D. Granite & Gneiss: Interlocking quartz-feldspar-biotite crystalline mosaic, pegmatite veinlets
    materialRoughness = 0.68;
    materialMetalness = 0.12;

    colorCtx.fillStyle = baseColorHex;
    colorCtx.fillRect(0, 0, width, height);

    // Crystalline feldspar (pink/white) and quartz mosaic
    colorCtx.globalAlpha = 0.6;
    for (let c = 0; c < 3500; c++) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const csize = 2.5 + Math.random() * 6.0;

      const rand = Math.random();
      if (rand > 0.65) {
        colorCtx.fillStyle = '#f43f5e'; // pink K-feldspar (microcline)
      } else if (rand > 0.3) {
        colorCtx.fillStyle = '#f8fafc'; // vitreous quartz
      } else {
        colorCtx.fillStyle = '#0f172a'; // black biotite mica
      }
      colorCtx.fillRect(cx, cy, csize, csize);

      // Crystalline bumps
      bumpCtx.fillStyle = rand > 0.3 ? '#d0d0d0' : '#202020';
      bumpCtx.fillRect(cx, cy, csize, csize);
    }

    // Folded pegmatite quartz vein intrusion
    colorCtx.strokeStyle = '#ffffff';
    colorCtx.lineWidth = 4.0;
    colorCtx.globalAlpha = 0.8;
    colorCtx.beginPath();
    colorCtx.moveTo(20, 480);
    colorCtx.bezierCurveTo(150, 320, 360, 280, 490, 40);
    colorCtx.stroke();

    bumpCtx.strokeStyle = '#ffffff';
    bumpCtx.lineWidth = 5.0;
    bumpCtx.stroke();

    roughCtx.strokeStyle = '#101010'; // shiny quartz vein
    roughCtx.lineWidth = 4.0;
    roughCtx.stroke();

  } else if (isCarbonate) {
    // E. Limestone & Dolomite: Stylolitic pressure-solution seams, calcite crystalline veins
    materialRoughness = 0.76;
    materialMetalness = 0.06;

    colorCtx.fillStyle = '#64748b'; // pale dolomite limestone
    colorCtx.fillRect(0, 0, width, height);

    // Dark stylolitic zig-zag pressure dissolution seams
    colorCtx.strokeStyle = '#1e293b';
    colorCtx.lineWidth = 2.0;
    colorCtx.globalAlpha = 0.75;
    bumpCtx.strokeStyle = '#101010';
    bumpCtx.lineWidth = 2.5;

    for (let s = 0; s < 6; s++) {
      const sy = 60 + s * 70;
      colorCtx.beginPath();
      bumpCtx.beginPath();
      colorCtx.moveTo(0, sy);
      bumpCtx.moveTo(0, sy);
      for (let x = 0; x <= width; x += 16) {
        const dy = (Math.random() - 0.5) * 8;
        colorCtx.lineTo(x, sy + dy);
        bumpCtx.lineTo(x, sy + dy);
      }
      colorCtx.stroke();
      bumpCtx.stroke();
    }

    // White calcite vein networks (fracture fillings)
    colorCtx.strokeStyle = '#ffffff';
    colorCtx.lineWidth = 1.8;
    colorCtx.globalAlpha = 0.85;
    bumpCtx.strokeStyle = '#e0e0e0';
    bumpCtx.lineWidth = 2.0;

    for (let v = 0; v < 4; v++) {
      const vx = 80 + v * 110;
      colorCtx.beginPath();
      bumpCtx.beginPath();
      colorCtx.moveTo(vx, 0);
      bumpCtx.moveTo(vx, 0);
      for (let y = 0; y <= height; y += 24) {
        const dx = (Math.random() - 0.5) * 12;
        colorCtx.lineTo(vx + dx, y);
        bumpCtx.lineTo(vx + dx, y);
      }
      colorCtx.stroke();
      bumpCtx.stroke();
    }

  } else if (isSchist) {
    // F. Schist & Amphibolite: Metamorphic foliation with micaceous sheen
    materialRoughness = 0.70;
    materialMetalness = 0.20;

    colorCtx.fillStyle = baseColorHex;
    colorCtx.fillRect(0, 0, width, height);

    // Tilted schistosity lines
    colorCtx.globalAlpha = 0.35;
    bumpCtx.globalAlpha = 0.6;
    for (let y = -40; y < height + 80; y += 7 + Math.random() * 5) {
      colorCtx.strokeStyle = Math.random() > 0.4 ? '#fef08a' : '#0f172a';
      colorCtx.lineWidth = 1.4;
      colorCtx.beginPath();
      colorCtx.moveTo(0, y);
      colorCtx.lineTo(width, y + 65);
      colorCtx.stroke();

      bumpCtx.strokeStyle = Math.random() > 0.5 ? '#b0b0b0' : '#404040';
      bumpCtx.lineWidth = 1.8;
      bumpCtx.beginPath();
      bumpCtx.moveTo(0, y);
      bumpCtx.lineTo(width, y + 65);
      bumpCtx.stroke();
    }

  } else {
    // Special Pedological Soil Profile for Regolith / Saprolite
    const isRegolith = formationCode.includes('REG') || text.includes('regolith') || text.includes('saprolite') || text.includes('soil');

    if (isRegolith) {
      materialRoughness = 0.96;
      materialMetalness = 0.01;

      // Authentic 3-tier pedological soil profile: A-horizon humus -> B-horizon illuvial -> C-horizon saprolite
      const soilGrad = colorCtx.createLinearGradient(0, 0, 0, height);
      soilGrad.addColorStop(0, '#26170d');    // Upper A-horizon: Rich dark organic humus topsoil
      soilGrad.addColorStop(0.25, '#3b2314'); // Lower A-horizon: Loamy humic earth
      soilGrad.addColorStop(0.55, '#5c3a21'); // B-horizon: Oxidized reddish-brown subsoil
      soilGrad.addColorStop(0.80, '#784c28'); // Lower B-horizon: Ferruginous sandy loam
      soilGrad.addColorStop(1.0, '#8c6035');  // C-horizon: Weathered saprolite with rock fragments
      colorCtx.fillStyle = soilGrad;
      colorCtx.fillRect(0, 0, width, height);

      // Fine rootlet and organic matter filaments in topsoil (top 35% of profile)
      colorCtx.strokeStyle = 'rgba(20, 12, 6, 0.45)';
      colorCtx.lineWidth = 1.2;
      for (let r = 0; r < 28; r++) {
        const rx = Math.random() * width;
        const ry = Math.random() * (height * 0.35);
        colorCtx.beginPath();
        colorCtx.moveTo(rx, ry);
        colorCtx.bezierCurveTo(rx + (Math.random() - 0.5) * 20, ry + 15, rx + (Math.random() - 0.5) * 35, ry + 30, rx + (Math.random() - 0.5) * 45, ry + 45);
        colorCtx.stroke();
      }

      // Weathered angular saprolite rock clasts in C-horizon (bottom 40% of profile)
      for (let c = 0; c < 45; c++) {
        const cx = Math.random() * width;
        const cy = height * 0.60 + Math.random() * (height * 0.40);
        const cw = 4 + Math.random() * 9;
        const ch = 3 + Math.random() * 6;
        colorCtx.fillStyle = Math.random() > 0.5 ? '#94a3b8' : '#64748b'; // Weathered gneiss/schist fragments
        colorCtx.globalAlpha = 0.65;
        colorCtx.fillRect(cx, cy, cw, ch);

        bumpCtx.fillStyle = '#d0d0d0';
        bumpCtx.globalAlpha = 0.6;
        bumpCtx.fillRect(cx, cy, cw, ch);
      }
    } else {
      // G. Alluvium, Silt, Sand: Granular sedimentary bedding, channel laminae, kankar nodules
      materialRoughness = 0.92;
      materialMetalness = 0.02;

      colorCtx.fillStyle = baseColorHex;
      colorCtx.fillRect(0, 0, width, height);

      // Wavy sedimentary alluvial bedding laminae with alternating silt/sand tones
      colorCtx.globalAlpha = 0.35;
      bumpCtx.globalAlpha = 0.45;
      for (let y = 0; y < height; y += 10 + Math.random() * 8) {
        colorCtx.strokeStyle = Math.random() > 0.5 ? '#78350f' : '#b45309';
        colorCtx.lineWidth = 1.8;
        colorCtx.beginPath();
        colorCtx.moveTo(0, y);
        for (let x = 0; x <= width; x += 32) {
          colorCtx.lineTo(x, y + Math.sin(x * 0.04) * 4 + (Math.random() - 0.5) * 3);
        }
        colorCtx.stroke();

        bumpCtx.strokeStyle = Math.random() > 0.5 ? '#909090' : '#505050';
        bumpCtx.lineWidth = 1.8;
        bumpCtx.stroke();
      }

      // Calcareous Kankar nodules (calcium carbonate concretions)
      for (let k = 0; k < 180; k++) {
        const kx = Math.random() * width;
        const ky = Math.random() * height;
        const kr = 1.5 + Math.random() * 3.0;

        colorCtx.fillStyle = '#f8fafc'; // pale grey/white kankar nodule
        colorCtx.globalAlpha = 0.70;
        colorCtx.beginPath();
        colorCtx.arc(kx, ky, kr, 0, Math.PI * 2);
        colorCtx.fill();

        bumpCtx.fillStyle = '#ffffff';
        bumpCtx.globalAlpha = 0.65;
        bumpCtx.beginPath();
        bumpCtx.arc(kx, ky, kr, 0, Math.PI * 2);
        bumpCtx.fill();
      }
    }
  }

  // Soft, organic mineral grain stippling (subtle quartz/feldspar micro-texture, NOT digital static)
  colorCtx.globalAlpha = 0.05;
  for (let i = 0; i < 1800; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    colorCtx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    colorCtx.beginPath();
    colorCtx.arc(rx, ry, 0.8, 0, Math.PI * 2);
    colorCtx.fill();
  }

  // 3. Create Three.js Textures
  const mapTexture = new THREE.CanvasTexture(colorCanvas);
  mapTexture.wrapS = THREE.RepeatWrapping;
  mapTexture.wrapT = THREE.RepeatWrapping;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.RepeatWrapping;

  const roughTexture = new THREE.CanvasTexture(roughCanvas);
  roughTexture.wrapS = THREE.RepeatWrapping;
  roughTexture.wrapT = THREE.RepeatWrapping;

  return {
    map: mapTexture,
    bumpMap: bumpTexture,
    roughnessMap: roughTexture,
    roughness: materialRoughness,
    metalness: materialMetalness
  };
}

/**
 * Constructs a watertight, continuous 3D volumetric stratum geometry
 * whose top boundary follows `topYFunc(x, z)`, bottom boundary follows `botYFunc(x, z)`,
 * and 4 vertical outer cut walls connect top and bottom seamlessly.
 *
 * This provides 100% watertight volumetric integrity between all stacked geological layers!
 */
export function buildDippingStratumGeometry(
  topYFunc: (x: number, z: number) => number,
  botYFunc: (x: number, z: number) => number,
  width: number,
  length: number,
  segsX: number = 32,
  segsZ: number = 32,
  meterScale: number = 4.0
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  const halfW = width / 2;
  const halfL = length / 2;
  const dx = width / segsX;
  const dz = length / segsZ;

  // 1. TOP SURFACE (Normal points upward +Y)
  for (let iz = 0; iz < segsZ; iz++) {
    for (let ix = 0; ix < segsX; ix++) {
      const x0 = -halfW + ix * dx;
      const x1 = x0 + dx;
      const z0 = -halfL + iz * dz;
      const z1 = z0 + dz;

      const y00 = topYFunc(x0, z0);
      const y10 = topYFunc(x1, z0);
      const y01 = topYFunc(x0, z1);
      const y11 = topYFunc(x1, z1);

      const u0 = (x0 + halfW) / meterScale;
      const u1 = (x1 + halfW) / meterScale;
      const v0 = (z0 + halfL) / meterScale;
      const v1 = (z1 + halfL) / meterScale;

      // Triangle 1: (0,0) -> (0,1) -> (1,1) [CCW winding for upward +Y normal]
      positions.push(
        x0, y00, z0,
        x0, y01, z1,
        x1, y11, z1
      );
      uvs.push(u0, v0, u0, v1, u1, v1);

      // Triangle 2: (0,0) -> (1,1) -> (1,0)
      positions.push(
        x0, y00, z0,
        x1, y11, z1,
        x1, y10, z0
      );
      uvs.push(u0, v0, u1, v1, u1, v0);
    }
  }

  // 2. BOTTOM SURFACE (Normal points downward -Y)
  for (let iz = 0; iz < segsZ; iz++) {
    for (let ix = 0; ix < segsX; ix++) {
      const x0 = -halfW + ix * dx;
      const x1 = x0 + dx;
      const z0 = -halfL + iz * dz;
      const z1 = z0 + dz;

      const y00 = botYFunc(x0, z0);
      const y10 = botYFunc(x1, z0);
      const y01 = botYFunc(x0, z1);
      const y11 = botYFunc(x1, z1);

      const u0 = (x0 + halfW) / meterScale;
      const u1 = (x1 + halfW) / meterScale;
      const v0 = (z0 + halfL) / meterScale;
      const v1 = (z1 + halfL) / meterScale;

      // Triangle 1: (0,0) -> (1,0) -> (1,1) [CCW winding for downward -Y normal]
      positions.push(
        x0, y00, z0,
        x1, y10, z0,
        x1, y11, z1
      );
      uvs.push(u0, v0, u1, v0, u1, v1);

      // Triangle 2: (0,0) -> (1,1) -> (0,1)
      positions.push(
        x0, y00, z0,
        x1, y11, z1,
        x0, y01, z1
      );
      uvs.push(u0, v0, u1, v1, u0, v1);
    }
  }

  // 3. NORTH CUT WALL (z = -halfL, facing outward -Z)
  for (let ix = 0; ix < segsX; ix++) {
    const x0 = -halfW + ix * dx;
    const x1 = x0 + dx;
    const z = -halfL;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (x0, top0) -> (x1, top1) -> (x0, bot0) [facing -Z]
    positions.push(
      x0, top0, z,
      x1, top1, z,
      x0, bot0, z
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    // Triangle 2: (x1, top1) -> (x1, bot1) -> (x0, bot0)
    positions.push(
      x1, top1, z,
      x1, bot1, z,
      x0, bot0, z
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 4. SOUTH CUT WALL (z = halfL, facing outward +Z)
  for (let ix = 0; ix < segsX; ix++) {
    const x0 = -halfW + ix * dx;
    const x1 = x0 + dx;
    const z = halfL;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (x0, top0) -> (x0, bot0) -> (x1, top1) [facing +Z]
    positions.push(
      x0, top0, z,
      x0, bot0, z,
      x1, top1, z
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    // Triangle 2: (x1, top1) -> (x0, bot0) -> (x1, bot1)
    positions.push(
      x1, top1, z,
      x0, bot0, z,
      x1, bot1, z
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  // 5. EAST CUT WALL (x = halfW, facing +X)
  for (let iz = 0; iz < segsZ; iz++) {
    const z0 = -halfL + iz * dz;
    const z1 = z0 + dz;
    const x = halfW;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = (z0 + halfL) / meterScale;
    const u1 = (z1 + halfL) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (z0, top0) -> (z1, top1) -> (z0, bot0)
    positions.push(
      x, top0, z0,
      x, top1, z1,
      x, bot0, z0
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    // Triangle 2: (z1, top1) -> (z1, bot1) -> (z0, bot0)
    positions.push(
      x, top1, z1,
      x, bot1, z1,
      x, bot0, z0
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 6. WEST CUT WALL (x = -halfW, facing -X)
  for (let iz = 0; iz < segsZ; iz++) {
    const z0 = -halfL + iz * dz;
    const z1 = z0 + dz;
    const x = -halfW;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = (z0 + halfL) / meterScale;
    const u1 = (z1 + halfL) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (z0, top0) -> (z0, bot0) -> (z1, top1)
    positions.push(
      x, top0, z0,
      x, bot0, z0,
      x, top1, z1
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    // Triangle 2: (z1, top1) -> (z0, bot0) -> (x, bot1)
    positions.push(
      x, top1, z1,
      x, bot0, z0,
      x, bot1, z1
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Builds watertight internal capping boundary walls for the excised 90-degree corner cut.
 * Wall 1: at x = 0, spanning z in [0, halfL], facing +X
 * Wall 2: at z = 0, spanning x in [0, halfW], facing +Z
 */
export function buildCornerCutInternalCappingWalls(
  topYFunc: (x: number, z: number) => number,
  botYFunc: (x: number, z: number) => number,
  halfW: number,
  halfL: number,
  segsX: number = 32,
  segsZ: number = 32,
  meterScale: number = 4.0
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  const dz = halfL / segsZ;
  const dx = halfW / segsX;

  // 1. Internal X-Cut Wall (x = 0, z from 0 to halfL, normal facing +X)
  const x = 0;
  for (let iz = 0; iz < segsZ; iz++) {
    const z0 = iz * dz;
    const z1 = z0 + dz;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = z0 / meterScale;
    const u1 = z1 / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (0, top0, z0) -> (0, top1, z1) -> (0, bot0, z0)
    positions.push(
      x, top0, z0,
      x, top1, z1,
      x, bot0, z0
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    // Triangle 2: (0, top1, z1) -> (0, bot1, z1) -> (0, bot0, z0)
    positions.push(
      x, top1, z1,
      x, bot1, z1,
      x, bot0, z0
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 2. Internal Z-Cut Wall (z = 0, x from 0 to halfW, normal facing +Z)
  const z = 0;
  for (let ix = 0; ix < segsX; ix++) {
    const x0 = ix * dx;
    const x1 = x0 + dx;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = x0 / meterScale;
    const u1 = x1 / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    // Triangle 1: (x0, top0, 0) -> (x0, bot0, 0) -> (x1, top1, 0)
    positions.push(
      x0, top0, 0,
      x0, bot0, 0,
      x1, top1, 0
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    // Triangle 2: (x1, top1, 0) -> (x0, bot0, 0) -> (x1, bot1, 0)
    positions.push(
      x1, top1, 0,
      x0, bot0, 0,
      x1, bot1, 0
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Constructs a 100% watertight, monolithic L-shaped volumetric stratum geometry
 * for Corner Cut excavations without relying on GPU clipping planes or separate capping meshes.
 * 
 * Solid domain covers the 3 visible quadrants:
 * - Quadrant NW: x in [-halfW, 0], z in [-halfL, 0]
 * - Quadrant SW: x in [-halfW, 0], z in [0, halfL]
 * - Quadrant NE: x in [0, halfW], z in [-halfL, 0]
 * 
 * Internal Excavation Cross-Section Walls:
 * - Face 1: x = 0, z in [0, halfL], normal pointing +X (into excavated void)
 * - Face 2: z = 0, x in [0, halfW], normal pointing +Z (into excavated void)
 * Meeting at x = 0, z = 0 with complete continuous stratigraphic contact!
 */
export function buildCornerCutStratumGeometry(
  topYFunc: (x: number, z: number) => number,
  botYFunc: (x: number, z: number) => number,
  width: number,
  length: number,
  segsX: number = 32,
  segsZ: number = 32,
  meterScale: number = 4.0
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  const halfW = width / 2;
  const halfL = length / 2;
  const halfSegsX = Math.max(8, Math.floor(segsX / 2));
  const halfSegsZ = Math.max(8, Math.floor(segsZ / 2));
  const dxW = halfW / halfSegsX;
  const dzL = halfL / halfSegsZ;

  // Helper to add a quad on top surface (normal points +Y)
  const addTopQuad = (x0: number, x1: number, z0: number, z1: number) => {
    const y00 = topYFunc(x0, z0);
    const y10 = topYFunc(x1, z0);
    const y01 = topYFunc(x0, z1);
    const y11 = topYFunc(x1, z1);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const v0 = (z0 + halfL) / meterScale;
    const v1 = (z1 + halfL) / meterScale;

    // Tri 1: (0,0) -> (0,1) -> (1,1)
    positions.push(
      x0, y00, z0,
      x0, y01, z1,
      x1, y11, z1
    );
    uvs.push(u0, v0, u0, v1, u1, v1);

    // Tri 2: (0,0) -> (1,1) -> (1,0)
    positions.push(
      x0, y00, z0,
      x1, y11, z1,
      x1, y10, z0
    );
    uvs.push(u0, v0, u1, v1, u1, v0);
  };

  // Helper to add a quad on bottom surface (normal points -Y)
  const addBotQuad = (x0: number, x1: number, z0: number, z1: number) => {
    const y00 = botYFunc(x0, z0);
    const y10 = botYFunc(x1, z0);
    const y01 = botYFunc(x0, z1);
    const y11 = botYFunc(x1, z1);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const v0 = (z0 + halfL) / meterScale;
    const v1 = (z1 + halfL) / meterScale;

    // Tri 1: (0,0) -> (1,0) -> (1,1)
    positions.push(
      x0, y00, z0,
      x1, y10, z0,
      x1, y11, z1
    );
    uvs.push(u0, v0, u1, v0, u1, v1);

    // Tri 2: (0,0) -> (1,1) -> (0,1)
    positions.push(
      x0, y00, z0,
      x1, y11, z1,
      x0, y01, z1
    );
    uvs.push(u0, v0, u1, v1, u0, v1);
  };

  // 1. TOP & BOTTOM SURFACES ACROSS 3 QUADRANTS
  // Quadrant NW: x in [-halfW, 0], z in [-halfL, 0]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = -halfW + ix * dxW;
      const x1 = x0 + dxW;
      addTopQuad(x0, x1, z0, z1);
      addBotQuad(x0, x1, z0, z1);
    }
  }

  // Quadrant SW: x in [-halfW, 0], z in [0, halfL]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = -halfW + ix * dxW;
      const x1 = x0 + dxW;
      addTopQuad(x0, x1, z0, z1);
      addBotQuad(x0, x1, z0, z1);
    }
  }

  // Quadrant NE: x in [0, halfW], z in [-halfL, 0]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = ix * dxW;
      const x1 = x0 + dxW;
      addTopQuad(x0, x1, z0, z1);
      addBotQuad(x0, x1, z0, z1);
    }
  }

  // 2. NORTH OUTER WALL (z = -halfL, facing -Z) across full width [-halfW, +halfW]
  const totalSegsX = halfSegsX * 2;
  for (let ix = 0; ix < totalSegsX; ix++) {
    const x0 = -halfW + ix * dxW;
    const x1 = x0 + dxW;
    const z = -halfL;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x0, top0, z,
      x1, top1, z,
      x0, bot0, z
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    positions.push(
      x1, top1, z,
      x1, bot1, z,
      x0, bot0, z
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 3. WEST OUTER WALL (x = -halfW, facing -X) across full length [-halfL, +halfL]
  const totalSegsZ = halfSegsZ * 2;
  for (let iz = 0; iz < totalSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    const x = -halfW;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = (z0 + halfL) / meterScale;
    const u1 = (z1 + halfL) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x, top0, z0,
      x, bot0, z0,
      x, top1, z1
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    positions.push(
      x, top1, z1,
      x, bot0, z0,
      x, bot1, z1
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  // 4. SOUTH OUTER WALL (z = +halfL, facing +Z) across x in [-halfW, 0]
  for (let ix = 0; ix < halfSegsX; ix++) {
    const x0 = -halfW + ix * dxW;
    const x1 = x0 + dxW;
    const z = halfL;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = (x0 + halfW) / meterScale;
    const u1 = (x1 + halfW) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x0, top0, z,
      x0, bot0, z,
      x1, top1, z
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    positions.push(
      x1, top1, z,
      x0, bot0, z,
      x1, bot1, z
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  // 5. EAST OUTER WALL (x = +halfW, facing +X) across z in [-halfL, 0]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    const x = halfW;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = (z0 + halfL) / meterScale;
    const u1 = (z1 + halfL) / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x, top0, z0,
      x, top1, z1,
      x, bot0, z0
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    positions.push(
      x, top1, z1,
      x, bot1, z1,
      x, bot0, z0
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 6. INTERNAL EXCAVATION FACE 1 (x = 0, z in [0, halfL], facing +X into excavated cut)
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = iz * dzL;
    const z1 = z0 + dzL;
    const x = 0;

    const top0 = topYFunc(x, z0);
    const top1 = topYFunc(x, z1);
    const bot0 = botYFunc(x, z0);
    const bot1 = botYFunc(x, z1);

    const u0 = z0 / meterScale;
    const u1 = z1 / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x, top0, z0,
      x, top1, z1,
      x, bot0, z0
    );
    uvs.push(u0, vTop0, u1, vTop1, u0, vBot0);

    positions.push(
      x, top1, z1,
      x, bot1, z1,
      x, bot0, z0
    );
    uvs.push(u1, vTop1, u1, vBot1, u0, vBot0);
  }

  // 7. INTERNAL EXCAVATION FACE 2 (z = 0, x in [0, halfW], facing +Z into excavated cut)
  for (let ix = 0; ix < halfSegsX; ix++) {
    const x0 = ix * dxW;
    const x1 = x0 + dxW;
    const z = 0;

    const top0 = topYFunc(x0, z);
    const top1 = topYFunc(x1, z);
    const bot0 = botYFunc(x0, z);
    const bot1 = botYFunc(x1, z);

    const u0 = x0 / meterScale;
    const u1 = x1 / meterScale;
    const vTop0 = top0 / meterScale;
    const vTop1 = top1 / meterScale;
    const vBot0 = bot0 / meterScale;
    const vBot1 = bot1 / meterScale;

    positions.push(
      x0, top0, z,
      x0, bot0, z,
      x1, top1, z
    );
    uvs.push(u0, vTop0, u0, vBot0, u1, vTop1);

    positions.push(
      x1, top1, z,
      x0, bot0, z,
      x1, bot1, z
    );
    uvs.push(u1, vTop1, u0, vBot0, u1, vBot1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Universal volumetric stratum builder that constructs a continuous, watertight 3D solid
 * for either Corner Cut (L-shaped) or Full Block / Fence modes.
 */
export function buildVolumetricStratumGeometry(
  topYFunc: (x: number, z: number) => number,
  botYFunc: (x: number, z: number) => number,
  width: number,
  length: number,
  isCornerCut: boolean,
  segsX: number = 32,
  segsZ: number = 32,
  meterScale: number = 4.0
): THREE.BufferGeometry {
  if (isCornerCut) {
    return buildCornerCutStratumGeometry(topYFunc, botYFunc, width, length, segsX, segsZ, meterScale);
  }
  return buildDippingStratumGeometry(topYFunc, botYFunc, width, length, segsX, segsZ, meterScale);
}

/**
 * Constructs a continuous, high-resolution L-shaped displaced terrain surface mesh
 * for the Corner Cut mode, mapped with normalized [0, 1] UVs that align seamlessly with
 * the canvas terrain texture.
 */
export function buildCornerCutTerrainGeometry(
  surfaceElevationFunc: (x: number, z: number) => number,
  width: number,
  length: number,
  segsX: number = 48,
  segsZ: number = 48
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  const halfW = width / 2;
  const halfL = length / 2;
  const halfSegsX = Math.max(12, Math.floor(segsX / 2));
  const halfSegsZ = Math.max(12, Math.floor(segsZ / 2));
  const dxW = halfW / halfSegsX;
  const dzL = halfL / halfSegsZ;

  const addTerrainQuad = (x0: number, x1: number, z0: number, z1: number) => {
    const y00 = surfaceElevationFunc(x0, z0);
    const y10 = surfaceElevationFunc(x1, z0);
    const y01 = surfaceElevationFunc(x0, z1);
    const y11 = surfaceElevationFunc(x1, z1);

    const u0 = (x0 + halfW) / width;
    const u1 = (x1 + halfW) / width;
    const v0 = (z0 + halfL) / length;
    const v1 = (z1 + halfL) / length;

    // Tri 1: (0,0) -> (0,1) -> (1,1) [upward normal]
    positions.push(
      x0, y00, z0,
      x0, y01, z1,
      x1, y11, z1
    );
    uvs.push(u0, v0, u0, v1, u1, v1);

    // Tri 2: (0,0) -> (1,1) -> (1,0)
    positions.push(
      x0, y00, z0,
      x1, y11, z1,
      x1, y10, z0
    );
    uvs.push(u0, v0, u1, v1, u1, v0);
  };

  // Quadrant NW: x in [-halfW, 0], z in [-halfL, 0]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = -halfW + ix * dxW;
      const x1 = x0 + dxW;
      addTerrainQuad(x0, x1, z0, z1);
    }
  }

  // Quadrant SW: x in [-halfW, 0], z in [0, halfL]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = -halfW + ix * dxW;
      const x1 = x0 + dxW;
      addTerrainQuad(x0, x1, z0, z1);
    }
  }

  // Quadrant NE: x in [0, halfW], z in [-halfL, 0]
  for (let iz = 0; iz < halfSegsZ; iz++) {
    const z0 = -halfL + iz * dzL;
    const z1 = z0 + dzL;
    for (let ix = 0; ix < halfSegsX; ix++) {
      const x0 = ix * dxW;
      const x1 = x0 + dxW;
      addTerrainQuad(x0, x1, z0, z1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Builds 3D line segment geometry marking the exact geological contacts along
 * the exposed internal cutaway faces.
 */
export function buildStratigraphicContactSeamGeometry(
  contactFunc: (x: number, z: number) => number,
  halfW: number,
  halfL: number,
  segs: number = 32
): THREE.BufferGeometry {
  const points: number[] = [];

  // Face 1: along x = 0, z from 0 to halfL
  const dz = halfL / segs;
  for (let iz = 0; iz < segs; iz++) {
    const z0 = iz * dz;
    const z1 = z0 + dz;
    const y0 = contactFunc(0, z0);
    const y1 = contactFunc(0, z1);
    points.push(0.015, y0, z0, 0.015, y1, z1);
  }

  // Face 2: along z = 0, x from 0 to halfW
  const dx = halfW / segs;
  for (let ix = 0; ix < segs; ix++) {
    const x0 = ix * dx;
    const x1 = x0 + dx;
    const y0 = contactFunc(x0, 0);
    const y1 = contactFunc(x1, 0);
    points.push(x0, y0, 0.015, x1, y1, 0.015);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  return geometry;
}

/**
 * Constructs a precision, museum-grade beveled geotechnical datum plinth
 * that frames the bottom of the geological block diagram, eliminating the
 * "Minecraft block floating in space" appearance and providing CAD/GIS standard framing.
 */
export function buildGeologicalDatumPlinthGeometry(
  width: number,
  length: number,
  baseY: number,
  isCornerCut: boolean = false,
  plinthHeight: number = 2.5,
  bevel: number = 1.0
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];

  const halfW = width / 2;
  const halfL = length / 2;
  const topY = baseY;
  const botY = baseY - plinthHeight;

  const addQuad = (
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    p4: [number, number, number]
  ) => {
    positions.push(...p1, ...p2, ...p3);
    positions.push(...p1, ...p3, ...p4);
    uvs.push(0, 0, 1, 0, 1, 1);
    uvs.push(0, 0, 1, 1, 0, 1);
  };

  if (!isCornerCut) {
    const wTop = halfW;
    const lTop = halfL;
    const wBot = halfW + bevel;
    const lBot = halfL + bevel;

    // Bottom face
    addQuad([-wBot, botY, -lBot], [wBot, botY, -lBot], [wBot, botY, lBot], [-wBot, botY, lBot]);

    // 4 Beveled side faces
    // North (z = -l)
    addQuad([-wTop, topY, -lTop], [wTop, topY, -lTop], [wBot, botY, -lBot], [-wBot, botY, -lBot]);
    // South (z = +l)
    addQuad([wTop, topY, lTop], [-wTop, topY, lTop], [-wBot, botY, lBot], [wBot, botY, lBot]);
    // West (x = -w)
    addQuad([-wTop, topY, lTop], [-wTop, topY, -lTop], [-wBot, botY, -lBot], [-wBot, botY, lBot]);
    // East (x = +w)
    addQuad([wTop, topY, -lTop], [wTop, topY, lTop], [wBot, botY, lBot], [wBot, botY, -lBot]);
  } else {
    const wT = halfW;
    const lT = halfL;
    const wB = halfW + bevel;
    const lB = halfL + bevel;

    // Outer North face (z = -lT)
    addQuad([-wT, topY, -lT], [wT, topY, -lT], [wB, botY, -lB], [-wB, botY, -lB]);
    // Outer West face (x = -wT)
    addQuad([-wT, topY, lT], [-wT, topY, -lT], [-wB, botY, -lB], [-wB, botY, lB]);
    // Outer South face (z = +lT, x in [-wT, 0])
    addQuad([0, topY, lT], [-wT, topY, lT], [-wB, botY, lB], [0, botY, lB]);
    // Outer East face (x = +wT, z in [-lT, 0])
    addQuad([wT, topY, -lT], [wT, topY, 0], [wB, botY, 0], [wB, botY, -lB]);

    // Internal Excavation Step Plinth Walls
    // Face 1: at x = 0, z in [0, lT]
    addQuad([0, topY, 0], [0, topY, lT], [0, botY, lB], [0, botY, 0]);
    // Face 2: at z = 0, x in [0, wT]
    addQuad([wT, topY, 0], [0, topY, 0], [0, botY, 0], [wB, botY, 0]);

    // Bottom L-shape
    addQuad([-wB, botY, -lB], [wB, botY, -lB], [wB, botY, 0], [-wB, botY, 0]);
    addQuad([-wB, botY, 0], [0, botY, 0], [0, botY, lB], [-wB, botY, lB]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
}


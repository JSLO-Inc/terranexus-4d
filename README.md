# TERRANEXUS 4D
### India's Unified Earth Intelligence Platform — Integrating Groundwater, Geology, Remote Sensing & 4D Subsurface Visualisation

[![Platform Status](https://img.shields.io/badge/Platform-Production--Grade-06b6d4.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![Data Integrity](https://img.shields.io/badge/Scientific_Data_Integrity-Gated_&_Audited-10b981.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![Test Suite](https://img.shields.io/badge/Automated_Tests-3%2C520%20Passed%20(18%2F18%20Suites)-34d399.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![License](https://img.shields.io/badge/License-MIT-3b82f6.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/Geographic_Scope-Pan--India%20&%20Global-f59e0b.svg)](https://github.com/JSLO-Inc/terranexus-4d)

---

> ### ⚠️ Mandatory Scientific Integrity Statement
> **TERRANEXUS 4D is committed to uncompromising scientific data provenance and honest attribution.**  
> In Earth observation and subsurface hydrology, different categories of data possess fundamentally different levels of certainty. This platform strictly enforces transparent classification labels across all APIs and visual displays:
> - **`OBSERVED`**: Direct physical in-situ measurements (e.g. tape/piezometric water table dip at a specific well, drill-hole core lithology, surface optical reflectance).
> - **`DERIVED`**: Computed deterministically from authoritative spatial models (e.g. Copernicus GLO-90 DEM elevations, HydroSHEDS drainage networks, slope angles).
> - **`MODELLED`**: Mathematical or statistical models (e.g. regional recharge suitability indices, GSI mineral prospectivity models).
> - **`REGIONAL_AGGREGATION`**: Macro-scale statistical summaries compiled across administrative units (e.g. Central Ground Water Board GEC-2015 state-level total recharge and extraction). **These macro figures do not represent point borehole measurements for arbitrary addresses.**
> - **`UNAVAILABLE`**: When data coverage does not exist for a requested coordinate, the platform displays an explicit "Data Unavailable" badge. **We never interpolate across state lines, invent unverified boreholes, or label synthetic estimates as live observations.**

---

## 1. Project Overview

**TERRANEXUS 4D** is an open, scientifically grounded Earth intelligence platform and subsurface digital twin engineered specifically for the Indian subcontinent with global geocoding support. It bridges the critical divide between surface remote sensing and deep underground hydrogeological and mineral systems across four interconnected spatiotemporal dimensions:

1. **Latitude ($X$)** — High-precision geodetic positioning across sovereign India and international loci.
2. **Longitude ($Y$)** — Multi-scale territorial navigation from national river basins to local administrative habitations.
3. **Depth ($Z$)** — Vertical exploration from topographic surface ($0\,\text{m}$) down to $-1,200\,\text{m}$ below ground level ($\text{mbgl}$).
4. **Time ($T$)** — Decade-long observation trajectories ($2015 - 2024$) capturing seasonal monsoon recharge, water table fluctuations, and multi-year gravitational mass changes.

---

## 2. Vision & Objectives

India supports nearly 18% of the world's population with only 4% of global freshwater resources, relying heavily on groundwater for over 60% of irrigated agriculture and 85% of rural drinking water. Despite the availability of vast public datasets from national and international agencies, information remains heavily siloed, inaccessible to field practitioners, or obscured by uncalibrated extrapolations.

The primary objectives of TERRANEXUS 4D are:
- **Democratise Subsurface Intelligence:** Make complex hydrogeological, geological, and remote sensing data instantly discoverable for any coordinate in India.
- **Enforce Scientific Provenance:** Ensure every chart, layer, and voxel is traceable to an authoritative open scientific source with transparent certainty tiers.
- **Prevent Misleading Claims:** Strictly separate surface optical reflectance from underground ore bodies, and regional gravity footprints from point borehole depths.
- **Unify Dual-Engine 3D Visualisation:** Harmonise orbital planetary exploration in CesiumJS with localized volumetric block cutaway slicing in Three.js.
- **Provide Extensible Operations Architecture:** Include a built-in Operations Centre and API Gateway with autonomous discovery, health monitoring, SSRF defenses, and credentials protection.

---

## 3. Problems TERRANEXUS 4D Aims to Address

| Conventional Problem | TERRANEXUS 4D Solution |
| :--- | :--- |
| **Fragmented Geospatial Silos** | Unifies Central Ground Water Board (CGWB), Geological Survey of India (GSI), Central Water Commission (CWC), NASA, Copernicus, and CARTO datasets into a single normalised schema. |
| **Borehole Over-Extrapolation** | Prevents linking addresses to distant monitoring wells across state boundaries; enforces distance gating ($\le 50\,\text{km}$) and state containment. |
| **Macro Data Misrepresentation** | Explicitly labels state-wide GEC-2015 administrative compilations (e.g. total state recharge) to avoid confusing them with localized 5 km well depths. |
| **Satellite Penetration Fallacy** | Enforces physics guardrails: optical and SWIR sensors reflect off the top microns of rock only; they cannot confirm underground ore deposits. |
| **Zero-Width Rendering Crashes** | Implements robust defensive layout and lifecycle guards inside CesiumJS to eliminate viewport initialisation and resizing exceptions. |
| **Unrealistic Minecraft Block Cutaways** | High-resolution displaced terrain mesh with physical incised river channels, non-planar dipping geological strata, and lenticular sand bodies. |

---

## 4. Core Architecture

TERRANEXUS 4D follows a decoupled, resilient client-server architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT 18 / TYPESCRIPT CLIENT                   │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │    CesiumGlobe.tsx    │  │   Subsurface3D.tsx    │  │ 2D Map Eng  │ │
│  │ (3D Earth, Orbit Nav) │  │(Volumetric 3D Cutaway)│  │(23 CWC Basin│ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
│              └──────────────────────────┼─────────────────────┘        │
│                                         ▼                              │
│                      Zustand State Store (useTerranexusStore)          │
└─────────────────────────────────────────┬──────────────────────────────┘
                                          │ HTTP REST / JSON
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS API BACKEND (:3001)                     │
│                                                                        │
│  [Security Perimeter: Hardened CORS, Rate Limiters, Path & URL Guards] │
│  [API Gateway & Operations Centre: Autonomous Discovery, SSRF Guard]   │
│                                 │                                      │
│  ┌──────────────────────────────┴───────────────────────────────────┐  │
│  │                 DATA INTEGRITY GATEWAY                           │  │
│  │   - Sovereign Bounding Box Validation (6°-37.5°N, 68°-97.5°E)   │  │
│  │   - Cross-State Station Isolation (Enforces State Boundaries)    │  │
│  │   - Scale Disclaimer Injection (GEC-2015 Administrative Macro)   │  │
│  │   - DEM Elevation Physics & Elevation Batch Chunking             │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │                                      │
│  ┌──────────────────────────────┴───────────────────────────────────┐  │
│  ▼                                  ▼                               ▼  │
│ Provider Adapters           NASA Satellite Pipeline         Nexus AI   │
│ - CGWB Groundwater         - GRACE RL06 NetCDF3 Parser     - Gemini    │
│ - GSI Bhukosh Terranes     - GPM IMERG Precipitation       - Rule Eng  │
│ - CWC River Basins         - 0.5° Tellus Mass Anomalies                │
│ - Copernicus DEM GLO-90    - CARTO Basemaps API                        │
└────────────────────────────────────────────────────────────────────────┘
```

For complete technical specifications, review [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 5. Key Scientific Modules

### 5.1 Nexus Hydro — Groundwater Intelligence
- **Central Ground Water Board (CGWB) & State Water Departments:**
  - In-situ piezometric water table monitoring network expanded across India.
  - 10-year seasonal hydrographs ($2015 - 2024$) tracking pre-monsoon (April/May) and post-monsoon (November) water table depths.
  - Distance-gated nearest well telemetry: coordinates within 50 km display the nearest authenticated well; points within 1 km are marked as direct observations.
- **Dynamic Ground Water Assessment (IN-GRES / GEC-2015):**
  - State-level administrative compilations for Annual Extractable Groundwater Resource, Total Extraction, and Stage of Extraction percentage.
- **NASA GRACE & GRACE-FO Satellite Gravimetry:**
  - Tellus Level-3 monthly Terrestrial Water Storage Anomaly ($\text{cm LWE}$) from JPL RL06/RL06.3 spherical harmonic solutions.
  - Identifies multi-year regional groundwater depletion across India's major alluvial and crystalline basins.
- **Physical Thiem Drawdown Cone Simulation:**
  - Dynamic phreatic water table cone of depression calculated from transmissivity ($T$) and discharge ($Q$) with unconfined Jacob aquifer corrections.

### 5.2 Nexus Strata — Geological Intelligence
- **Geological Survey of India (GSI) 1:2M & 1:50,000 Lithotectonic Terranes:**
  - Authentic terrane classification including Eastern Ghats Mobile Belt, Deccan Volcanic Province, Dharwar Craton, Aravalli-Delhi Fold Belt, Singhbhum Craton, and Indo-Gangetic Alluvial Basin.
- **Borehole Core Litholog Repository:**
  - Drill-hole stratigraphic columns with depth intervals, rock colors, textures, and hydraulic conductivity values ($K$ in $\text{m/day}$).
- **Three.js Volumetric Subsurface Cutaway:**
  - Expansive landscape proportions ($44 \times 44 \times 34\,\text{m}$) eliminating boxy voxel appearances.
  - Continuous 3D topography with natural rolling hills, flanking levees, and incised river drainage swales aligned with surface satellite imagery.
  - Watertight dipping strata with realistic structural attitudes, variable sediment thickness, lenticular channel sand bodies, and unconformity scalloping.
  - Multiple visualization modes: Corner Cut (default), Full Block, 3D Fence Diagram, and 2D Orthogonal Section.

### 5.3 Nexus Mineral — Surface Alteration Intelligence
- **Copernicus Sentinel-2 MSI Multi-Spectral Ratios:**
  - *Iron Oxide / Gossan Index:* $\text{Band } 4 / \text{Band } 2$ ($\text{Red} / \text{Blue}$) — highlights ferric/ferrous oxide weathering products.
  - *Hydroxyl & Clay Alteration Index:* $\text{Band } 11 / \text{Band } 12$ ($\text{SWIR-1} / \text{SWIR-2}$) — detects sericite, illite, kaolinite, and alunite alteration.
  - *Ferrous Silicates Index:* $\text{Band } 12 / \text{Band } 8A$ ($\text{SWIR-2} / \text{NIR-narrow}$) — maps chlorite and amphibole assemblages.
- **GSI Metallogenic Belts & Host Lithologies:**
  - Contextual alignment with verified metallogenic provinces (e.g. Khetri Copper Belt, Zawar Lead-Zinc Belt, Singhbhum Copper-Uranium Belt).
- **Physical Limitation Notice:** Surface spectral ratios capture outcrop reflectance from the top micrometers of Earth's crust only. They do not penetrate overburden or prove underground ore reserves.

### 5.4 Nexus AI — Context-Grounded Scientific Copilot
- **Context-Grounded Reasoning:** Powered by **Google Gemini API** (`@google/genai`) when an API key is configured.
- **Autonomous Offline Fallback:** If no API key is configured, Nexus AI automatically engages an offline, rule-based scientific inference engine that generates rigorous technical explanations directly from active provider data without internet access or crashes.
- **Strict Guardrails:** Nexus AI is systematically barred from predicting exact drilling depths, guaranteeing borehole water potability, or claiming unverified mineral reserves.

### 5.5 Operations Centre & API Gateway
- **Centralized API Registry:** Live monitoring and endpoint testing across 14+ authentic earth intelligence APIs.
- **Autonomous Discovery Engine:** Candidate discovery pipelines for open environmental data services with staging gates.
- **Industrial SSRF Protection:** Multi-layer IP parsing (decimal, hex, octal, IPv6), DNS rebinding resolution, and redirect inspection.
- **Credentials Vault:** Local environment masking protecting sensitive tokens from client leakage.

---

## 6. 4D Earth Explorer — Multi-Viewport Visualisation

TERRANEXUS 4D provides synchronized multi-engine visualisation modes:

1. **3D Globe Mode (Default Landing):** Full-screen 3D planetary globe powered by CesiumJS with high-resolution Satellite basemap imagery, elevation shading, and pan-India administrative boundaries.
2. **3D Cutaway Mode:** Full-screen Three.js 3D block cutaway diagram with Corner Cut excavation, dynamic depth slicing, borehole cylinders, and water table surfaces.
3. **Split Mode:** Synchronized side-by-side view pairing the CesiumJS orbital terrain on the left with the Three.js subsurface cutaway on the right.
4. **2D Location Dossier & Vector Map:** High-speed vector canvas rendering all 23 CWC mainland river basins, island archipelagos, river courses, and administrative boundaries with integrated hydrogeological evidence panels.

---

## 7. Technologies & Frameworks Actually Used

| Domain | Technology / Library | Version | License | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI** | React | `^18.3.1` | MIT | Component UI lifecycle, hooks, and views |
| **Language** | TypeScript | `~5.6.3` | Apache-2.0 | End-to-end type safety across client and server |
| **Build & Dev** | Vite | `^5.4.11` | MIT | High-speed HMR frontend compilation and bundling |
| **3D Planetary Engine**| CesiumJS | `^1.121.0` | Apache-2.0 | Planetary globe, WGS84 coordinates, camera controllers |
| **3D Subsurface Engine**| Three.js | `^0.170.0` | MIT | 3D block diagram cutaway, strata slabs, borehole tubes |
| **Basemaps API** | CARTO Basemaps | Official GL | CARTO TOS | High-performance vector & raster basemaps (Dark Matter, Voyager, Positron) |
| **Vector Mapping** | MapLibre GL | `^4.7.1` | BSD-3-Clause | 2D vector basemaps and interactive layers |
| **State Management** | Zustand | (Custom Store) | MIT | Unified reactive store (`useTerranexusStore.ts`) |
| **Styling** | Tailwind CSS | `^3.4.15` | MIT | Dark scientific design system and responsive layout |
| **Data Visualisation** | Recharts | `^2.13.3` | MIT | Dual-axis seasonal hydrographs and GRACE time series |
| **Icons** | Lucide React | `^0.460.0` | ISC | Scientific and geospatial UI icon set |
| **Backend API** | Express | `^4.21.1` | MIT | REST endpoints, rate limiting, and provider orchestration |
| **Runtime Execution**| tsx / Node.js | `^4.19.2` | MIT | High-speed TypeScript execution without manual compilation |
| **AI Integration** | `@google/genai` | `^2.32.0` | Apache-2.0 | Context-grounded generative AI explanations |

---

## 8. Data Sources & Scientific Provenance

TERRANEXUS 4D integrates exclusively with authoritative national and international public scientific programs:

1. **Central Ground Water Board (CGWB)**, Ministry of Jal Shakti, Government of India:
   - National Aquifer Mapping and Management Programme (NAQUIM).
   - National Ground Water Monitoring Well Network (India-WRIS).
   - Dynamic Ground Water Resources Assessment of India (IN-GRES, GEC-2015).
2. **Geological Survey of India (GSI)**, Ministry of Mines, Government of India:
   - Bhukosh Spatial Data Portal (1:2,000,000 Geological Map of India, 1:50,000 Series).
   - Metallogenic Belts and Mineral Inventory of India.
3. **Central Water Commission (CWC)**, Ministry of Jal Shakti, Government of India:
   - Official River Basin Catchment Boundaries (23 major basins).
4. **NASA Jet Propulsion Laboratory (JPL) & UT CSR:**
   - GRACE and GRACE Follow-On Tellus Level-3 Monthly Land Mass Grids (RL06/RL06.3).
5. **NASA Goddard Earth Sciences (GES DISC):**
   - Global Precipitation Measurement (GPM) IMERG Final Precipitation Grids.
6. **European Space Agency (ESA) & Copernicus Programme:**
   - Sentinel-2 Multi-Spectral Instrument (MSI) BOA Surface Reflectance.
   - Copernicus Global Digital Elevation Model (GLO-90 DEM, 90m resolution).
7. **CARTO & OpenStreetMap:**
   - CARTO Basemaps API (Dark Matter, Voyager, Positron styles).
   - OpenStreetMap base imagery tiles and Nominatim geocoding services.

For full citation guidelines, legal disclaimers, and terms of use, see [DATA_LICENSES_AND_ATTRIBUTION.md](DATA_LICENSES_AND_ATTRIBUTION.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## 9. Installation & Setup Instructions

### Prerequisites
- **Node.js:** v18.0.0 or v20.0.0+ (Tested on v20.18.0)
- **npm:** v9.0.0 or v10.0.0+
- **Git**

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/JSLO-Inc/terranexus-4d.git
cd terranexus-4d

# 2. Install dependencies
npm install

# 3. Create your local environment configuration file
# On Windows (PowerShell / Command Prompt):
copy .env.example .env
# On macOS / Linux:
cp .env.example .env

# 4. (Optional) Provide API keys in your local .env or .env.local:
# - GEMINI_API_KEY: for live Google Gemini AI answers (app works offline without it)
# - VITE_CARTO_BASEMAPS_API_KEY: for CARTO Vector & Raster basemap styles
# - VITE_CESIUM_ION_TOKEN: for high-res Cesium 3D World Terrain (falls back to open imagery)

# 5. Launch both Express backend and Vite client concurrently
npm run dev
```

Open your browser at **`http://localhost:3000`** to access the platform.  
The Express backend operates at **`http://localhost:3001`**.

---

## 10. Environment Variables & API Configuration

All configuration variables are defined with safe fallbacks in `.env.example`:

| Variable | Scope | Required? | Default / Fallback | Purpose |
| :--- | :--- | :---: | :--- | :--- |
| `PORT` | Backend | Optional | `3001` | Express backend server port |
| `VITE_API_URL` | Client | Optional | `http://localhost:3001` | Backend API URL reached by Vite client |
| `GEMINI_API_KEY` | Backend | Optional | `None` (Offline Rule Engine) | Google Gemini API key for live AI copilot |
| `VITE_CARTO_BASEMAPS_API_KEY` | Client | Optional | `None` (Open Basemap Fallback)| CARTO Basemaps API key for Vector/Raster styles |
| `VITE_CESIUM_ION_TOKEN`| Client | Optional | `None` (OpenStreetMap fallback)| Cesium Ion token for 3D terrain streaming |
| `EARTHDATA_TOKEN` | Backend | Optional | `None` (Local benchmark cache)| NASA Earthdata token for live NetCDF downloads|
| `NASA_CMR_BASE_URL` | Backend | Optional | Official CMR Endpoint | NASA Common Metadata Repository URL |
| `NASA_PO_DAAC_BASE_URL`| Backend | Optional | Official PO.DAAC Endpoint | NASA PO.DAAC satellite granule download URL |

---

## 11. Development Commands

```bash
# Start backend and frontend concurrently
npm run dev

# Start frontend client only (Vite on :3000)
npm run dev:client

# Start backend server only (tsx watch on :3001)
npm run dev:server

# Run TypeScript compilation check
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 12. Testing & Verification

TERRANEXUS 4D features an exhaustive automated test suite covering 18 domain test suites with **3,520 automated assertions (100% pass rate)**:

```bash
# Run the complete test suite across all 18 subsystems
npm run test:all

# Run specific domain test suites
npm run test:system              # Core system and provider registry health
npm run test:ingestion           # NetCDF and CSV ingestion pipeline integrity
npm run test:nasa                # NASA GRACE Tellus and GPM IMERG pipelines
npm run test:api-routes          # Backend REST endpoint integration
npm run test:phase4              # Phase 4 hydrogeological validation
npm run test:phase5              # Nationwide coverage scoring and multi-layer heatmaps
npm run test:national-security   # National data security, SSRF guards, rate limits
npm run test:cutaway             # Subsurface 3D volumetric strata and Copernicus DEM
npm run test:cesium-lifecycle    # CesiumJS mounting and destruction lifecycle
npm run test:cesium-guard        # CesiumJS zero-width rendering crash prevention
npm run test:geospatial          # Administrative hierarchy and CWC river basins
npm run test:photorealistic      # Structural attitude derivation, PBR rock synthesis, watertight geometry
npm run test:dossier-engine      # Location Evidence Engine and provenance calculations
npm run test:carto               # CARTO Basemaps integration and attribution compliance
npm run test:debiasing           # De-biasing, nationwide coverage, and international geocoding
npm run test:defaults            # Default landing (3D Globe Satellite, Corner Cut) and persistence
npm run test:gemini-streaming    # Gemini AI streaming, offline fallback, and prompt grounding
npm run test:api-registry        # API Registry, autonomous discovery, and credentials vault
```

---

## 13. Project Directory Structure

```text
terranexus-4d/
├── .env.example              # Public environment configuration template
├── .gitignore                # Strict repository exclusion rules (secrets, raw binaries)
├── ARCHITECTURE.md           # Comprehensive technical architecture specification
├── CHANGELOG.md              # Historical version release log
├── CONTRIBUTING.md           # Contribution guidelines & code of scientific conduct
├── DATA_LICENSES_AND_ATTRIBUTION.md # Official scientific dataset licensing register
├── LICENSE                   # MIT open-source license
├── THIRD_PARTY_NOTICES.md    # Third-party library and cartography notices
├── package.json              # Project scripts and dependencies
├── vite.config.ts            # Vite 5 and Cesium plugin configuration
│
├── server/                   # Express API Backend
│   ├── apiRegistry/          # Operations Centre API Registry & Discovery Engine
│   ├── evidence/             # DataIntegrityGate & Location Evidence Engine
│   ├── ingestion/            # NASA GRACE NetCDF parser, GPM IMERG, CWC WRIS pipelines
│   ├── providers/            # Scientific provider adapters (CGWB, GSI, CWC, Copernicus)
│   ├── routes/               # REST API endpoints (/api/location, /api/ops)
│   ├── security/             # SSRF URL validator, path sanitizer, rate limiters
│   └── services/             # Geocoding, coverage scoring, raster heatmaps, label hierarchy
│
├── src/                      # React 18 Frontend
│   ├── components/           # UI components
│   │   ├── ai/               # Nexus AI Scientific Copilot
│   │   ├── catalog/          # Scientific Data Catalog
│   │   ├── dossier/          # High-Fidelity 2D Vector Map Engine & Location Dossier
│   │   ├── globe/            # CesiumJS 3D Earth Globe with zero-width guards
│   │   ├── hydro/            # Nexus Hydro dual-axis hydrographs and GRACE charts
│   │   ├── layout/           # App header, dock, depth control, inspector drawer
│   │   ├── location/         # Universal search bar and discovery gateway
│   │   ├── mineral/          # Nexus Mineral Sentinel-2 ratio analysis
│   │   ├── strata/           # Nexus Strata litholog columns and petrophysics
│   │   └── subsurface/       # Three.js Volumetric Subsurface 3D Cutaway Engine
│   ├── data/                 # CWC vector basins, CGWB stations, Indian study loci
│   ├── services/             # CARTO basemaps integration service
│   ├── state/                # Zustand global state store (useTerranexusStore.ts)
│   └── types/                # TypeScript interfaces (Location, Dossier, Geology, Hydro)
│
├── docs/                     # Documentation & Evidence
├── scripts/                  # Data engineering, map generation, and audit utilities
└── test/                     # Automated regression test suites (18 suites, 3,520 checks)
```

---

## 14. Application Visual Architecture & Interface Overview

The TERRANEXUS 4D interface provides multiple real-time 3D geospatial and volumetric rendering modes:

| Interface Mode | Primary Engine | Core Capabilities & Rendering Features |
| :--- | :--- | :--- |
| **Orbital 3D Earth Globe** | CesiumJS | Full-screen interactive globe with Satellite and CARTO basemaps, nationwide administrative boundaries, and geological study loci markers. |
| **3D Subsurface Corner Cut** | Three.js | Volumetric crustal excavation featuring continuous undulating terrain relief, incised river swales, dipping lithological strata, and exploratory borehole strings. |
| **Full Geological Block** | Three.js | Solid volumetric crustal block showcasing topography, surface parcel texturing, and lateral stratigraphic contacts down to basement rock. |
| **3D Stratigraphic Fence** | Three.js | Orthogonal fence diagram corridors connecting exploratory boreholes across regional stratigraphic horizons with depth slicing. |
| **Nexus AI Scientific Copilot** | Google Gemini / Rules | Multimodal hydrogeological synthesis panel with transparent data tiering (`OBSERVED`, `MODELLED`, `DEMONSTRATION`). |
| **Operations Centre Gateway** | Express / REST | Live API Registry, endpoint testing console, autonomous data discovery, and credentials monitoring. |

---

## 15. Implemented Features vs Planned Roadmap

To maintain absolute scientific transparency, implemented capabilities are strictly separated from planned roadmap items:

### ✅ Fully Implemented & Verified Capabilities
- Universal Indian place and coordinate geocoding with five-tier administrative parsing.
- Default 3D Globe landing with high-resolution Satellite basemap imagery.
- Official CARTO Basemaps integration (Dark Matter, Voyager, Positron styles) with graceful open fallbacks.
- Reconstructed 3D Subsurface Cutaway with continuous undulating terrain relief, incised river swales, and watertight dipping strata.
- Multiple subsurface visualization modes: Corner Cut, Full Block, 3D Fence Diagram, and 2D Orthogonal Section.
- Dual-axis seasonal groundwater hydrographs (2015–2024) and NASA GRACE gravimetry time series.
- In-situ CGWB groundwater monitoring station discovery with 50 km distance gating and state isolation.
- Runtime `DataIntegrityGate` enforcing containment, scale disclaimers, and anti-fabrication rules.
- Sentinel-2 MSI surface alteration indices (Iron Oxide, Hydroxyl, Ferrous Silicates).
- CesiumJS defensive zero-width lifecycle guards preventing WebGL crashes.
- Context-grounded Gemini AI copilot with offline rule-based fallback.
- Centralized Operations Centre & API Gateway with SSRF protection, candidate discovery, and request telemetry.

### 📋 Planned Future Capabilities (Roadmap)
- Real-time automated ingestion from live India-WRIS telemetry endpoints once official machine APIs stabilize.
- Ingestion of GSI Bhukosh OGC WMS/WMTS vector layers for direct map streaming.
- Subsurface electrical resistivity tomography (ERT) profile rendering.
- Integration of ISRO Bhuvan satellite imagery basemaps.
- Automated export of compliant hydrogeological reports in PDF/GeoTIFF formats.

---

## 16. Licensing & Legal Compliance

- **Software License:** Distributed under the [MIT License](LICENSE). Copyright © 2026 JSLO-Inc.
- **Third-Party Software Notices:** Full list of open-source libraries and copyright statements available in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Scientific Data Compliance:** Geospatial layers and government datasets are accessed in compliance with:
  - Government Open Data License - India (GODL-India) under NDSAP.
  - NASA Earth Science Open Data Policy (17 U.S.C. § 105).
  - European Union Copernicus Open Access Regulation (EU Regulation No 377/2014).
  - CARTO Basemaps Terms of Service and OpenStreetMap ODbL.
  - Detailed dataset citations and legal terms available in [DATA_LICENSES_AND_ATTRIBUTION.md](DATA_LICENSES_AND_ATTRIBUTION.md).
- **Contributions:** Contributions adhering to our scientific code of conduct are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting pull requests.

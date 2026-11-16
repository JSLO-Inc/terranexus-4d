# TERRANEXUS 4D
### Open-Source 4D Earth Digital Twin & Subsurface Intelligence Platform — Unifying Groundwater, Lithostratigraphy, Soil Physics, Satellite Gravimetry & Volumetric 3D Cutouts

[![Platform Status](https://img.shields.io/badge/Platform-Production--Grade-06b6d4.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![Data Integrity](https://img.shields.io/badge/Scientific_Data_Integrity-Gated_&_Audited-10b981.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![Test Suite](https://img.shields.io/badge/Automated_Tests-19%20Suites%20Passed%20(100%25)-34d399.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![License](https://img.shields.io/badge/License-MIT%20%2B%20Open%20Data%20Compliant-3b82f6.svg)](LICENSE)
[![Coverage](https://img.shields.io/badge/Geographic_Scope-Global%20%26%20Deep%20Pan--India-f59e0b.svg)](https://github.com/JSLO-Inc/terranexus-4d)

> **GitHub Repository Description:**  
> *TERRANEXUS 4D is an open-source 4D Earth Digital Twin and Subsurface Intelligence Platform that lets anyone—from farmers, civil engineers, and urban planners to hydrogeologists, researchers, and everyday citizens—inspect what lies beneath any coordinate on Earth. It fuses orbital satellite gravimetry (NASA GRACE/GRACE-FO), 90m Copernicus DEM terrain, Esri optical imagery, CGWB/GSI/USGS subsurface frameworks, ISRIC SoilGrids, and FAO-56 agro-meteorology into an interactive 3D planetary globe, a photorealistic 3D geological & water-table cutout engine, and a context-grounded scientific AI copilot.*

---

> ### ⚠️ Mandatory Scientific Integrity & Legal Notice
> **TERRANEXUS 4D enforces strict scientific provenance and epistemic honesty across every pixel and API response.**  
> Different Earth observation and subsurface datasets carry fundamentally different levels of physical certainty. Every value in this platform is tagged with an explicit provenance tier:
> - **`OBSERVED` / `MEASURED`**: Direct physical in-situ measurements or primary satellite telemetry (e.g., piezometric water-level depth at a monitored well, drill-core lithologs, NASA GRACE Level-3 mascon anomalies).
> - **`DERIVED`**: Computed deterministically from primary physical grids (e.g., Copernicus GLO-90 DEM elevation, slope, and hillshade normals).
> - **`MODELLED` / `PREDICTED`**: Derived from peer-reviewed statistical, machine-learning, or analytical physics equations (e.g., ISRIC SoilGrids 250m profiles, Thiem-Jacob pumping drawdown cones, Sentinel-2 spectral alteration ratios).
> - **`REGIONAL_AGGREGATION`**: Macro-scale administrative compilations (e.g., CGWB GEC-2015 state groundwater budgets). **Macro state figures are explicitly labeled so they are never mistaken for local point borewell measurements.**
> - **`UNAVAILABLE`**: Where verified coverage does not exist, the platform states so transparently. **It never fabricates boreholes, interpolates across state borders, or claims optical satellites can see deep underground ore bodies.**

---

## 1. What is TERRANEXUS 4D & Why Does It Matter to Everyone?

Everything human society builds, grows, or drinks depends on the top 1,200 meters of Earth's crust—yet for most people, the ground beneath their feet is a complete black box. Crucial datasets on groundwater tables, rock formations, soil chemistry, flood/drought risk, and terrain stability are locked away in fragmented government portals, complex NetCDF satellite archives, or static PDF tables that require specialized GIS software to read.

**TERRANEXUS 4D turns those fragmented scientific archives into a single, intuitive 4D workstation (`Latitude × Longitude × Depth × Time`).** Type in any city, town, rural village, coordinate pair, or Google Maps link, and you can immediately inspect the surface terrain, lift out a 3D cross-section of the underlying soil, rock strata, and groundwater table, and generate an audited scientific report.

### Who Benefits & Practical Real-World Use Cases

| User Group | How They Use TERRANEXUS 4D | Concrete Practical Benefit |
| :--- | :--- | :--- |
| **Farmers, Agronomists & Rural Communities** | Search any village or agricultural district to inspect **Nexus Agri**, **Nexus Soil**, and the **3D Water Cutout**. | View 7-day crop water balance ($\text{ET}_0$ vs. rainfall), soil pH/organic carbon (`0–60 cm`), local aquifer depth (`mbgl`), and FAO-56 suitability across 6 major crop systems before planning irrigation or borewells. |
| **Civil, Geotechnical & Infrastructure Engineers** | Extract a **3D Subsurface Cutout** (`2 km` to `20 km` extent) and inspect **Nexus Strata**. | Examine surface relief (Copernicus 90m DEM), regolith overburden thickness, bedrock lithology, structural strike/dip, rock hardness (Mohs), and density ($\text{g/cm}^3$) for preliminary site reconnaissance. |
| **Hydrogeologists & Water Resource Agencies** | Analyze **Nexus Hydro** and run live **Thiem Pumping Simulations** in the 3D Cutout. | Compare 10-year seasonal piezometer hydrographs (CGWB) against regional NASA GRACE/GRACE-FO terrestrial water storage anomalies ($\text{cm LWE}$) and visualize the 3D cone of depression under active pumping ($Q = 12\,\text{L/s}$). |
| **Urban Planners & Disaster Management Teams** | Inspect **Nexus Environment**, **Timeline & Cycles**, and **2D/3D Basin Overlays**. | Audit watershed health, RUSLE soil erosion hazard, drought/flood exposure, and multi-year groundwater depletion trends across 25 major river basins. |
| **Exploration Geologists & Earth Scientists** | Combine **Nexus Mineral**, **Nexus Strata**, and the **Earth Intelligence Core (EIC)**. | Cross-reference Sentinel-2 surface alteration indices (Iron Oxide, Hydroxyl/Clay, Ferrous Silicates) with GSI/USGS metallogenic belts and structural shear zones while maintaining strict physical separation between surface reflectance and deep core validation. |
| **Educators, Students & Everyday Citizens** | Explore the interactive **3D Planetary Globe**, slice through **3D Rock & Water Cutouts**, and ask **Nexus AI Copilot**. | Understand how aquifers, monsoons, volcanic traps, cratons, and sedimentary basins work in your own hometown through visual 3D cutaways and cited, plain-language scientific explanations. |

---

## 2. How Everything Works Under the Hood (End-to-End Technical Pipeline)

TERRANEXUS 4D is engineered as a full-stack TypeScript application pairing a dual-engine 3D WebGL frontend (**CesiumJS** + **Three.js** + **GSAP**) with a hardened **Express Scientific Data & AI Gateway**.

### 2.1 Universal Location Resolution & Multi-Tier Geocoding (`locationResolver.ts` & `geocodingService.ts`)
1. **Input Parsing:** When a user enters a query in the top search bar—whether a place name (`"Pune"`, `"Zermatt"`), a rural Indian model village (`"Hiware Bazar"`, `"Ralegan Siddhi"`), decimal/DMS coordinates (`"30.9010, 75.8573"`), or a pasted Google Maps URL—the resolver parses and normalizes the request.
2. **Tiered Gazetteer Lookup:** The backend queries curatorial national benchmarks, a built-in Indian village/district gazetteer, the Open-Meteo global settlement database (11M+ places), and OpenStreetMap Nominatim with circuit-breaker fallback.
3. **Sovereign & Hydrological Enrichment:** Each resolved coordinate is matched against 25 Central Water Commission (CWC) river basin polygons, Geological Survey of India (GSI) / USGS geological provinces, and a 50 km Haversine search radius for authenticated groundwater monitoring stations.

### 2.2 Synchronized Dual-Engine 3D Architecture (`CesiumGlobe.tsx`, `Subsurface3D.tsx`, `extractionStageTransition.ts`)
Instead of forcing a single 3D engine to do both planetary orbital rendering and deep underground solid-modeling, TERRANEXUS 4D coordinates two specialized WebGL engines through a deterministic state machine (`extractionStage`):
1. **Orbital 3D Earth Digital Twin (CesiumJS):**
   - Streams Esri World Imagery optical satellite tiles, topographic shaded relief, or CARTO basemaps onto the WGS84 ellipsoid.
   - Renders single-pass political boundaries (`minimumLevel: 4` to prevent low-zoom raster text distortion), CWC river basin boundaries, and collision-suppressed hierarchical labels.
   - Traces the exact non-circular watershed polygon around the selected target locus.
2. **Reversible 8-Stage Globe ↔ 3D Cutout Transition (`extractionStageTransition.ts`):**
   - Clicking **`Extract 3D Cutout`** animates the orbital camera toward the target polygon, extrudes the regional boundary, and cross-fades via GSAP into the Three.js Subsurface Studio (`EXTRACTION_IN_PROGRESS` → `CUTOUT_READY`) while suspending background Cesium rendering to conserve GPU/CPU resources.
   - Clicking **`Return to Globe`** lowers the 3D block back into its planetary coordinates (`RETURN_IN_PROGRESS` → `GLOBE_RESTORED` → `GLOBE_IDLE`) and restores the orbital camera without losing context or flickering.
3. **Photorealistic 3D Subsurface & Phreatic Water Cutout Engine (`Subsurface3D.tsx` & `geologicalMaterials.ts`):**
   - **Real DEM Surface Relief & Optical Drapery:** Fetches a $25 \times 25$ Copernicus GLO-90 Digital Elevation Model (DEM) grid for the active coordinate and extent (`2 km` to `20 km`), computes analytical NW hillshading and Sobel tangent-space normal maps, and drapes a $2 \times 2$ mosaic of real Esri satellite imagery aligned with true North ($-Z$).
   - **Watertight Dipping Stratigraphy & Cached PBR Rock Shaders:** Constructs continuous, non-overlapping 3D rock formations (`buildIrregularPolygonStratumGeometry`) honoring regional strike, dip, sediment pinch-outs, and basal unconformities. Procedural 512×512 PBR rock textures (albedo, Sobel normal map, roughness map) are synthesized per lithology (alluvium, basalt, granite, gneiss, sandstone, limestone, schist) and cached in memory for sub-millisecond scene rebuilds.
   - **Volumetric 3D Water Cutout & Thiem Drawdown Physics:** Renders both the saturated aquifer horizon along the outer cliff walls and a dedicated **3D Corner Water Cutout Wedge** inside the excavated front-right quadrant ($\theta \in [0, \pi/2]$). The water cutout features a procedural ripple normal map, physical index of refraction ($\text{IOR} = 1.333$), a glowing cyan phreatic meniscus rim at the exact observed/modelled water table depth ($\text{mbgl}$), and a live **Thiem-Jacob cone of depression** when the **`Pump`** simulation is toggled on:
     $$s(r) = \frac{Q}{2\pi T} \ln\left(\frac{R}{r}\right)$$

### 2.3 Multi-Source Data Fusion & Earth Intelligence Core (`server/eic/earthIntelligenceCore.ts`)
When a location is selected, the backend executes a parallel scientific synthesis pipeline:
- **Hydrogeology (`NexusHydro`):** Combines nearest CGWB piezometer time series (gated strictly to $\le 50\,\text{km}$ and same state) with NASA JPL GRACE/GRACE-FO Tellus Level-3 mascon anomalies ($\Delta\text{TWSA}$) and GPM IMERG precipitation. Preserves the 11-month GRACE-to-GRACE-FO mission gap (`2017-07` to `2018-05`) as honest `null` values without artificial interpolation.
- **Pedology & Agro-Meteorology (`NexusSoil` & `NexusAgri`):** Synthesizes 4-horizon soil profiles (`0–5`, `5–15`, `15–30`, `30–60 cm`) with USDA texture classes, bulk density, organic carbon, pH, and plant-available water capacity (PAWC), paired with live Open-Meteo 7-day reference evapotranspiration ($\text{ET}_0$) and FAO-56 crop suitability scoring.
- **Location-Centered Knowledge Graph (`NexusEIC`):** Links 9 domain nodes and 8 physical causal edges (e.g., *Monsoon Precipitation* → *Infiltration & Soil Moisture* → *Unconfined Aquifer Recharge* → *GRACE Gravity Anomaly*) and reconciles cross-scale divergences.

### 2.4 Live Context-Grounded Nexus AI Copilot (`server/aiService.ts`, `NexusAI.tsx`, `Subsurface3D.tsx`)
- **Live Gemini Inference with Automatic Model Failover:** Queries the official `@google/genai` SDK using `gemini-4-hydrogen` (with `ThinkingLevel.LOW` for fast, responsive reasoning) and automatic failover to `gemini-3.1-flash-lite`.
- **Deep Telemetry Grounding:** Every prompt—whether from the **Nexus AI Copilot** workstation or the **"Explain Geological Context"** button inside the 3D Cutout inspector—is injected with the active location's exact coordinates, elevation, geological formations, aquifer transmissivity, water table depth, GRACE trend, and soil profile.
- **Deterministic Offline Scientific Fallback:** If no `GEMINI_API_KEY` is present in the environment or network connectivity is unavailable, the backend seamlessly switches to a deterministic scientific rule engine (`DETERMINISTIC_OFFLINE_RULES`) that synthesizes a structured, citation-backed hydrogeological and terrestrial water balance analysis ($\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS} - \Delta\text{SWS} - \Delta\text{SWE}$) so the app never fails or returns HTML/JSON errors.

### 2.5 Audited Binary PDF 1.4 Scientific Report Generator (`pdfReportService.ts`)
- Generates multi-page, vector-typeset binary `%PDF-1.4` dossiers tailored to the active coordinate (`COMPREHENSIVE`, `HYDRO`, `SOIL`, `AGRI`, `STRATA`, `MINERAL`, `ENVIRONMENT`), verified by an automated 6-point pre-download integrity check.

---

## 3. Problems TERRANEXUS 4D Solves

| Conventional Industry Problem | TERRANEXUS 4D Engineering Solution |
| :--- | :--- |
| **Fragmented Geospatial & Subsurface Silos** | Unifies CGWB, GSI, CWC, NASA GRACE/GPM, Copernicus GLO-90 DEM, Sentinel-2, ISRIC SoilGrids, and Open-Meteo into a single normalized 4D schema. |
| **Borehole Over-Extrapolation Across Borders** | Enforces strict Haversine distance gating ($\le 50\,\text{km}$) and state boundary containment so distant wells are never misattributed to a local site. |
| **Macro Data Misrepresentation** | Explicitly flags state-wide GEC-2015 administrative compilations so macro budgets are never confused with point borewell measurements. |
| **Satellite Penetration Fallacy** | Enforces physics guardrails: optical and SWIR sensors measure the top micrometers of surface outcrop only and never claim to prove deep underground ore reserves without core drilling. |
| **Boxy CAD / "Minecraft" Subsurface Views** | Renders organic watershed-bounded cutouts with real Copernicus DEM relief, Esri optical satellite drapery, smooth dipping rock strata, and a physical 3D corner water cutout wedge. |
| **Fragile WebGL Context & Transition Stalls** | Reuses WebGL contexts, caches procedural PBR textures, and coordinates Globe ↔ Cutout transitions via a unit-tested GSAP state machine. |

---

## 4. System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT 18 / TYPESCRIPT CLIENT                   │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │    CesiumGlobe.tsx    │  │   Subsurface3D.tsx    │  │ 2D Dossier  │ │
│  │ (3D Earth, Orbit Nav) │  │(3D Rock & Water Cutout│  │(25 CWC Basin│ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
│              └──────────────────────────┼─────────────────────┘        │
│                                         ▼                              │
│                External-Sync State Store (useTerranexusStore)          │
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
│  │                 DATA INTEGRITY & FUSION GATEWAY                  │  │
│  │   - Sovereign Bounding Box Validation & Global Gazetteer         │  │
│  │   - Cross-State Station Isolation (Enforces <=50km & State)      │  │
│  │   - Scale Disclaimer Injection (GEC-2015 Administrative Macro)   │  │
│  │   - Copernicus GLO-90 DEM Grid & Esri Optical Tile Proxy         │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 │                                      │
│  ┌──────────────────────────────┴───────────────────────────────────┐  │
│  ▼                                  ▼                               ▼  │
│ Provider Adapters           NASA Satellite Pipeline         Nexus AI   │
│ - CGWB Groundwater         - GRACE RL06 NetCDF3 Parser     - Gemini    │
│ - GSI Bhukosh / USGS       - GPM IMERG Precipitation       - Offline   │
│ - CWC River Basins         - 0.5° Tellus Mass Anomalies      Rule Eng  │
│ - ISRIC SoilGrids / FAO    - CARTO & Esri Basemap Layers               │
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
- **Global & Village Gazetteer Search (`geocodingService.ts`):** Supports countries, states, districts, cities, towns, rural Indian villages (*Ralegan Siddhi*, *Hiware Bazar*, *Piplantri*, *Punsari*, *Mawlynnong*, *Pochampally*, *Dharnai*, *Odanthurai*, *Doraha*, *Jagraon*, *Akividu*), Open-Meteo GeoNames (11M+ settlements), OSM Nominatim, and raw coordinates with resolution precision and multi-candidate disambiguation badges.
- **8-Stage Reversible Globe-to-Cutout Extraction (`App.tsx` & `Subsurface3D.tsx`):** Natural non-cubic polygon terrain and dipping stratigraphic cutout with Copernicus DEM relief, glowing boundary rim, and reversible stage HUD (`GLOBE_IDLE` → `CUTOUT_READY` ↔ `RETURN_IN_PROGRESS`).
- **Earth Intelligence Core (`server/eic/earthIntelligenceCore.ts` & `NexusEIC.tsx`):** 11-state epistemic availability classification, 7-step multi-source data fusion pipeline, cross-scale conflict reconciliation (GRACE vs. CGWB vs. NDVI), 9-node / 8-edge Location-Centered Knowledge Graph, Versioned Scientific Memory with LOO-CV prediction validation, and 16 Gemini EIC orchestration tools.
- **All Scientific Domain Workspaces:**
  - `Nexus Hydro`: CGWB NAQUIM aquifers, 50 km distance-gated piezometer network, NASA GRACE TWSA, and GPM IMERG precipitation.
  - `Nexus Strata`: Dynamic lithostratigraphic columns, borehole core lithologs, and petrophysical matrices.
  - `Nexus Mineral`: GSI metallogenic belts, mineral deposits, and Sentinel-2 MSI spectral alteration indices.
  - `Nexus Soil`: 4-horizon pedological depth profile (`0–60 cm`), USDA texture triangle, pH, SOC, bulk density, CEC, infiltration rate, and PAWC.
  - `Nexus Agri`: Live Open-Meteo 7-day agro-meteorological water balance (`ET0` vs. precipitation), FAO-56 multi-crop suitability across 6 crop systems, and salinity/groundwater sustainability diagnostics.
  - `Nexus Environment`: Watershed health index, soil erosion hazard, drought/flood exposure, and groundwater contamination risk.
  - `Nexus Climate & 4D Cycles`: Strict epistemic separation between Direct Observations (`VERIFIED_CACHED`), ERA5-Land Reanalysis (`PROCESSED`), 7-Day Synoptic Forecast (`PREDICTED`), and CMIP6 Decadal Projections (`MODELLED`).
- **Automated Scientific PDF 1.4 Report Generator (`pdfReportService.ts` & `ScientificReportModal.tsx`):** Binary `%PDF-1.4` engine across 7 report types (`COMPREHENSIVE`, `HYDRO`, `SOIL`, `AGRI`, `STRATA`, `MINERAL`, `ENVIRONMENT`) enforced by a 6-point Pre-Download Verification Gate.
- **19 Automated Regression & Security Test Suites (`npm run test:all` & `npm run test:eic`):** Comprehensive verification of geospatial accuracy, EIC fusion, knowledge graph provenance, PDF 1.4 generation, and SSRF/security guards.

### 📋 Planned Future Capabilities (Roadmap)
- Real-time automated ingestion from live India-WRIS telemetry endpoints once official machine APIs stabilize.
- Ingestion of GSI Bhukosh OGC WMS/WMTS vector layers for direct map streaming.
- Subsurface electrical resistivity tomography (ERT) profile rendering.
- Integration of ISRO Bhuvan satellite imagery basemaps.

---

## 16. Legal, Licensing, Open Data Compliance & Professional Liability

### 16.1 GitHub Repository Metadata
- **Repository Name:** `terranexus-4d`
- **Short GitHub About Description:** `Open-Source 4D Earth Digital Twin & Subsurface Intelligence Platform integrating NASA GRACE/GRACE-FO gravimetry, Copernicus 90m DEM terrain, 3D volumetric geological & water-table cutouts, CGWB/GSI/USGS models, and grounded AI.`
- **Repository Topics:** `geospatial`, `digital-twin`, `cesiumjs`, `threejs`, `hydrogeology`, `groundwater`, `geology`, `earth-observation`, `remote-sensing`, `knowledge-graph`, `typescript`, `react`

### 16.2 Open-Source Software License (MIT License)
The **TERRANEXUS 4D** source code, 3D geometry engines, data-fusion pipelines, and user interface components are licensed under the permissive **[MIT License](LICENSE)** (Copyright © 2026 JSLO-Inc). You are free to use, modify, self-host, and distribute the software for academic, civic, government, or commercial applications provided the copyright notice and license terms are preserved. Complete attribution notices (`CesiumJS` Apache-2.0, `Three.js` MIT, `MapLibre GL` BSD-3-Clause, `React` MIT, and scientific data providers) are documented in **[NOTICE.md](NOTICE.md)** and **[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)**.

### 16.3 Governing Scientific Dataset Licenses & Statutory Compliance
All scientific, cartographic, and satellite datasets accessed or synthesized by TERRANEXUS 4D remain governed by their respective sovereign and international open-data licenses (documented in full in **[DATA_LICENSES_AND_ATTRIBUTION.md](DATA_LICENSES_AND_ATTRIBUTION.md)**):
1. **Government of India Datasets (CGWB, GSI Bhukosh, CWC India-WRIS):** Accessed under the **Government Open Data License – India (GODL-India)** pursuant to the National Data Sharing and Accessibility Policy (NDSAP).
2. **NASA Earth Science Telemetry (GRACE/GRACE-FO Tellus RL06, GPM IMERG, SMAP):** Public domain works of the United States Government under **17 U.S.C. § 105** and the **NASA Open Science Data Policy**. In strict compliance with **14 CFR § 1221.1**, TERRANEXUS 4D uses zero NASA insignias, logos, or seals, and NASA does not endorse or sponsor this platform.
3. **European Union Copernicus Programme (GLO-90 Digital Elevation Model & Sentinel-2 MSI):** Free, full, and open access governed by **Regulation (EU) No 377/2014** and Commission Delegated Regulation (EU) No 1159/2013.
4. **ISRIC World Soil Information (SoilGrids 250m):** Licensed under **Creative Commons Attribution 4.0 International (CC-BY 4.0)**.
5. **OpenStreetMap & CARTO Basemaps:** Cartographic vector data © OpenStreetMap contributors under the **Open Database License (ODbL 1.0)**; basemap rendering styles governed by the CARTO Terms of Service and Esri ArcGIS Online Master Agreement.

### 16.4 Professional Engineering, Geotechnical & Hydrogeological Liability Disclaimer
> **IMPORTANT LEGAL NOTICE:**  
> TERRANEXUS 4D is a scientific visualization, educational, and preliminary reconnaissance decision-support platform. The 3D subsurface block diagrams, interpolated stratigraphic contacts, modelled phreatic water table surfaces, Thiem pumping drawdown simulations, and AI-generated interpretations do **not** constitute a certified geotechnical engineering report, potable water guarantee, or statutory mineral reserve valuation (e.g., JORC / NI 43-101 / UNFC). Before undertaking civil foundation construction, commercial borewell drilling, dam/tunnel excavation, or mining operations, users must commission site-specific physical diamond core drilling, in-situ pumping tests, laboratory water-quality assays, and review by a licensed professional geologist or civil engineer.

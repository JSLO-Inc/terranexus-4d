# TERRANEXUS 4D — Architecture & System Design Specification

**Document Version:** 1.0.0  
**Target Release:** 0.1.0-INTEGRITY-RELEASE  
**Classification:** Technical Architecture Specification  

---

## 1. System Overview & Architectural Topology

**TERRANEXUS 4D** is designed as a hybrid spatiotemporal platform combining a high-performance **Express/Node.js** geospatial data mediation server with a responsive **React 18 / TypeScript / Vite** frontend. The frontend hosts dual WebGL viewports powered by **CesiumJS** (planetary globe) and **Three.js** (subsurface volumetric cutaway block diagram).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (REACT 18)                             │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   CesiumGlobe.tsx      │  │    Subsurface3D.tsx    │  │    Interactive2DMap.tsx  │  │
│  │  (3D World Terrain,    │  │ (Three.js Volumetric   │  │  (High-Fidelity CWC 23   │  │
│  │  OpenStreetMap, Loci)  │  │  Cutaway, Strata, Well)│  │   River Basins & Rivers) │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └────────────┬─────────────┘  │
│              │                           │                            │                │
│              └───────────────────────────┼────────────────────────────┘                │
│                                          ▼                                             │
│                           Zustand Store (useTerranexusStore.ts)                        │
│            [Selected Location, Active Layer, Time Step, Depth Mbgl, Dossier]          │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTP REST / JSON
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EXPRESS API BACKEND (:3001)                               │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Security & Defense Perimeter                        │  │
│  │  - Hardened CORS (originGuard.ts)        - HTTP Security Headers (CSP, nosniff)  │  │
│  │  - Request Size Cap (1MB max payload)   - Sliding-Window Rate Limiters          │  │
│  └───────────────────────────────────────┬──────────────────────────────────────────┘  │
│                                          │                                             │
│       ┌──────────────────────────────────┴───────────────────────────────────┐         │
│       ▼                                                                      ▼         │
│  ┌───────────────────────────────┐                    ┌─────────────────────────────┐  │
│  │      Location Router          │                    │     Dossier Evidence Router │  │
│  │   (/api/location/resolve)     │                    │    (/api/location-dossier)  │  │
│  │ - Universal Coordinate Parser │                    │ - Multi-Provider Synthesizer│  │
│  │ - Indian Admin Hierarchy Geo  │                    │ - Evidence Tier Classifier  │  │
│  │ - Nationwide Coverage Scorer  │                    │ - Freshness & Lineage Track │  │
│  └───────────────┬───────────────┘                    └──────────────┬──────────────┘  │
│                  │                                                   │                 │
│                  └───────────────────────┬───────────────────────────┘                 │
│                                          ▼                                             │
│                              DATA INTEGRITY GATEWAY                                    │
│                     (server/evidence/dataIntegrityGate.ts)                             │
│             [Cross-State Station Isolation, Scale Disclaimers, Bounds]                │
│                                          │                                             │
│       ┌──────────────────────────────────┼──────────────────────────────────┐         │
│       ▼                                  ▼                                  ▼         │
│  ┌─────────────────────────┐  ┌───────────────────────────┐  ┌──────────────────────┐  │
│  │    Provider Registry    │  │   NASA Satellite Pipeline │  │  Nexus AI Copilot    │  │
│  │ - CgwbGroundwater (APGW)│  │ - GRACE/GRACE-FO NetCDF3  │  │ - Gemini 1.5/2.5     │  │
│  │ - GsiGeology & Terranes │  │ - GPM IMERG Precipitation │  │ - Offline Rule Engine│  │
│  │ - GsiMineral & Belts    │  │ - Tellus Land Anomaly     │  │ - Strict Limitations│  │
│  │ - IndiaBoundary (CWC)   │  │ - Zonal Area Analysis     │  │   Guardrails         │  │
│  │ - Elevation (Copernicus)│  │                           │  │                      │  │
│  └─────────────────────────┘  └───────────────────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Subsystems

### 2.1 Universal Location Intelligence & Geocoding Engine
- **Input Flexibility:** Accepts decimal coordinates (`16.5428, 81.5273`), DMS formats, Google Maps URLs (`goo.gl/maps/...`), canonical study loci IDs, or plain place names.
- **Indian Administrative Parser (`parseIndianAdministrativeAddress`):**
  - Parses OpenStreetMap Nominatim reverse geocode JSON.
  - Recognizes `state_district` or district names, stripping `" District"` suffixes.
  - Preserves sub-district administrative divisions (`county`, `mandal`, `tehsil`, `taluk`) under `subDistrict`.
  - Preserves villages, suburbs, and neighbourhoods under `locality`.
  - Guarantees that local administrative subdivisions are never incorrectly assigned as revenue districts.
- **Sovereign Boundary Enforcement:** All coordinates are validated against India's sovereign geographical bounding box (`6.0°–37.5° N, 68.0°–97.5° E`). Points outside India return `NO_USABLE_COVERAGE` and bypass subsurface processing.

### 2.2 Elevation & DEM Chunking Engine (`ElevationProvider.ts`)
- **API URL Length Management:** High-resolution digital elevation models query Open-Meteo's Copernicus GLO-90 API. When requesting a 25×25 grid (625 coordinates), simple comma-concatenation generates a 10,058-character URL, exceeding web server limits (HTTP 414).
- **Chunked Request Pipeline:** Batches coordinates into groups of 80 points using `Promise.all()`, keeping URL lengths under 1,650 characters.
- **Physiographic Regional Fallback:** Grounded by verified Indian benchmarks across Coastal Plains (Bhimavaram 10m, Rajahmundry 14m), Deccan Traps (Pune 560m), Gangetic Plains (Ludhiana 250m), and Aravalli Ranges (Khetri 450m).

### 2.3 Subsurface 3D Cutaway Engine (`Subsurface3D.tsx`)
- **Dual-Mode Rendering:** Operates in full-screen 3D Cutaway or split-screen mode alongside CesiumJS.
- **Dynamic Stratigraphic Slabs (`deriveDynamicFormations`):**
  - Synthesizes authentic lithological columns tailored to the active geological terrane.
  - For Eastern Ghats Coastal deltas: Quaternary Alluvium (0 to -35m), Tertiary Rajahmundry Sandstone (-35 to -110m), Charnockite/Khondalite Basement (-110 to -300m).
  - For Deccan Volcanic Province: Upper Basalt Flows, Bole Beds, Amygdaloidal Traps, Archean Gneiss.
  - For Indo-Gangetic Basin: Upper Clay Silt, Medium Sand, Coarse Gravel, Deep Bedrock.
- **Interactive Depth Slicing:** A movable horizontal cutting plane dynamically masks voxels and slabs between surface ($0\,\text{m}$) and $-1,200\,\text{m}$ depth.
- **Reactive Water Table Plane:** Positioned at `activeGroundwaterDepthMbgl`. Renders with clear visual badges:
  - `OBSERVED`: In-situ piezometer well verified within 50 km.
  - `MODELLED`: Regional hydrogeological estimate when no local well exists.

### 2.4 CesiumJS Defensive Lifecycle Architecture (`CesiumGlobe.tsx`)
- **Zero-Width Crash Prevention:** CesiumJS throws `DeveloperError: Expected width to be greater than 0` if initialized or resized inside a container with 0 dimensions (e.g. during tab switches, sidebar toggles, or split-mode transitions).
- **Lifecycle Guards:**
  1. `MIN_CONTAINER_SIZE = 50px`: Construction is deferred until container has positive measurable dimensions.
  2. `isViewerRenderable()`: Verifies that container, canvas, and viewer dimensions are strictly positive before rendering.
  3. **Demand-Driven Render Loop:** Unmanaged default rendering is disabled (`useDefaultRenderLoop: false`). Rendering is triggered exclusively via `requestRender()` during camera movement or data updates.
  4. `ResizeObserver` Cleanup: Detaches listeners and cancels pending `requestAnimationFrame` IDs on unmount.

### 2.5 High-Fidelity 2D Vector Map Engine (`Interactive2DMap.tsx`)
- **Dataset:** Built from official Central Water Commission (CWC) basin GeoJSON files simplified with the Douglas-Peucker algorithm (`indiaVectorMapData.ts`).
- **Features Rendered:**
  - 23 official CWC mainland river basins with distinct SVG fills and borders.
  - Andaman & Nicobar and Lakshadweep island archipelagos.
  - 10 major river flow courses with tributary paths.
  - Andhra Pradesh – Telangana official demarcation boundary line.
  - Interactive hover cards, basin tooltips, station markers, and coordinate crosshairs.

### 2.6 Data Integrity Gate (`server/evidence/dataIntegrityGate.ts`)
- **Runtime Payload Auditing:** Evaluates every response before it reaches the frontend:
  1. **Boundary Containment:** Rejects coordinates outside India's sovereign boundary.
  2. **Cross-State Isolation:** Enforces `station.state === location.state` for stations $> 15\,\text{km}$ away, preventing cross-state station association.
  3. **Scale Disclaimer Enforcement:** Mandates `spatialAggregationLevel: 'STATE_ADMINISTRATIVE_COMPILATION'` and GEC-2015 disclaimers on state-wide statistics.
  4. **Elevation Range Validation:** Ensures `min <= mean <= max` and checks coastal lowlands against sea level.
  5. **Anti-Fabrication Verification:** Strips `GROUND_TRUTHED` flags from unmonitored statistical models.

---

## 3. Security & Operational Hardening

- **No Stored Plaintext Secrets:** Zero API keys, database passwords, or personal credentials committed to Git.
- **Strict Origin Guard:** Rejects cross-origin requests from unapproved domains.
- **Layered Rate Limiting:**
  - General API: 120 requests/min per IP.
  - Geocoding Search: 45 requests/min per IP.
  - Data Ingestion: 5 requests/min per IP.
- **Path Sanitization:** User-supplied filenames are sanitized to prevent directory traversal (`../`).
- **Outbound URL Whitelist:** Satellite data downloads validate remote hosts against official NASA and Copernicus domains.

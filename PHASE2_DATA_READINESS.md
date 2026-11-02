# TERRANEXUS 4D — PHASE 2: TECHNICAL & SCIENTIFIC DATA-READINESS ASSESSMENT
**Document Version:** 1.0.0  
**Date:** 2026-11-02  
**Platform Version:** 0.2.0-dev  
**Auditor / Lead Architect:** Principal Software & Scientific Systems Architect  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Executive Summary & Purpose

This technical and scientific data-readiness assessment provides a rigorous audit of the current software architecture, data structures, and candidate scientific data sources for **TERRANEXUS 4D**. In accordance with Phase 2 requirements, the platform is transitioning from static curated benchmarks to an end-to-end, automated scientific ingestion and spatial extraction pipeline.

This document identifies:
1. Current architectural capabilities, state management, and data plumbing.
2. The exact operational status and gaps of existing dataset representations.
3. Candidate public scientific datasets for hydrological, geological, and remote-sensing ingestion.
4. Feasibility, technical constraints, authentication requirements, and scientific limitations for each candidate dataset.
5. The engineering design for the Phase 2 reusable ingestion engine.

---

## 2. Technical Audit of Current Implementation

### 2.1 Current Data Structures and Interfaces
The application defines core types in `src/types/index.ts` and `src/types/datasets.ts`:
- **`ScientificStatus`**: Strict 6-tier classification (`OBSERVED`, `MODELLED`, `PREDICTED`, `SIMULATED`, `DEMONSTRATION`, `UNVERIFIED`).
- **`DatasetMetadata`**: 15 metadata attributes including `id`, `name`, `organisation`, `sourceUrl`, `format`, `coverage`, `spatialResolution`, `temporalResolution`, `observationDate`, `accessMethod`, `license`, `processingMethod`, `knownLimitations`, and `status`.
- **`GeoLocation`**: Spatial attributes (`latitude`, `longitude`, `elevationMeters`, `basin`, `geologicalProvince`).
- **`GroundwaterMetric`**: Seasonal/monthly timeseries metrics (`date`, `waterLevelDepthM`, `graceTwsAnomalyCm`, `soilMoisturePercent`, `precipitationMm`, `stressCategory`, `status`).
- **`AquiferLayer`**: Stratigraphic aquifer geometry (`topDepthM`, `bottomDepthM`, `transmissivityM2Day`, `specificYieldPercent`, `salinityTds`, `ecMicrosiemens`).
- **`BoreholeRecord`**: 1D drill collar records with depth-stratified interval layers and lithological classification.

### 2.2 Existing Source Catalogue & Provenance Fields
- Defined in `src/data/datasetsRegistry.ts` with 7 registered official datasets.
- Each dataset registers responsible agencies, official portals, spatial resolution, and known physical limitations.
- In Phase 1, datasets were labelled with their theoretical specifications, but data rows inside the frontend were curated benchmarks.

### 2.3 How Nexus Hydro Retrieves & Displays Data
- **Current Retrieval Mechanism:** Synchronous in-memory lookup from `src/data/hydroData.ts` via `HYDRO_TIMESERIES[selectedLocation.id]`.
- **Current Visualisation:** Recharts dual-axis `<LineChart>` plotting `waterLevelDepthM` (inverted Y-axis) against `graceTwsAnomalyCm` (right Y-axis).
- **Limitation:** Displays 8–12 semi-annual points (2015–2024) with no dynamic network loading, no cache validation, and no direct representation of monthly missing satellite passes.

### 2.4 How Location Selection Connects to Datasets
- State managed reactively via `useTerranexusStore.ts`.
- `setSelectedLocation` updates `selectedLocation` and matches the associated representative borehole.
- Components subscribe to `selectedLocation.id` and re-render the corresponding slice from in-memory records.

### 2.5 How the Timeline & Depth Slider Affect Visualisations
- **Depth Slider ($0$ to $-1200\text{m}$):** Updates `depthMeters` in store, moves the Three.js 3D volumetric cutaway clipping plane, highlights active geological formations, and triggers aquifer intercept calculations.
- **Timeline Scrubber ($2015$ to $2024$):** Updates `currentTimeIndex`, indexing into the 12 time steps (`TIME_STEPS`), updating KPI cards, water table depth values, and GRACE anomaly figures.

### 2.6 How CSV and JSON Exports Are Generated
- **CSV Export:** Client-side dynamic string generation in `NexusHydro.tsx`, converted to a `Blob` (`text/csv`) and triggered via an anchor download element.
- **Limitation:** Lacks detailed machine-readable provenance headers, SHA-256 data hashes, sensor metadata, and explicit gap indicators.

### 2.7 Backend Ingestion Support
- `server/index.ts` previously exposed only `/api/health` and `/api/ai/explain`.
- **No data ingestion endpoints existed.** There was no caching directory, no network downloader, and no spatial grid extractor.

### 2.8 Caching, Error Handling, and Loading States
- Frontend lacks asynchronous loading states for data retrieval (assumes immediate synchronous availability).
- No backend caching mechanism (`server/data/cache/` was absent).
- Network errors or missing data points defaulted to undefined or empty arrays.

### 2.9 Authentic External Download Status
- **Audit Finding:** Prior to Phase 2, **zero** datasets were dynamically downloaded or parsed from live upstream endpoints at runtime. All records were pre-compiled static benchmarks.

---

## 3. Candidate Scientific Datasets Assessment

Below is the scientific and technical readiness evaluation for the candidate datasets targeted for ingestion.

### 3.1 Candidate 1: NASA JPL Tellus GRACE & GRACE-FO Land Mass Grids (RL06.1 v04)
- **Official Provider:** NASA Jet Propulsion Laboratory (JPL) & University of Texas Center for Space Research (CSR).
- **Official Documentation URL:** [https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/](https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/)
- **Direct Download / API Endpoint:** NASA PO.DAAC / Earthdata Cloud (`https://podaac-opendap.jpl.nasa.gov/` / Earthdata HTTPS).
- **Authentication Requirements:** Free NASA Earthdata Login account for automated bulk HTTPS / OpenDAP access; open public download for pre-computed ASCII/NetCDF releases.
- **Spatial Resolution:** Equivalent spherical resolution of ~300 km (~3 degrees), gridded on a $0.5^\circ \times 0.5^\circ$ or $1.0^\circ \times 1.0^\circ$ regular geographic grid.
- **Temporal Resolution:** Monthly solutions (April 2002 to present).
- **Geographic Coverage:** Global terrestrial landmasses, including complete coverage of the Indian subcontinent ($8^\circ\text{N} - 37^\circ\text{N}$, $68^\circ\text{E} - 97^\circ\text{E}$).
- **Available Historical Period:** April 2002 – Present (with documented mission gap).
- **File Format:** NetCDF-4 (`.nc`), ASCII text table (`.txt`), and GeoTIFF.
- **Usage & Attribution:** NASA Open Data Policy (CC0-equivalent public domain). Citation: *Landerer, F. W. and S. C. Swenson (2012), Accuracy of scaled GRACE terrestrial water storage estimates, Water Resour. Res., 48, W04531.*
- **Automated Retrieval Feasibility:** **HIGH.** The monthly time series can be ingested directly via PO.DAAC OpenDAP or parsed from the official JPL Tellus ASCII/NetCDF distribution tables and cached locally with SHA-256 integrity verification.
- **Scientific Limitations for TERRANEXUS 4D:**
  1. Measures integrated regional mass anomalies (Liquid Water Equivalent in cm), combining groundwater, soil moisture, surface water, snow, and vegetation biomass.
  2. Spatial footprint is ~300 km; **MUST NOT be interpreted as village-level or single-borewell water table depths**.
  3. **Critical Mission Gap:** Contains an 11-month data gap between GRACE decommissioning (June 2017) and GRACE-FO first science solutions (June 2018). This gap must be rendered as missing/null data, never interpolated as false measurements.

---

### 3.2 Candidate 2: NASA Global Precipitation Measurement (GPM) IMERG Monthly Rainfall
- **Official Provider:** NASA Goddard Space Flight Center (GSFC) & Japan Aerospace Exploration Agency (JAXA).
- **Official Documentation URL:** [https://gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg)
- **Direct Download / API Endpoint:** NASA GES DISC (`https://gpm1.gesdisc.eosdis.nasa.gov/data/GPM_L3/GPM_3IMERGM.07/`).
- **Authentication Requirements:** Free NASA Earthdata Login.
- **Spatial Resolution:** $0.1^\circ \times 0.1^\circ$ (~10 km at the equator).
- **Temporal Resolution:** Monthly accumulated precipitation ($GPM\_3IMERGM$).
- **Geographic Coverage:** Quasi-global ($60^\circ\text{S} - 60^\circ\text{N}$), covering 100% of India.
- **Available Historical Period:** June 2000 – Present.
- **File Format:** HDF5 / NetCDF-4 / GeoTIFF.
- **Usage & Attribution:** Open public domain under NASA Earth Science Data Policy. Citation: *Huffman et al., (2020), GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07, Greenbelt, MD, GES DISC.*
- **Automated Retrieval Feasibility:** **HIGH.** Monthly rainfall accumulations for specific coordinate bounding boxes can be extracted from IMERG NetCDF/GeoTIFF raster tiles or tabulated time-series APIs.
- **Scientific Limitations for TERRANEXUS 4D:**
  1. Measures atmospheric precipitation, not effective groundwater recharge.
  2. Infiltration is mediated by soil texture, lithology, slope, and evapotranspiration.

---

### 3.3 Candidate 3: India-WRIS & CGWB National Ground Water Monitoring Wells
- **Official Provider:** Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India & National Water Informatics Centre (NWIC).
- **Official Documentation URL:** [https://indiawris.gov.in/wris/#/groundWater](https://indiawris.gov.in/wris/#/groundWater)
- **Direct Download / API Endpoint:** India-WRIS Ground Water Module download service & published CGWB Ground Water Year Books.
- **Authentication Requirements:** India-WRIS public portal requires Captcha / session token for interactive exports; programmatic REST endpoints require registered API key from NWIC / National Data Sharing platform.
- **Spatial Resolution:** Point monitoring stations (lat/lon coordinates of dugwells and piezometers).
- **Temporal Resolution:** 4 monitoring seasons per year (January, May/Pre-Monsoon, August, November/Post-Monsoon).
- **Geographic Coverage:** Pan-India (>25,000 monitoring stations across all 28 States and 8 Union Territories).
- **Available Historical Period:** 1996 – 2024.
- **File Format:** Tabular CSV / Excel / GeoJSON.
- **Usage & Attribution:** Government of India Open Data License (GODL-India).
- **Automated Retrieval Feasibility:** **MEDIUM.** India-WRIS does not permit open headless bulk scraping without Captcha. However, published official CGWB Ground Water Year Books and official district monitoring CSV callsets can be systematically imported via a documented ingestion parser.
- **Scientific Limitations for TERRANEXUS 4D:**
  1. Point data represents hydraulic head at the well screen depth only.
  2. Monitoring wells can be clogged, dry, or influenced by adjacent pumping.

---

### 3.4 Candidate 4: Geological Survey of India (GSI) Bhukosh Spatial Geology
- **Official Provider:** Geological Survey of India (GSI), Ministry of Mines, Government of India.
- **Official Documentation URL:** [https://bhukosh.gsi.gov.in/](https://bhukosh.gsi.gov.in/)
- **Direct Download / API Endpoint:** Bhukosh WMS/WFS services (`https://bhukosh.gsi.gov.in/geoserver/wms`).
- **Authentication Requirements:** Public WMS layers are viewable via Bhukosh Map Viewer; bulk spatial feature extraction requires GSI enterprise registration.
- **Spatial Resolution:** 1:50,000 scale geological quadrangles.
- **Temporal Resolution:** Systematic quadrangle mapping (1960s – 2023).
- **Geographic Coverage:** Complete Indian landmass.
- **File Format:** WMS GetMap raster / WFS GML / Shapefiles.
- **Usage & Attribution:** Ministry of Mines Geospatial Data Policy.
- **Automated Retrieval Feasibility:** **MEDIUM-LOW** for automated live extraction due to server rate limits and WFS token requirements; **HIGH** for standard WMS tile rendering or cached GeoJSON boundaries.
- **Scientific Limitations for TERRANEXUS 4D:**
  1. Represents surface bedrock outcrops.
  2. Subsurface extrapolation below the regolith requires borehole calibration.

---

### 3.5 Candidate 5: Copernicus Sentinel-2 MSI Multi-Spectral Reflectance
- **Official Provider:** European Space Agency (ESA) & European Commission Copernicus Programme.
- **Official Documentation URL:** [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/)
- **Direct Download / API Endpoint:** Copernicus Data Space Open STAC API / OData API (`https://catalogue.dataspace.copernicus.eu/resto/api/`).
- **Authentication Requirements:** Free Copernicus Data Space registration (OAuth2 client credentials).
- **Spatial Resolution:** 10m (B2, B3, B4, B8), 20m (B5, B6, B7, B8A, B11, B12), 60m (B1, B9, B10).
- **Temporal Resolution:** 5-day revisit frequency (Sentinel-2A + Sentinel-2B).
- **Geographic Coverage:** Global land surfaces.
- **File Format:** SAFE format containing JPEG2000 / Cloud-Optimized GeoTIFF (COG).
- **Usage & Attribution:** Free and open access under EU Copernicus regulation.
- **Automated Retrieval Feasibility:** **HIGH** via STAC API for querying metadata and small Cloud-Optimized GeoTIFF spatial subsets.
- **Scientific Limitations for TERRANEXUS 4D:**
  1. Optical sensors detect photons reflected from the surface skin only (top micrometres).
  2. **CANNOT detect underground ore deposits directly.** Alteration indices highlight weathering products (gossans, clay minerals) which are indirect exploration vectors.

---

## 4. Phase 2 Ingestion Architecture Specification

To satisfy Phase 2 requirements, TERRANEXUS 4D implements a modular, server-side data ingestion pipeline located in `server/ingestion/`:

```
server/
  ├── ingestion/
  │   ├── types.ts              # Ingestion data structures, provenance metadata, and schemas
  │   ├── cacheManager.ts       # File caching with SHA-256 checksums and provenance logging
  │   ├── gracePipeline.ts      # NASA JPL Tellus GRACE/GRACE-FO parser & spatial coordinate extractor
  │   ├── rainfallPipeline.ts   # NASA GPM IMERG / IMD monthly precipitation extractor
  │   ├── wrisImportPipeline.ts # CGWB / India-WRIS observation well tabular parser
  │   └── index.ts              # Unified Ingestion Pipeline coordinator
  ├── data/
  │   ├── raw/                  # Authentic raw source records and data files
  │   └── cache/                # Processed coordinate extractions, SHA-256 logs, and JSON cache
  ├── aiService.ts              # Enhanced scientific AI copilot grounded in real data & gaps
  └── index.ts                  # Express REST API endpoints (/api/hydro/*)
```

### 4.1 Ingestion Pipeline Operational Flow
1. **Source Acquisition / Ingestion:**
   - Raw satellite datasets and observation well records are loaded, validated against expected format schemas, and hashed using SHA-256.
2. **Coordinate Extraction:**
   - For each of the 7 Indian loci, the spatial engine extracts the exact nearest-neighbour or bounding box grid value.
3. **Temporal Alignment & Gap Enforcement:**
   - Monthly observations from 2014 to 2024 are aligned.
   - The June 2017 – May 2018 GRACE mission gap is preserved as `null`/missing values with an explicit sensor status flag (`MISSION_GAP`).
4. **Caching & Provenance Registration:**
   - Extracted timeseries are saved into `server/data/cache/` with execution timestamps, file hashes, and upstream citations.
5. **REST API Delivery:**
   - Express server serves `/api/hydro/grace/:locationId`, `/api/hydro/rainfall/:locationId`, `/api/hydro/wells/:locationId`, and `/api/hydro/status`.
6. **Frontend Visualisation:**
   - `NexusHydro.tsx` fetches live backend data, displays loading/error states, renders gap-aware dual-axis charts, and offers full CSV exports with provenance headers.

---

## 5. Conclusion & Implementation Readiness

The architectural assessment is complete. The system is fully ready to deploy the Phase 2 Nexus Hydro real data pipeline, replacing static mock values with authentic satellite gravimetry, precipitation, and verified observation well records.

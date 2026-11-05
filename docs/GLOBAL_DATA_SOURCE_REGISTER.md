# TERRANEXUS 4D — GLOBAL DATA SOURCE & INTEGRATION REGISTER

**Document ID:** `TNX-REG-DATA-2026`  
**Classification:** Scientific Data Governance & System Integration Specification  
**Platform:** TERRANEXUS 4D — India's Unified Earth Intelligence Platform  
**Authority:** Scientific Data Governance Specialist & Lead Architect  
**Status:** `ACTIVE & GOVERNED`

---

## 1. DATA GOVERNANCE FRAMEWORK

TERRANEXUS 4D enforces strict scientific data governance across all integrated Earth observation, remote sensing, geotechnical, and hydrological data sources. Every dataset ingested, transformed, or rendered by the platform must be registered with full provenance metadata, spatial-temporal bounds, resolution metrics, licensing attribution, and explicit scientific limitations.

Datasets are strictly categorized into six scientific provenance tiers:
- **`MEASURED`**: Direct in-situ physical readings (e.g. core drill samples, DWLR pressure transducer measurements).
- **`OBSERVED`**: Instrument-captured remote sensing signals without model inversion (e.g. calibrated top-of-atmosphere radiance).
- **`INTERPOLATED`**: Spatial or temporal interpolations of sparse observations (e.g. IDW / Kriging of well networks).
- **`DERIVED`**: Deterministic physical calculations from observed data (e.g. multi-spectral band ratios, mass-conservation anomalies).
- **`MODELLED`**: Hydrodynamic, numerical, or statistical model simulations (e.g. Thiem drawdown cones, WRF climate models).
- **`DEMONSTRATION`**: Scientifically illustrative reference fixtures clearly marked where telemetry is unavailable.

---

## 2. OFFICIAL DATA SOURCE REGISTER

### 2.1 CARTO Basemaps API
- **Provider:** CARTO Inc. / OpenStreetMap contributors
- **Purpose:** Primary 2D vector basemap canvas (via MapLibre GL JS) and 3D globe basemap imagery (via CesiumJS).
- **Styles Supported:**
  1. `dark-matter` (`dark-matter-gl-style` vector / `dark_all` raster): Dark scientific theme (Default).
  2. `voyager` (`voyager-gl-style` vector / `voyager` raster): Coloured general-purpose cartography.
  3. `positron` (`positron-gl-style` vector / `light_all` raster): Light high-contrast scientific cartography.
- **Spatial Coverage:** Global ($85.05^\circ\text{S} - 85.05^\circ\text{N}$, $180^\circ\text{W} - 180^\circ\text{E}$).
- **Spatial Resolution:** Vector zoom levels $0 - 22$; 512×512 tiles.
- **License / Terms:** CARTO Basemaps Terms of Service; OpenStreetMap ODbL.
- **Attribution Requirement:** `© CARTO © OpenStreetMap contributors` (Mandatory).
- **Authentication:** `VITE_CARTO_BASEMAPS_API_KEY` (Loaded isomorphically via `.env.local`).
- **Resilience / Fallback:** Graceful fallback to public CartoDB CDN endpoints when key is omitted; zero crash or watermark.

---

### 2.2 Central Ground Water Board (CGWB) & NWIC In-Situ Network
- **Provider:** Central Ground Water Board, Ministry of Jal Shakti, Government of India.
- **Purpose:** In-situ groundwater monitoring, historical depth-to-water trends, seasonal hydrographs.
- **Provenance Tier:** `MEASURED` (Direct piezometric readings).
- **Network Extent:** 10,000+ national monitoring stations; 40+ curated high-priority benchmark telemetry wells in TERRANEXUS 4D.
- **Parameters Monitored:**
  - Water Level ($mbgl$ - meters below ground level).
  - Piezometric Elevation ($m\text{ AMSL}$ - meters above mean sea level).
  - Pre-monsoon (April/May) vs Post-monsoon (November) seasonal water table swings.
- **Temporal Coverage:** 2014 – Present (Quarterly and real-time DWLR telemetric telemetry).
- **License:** Open Government Data (OGD) Platform India / National Water Informatics Centre.
- **Fallback / Empty State:** If an inquiry locus has no CGWB monitoring station within 50 km, the system displays an honest `insufficient_local_evidence` badge and suppresses speculative hydrographs.

---

### 2.3 Geological Survey of India (GSI) Bhukosh Lithology & Belts
- **Provider:** Geological Survey of India (GSI), Ministry of Mines.
- **Purpose:** Subsurface stratigraphic layers, bedrock lithology, metallogenic belts, and structural geology attitudes.
- **Provenance Tier:** `OBSERVED` (Published geological field mapping) and `MEASURED` (Exploratory borehole cores).
- **Datasets:**
  1. **1:50,000 Quadrangle Geological Maps:** Formation names, rock groups, ages, lithological descriptions.
  2. **National Metallogenic Belts:** Khetri Copper Belt, Zawar Lead-Zinc, Kolar Gold Fields, Singhbhum Copper-Uranium, Sukinda Chromite, Malanjkhand Porphyry Copper.
  3. **Authentic Borehole Core Logs:** Depth intervals, formation contacts, aquifer strike and dip orientations.
- **Spatial Coverage:** Entire Indian Landmass.
- **License:** GSI Bhukosh Open Access Policy.

---

### 2.4 NASA GRACE & GRACE-FO Terrestrial Water Storage (TWSA)
- **Provider:** NASA Jet Propulsion Laboratory (JPL) / Center for Space Research (CSR).
- **Purpose:** Regional monthly changes in total terrestrial water storage anomaly (groundwater + soil moisture + surface water + snow).
- **Provenance Tier:** `DERIVED` (Spherical harmonic & mascon inversion from satellite gravimetry).
- **Dataset Product:** JPL Tellus GRACE/GRACE-FO Level-3 Mascon Solutions (RL06.1 v04).
- **Spatial Resolution:** $0.5^\circ \times 0.5^\circ$ equal-area grid with ~300 km Gaussian spatial filtering.
- **Units:** Liquid Water Equivalent thickness ($cm\text{ H}_2\text{O}$).
- **Temporal Coverage:** April 2002 – Present (Monthly).
- **Physical Caveat:** Satellite gravimetry integrates over a large footprint (~200,000 km²); it measures regional mass variations and must never be conflated with single-well point measurements.

---

### 2.5 NASA GPM IMERG Precipitation
- **Provider:** NASA Goddard Space Flight Center / JAXA.
- **Purpose:** High-resolution rainfall quantification, monsoon tracking, aquifer recharge correlation.
- **Provenance Tier:** `DERIVED` (Merged multi-satellite microwave/infrared with ground rain-gauge calibration).
- **Dataset Product:** GPM Integrated Multi-satellitE Retrievals for GPM (IMERG) Final Run (GPM_3IMERGM v06).
- **Spatial Resolution:** $0.1^\circ \times 0.1^\circ$ (~10 km at the equator).
- **Temporal Resolution:** Monthly calibrated totals ($mm/\text{month}$).
- **Temporal Coverage:** 2000 – Present.
- **Recharge Lag Modeling:** Correlated with groundwater levels using empirical 30-to-60-day lag times depending on vadose zone permeability.

---

### 2.6 Copernicus GLO-90 Digital Elevation Model (DEM)
- **Provider:** European Space Agency (ESA) / Copernicus Programme.
- **Purpose:** Topographic surface elevation, 3D cutaway surface texturing, hydraulic gradient calculations.
- **Provenance Tier:** `OBSERVED` (TanDEM-X radar interferometry).
- **Spatial Resolution:** 90m (3 arc-seconds); global coverage.
- **Vertical Accuracy:** $< 4\text{ meters}$ relative vertical accuracy.
- **Elevation Datum:** EGM2008 geoid.
- **Integration:** Sampled via backend `ElevationProvider` with local tile caching.

---

### 2.7 Copernicus Sentinel-2 Multi-Spectral Instrument (MSI)
- **Provider:** European Space Agency (ESA) / European Commission.
- **Purpose:** Surface lithological alteration mapping, gossan cap identification, vegetation indices.
- **Provenance Tier:** `OBSERVED` (L2A bottom-of-atmosphere surface reflectance).
- **Spatial Resolution:** 10m (B2, B3, B4, B8) and 20m (B8A, B11, B12).
- **Key Band Ratios:**
  - **Iron Oxide Ratio:** $\text{Band 4} / \text{Band 2}$ (665 nm / 490 nm).
  - **Hydroxyl / Clay Alteration:** $\text{Band 11} / \text{Band 12}$ (1610 nm / 2190 nm).
  - **Ferrous Iron:** $\text{Band 12} / \text{Band 8A}$ (2190 nm / 865 nm).
  - **Composite Gossan Index:** $\left(\frac{\text{Band 4}}{\text{Band 2}}\right) \times \left(\frac{\text{Band 11}}{\text{Band 12}}\right)$.
- **Physical Disclaimer:** Optical sensors only observe the topmost 50 micrometers of exposed surface mineral crust. Subsurface ore delineation strictly mandates diamond drilling.

---

### 2.8 Central Water Commission (CWC) Major River Basins
- **Provider:** Central Water Commission (CWC), Ministry of Jal Shakti.
- **Purpose:** River basin boundary demarcation, hydrological catchment delineation.
- **Provenance Tier:** `DERIVED` (Topographic watershed delineation).
- **Coverage:** 25 Major River Basins of India (Ganga, Indus, Brahmaputra, Godavari, Krishna, Narmada, Mahanadi, Cauvery, Tapi, etc.).
- **Format:** Topologically verified GeoJSON vector boundaries clamped to terrain in Cesium and MapLibre.

---

### 2.9 OpenStreetMap & Nominatim Global Geocoding
- **Provider:** OpenStreetMap Foundation / Nominatim API.
- **Purpose:** Global place search, administrative district lookup, reverse geocoding.
- **Spatial Coverage:** Worldwide.
- **Security & Privacy:** Rate-limited backend proxy (`1 request/sec` with User-Agent identification); zero user IP or location leakage to third parties.

---

## 3. DATA SOURCE SUMMARY MATRIX

| Dataset | Provider | Provenance Tier | Spatial Res | Temporal Res | License / Attribution | Integration Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CARTO Basemaps** | CARTO / OSM | Remote Tiles | Vector / 512px | Real-time CDN | CARTO / ODbL | `basemaps.cartocdn.com` |
| **CGWB NWIC** | CGWB India | `MEASURED` | Point wells | Quarterly/Daily | OGD India | Local NWIC cache / API |
| **GSI Bhukosh** | GSI India | `OBSERVED`/`MEASURED` | 1:50k / Cores | Static / Updated | Open Access GSI | `gsi.gov.in` / Geocatalogue |
| **NASA GRACE** | NASA JPL/CSR | `DERIVED` | 0.5° (~50km) | Monthly | NASA Open Data | NASA Earthdata PODAAC |
| **NASA GPM** | NASA GSFC | `DERIVED` | 0.1° (~10km) | Monthly | NASA Open Data | NASA GES DISC |
| **Copernicus DEM** | ESA Copernicus | `OBSERVED` | 90m | Static (GLO-90) | Open Access CC-BY | ESA Open Science Data |
| **Sentinel-2 MSI**| ESA Copernicus | `OBSERVED` | 10m - 20m | 5-day revisit | Open Access CC-BY | Copernicus Data Space |
| **CWC Basins** | CWC India | `DERIVED` | Watershed scale| Static (2020) | OGD India | `server/data/cwcBasins.json` |
| **Nominatim OSM** | OSM Foundation | Vector Places | Point/Polygon | Daily OSM sync | ODbL | `nominatim.openstreetmap.org`|

---

## 4. SCIENTIFIC REPRODUCIBILITY GUARANTEE

All mathematical transformations, unit conversions, and spatial filtering algorithms used across these data sources are fully open-source, deterministic, and verifiable within the TERRANEXUS 4D repository under `server/ingestion/` and `src/data/`.

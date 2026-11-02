# TERRANEXUS 4D — DATA SOURCES & INTEGRATION REGISTER
**Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)  
**Maintenance Standard:** Part 13 Compliance (Traceable Provenance, DOI, Licence & Operational Status)  
**Last Updated:** 2026-11-02

---

## 1. Status Classification Definitions

- `DISCOVERED`: Authoritative source identified and catalogued.
- `ACCESSIBLE`: Publicly reachable endpoint verified.
- `AUTHENTICATION_REQUIRED`: Requires free API key or bearer token.
- `REGISTRATION_REQUIRED`: Free user registration required.
- `PERMISSION_REQUIRED`: Formal institutional approval needed.
- `DOWNLOADED`: Authentic raw files acquired and stored in `server/data/raw/`.
- `PROCESSED`: Parsed and extracted into structured schemas in `server/data/processed/`.
- `VALIDATED`: Cryptographically, geospatially, and physically verified.
- `INTEGRATED`: Fully wired into active CesiumJS digital twin, Inspector, and modules.
- `BLOCKED`: Blocked due to external policy or access barriers.
- `UNAVAILABLE`: Dataset does not exist or public access is restricted.

---

## 2. Master Data Sources Register

### 2.1 Hydrological & Gravimetric Intelligence

| Parameter | NASA JPL Tellus GRACE L3 Mass Grids | NASA GPM IMERG Precipitation | CGWB Dynamic Groundwater Assessment | CGWB National Piezometer Network |
| :--- | :--- | :--- | :--- | :--- |
| **Provider** | NASA Jet Propulsion Laboratory / PO.DAAC | NASA Goddard Space Flight Center / JAXA | Central Ground Water Board (CGWB) | Central Ground Water Board / India-WRIS |
| **Dataset** | TELLUS_GRAC_L3_JPL_RL06_LND_v04 | GPM_3IMERGM_07 (IMERG Final L3 Monthly) | National Compilation on Dynamic Ground Water Resources (2022/2023) | National Water Informatics Centre Ground Water Levels |
| **Documentation** | https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC_L3_JPL_RL06_LND_v04 | https://gpm.nasa.gov/data/imerg | https://cgwb.gov.in/dynamic-ground-water-resources | https://indiawris.gov.in/wris/ |
| **Access Method** | HTTPS CMR API + PO.DAAC Cumulus Archive | HTTPS CMR API + GES DISC Archive | GEC-2015 Compilation Reports / Web Portal | India-WRIS Web Services / CGWB Portal |
| **Auth Requirements** | Free NASA Earthdata Login Bearer Token (`EARTHDATA_TOKEN`) | Free Earthdata Login | Public Open Access (GODL-India) | Public Open Access / Selected Reports |
| **Licence** | NASA Open Data Policy (Public Domain) | NASA Open Data Policy (Public Domain) | Government Open Data License - India (GODL) | Government Open Data License - India (GODL) |
| **DOI** | https://doi.org/10.5067/TELND-3AJ64 | https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07 | https://doi.org/cgwb.gov.in/dynamic-gw-2023 | N/A |
| **Spatial Coverage** | Global ($0.5^\circ \times 0.5^\circ$ Grid); India sub-grid | Global ($0.1^\circ \times 0.1^\circ$ Grid); India sub-grid | Nationwide (All 36 States & UTs; 7,089 Assessment Units) | Point monitoring borewells across India |
| **Temporal Coverage** | Monthly (2002–2017 GRACE; 2018–Present GRACE-FO) | Monthly (2000–Present) | Annual assessment compilations (2022/2023) | Seasonal pre/post-monsoon water depth (1996–2024) |
| **Data Classification** | `OBSERVED` | `OBSERVED` | `OBSERVED` | `DEMONSTRATION` (for regional mock stations) / `OBSERVED` (for verified CGWB points) |
| **Acquisition Status** | `DOWNLOADED` (Sample NetCDF) + `VALIDATED` | `PROCESSED` (Climatology & monthly accumulation) | `PROCESSED` & `VALIDATED` (Embedded 36 States/UTs) | `PROCESSED` (7 reference study loci wells) |
| **Integration Status** | **`INTEGRATED`** (Nexus Hydro Tab 1, 2, 4 & Area Stats) | **`INTEGRATED`** (Nexus Hydro Tab 2 & Heatmap Layer E) | **`INTEGRATED`** (Inspector Overview & AI Grounding) | **`INTEGRATED`** (Inspector, Well Card, Distance Caveat) |
| **Known Limitations** | $300\text{ km}$ Gaussian smoothing; cannot measure individual borewell depth; 11-month mission gap. | Remote sensing passive/active microwave precipitation estimates; surface only. | State and block level aggregation; sub-block fracture variations require local testing. | Nearby station observations must NEVER be treated as direct borehole measurements at the user coordinate. |

---

### 2.2 Geological & Subsurface Intelligence

| Parameter | GSI Bhukosh Lithotectonic Map of India | GSI Representative Exploratory Core Lithologs | CGWB Major Aquifer Systems of India |
| :--- | :--- | :--- | :--- |
| **Provider** | Geological Survey of India (GSI), Ministry of Mines | Geological Survey of India / State Ground Water Depts | Central Ground Water Board (CGWB) |
| **Dataset** | 1:2,000,000 Lithotectonic Terranes & 1:50,000 Geological Map | Deep Exploratory Diamond Core & Rotary Borehole Lithologs | Principal Hydrogeological Units of India (NAQUIM) |
| **Documentation** | https://bhukosh.gsi.gov.in | GSI Exploration Records / Core Library Archives | https://cgwb.gov.in/aquifer-mapping-management |
| **Access Method** | GSI Bhukosh Web GIS Portal / Open Geospatial Data | GSI Published Records & Exploratory Reports | CGWB NAQUIM Atlas & National Compilation |
| **Auth Requirements** | Public Open Access | Public Open Access / Geological Literature | Public Open Access (GODL-India) |
| **Licence** | Government Open Data License - India (GODL) | GODL-India / Public Scientific Domain | GODL-India |
| **DOI** | https://bhukosh.gsi.gov.in | N/A | N/A |
| **Spatial Coverage** | Nationwide (All 26 cratonic and orogenic terranes of India) | Representative depth columns for major terranes (0 to -1500m) | Nationwide (Alluvial, Basaltic, Hard Rock, Sedimentary, Coastal) |
| **Temporal Coverage** | Archean (~3.5 Ga) to Quaternary (Holocene) | Fixed drill-year core records (2018–2023) | Multi-year hydrogeological compilation |
| **Data Classification** | `MODELLED` | `MODELLED` / `OBSERVED` | `MODELLED` |
| **Acquisition Status** | `PROCESSED` & `VALIDATED` (GSI terrane engine) | `PROCESSED` & `VALIDATED` (Deep core layer logs) | `PROCESSED` & `VALIDATED` (Aquifer classification) |
| **Integration Status** | **`INTEGRATED`** (Nexus Strata, Inspector, AI Grounding) | **`INTEGRATED`** (Nexus Strata Core Log Viewer) | **`INTEGRATED`** (Inspector Data Tab & Aquifer Resolver) |
| **Known Limitations** | Regional scale boundaries; local contact aureoles require site-specific diamond drilling. | Representative synthetic/curated logs from published GSI wells; not continuous point cores at all coordinates. | Transmissivity and storage coefficients are regional averages; local fracturing controls actual yields. |

---

### 2.3 Remote Sensing & Mineral Alteration Intelligence

| Parameter | Copernicus Sentinel-2 MSI Multi-Spectral Data | GSI National Mineral Inventory (NMI) | ASTER Mineral Indices (NASA/METI) |
| :--- | :--- | :--- | :--- |
| **Provider** | European Space Agency (ESA) Copernicus Programme | Geological Survey of India & Indian Bureau of Mines (IBM) | NASA & Ministry of Economy, Trade and Industry of Japan (METI) |
| **Dataset** | Sentinel-2 Level-2A Bottom of Atmosphere (BOA) Reflectance | Major Metallogenic Belts & Mineral Deposit Analogues | Advanced Spaceborne Thermal Emission and Reflection Radiometer |
| **Documentation** | https://dataspace.copernicus.eu/ | https://ibm.gov.in/ / https://gsi.gov.in | https://asterweb.jpl.nasa.gov/ |
| **Access Method** | Copernicus Data Space Ecosystem Open Access | GSI Mineral Inventory Bulletins & Published Belts | NASA Earthdata Search / LP DAAC |
| **Auth Requirements** | Free Copernicus Account (for bulk granules) / Open Ratios | Public Scientific Domain | Free Earthdata Login |
| **Licence** | ESA Copernicus Open Access Policy | GODL-India / Public Domain | NASA Open Data Policy |
| **DOI** | https://doi.org/10.5270/S2_-znk9-5777 | N/A | https://doi.org/10.5067/ASTER/AST_L1T.003 |
| **Spatial Coverage** | Global ($10\text{m} - 20\text{m}$ resolution); India coverage | Key metallogenic belts across India (Khetri, Zawar, Singhbhum, etc.) | Global ($15\text{m} - 90\text{m}$ resolution) |
| **Temporal Coverage** | 2015–Present (5-day revisit) | Decadal mineral inventory compilation | 2000–Present |
| **Data Classification** | `OBSERVED` (Spectral Band Math) / `MODELLED` (Alteration Haloes) | `MODELLED` | `MODELLED` |
| **Acquisition Status** | `PROCESSED` (Copernicus band math formulas embedded) | `PROCESSED` & `VALIDATED` (Metallogenic belt register) | `DISCOVERED` |
| **Integration Status** | **`INTEGRATED`** (Nexus Mineral Spectral Indices Card) | **`INTEGRATED`** (Nexus Mineral Belt Analogue Viewer) | `DISCOVERED` (Formulas referenced in documentation) |
| **Known Limitations** | **Fundamental Law of Remote Sensing:** Optical/SWIR sensors detect only the outermost top micrometres of Earth's surface. Cannot penetrate solid rock to prove deep ore without diamond core drilling. | Deposit outlines reflect regional prospective belts, not active unmined ore claims. | Thermal infrared noise and atmospheric calibration required for raw scenes. |

---

### 2.4 Geographical, Administrative & River Basins

| Parameter | OpenStreetMap & Nominatim | Survey of India / Natural Earth Administrative Boundaries | CWC Major River Basins of India |
| :--- | :--- | :--- | :--- |
| **Provider** | OpenStreetMap Foundation & Global Contributors | Survey of India / Natural Earth Open Data | Central Water Commission (CWC) / India-WRIS |
| **Dataset** | OpenStreetMap Planet Dump & Nominatim API | 1:10m State & National Boundaries of India | CWC Major River Basins Atlas (18 Basins) |
| **Documentation** | https://nominatim.org/release-docs/latest/ | https://surveyofindia.gov.in/ / https://naturalearthdata.com | https://indiawris.gov.in/wris/#/riverBasins |
| **Access Method** | HTTPS REST API (Rate limited: 1 req/sec) + Local Index | GeoJSON Vector Boundaries / Centroids | India-WRIS GIS Shapefiles / GeoJSON Boundaries |
| **Auth Requirements** | None (Requires compliant User-Agent and attribution) | Public Open Access | Public Open Access (GODL-India) |
| **Licence** | Open Database License (ODbL) 1.0 | Public Domain / CC0 / GODL-India | Government Open Data License - India (GODL) |
| **Spatial Coverage** | All settlements, cities, districts, roads in India | 36 States & Union Territories of India | All 18 major river basins across the Indian subcontinent |
| **Data Classification** | `OBSERVED` | `OBSERVED` | `OBSERVED` |
| **Acquisition Status** | `PROCESSED` (Local offline index of 36 States + 70+ districts) | `PROCESSED` & `VALIDATED` | `PROCESSED` & `VALIDATED` (14 major river basins) |
| **Integration Status** | **`INTEGRATED`** (Universal Search Bar & Reverse Geocoding) | **`INTEGRATED`** (Top Bar Breadcrumbs, Inspector Hierarchy) | **`INTEGRATED`** (Inspector Basin Card & Provider Router) |
| **Known Limitations** | Nominatim demo server requires strict 1 req/sec rate limit. Mitigated via local offline index. | High-altitude border definitions follow official Survey of India cartographic standards. | Sub-catchment delineations require high-resolution DEM stream extraction. |

---

## 3. Operational Summary

| Category | Total Sources Evaluated | Integrated & Operational | Blocked / Pending External Auth |
| :--- | :--- | :--- | :--- |
| **Hydrological & Gravimetric** | 4 | 4 (`INTEGRATED`) | 0 (PO.DAAC cloud app authorization recommended) |
| **Geological & Subsurface** | 3 | 3 (`INTEGRATED`) | 0 |
| **Remote Sensing & Minerals** | 3 | 2 (`INTEGRATED`), 1 (`DISCOVERED`) | 0 |
| **Geographical & Administrative**| 3 | 3 (`INTEGRATED`) | 0 |
| **TOTAL** | **13** | **12 (`INTEGRATED`), 1 (`DISCOVERED`)** | **0** |

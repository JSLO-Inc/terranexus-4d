# TERRANEXUS 4D — PHASE 5 & 5D KNOWN LIMITATIONS
## Scientific Boundaries, Spatial Resolution Constraints & Model Disclaimers

**Document Version:** 1.1.0  
**Phase:** 5D (Forensic Scientific Data Validation, Provider Corrections & Security Remediation)  
**Date of Completion:** November 2026  
**Intended Audience:** Scientific Evaluators, Hydrologists, GIS Analysts, Government Agencies  
**Governing Standard:** Non-Negotiable Scientific Integrity Framework (Part 13 Compliance)

---

## 1. Spatial Resolution Discrepancy & Non-Conflation Caveats

### 1.1 The Regional Satellite Gravimetry Scale (NASA GRACE / GRACE-FO)
NASA GRACE and GRACE-FO Level-3 Land Mass grids (JPL Tellus RL06 / RL06.3) are generated on a $0.5^\circ \times 0.5^\circ$ geographic grid. Due to the physics of satellite-to-satellite tracking at $\sim 450\text{ km}$ orbital altitude and spherical harmonic truncation ($l_{\max} = 60$), the effective spatial resolution is constrained by a **$\sim 300\text{ km}$ Gaussian smoothing filter**.
- The nominal footprint envelope covers approximately **$282,743\text{ km}^2$**.
- **Scientific Limitation:** GRACE measures total column mass variations integrated over regional basins (e.g. the entire Upper Ganga or Sutlej-Beas basin). **It does NOT measure water table levels at individual farm borewells, village clusters, or urban wards.**
- **Mass Decoupling Requirement:**
  $$\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS} - \Delta\text{SWS} - \Delta\text{SWE}$$
  Decoupling groundwater storage ($\Delta\text{GWS}$) requires independent soil moisture ($\Delta\text{SMS}$) and surface water storage ($\Delta\text{SWS}$) models (e.g. GLDAS/Noah). Converting $\Delta\text{GWS}$ into piezometric head change ($\Delta h_{\text{gw}}$) requires accurate knowledge of aquifer specific yield ($S_y$):
  $$\Delta h_{\text{gw}} = \frac{\Delta\text{GWS}}{S_y}$$

### 1.2 In-Situ CGWB Piezometer Station Spatial Representativeness
- CGWB and State Ground Water Department monitoring wells provide discrete point observations ($m\text{ bgl}$).
- **Scientific Limitation:** When an arbitrary coordinate in India is searched (e.g. an agricultural village), the nearest monitoring station might be $15–80\text{ km}$ away. Local pumping cones, fractured crystalline hard-rock heterogeneity, and localized lithological clay lenses mean that nearby well water levels **cannot be inferred as exact local readings**.
- **Platform Enforcement:** The platform displays the exact Haversine distance and direction to the nearest station and strictly marks `isDirectObservation: false`.

### 1.3 CGWB Dynamic Ground Water Resource Assessment Macro-Scale
- CGWB dynamic groundwater assessments (GEC-2015 methodology) provide total annual replenishable recharge, extractable resources, and stage of extraction aggregated at the State and Assessment Unit (Block/Mandal/Taluk) scale.
- **Scientific Limitation:** Macro-administrative figures ($\text{BCM}/\text{year}$) do not indicate whether an unconfined or deep fractured aquifer at a specific plot of land has productive yield.
- **Platform Enforcement:** Unmatched administrative entities strictly return `null` (`UNAVAILABLE`) without fallback to national averages.

---

## 2. Geological & Subsurface Stratigraphy Disclaimers

### 2.1 Educational Synthetic Borehole Cross-Sections (`EDU-SYNTH-...`)
- The deep stratigraphic columns displayed in Nexus Strata are **pedagogical composite cross-sections** illustrating typical regional stratigraphy for the cratonic or orogenic terrane.
- **Scientific Limitation:** They are **NOT physically drilled exploratory diamond cores** logged at the specific user coordinate. Pseudo-exact water strike depths and specific permeability coefficients have been replaced with qualitative hydrogeological descriptions.
- **Engineering Notice:** Site-specific diamond core drilling, geophysical logging (gamma, resistivity, caliper), and pumping tests remain mandatory for engineering foundations, tunnel excavation, or mine development.

### 2.2 Rectangular Terrane Bounding Boxes
- Cratonic, mobile belt, and sedimentary basin boundaries are modeled using regional bounding boxes tagged as `TERRANE-REGIONAL-INTERPRETATION`.
- **Scientific Limitation:** These geometric boxes do not capture curved structural contacts (such as the Main Central Thrust or Central Indian Tectonic Zone). Coordinates falling outside all bounding boxes return an unassigned regional interpretation rather than defaulting to the Dharwar Craton.

---

## 3. Hydrological Basins & Geometry (CWC & India-WRIS 25 Official Basins)

### 3.1 Point-in-Polygon (PIP) Resolution
- River basin identification is executed via deterministic ray-casting point-in-polygon containment against authentic CWC & India-WRIS catchment polygons (`wris_basins_cwc_official.json`).
- **Complete National Coverage:** Covers all 25 official Indian hydrological basins, including mainland major rivers (Ganga, Indus, Brahmaputra, Godavari, Krishna, Cauvery, Narmada, Tapi, Mahanadi, Pennar, Mahi, Sabarmati, Subarnarekha, Brahmani-Baitarani), coastal river groupings (Tapi to Tadri, Tadri to Kanyakumari, Pennar to Kanyakumari, Mahanadi to Pennar, Subarnarekha to Rushikulya), endorheic inland drainage (Kutch, Saurashtra & Luni, Ladakh High-Altitude Basins), and island marine catchments (Andaman and Nicobar Islands, Lakshadweep Islands).
- **Null Containment:** Locations strictly falling outside all 25 official polygons (e.g. international territory, maritime EEZ outside island catchments) strictly return `null` (`UNKNOWN`) rather than guessing a nearest basin centroid or bounding box.

---

## 4. Remote Sensing & Atmospheric Sensors

### 4.1 Fundamental Law of Remote Sensing (Sentinel-2 MSI Mineral Indices)
- Optical and shortwave infrared (SWIR) sensors on satellites detect reflected solar radiation strictly from the **outermost sub-millimetre surface layer** of the crust (the top few micrometres of exposed rock, gossan, or soil).
- **Scientific Limitation:** Satellites cannot penetrate solid rock, dense agricultural crops, transported alluvium, or sand dunes. Surface alteration indices (e.g. ferric iron $B4/B2$, hydroxyl $B11/B12$) are classified as `MODELLED` analytical ratios. They **do not prove the presence of concealed commercial-grade copper, gold, or lithium deposits**.
- **Copernicus CDSE Ingestion Status & Keycloak Barrier:** While scene metadata discovery is operational via CDSE OData (`discoverSentinel2Scenes`), programmatic download of full `.SAFE` L2A products or raw GeoTIFF bands requires an authorized Copernicus Data Space Ecosystem (CDSE) Keycloak OAuth token. Without this token, download attempts return HTTP 401 Unauthorized.

### 4.2 NASA GPM IMERG Ingestion Status & GES DISC OAuth Barrier
- Standby monthly precipitation is calculated via a localized seasonal curve and classified as **`SIMULATED` / `DEMONSTRATION`** (`STANDIN_SIMULATED`).
- While metadata discovery for monthly V07 granules is operational via NASA CMR (`discoverGpmGranules`), direct binary download of HDF5 granules from `data.gesdisc.earthdata.nasa.gov` requires an active Earthdata Login Bearer Token with approved GES DISC OAuth application permissions on the user's Earthdata profile. Unauthenticated direct download requests return HTTP 401 Unauthorized.

---

## 5. Sensor Continuity & Mission Gap Handling

1. **The 11-Month GRACE to GRACE-FO Gap (July 2017 – May 2018):**
   - The primary GRACE mission ended in June 2017; GRACE-FO operations began in June 2018.
   - **Strict Policy:** TERRANEXUS 4D preserves these 11 months as unobserved null discontinuities ($NaN$). The platform does not interpolate across this gap with splines or regressions.
2. **Spacecraft Calibration & Battery Outages:**
   - 11 monthly battery conservation shutdowns (2014–2017) and 2 GRACE-FO in-orbit calibration months (August–September 2018) are similarly treated as discrete unobserved steps ($NaN$).

---

## 6. Digital Twin Infrastructure & Content Security Policy (CSP)

1. **CesiumJS WebGL Shader Compilation (`unsafe-eval`):**
   - CesiumJS requires `'unsafe-eval'` in its Content Security Policy to compile WebGL GLSL shaders dynamically at runtime in the browser using `new Function()`.
   - Web Workers for terrain tile decompression require `blob:` script evaluation.
   - Disabling `'unsafe-eval'` halts WebGL initialization, crashing the 3D digital twin.
2. **Zero Paid API Dependencies:**
   - The platform defaults to the WGS84 Reference Ellipsoid to ensure zero paid API dependencies. High-resolution terrain meshes are enabled when an optional user token is supplied.

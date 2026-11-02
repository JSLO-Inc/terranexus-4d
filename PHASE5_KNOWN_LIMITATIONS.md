# TERRANEXUS 4D — PHASE 5 KNOWN LIMITATIONS
## Scientific Boundaries, Spatial Resolution Constraints & Model Disclaimers

**Document Version:** 1.0.0  
**Phase:** 5 (Nationwide Location Intelligence, Multi-Layer Heatmaps & Place Discovery)  
**Date:** November 2026  
**Intended Audience:** Scientific Evaluators, Hydrologists, GIS Analysts, Government Agencies  

---

## 1. Spatial Resolution Discrepancy & Non-Conflation Caveat

### 1.1 The Regional Satellite Gravimetry Scale
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

---

## 2. Sensor Continuity & Mission Gap Handling

1. **The 11-Month GRACE to GRACE-FO Gap (July 2017 – May 2018):**
   - The primary GRACE mission was decommissioned in June 2017. GRACE-FO was launched on May 22, 2018, with initial science records commencing in June 2018.
   - **Strict Policy:** TERRANEXUS 4D preserves these 11 months as unobserved null discontinuities ($NaN$). The platform does not interpolate across this gap with splines or regressions. In statistical calculations, these months are tracked in `noDataCount` and excluded from denominators.
2. **Spacecraft Calibration & Battery Outages:**
   - 13 official monthly outages occurred between 2014 and 2017 during GRACE accelerometer calibration and orbital shadow cycles. These are similarly treated as discrete unobserved steps.

---

## 3. Remote Sensing Optical Mineral Alteration Boundaries

1. **Top-Micron Surface Reflectance:**
   - Copernicus Sentinel-2 MSI band ratios (e.g. B4/B2 for ferric iron/gossan, B11/B12 for clay/hydroxyl minerals) measure surface reflectance from exposed rock outcrops (the top few microns of the crust).
   - **Scientific Limitation:** Optical satellite sensors cannot penetrate soil, dense agricultural vegetation, alluvium, or solid bedrock. Surface alteration indices **do not prove the presence of concealed deep economic mineralization** (copper, gold, lithium, or rare earths). Ground geophysical surveys (induced polarization, gravity, magnetics) and diamond core drilling are mandatory.

---

## 4. Open Geocoding & Network Boundaries

1. **Nominatim Usage Limits:**
   - OpenStreetMap Nominatim is a shared community resource. TERRANEXUS 4D adheres strictly to its usage policies by rate-limiting queries to maximum 1 request per second and aggressively caching responses.
   - For rapid place searches, the platform relies on its built-in local index of 36 States/UTs and 70+ major districts.
2. **Shortened Google Maps Links (`maps.app.goo.gl`):**
   - Shortened URLs require HTTP `301/302` redirect unwrapping over a live network. If network conditions block external redirects, the system prompts the user to enter coordinates, town names, or full Google Maps URLs directly.

---

## 5. 3D Elevation & Terrain Disclosures

1. **CesiumJS Terrain Baseline:**
   - To guarantee zero paid API dependencies, the 3D globe defaults to the WGS84 Reference Ellipsoid.
   - Where Cesium World Terrain is optional (via user-supplied `VITE_CESIUM_ION_TOKEN`), high-resolution photogrammetric elevations are enabled.
   - Elevation estimates returned by the location inspector represent Survey of India benchmark approximations and ellipsoid heights ($\pm 5\text{ m}$ vertical uncertainty).

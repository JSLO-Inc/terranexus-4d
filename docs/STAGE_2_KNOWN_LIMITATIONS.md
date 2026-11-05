# TERRANEXUS 4D — STAGE 2 SCIENTIFIC & TECHNICAL KNOWN LIMITATIONS
## Transparent Boundaries, Sensor Physics, Resolution Thresholds & Epistemic Governance

**Platform:** TERRANEXUS 4D — India's Unified Earth Intelligence Platform  
**Document Designation:** `DOC-TN4D-STAGE-2-KNOWN-LIMITATIONS`  
**Classification:** Authoritative Technical Disclosure & User Advisory  
**Target Territory:** Republic of India ($6^\circ\text{N} - 38^\circ\text{N}$, $68^\circ\text{E} - 98^\circ\text{E}$)  
**Lead Engineering Authority:** Lead Architect, 3D Geospatial Director, Scientific QA Team  
**Date of Certification:** November 4, 2026  

---

## 1. EXECUTIVE DISCLOSURE & PHILOSOPHY OF SCIENTIFIC TRANSPARENCY

TERRANEXUS 4D operates under a strict principle of **epistemic integrity**: *an Earth intelligence workstation must clearly articulate what its data cannot tell the user, with the same rigor and precision with which it presents what the data does tell the user.*

In geospatial intelligence and subsurface engineering, catastrophic failures occur when decision-makers mistake coarse regional satellite estimations or mathematical illustrative models for high-resolution ground truth. This document formally outlines the operational, physical, sensor, mathematical, and architectural limitations of TERRANEXUS 4D across all subsystems.

---

## 2. COPERNICUS GLO-90 DIGITAL SURFACE MODEL (DSM)

### 2.1 Digital Surface Model (DSM) vs. Digital Terrain Model (DTM)
- **Physical Sensor:** The European Space Agency (ESA) Copernicus DEM GLO-90 is derived primarily from the TanDEM-X X-band synthetic aperture radar (SAR) interferometry mission.
- **Canopy & Structure Reflection:** Because X-band radar ($\approx 3.1\text{ cm}$ wavelength) reflects off the top of forest canopies, dense vegetation, and anthropogenic structures (buildings, industrial complexes), Copernicus GLO-90 is a **Digital Surface Model (DSM)**, *not* a bare-earth **Digital Terrain Model (DTM)**.
- **Topographic Elevation Impact:** In forested regions (such as the Western Ghats, Nilgiris, Northeast India, and Himalayan foothills), elevations can exceed true ground level by 10 to 35 meters due to tree crown heights. In dense urban agglomerations (Mumbai, Delhi, Kolkata), building heights are integrated into the surface. Users conducting hydrological drainage or flood-inundation modeling must account for this canopy offset.

### 2.2 Spatial Resolution & Grid Registration
- **Grid Spacing:** The dataset is distributed on an integer-arcsecond grid with 3 arcseconds of resolution ($\approx 90\text{ m}$).
- **Longitudinal Meridian Convergence:** In Central India ($20^\circ\text{N} - 24^\circ\text{N}$), meridian convergence scales the east-west cell dimension to:
  $$\Delta X \approx 92.8\text{ m} \times \cos(22^\circ) \approx 86.0\text{ m}$$
  North-south spacing remains constant at $\approx 92.6\text{ m} - 92.8\text{ m}$.
- **Sub-Grid Features:** Topographic features smaller than 90 meters (e.g., narrow river gullies, highway embankments, small mining pits, micro-watershed bunds) are smoothed or aliased by cell averaging.

### 2.3 Vertical Accuracy Specifications ($\text{LE90}$)
- **Product-Level Accuracy:** Copernicus GLO-90 specifies an absolute vertical accuracy of $\text{LE90} < 4.0\text{ m}$ (Linear Error at 90% confidence level) globally in non-forested terrain.
- **Local Uncertainty:** This figure is a global statistical metric across validation benchmarks, *not a guaranteed per-pixel accuracy bound*. In rugged terrains with slope angles $> 20^\circ$ (Himalayan scarps, Deccan Western Ghats escarpments), radar layover, shadow, and foreshortening introduce local elevation errors that can exceed $\pm 15\text{ m}$.

---

## 3. NASA GRACE & GRACE-FO SATELLITE GRAVIMETRY

### 3.1 Spatial Resolution & Filtering
- **Physical Sensor:** The Gravity Recovery and Climate Experiment (GRACE) and GRACE Follow-On (GRACE-FO) track minute inter-satellite microwave and laser ranging variations caused by Earth's shifting mass distribution.
- **Spatial Smoothing:** Raw spherical harmonic geopotential coefficients are truncated at degree and order 60, followed by a spatial Gaussian smoothing filter with a radius of $300\text{ km}$ to suppress North-South striping errors.
- **Effective Footprint:** The spatial resolution of GRACE-derived Terrestrial Water Storage Anomaly (TWSA) is approximately $3^\circ \times 3^\circ$ ($\approx 100,000\text{ km}^2$).
- **Local Aquifer Inapplicability:** GRACE TWSA **cannot resolve individual village aquifers, municipal wellfields, or sub-district water table dynamics**. It measures the integrated mass change across an entire multi-state catchment (e.g., the combined Indus-Ganges basin or Godavari-Krishna basin). Point extraction of GRACE data at a specific lat/lon represents the center of a wide regional smoothing window.

### 3.2 Total Mass Anomaly vs. Groundwater Specific Yield
- **Vertical Integration:** GRACE measures the change in **total column water storage**, integrating canopy storage, surface water reservoirs, soil moisture in the root zone, and deep unconfined/confined aquifers.
- **Partitioning Ambiguity:** Without auxiliary land surface models (e.g., GLDAS Noah or Catchment models) to isolate soil moisture and snowpack, GRACE data alone cannot uniquely attribute mass depletion to groundwater abstraction versus surface drought or reservoir discharge.
- **Temporal Latency:** Operational GRACE-FO Level-3 mass grids have a publishing latency of 60 to 90 days from acquisition to delivery by NASA JPL, CSR, and GFZ. Real-time groundwater monitoring relies on in-situ telemetry.

---

## 4. MULTI-SPECTRAL REMOTE SENSING (SENTINEL-2 & ASTER)

### 4.1 Physical Penetration Depth & Sensor Physics
- **Electromagnetic Waveband:** The optical (VNIR: 400–1000 nm) and shortwave infrared (SWIR: 1000–2500 nm) sensors on Copernicus Sentinel-2 MSI and NASA/METI ASTER detect solar photons backscattered and reflected from the surface.
- **Beer-Lambert Absorption & Optical Skin Depth:** The penetration of optical radiation into terrestrial materials follows the physical **Beer-Lambert attenuation law**:
  $$I(z) = I_0 e^{-\alpha(\lambda) z}, \quad \delta(\lambda) = \frac{1}{\alpha(\lambda)}$$
  where $\alpha(\lambda)$ is the wavelength-dependent absorption coefficient and $\delta(\lambda)$ is the characteristic penetration (skin) depth.
  - In opaque, highly absorbing rock and mineral surfaces (e.g., ferric oxides such as hematite and goethite, iron sulfides, and carbonaceous shales), $\alpha(\lambda) > 10^3\text{ cm}^{-1}$, causing 99% of radiant flux to be absorbed within the **outermost 20 to 50 micrometers** ($0.02 - 0.05\text{ mm}$).
  - In translucent or transparent minerals (e.g., pure quartz sand grains, unweathered halite, calcite) within specific SWIR atmospheric windows, light undergoes internal scattering and can penetrate several millimeters ($1 - 5\text{ mm}$) before escaping as diffuse reflectance.
- **Fundamental Subsurface Blindness:** Regardless of micro-scale differences in optical skin depth (microns to millimeters), **optical and SWIR sensors detect radiation reflected or emitted strictly from the outermost physical exposure of the Earth**. They cannot penetrate opaque regolith, overlying alluvium, agricultural soils, dense vegetation, or forest canopies to reveal buried subterranean ore bodies.
- **Alteration Halo vs. Economic Ore Body:** Band ratios (e.g., Sentinel-2 $B4/B2$ for Ferric Iron, $B11/B12$ for Hydroxyl/Clay minerals, $B12/B8A$ for Ferrous Iron) highlight spectral absorption features associated with surface weathering and hydrothermal alteration products (hematite, goethite, alunite, kaolinite, illite). A high spectral alteration index indicates the presence of altered minerals on the exposed ground surface; **it does NOT confirm the presence, strike, dip, depth, or economic grade of a buried subterranean mineral deposit**. Subsurface ore bodies can only be confirmed by diamond core drilling, downhole geophysics, and chemical assaying.
- **False Positives:** Dry agricultural soils, plowed clay-rich vertisols (Deccan black cotton soil), and synthetic industrial surfaces can mimic hydrothermal clay absorption signatures.

---

## 5. IN-SITU CGWB GROUNDWATER MONITORING NETWORK

### 5.1 Station Density & Spatial Coverage
- **Monitoring Infrastructure:** The Central Ground Water Board (CGWB) maintains approximately 33,000 piezometric stations across India, monitored four times annually (January, May/Pre-monsoon, August, November/Post-monsoon).
- **Curated Baseline Network:** TERRANEXUS 4D’s current embedded baseline dataset integrates 33 reference national observation stations representing India's major hydrogeological provinces.
- **Interpolation Risk:** Outside the immediate vicinity ($r > 25\text{ km}$) of an active CGWB station, groundwater depth values are spatial estimations. In crystalline hard-rock terranes (Deccan Traps, Dharwar Craton, Aravallis), water levels vary dramatically over tens of meters due to compartmentalized fracture networks.

### 5.2 Automated Uncertainty Quality Gate
- **Validation Gate:** TERRANEXUS 4D enforces a strict cross-validation gate:
  $$\text{Leave-One-Out MAE} = \frac{1}{N} \sum_{i=1}^N |y_i - \hat{y}_{(-i)}|$$
- **Suppression Rule:** If the local spatial cross-validation Mean Absolute Error ($\text{MAE}$) exceeds $5.0\text{ m}$, the system automatically withholds local address-level point predictions and displays the regional basin-wide CGWB statistics with an explicit uncertainty warning badge.

---

## 6. 3D SUBSURFACE STRUCTURAL GEOLOGY

### 6.1 Mode A (Evidence-Based) vs. Mode B (Illustrative)
- **Mode A (Evidence-Based):**
  - Renders only verified planar stratigraphy matching published GSI 1:50,000 quadrangle maps and observed borehole lithological logs.
  - Curvature, synthetic anticlinal folds, and unverified micro-faults are strictly disabled.
  - Stratigraphic interfaces are shown as bounded planar slabs with transparent uncertainty envelopes.
- **Mode B (Illustrative):**
  - Renders realistic geomorphic and geological features (e.g., Deccan basalt stepped trap profiles, red bole interbeds, coastal deltaic lenses) for educational, regional conceptualization, and presentation purposes.
  - **Mandatory Warning:** Must always display the persistent amber notification:
    `"ILLUSTRATIVE MODEL — NOT A VERIFIED LOCAL GEOLOGICAL OBSERVATION"`.

### 6.2 Borehole Correlation & Stratigraphic Uncertainty
- **Spatial Separation:** Boreholes located several kilometers apart cannot be correlated with 100% confidence without intervening 2D seismic reflection profiles or electrical resistivity tomography (ERT).
- **Unconformities:** Across regional unconformities (e.g., Archean basement vs. Gondwana sediments), automatic lithological interpolation is prohibited. TERRANEXUS 4D renders such boreholes as isolated 3D geotechnical columns with color-coded lithology intervals.

---

## 7. GROUNDWATER HYDRAULIC DRAWDOWN CALCULATIONS

### 7.1 Steady-State Radial Flow Assumptions (Thiem Equation)
- **Equation:**
  $$s(r) = s_{\text{max}} \cdot \frac{\ln(R / r)}{\ln(R / r_w)}$$
- **Underlying Assumptions:**
  1. The aquifer is confined, homogeneous, isotropic, of uniform horizontal thickness, and infinite in areal extent.
  2. Flow to the well is purely horizontal and strictly laminar ($Re < 10$).
  3. Pumping rate $Q$ is constant, and steady-state equilibrium has been achieved ($\partial h / \partial t = 0$).
  4. The well fully penetrates the saturated thickness of the aquifer.
- **Real-World Deviations:** In fractured crystalline aquifers (granites, gneisses, basalts), groundwater flow occurs primarily through discrete 2D fracture networks, faults, and joints, violating the continuum porous-media assumption. The Thiem equation provides an idealized reference profile, not a fractured-rock discrete fracture network (DFN) simulation.

### 7.2 Jacob Unconfined Aquifer Correction
- **Equation:**
  $$s' = s - \frac{s^2}{2H}$$
- **Assumptions & Applicability Conditions:**
  - **Dupuit-Forchheimer Assumption:** The correction assumes predominantly horizontal laminar flow with negligible vertical flow components throughout the regional cone of depression.
  - **Radicand Positivity Bound:** Mathematically, the equivalent confined head formulation requires $2s < H$ (the saturated thickness cannot be drawn down below zero).
  - **Late-Time Delayed Yield:** In unconfined aquifers undergoing pumping, initial response is governed by elastic storage release ($S$), transitioning through delayed gravity drainage (Boulton-Neuman curve) to the ultimate specific yield ($S_y$). Jacob's unconfined correction is mathematically applicable strictly during the late-time quasi-steady-state phase.
  - **Caveat on Universal Cutoff Rules:** Common rules of thumb (such as $s/H \le 0.25$ or $r > 1.5H$) are empirical engineering heuristics rather than universal physical laws; near the wellbore, vertical seepage faces and well losses dominate, requiring 3D numerical boundary-element or finite-difference modeling (e.g. MODFLOW).

---

## 8. BROWSER & CLIENT-SIDE ARCHITECTURAL CONSTRAINTS

### 8.1 Dual WebGL Context Allocation & Inactive Loop Decoupling
- **Architecture:** TERRANEXUS 4D employs CesiumJS for global 4D Earth rendering and Three.js for high-fidelity 3D subsurface cutaway rendering.
- **Render-Loop Decoupling vs. Total System GPU Utilization:**
  - When navigating away from the globe (`isGlobeVisible = false`), the CesiumJS `requestAnimationFrame` loop is detached, terminating all Cesium rendering passes. This drops **active Cesium GPU draw-call consumption to 0%**.
  - However, this does **NOT mean the entire browser process consumes 0% GPU**. The Three.js WebGL context remains active (rendering the 3D cutaway), and the Windows Desktop Window Manager (DWM) compositor, Chromium GPU process, and VRAM buffer allocations remain resident. Total application GPU utilization is determined by the active foreground viewport.
- **Hardware Limits:** Running two active WebGL contexts concurrently requires dedicated GPU memory ($> 2\text{ GB VRAM}$). On integrated graphics chips (e.g., Intel Iris Xe, UHD 620) or mobile browsers, maintaining two unthrottled 60 Hz rendering loops can trigger browser context loss (`WEBGL_context_lost`) or severe queue contention.

### 8.2 Font Latency: Render-Blocking vs. Network Transfer Readiness
- **Main-Thread Render-Blocking Elimination (0 ms):** Converting `<link rel="stylesheet">` to non-blocking `<link rel="preload">` eliminates the **3,059 ms main-thread parsing blockage** on cold startup. First Contentful Paint (FCP) and DOM rendering proceed immediately with zero delay.
- **Font Network Transfer & Readiness:** Font stylesheets and `.woff2` glyph files still require time to transfer over HTTP/2 and be parsed by the browser text engine (measured at $\approx 430\text{ ms}$ layout readiness). During this transfer window, fallback system fonts (`system-ui`, `monospace`) render instantly, swapping seamlessly via `font-display: swap` without layout shifts (CLS $< 0.01$).

### 8.3 Basal Datum Technical Boundary Disclosure
- **Flat -55m Elevation Datum:** The bottom boundary of the 3D cutaway block is pinned to a flat elevation datum at $-55.0\text{ m AMSL}$.
- **Technical Disclosure:** This flat base represents an **artificial model cut-off visualization boundary** designed to ensure a watertight Cartesian geometry; it does **NOT represent an empirical geological contact, horizontal bedding surface, or crystalline basement unconformity**.

---

## 9. SUMMARY COMPLIANCE MATRIX

| Subsystem | Underlying Sensor / Model | Known Limitation | Mitigating Feature in Platform |
| :--- | :--- | :--- | :--- |
| **Topography** | Copernicus GLO-90 DSM | Radar canopy/building offset ($\approx 10-35\text{m}$ in forests); $\text{LE90} < 4.0\text{m}$ is a global statistical metric. | Clear DSM metadata badge; elevation offsets documented in Inspector. |
| **Groundwater Gravity** | NASA GRACE-FO TWSA | ~300 km spatial Gaussian filter; cannot resolve local village wells; 60–90 day lag. | Spatial disclaimer; integration with local CGWB in-situ well data. |
| **Mineral Exploration** | Sentinel-2 / ASTER | Beer-Lambert attenuation restricts sensing to surface exposure; detects alteration halos, NOT underground ore bodies. | Prominent geophysical exploration disclaimer; drilling required notice. |
| **Groundwater Levels** | CGWB In-Situ Network | Sparse network in remote areas; hard-rock fracture compartmentalization. | Automated Leave-One-Out validation gate ($\text{MAE} > 5.0\text{m}$ suppression). |
| **3D Geological Cutaway** | GSI 1:50k & Boreholes | Unmeasured contacts between distant wells are inferred; synthetic undulations illustrative only. Flat -55m datum is technical cut-off. | Dual Mode toggle (Mode A Evidence-Based vs Mode B Illustrative with amber banner); datum disclosure. |
| **Hydraulic Drawdown** | Thiem & Jacob Formulations | Assumes isotropic porous media; unconfined vertical flow and delayed yield near wellbore. | Mathematical caveats documented in UI; simulation marked as illustrative. |
| **Rendering Engine** | Dual WebGL (Cesium + Three) | High VRAM usage on low-end integrated graphics if running simultaneously. | Cesium RAF loop decoupling when cutaway is active; WebGL memory profiling. |
| **Typography & Fonts** | Google WebFonts | Web fonts require network transfer; 0 ms render-blocking does not mean instant font glyph readiness. | Non-blocking preloading with instant system font fallback and `font-display: swap`. |

---

*Certified by the Lead Engineering Architect, 3D Geospatial Director, and Scientific QA Team, TERRANEXUS 4D Platform.*

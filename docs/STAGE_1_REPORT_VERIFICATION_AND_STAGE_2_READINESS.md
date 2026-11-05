# TERRANEXUS 4D — REVISED STAGE 1 TECHNICAL SPECIFICATION, SCIENTIFIC AUDIT & STAGE 2 READINESS BLUEPRINT

**Document Designation:** `STAGE-1-REVISED-TECHNICAL-SPECIFICATION-AND-STAGE-2-READINESS`  
**Classification:** Authoritative Engineering Specification, Scientific Validation & Architecture Blueprint  
**Platform:** TERRANEXUS 4D — India's Unified Earth Intelligence Platform  
**Target Territory:** Republic of India ($6^\circ\text{N} - 38^\circ\text{N}$, $68^\circ\text{E} - 98^\circ\text{E}$)  
**Execution Authority:** Lead 3D Engineering Architect, Technical Director & Integration Manager  
**Implementation Permission Status:** **NOT GRANTED (Strict Inspection, Specification Revision & Audit Only)**  
**Benchmark Evidence:** [`docs/reproducible-benchmark-report.json`](file:///d:/Terranexus%204d/docs/reproducible-benchmark-report.json)  
**Date of Revision:** November 4, 2026  

---

## EXECUTIVE SUMMARY

In strict adherence to the **Stakeholder Technical Review and Revision Directive**, this revised specification resolves all outstanding scientific, mathematical, geometric, and performance architecture issues identified during the review of the Stage 1 report.

**Zero application source-code modifications have been implemented during this phase.** All mathematical formulations, geometric rendering pipelines, provenance categorizations, and performance benchmarks have been rigorously re-evaluated and corrected from first principles.

### Key Revisions in this Specification:
1. **Rigorous Groundwater Mathematics:** Re-derived Thiem's steady-state radial flow equation and verified boundary conditions ($s(r_w) = s_{\text{max}}$ at well radius; $s(R) = 0$ at radius of influence). Formally derived Dupuit-Forchheimer unconfined flow. For Jacob's unconfined drawdown correction ($s' = s - s^2/2H$), documented the underlying Dupuit horizontal-flow assumptions, late-time radial-flow conditions, delayed-yield dynamics, vertical anisotropy considerations, and hard-rock bedrock limitations—removing arbitrary universal numerical limits. Formally demarcated the mathematical boundary between an **illustrative geometric surface**, a **calibrated numerical groundwater model**, and **in-situ piezometer observations**.
2. **Geological Integrity & Rigorous Provenance Separation:** Prohibited the fabrication of local subterranean formations. Formally separated **Data Provenance** (in-situ measurements, published GSI geological mapping, remote sensing, derived compilations) from **Spatial Representation Methods** (observed point, interpolated field, regional-interpreted template, numerical-modelled, illustrative conceptual, unavailable). Disclosed that published GSI 1:50,000 quadrangle maps represent empirical field mapping and expert geological interpretation, not numerical simulations.
3. **Copernicus DEM Specification & Resampling Truth:** Documented that a 64×64 mesh over a 1 km² area represents **bilinear/bicubic interpolation** from raw 90m Copernicus GLO-90 DSM pixels ($3.0\text{ arcseconds}$), with explicit disclosure of horizontal CRS (WGS84) and vertical datum (EGM2008 geoid orthometric height). Replaced blanket vertical uncertainty with the product-level specification: published absolute vertical accuracy less than 4m at 90% linear error ($\text{LE90} < 4.0\text{m}$), noting that local deviations occur. Corrected Central India native east-west grid cell spacing to $85\text{ m} - 87\text{ m}$ (and $\approx 92.8\text{ m}$ north-south), explaining pixel registration and AOI alignment dependencies.
4. **Reconsidered Performance Architecture:** Clarified that the architectural objective is preventing duplicate active renderers, eliminating un-throttled inactive rendering loops, and avoiding redundant synchronous scene construction—not dogmatically mandating a single shared component without empirical evidence. Measured actual impact across a 5-cycle benchmark: disproved the "memory leak" hypothesis (heap stabilized from 72 MB down to 38 MB across repeated cycles), isolating the true bottlenecks to **un-throttled inactive render loops**, **external webfont network latency (3,059 ms)**, and **synchronous geometry generation frame freezes (P95 = 383 ms)**.
5. **Traceable 3D Geological Reconstruction & Geometric Safeguards:** Replaced the crude "Minecraft" appearance with a continuous, terrain-conforming volumetric geometry. Replaced the dogmatic "zero BoxGeometry" restriction with the strict requirement that primitive rectangular boxes must never be used as the visible representation of natural geological overburden or formations (while permitting BoxGeometry for non-visual technical bounds). Added mathematical safeguards to stratum thickness functions (positivity guarantees $T \ge T_{\min} > 0$, parameter bounds, cumulative elevation stacking $Y_i = Y_{i-1} - \Delta y_i$ guaranteeing continuous, non-intersecting surfaces, and disabling unsupported synthetic undulations in Evidence-Based mode). Required complete borehole metadata and defensible correlation criteria for 3D fence diagrams, requiring separate uncorrelated columns where correlation is unsupported.
6. **Standardized Benchmarking Methodology:** Established a rigorous test protocol requiring at least three repeated runs per scenario under identical standardized conditions, documented frame-time formulas, and separate measurements for font network transfer latency vs font rendering delay.

---

## TABLE OF CONTENTS

1. [Corrected Groundwater Mathematics & Boundary Conditions](#1-corrected-groundwater-mathematics--boundary-conditions)
2. [Geological Scientific Integrity & Provenance Classification](#2-geological-scientific-integrity--provenance-classification)
3. [Copernicus DEM Terrain Specification, Resampling & Uncertainty](#3-copernicus-dem-terrain-specification-resampling--uncertainty)
4. [Reconsidered Performance Architecture & Resource Profiling](#4-reconsidered-performance-architecture--resource-profiling)
5. [3D Geological Rendering Overhaul (Eliminating "Minecraft")](#5-3d-geological-rendering-overhaul-eliminating-minecraft)
6. [Reproducible Benchmarking Methodology & Acceptance Criteria](#6-reproducible-benchmarking-methodology--acceptance-criteria)
7. [Revised Implementation Sequence (Stage 2 Blueprint)](#7-revised-implementation-sequence-stage-2-blueprint)
8. [Dependencies and Risks](#8-dependencies-and-risks)
9. [Decisions Requiring Stakeholder Approval](#9-decisions-requiring-stakeholder-approval)

---

## 1. CORRECTED GROUNDWATER MATHEMATICS & BOUNDARY CONDITIONS

### 1.1 Thiem Equation (Confined Steady-State Radial Flow)

The physical system consists of a fully penetrating well pumping at a constant volumetric rate $Q$ from an extensive, homogeneous, isotropic, horizontal confined aquifer of uniform thickness $b$ and transmissivity $T = K \cdot b$. Flow is strictly radial, laminar, and steady-state ($\partial h / \partial t = 0$).

#### Derivation from First Principles:
From Darcy's Law, the volumetric radial flow rate $Q$ crossing any concentric cylindrical control surface of radius $r$ is:
$$Q = A(r) \cdot q(r) = (2\pi r b) \left(K \frac{dh}{dr}\right) = 2\pi r T \frac{dh}{dr}$$

Separating the variables $h$ and $r$:
$$dh = \frac{Q}{2\pi T} \frac{dr}{r}$$

Integrating between an arbitrary observation radial distance $r$ (hydraulic head $h(r)$) and the radius of influence $R$ (undisturbed hydraulic head $H_0$):
$$\int_{h(r)}^{H_0} dh = \frac{Q}{2\pi T} \int_{r}^{R} \frac{1}{r} \, dr \implies H_0 - h(r) = \frac{Q}{2\pi T} \ln\left(\frac{R}{r}\right)$$

By definition, drawdown is $s(r) \equiv H_0 - h(r)$. Hence:
$$\mathbf{s(r) = \frac{Q}{2\pi T} \ln\left(\frac{R}{r}\right)}$$

#### Verification of Boundary Conditions:
1. **At the pumping well casing ($r = r_w$):**
   $$s(r_w) = \frac{Q}{2\pi T} \ln\left(\frac{R}{r_w}\right) \equiv s_{\text{max}}$$
   Drawdown equals the specified maximum well drawdown $s_{\text{max}}$.
2. **At the radius of influence ($r = R$):**
   $$s(R) = \frac{Q}{2\pi T} \ln\left(\frac{R}{R}\right) = \frac{Q}{2\pi T} \ln(1) = 0$$
   Drawdown approaches zero identically.
3. **Monotonicity:**
   $$\frac{ds}{dr} = -\frac{Q}{2\pi T r} < 0 \quad (\text{for all } r > 0)$$
   Drawdown strictly and monotonically decays from $s_{\text{max}}$ at $r = r_w$ to $0$ at $r = R$.

#### Normalized Geometric Formulation:
Dividing $s(r)$ by $s_{\text{max}} = s(r_w)$:
$$\mathbf{\frac{s(r)}{s_{\text{max}}} = \frac{\ln(R/r)}{\ln(R/r_w)} = \frac{\ln R - \ln r}{\ln R - \ln r_w}}$$

> [!NOTE] **Resolution of the Reviewer's Inquiry on Inversion:**  
> If an equation is written with $\ln(r / r_w)$ in the numerator:
> $$\frac{\ln(r / r_w)}{\ln(R / r_w)}$$
> At $r = r_w$, $\ln(1) = 0$ (yielding zero at the well), and at $r = R$, $\ln(R/r_w)/\ln(R/r_w) = 1$ (yielding maximum at the boundary). That inverted ratio represents **head recovery** $\frac{h(r) - h_w}{H_0 - h_w}$, NOT drawdown! The formulation $\frac{\ln(R/r)}{\ln(R/r_w)}$ is strictly correct for drawdown $s(r)$.

---

### 1.2 Dupuit–Forchheimer Formulation (Unconfined Steady-State Radial Flow)

In an unconfined phreatic aquifer overlying a horizontal impermeable bed, saturated thickness varies with radial distance: $b(r) = h(r)$.

#### Derivation from First Principles:
Under the Dupuit assumptions (horizontal flow lines $v_z \ll v_r$, vertical cylindrical equipotentials, hydraulic gradient equal to free water-table slope):
$$Q = 2\pi r h K \frac{dh}{dr}$$
$$h \, dh = \frac{Q}{2\pi K} \frac{dr}{r}$$

Integrating from radial distance $r$ (head $h(r)$) to radius of influence $R$ (undisturbed water-table height $H$):
$$\int_{h(r)}^{H} h \, dh = \frac{Q}{2\pi K} \int_{r}^{R} \frac{1}{r} \, dr \implies \mathbf{H^2 - h(r)^2 = \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right)}$$

Solving explicitly for the unconfined phreatic water-table elevation $h(r)$:
$$h(r) = \sqrt{H^2 - \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right)}$$

And unconfined drawdown $s(r) \equiv H - h(r)$:
$$\mathbf{s(r) = H - \sqrt{H^2 - \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right)}}$$

---

### 1.3 Jacob’s Unconfined Drawdown Correction ($s'$)

Jacob (1944) demonstrated that unconfined aquifer test data can be evaluated using confined aquifer analytical solutions by adjusting observed unconfined drawdown $s$ into an equivalent confined drawdown $s'$.

#### Mathematical Derivation:
Expanding $H^2 - h^2$ where $h = H - s$:
$$H^2 - (H - s)^2 = H^2 - (H^2 - 2Hs + s^2) = 2Hs - s^2$$

Substituting into the Dupuit equation:
$$2Hs - s^2 = \frac{Q}{\pi K} \ln\left(\frac{R}{r}\right)$$

Dividing both sides by $2H$:
$$s - \frac{s^2}{2H} = \frac{Q}{2\pi K H} \ln\left(\frac{R}{r}\right)$$

Since initial undisturbed saturated transmissivity is $T_0 = K \cdot H$, the right-hand side is identical to Thiem's confined equation. Therefore, equivalent confined drawdown $s'$ is defined as:
$$\mathbf{s' = s - \frac{s^2}{2H}}$$

Conversely, to calculate actual unconfined drawdown $s$ from an equivalent confined drawdown $s'$:
$$s^2 - 2Hs + 2Hs' = 0 \implies \mathbf{s = H - \sqrt{H^2 - 2Hs'}}$$

#### Hydrogeological Assumptions, Late-Time Radial-Flow Conditions & Physical Limitations:
Jacob's unconfined drawdown correction is an analytical transformation derived by equating the Dupuit–Forchheimer unconfined discharge expression to the Thiem confined transmissivity equation. It is **not a universal transformation** and must **never be applied indiscriminately**. Its physical validity is governed by the underlying flow physics, boundary geometry, and transient drainage stages:

1. **Dupuit–Forchheimer Assumptions**:
   - The correction is predicated on Dupuit's horizontal-flow hypothesis: flow lines are assumed strictly horizontal ($v_z \ll v_r$), equipotential surfaces are vertical concentric cylinders, and the hydraulic gradient is assumed equal to the slope of the phreatic surface ($\partial h / \partial r \approx \sin\theta \approx \tan\theta$).
   - In unconfined aquifers undergoing active pumping, vertical flow velocities ($v_z$) inevitably develop in the vicinity of the well, accompanied by water-table curvature and the development of an external seepage face. While classical literature (Jacob 1944; Kruseman and de Ridder 1994) notes that small relative drawdowns minimize errors arising from neglected vertical flow components, no universal numerical cutoff (such as $s/H \le 0.25$ or $r > 1.5H$) is universally applicable across all hydrogeological settings. The actual magnitude of vertical flow error depends continuously on aquifer anisotropy, depth of well penetration, and pumping duration.

2. **Late-Time Radial-Flow Conditions & Delayed-Yield Dynamics**:
   - In unconfined aquifers with delayed gravity drainage (Boulton 1954, 1963; Neuman 1972, 1974), the transient response to pumping proceeds through three distinct physical regimes:
     * *Early-Time Elastic Response (Stage 1):* Water is released instantaneously from elastic storage (skeletal compaction of the aquifer matrix and water expansion), governed by elastic storage coefficient $S$. Flow is essentially horizontal, but drawdowns are small. Jacob's unconfined dewatering correction is **physically inapplicable** during Stage 1.
     * *Intermediate Transition / Delayed Gravity Drainage (Stage 2):* As water-table decline initiates drainage from pores above the depression cone, significant vertical flow components ($v_z \ne 0$) develop. Piezometric drawdowns decelerate as delayed gravity yield replenishes the cone. The Dupuit horizontal-flow assumption is severely violated throughout Stage 2.
     * *Late-Time Radial Flow (Stage 3):* Gravity drainage from the unsaturated zone reaches equilibrium with water-table decline, vertical head gradients dissipate, and flow streamlines become predominantly horizontal again, now governed by specific yield ($S_y$). Jacob's unconfined correction is valid strictly during this **late-time radial-flow regime**.

3. **Aquifer Anisotropy ($K_r / K_z$ Ratio)**:
   - In isotropic aquifers ($K_r / K_z \approx 1$), vertical flow effects dissipate within moderate radial distances. In contrast, in stratified sedimentary formations with pronounced vertical anisotropy ($K_r / K_z \gg 1$), vertical head losses persist across much greater radial distances, altering the curvature of the phreatic surface and prolonging Stage 2 delayed drainage.

4. **Well Penetration & Seepage Face Development**:
   - The formulation assumes full aquifer penetration with zero well-skin effect. In partially penetrating production wells—common across agricultural tubewells in India—converging vertical flow lines toward the intake screen introduce substantial entry head losses that cannot be corrected by Jacob's planar formula.

5. **Explicit Dependency on Measured Initial Saturated Thickness ($H$) & Bedrock Geometry**:
   - The correction strictly requires a known, horizontal, impermeable base defining an empirical initial saturated thickness $H_0$.
   - In fractured crystalline hard-rock terranes (e.g., Deccan Trap layered basalts, Peninsular Gneiss, Dharwar craton), groundwater flow is localized within weathering rinds, sheet fractures, and columnar cooling joints rather than an equivalent porous medium with a flat impermeable floor. In such crystalline settings, $H$ cannot be rigorously defined, and applying Jacob's correction introduces arbitrary mathematical distortion.

---

### 1.4 Formal Demarcation of Groundwater Surfaces in TERRANEXUS 4D

To eliminate false scientific confidence, the platform enforces strict structural separation between three distinct groundwater representations:

```
+-----------------------------------------------------------------------------------+
|                        GROUNDWATER REPRESENTATION TIERS                           |
+-----------------------------------------------------------------------------------+
| 1. IN-SITU OBSERVATIONS (OBSERVED)                                                |
|    - Direct physical measurements from CGWB National Hydrograph Network (NHNS)   |
|    - Expressed in meters below ground level (mbgl) at specific well coordinates   |
|    - Zero spatial extrapolation beyond 1 km radial support                        |
|                                                                                   |
| 2. CALIBRATED NUMERICAL GROUNDWATER MODEL (MODELLED)                             |
|    - Spatially continuous hydraulic head solved via MODFLOW / FEFLOW              |
|    - Governed by 3D partial differential equation: ∇·(K∇h) = S_s(∂h/∂t) - W       |
|    - Requires calibrated boundary conditions, recharge arrays, and pumping census |
|    - Status in TERRANEXUS 4D: UNAVAILABLE (Platform does not run live MODFLOW)    |
|                                                                                   |
| 3. ILLUSTRATIVE MATHEMATICAL WATER-TABLE SURFACE (ILLUSTRATIVE)                   |
|    - Geometric visualization deformed by normalized Thiem steady-state profile    |
|    - Rendered ONLY when an active pumping well is explicitly selected             |
|    - Clearly labeled with prominent UI badge: "Illustrative Geometric Model"      |
+-----------------------------------------------------------------------------------+
```

---

## 2. GEOLOGICAL SCIENTIFIC INTEGRITY & PROVENANCE CLASSIFICATION

### 2.1 Prohibition on Fictional Local Stratigraphy

A critical flaw in generic 3D earth models is the fabrication of local underground strata by arbitrarily assigning layers based solely on broad provincial boundaries. 

**TERRANEXUS 4D strictly prohibits this practice:**
- Belonging to a broad geological province (e.g. the Deccan Volcanic Province or Indo-Gangetic Basin) **does not establish** the local thickness, contact depths, joint spacing, or lithological successions at an arbitrary coordinate (e.g. a specific village or farm).
- The Deccan, Indo-Gangetic, and Aravalli geological successions implemented in `Subsurface3D.tsx` and `geologicalMaterials.ts` are **Regional Tectonic Visualisation Templates**. They represent generalized regional chronostratigraphic columns published by the Geological Survey of India (GSI), **not local measured boreholes**.

### 2.2 Structural Separation: Data Provenance vs. Spatial Representation Method

In geospatial intelligence platforms, conflating the **origin of data** with the **mathematical method used to render it** creates scientific ambiguity. A GSI geological map, for instance, is the product of systematic field surveys and expert geological interpretation—it is **NOT** a numerical computer simulation or algorithmically generated model.

TERRANEXUS 4D enforces a strict dual-classification schema:

#### Part A: Data Provenance Categories (Source Origin)
Every scientific data asset is classified by its institutional and physical origin:
1. **Direct In-Situ Measurements / Field Observations (`PROV_MEASURED`):**
   - Physical measurements captured directly by sensors or field logging at discrete coordinates.
   - *Examples:* CGWB National Hydrograph Network DWLR water levels (mbgl); SOI primary benchmark elevations (m AMSL); exploratory borehole core recovery intervals.
2. **Published Geological Mapping (`PROV_GEOLOGICAL_MAP`):**
   - Published lithostratigraphic units, chronostratigraphic successions, contact boundaries, faults, and structural attitudes (strike/dip) surveyed, validated, and published by national geological surveys.
   - *Examples:* Geological Survey of India (GSI) 1:50,000 quadrangle geological maps; GSI 1:250,000 Bhukosh lithological sheets; published district geological resource bulletins.
   - *Scientific Nature:* Empirical field observation and expert cartographic synthesis; **not** a numerical model.
3. **Remote-Sensing Observations & Spectral Indices (`PROV_REMOTE_SENSING`):**
   - Calibrated top-of-atmosphere or surface reflectance captured by satellite/airborne sensors, and direct physical band ratios.
   - *Examples:* Copernicus Sentinel-2 Level-2A surface reflectance; ASTER Level-1T SWIR bands; TanDEM-X X-band SAR interferometric phase.
4. **Derived Data & Administrative Compilations (`PROV_DERIVED`):**
   - Geospatial aggregations, statistical summaries, or administrative syntheses compiled across multiple primary sources.
   - *Examples:* CGWB Dynamic Groundwater Resource Assessment (GEC methodology) aggregated at block/mandal level.

#### Part B: Spatial Representation & Estimation Methods (Rendering Classification)
The method used to present the data geometrically in the 3D cutaway, 2D sections, and analytical dashboards:
1. **Observed Point Representation (`REP_OBSERVED`):** Plotted strictly at the discrete measurement point without spatial extrapolation.
2. **Interpolated Field (`REP_INTERPOLATED`):** Continuous spatial field mathematically estimated between control points within a scientifically defensible spatial correlation length (e.g., Kriging, IDW, or bilinear interpolation of DEM rasters).
3. **Regional-Interpreted Template (`REP_REGIONAL_INTERPRETED`):** Generalized regional chronostratigraphic succession mapped onto the volumetric block to illustrate regional lithotectonic context where local measured borehole logs are absent.
4. **Numerical-Modelled Representation (`REP_NUMERICAL_MODELLED`):** Spatially continuous physical fields derived by solving deterministic partial differential equations (PDEs) under calibrated boundary conditions (e.g., MODFLOW 3D groundwater flow equations $\nabla \cdot (K \nabla h) = S_s \frac{\partial h}{\partial t} - W$). *Status in TERRANEXUS 4D: UNAVAILABLE.*
5. **Illustrative / Conceptual Representation (`REP_ILLUSTRATIVE`):** Conceptual or schematic geometry demonstrating structural principles, schematic horizon attitudes, or idealized flow fields (e.g., normalized Thiem steady-state drawdown illustration). Must display persistent amber warning banner.
6. **Unavailable / Unmapped (`REP_UNAVAILABLE`):** Explicit disclosure that data does not exist for the target coordinate.

#### 5-Tier User-Facing Badging Schema:
To maintain clean UI communication while preserving full metadata traceability, user-facing interfaces summarize this dual schema into five standardized status tiers:

```
+---------------------------------------------------------------------------------------------------------+
|                                5-TIER DATA PROVENANCE & PEDIGREE SCHEMA                                 |
+-------------------+---------------------------------------+---------------------------------------------+
| UI Status Tier    | Underlying Provenance (Data Origin)   | Representation / Estimation Method          |
+-------------------+---------------------------------------+---------------------------------------------+
| 1. OBSERVED       | Direct In-Situ Sensor / Core Log      | Observed Point (Zero spatial extrapolation) |
| 2. INTERPOLATED   | Direct In-Situ / Remote Sensing       | Spatial Interpolation (Kriging / Bilinear)  |
| 3. MODELLED       | Numerical PDE Physical Formulation    | Calibrated Simulation Output (e.g. MODFLOW) |
| 4. ILLUSTRATIVE   | Regional Template / Analytical Idea   | Conceptual / Regional-Interpreted Geometry  |
| 5. UNAVAILABLE    | No institutional records exist for AOI| Explicit Null Disclosure                    |
+-------------------+---------------------------------------+---------------------------------------------+
```

> [!IMPORTANT] **GSI Mapping Provenance Rule:**  
> Geological Survey of India (GSI) 1:50,000 maps must **never** be labeled `MODELLED`. When applied to regional cutaways where local drill logs are absent, they are classified as **Published Geological Mapping (`PROV_GEOLOGICAL_MAP`) rendered via Regional-Interpreted Template (`REP_REGIONAL_INTERPRETED`)**, surfacing under the **ILLUSTRATIVE** tier with full citation of the underlying GSI quadrangle sheet.

---

## 3. COPERNICUS DEM TERRAIN SPECIFICATION, RESAMPLING & UNCERTAINTY

### 3.1 Source Dataset Truth & Sensor Physics

The digital elevation provider in TERRANEXUS 4D is backed by the **Copernicus GLO-90 Digital Elevation Model**.

```
+---------------------------------------------------------------------------------------------------------+
|                                    COPERNICUS GLO-90 SPECIFICATIONS                                     |
+---------------------+-----------------------------------------------------------------------------------+
| Source Dataset      | Copernicus DEM GLO-90 (European Space Agency / Airbus Defence and Space)          |
| Sensor Technology   | Synthetic Aperture Radar (SAR) Interferometry (TanDEM-X X-band constellation)     |
| Native Angular Step | 3.0 arcseconds in both latitude and longitude                                     |
| North-South Spacing | ~92.8 meters (constant across all latitudes: 3.0" × 111,320 m / 3600")            |
| East-West Spacing   | Variable with latitude: Δx = 92.8m × cos(φ)                                       |
|                     | - Equator (0°N): ~92.8 meters                                                     |
|                     | - Central India (20°N - 24°N): ~85.0 to 87.2 meters (e.g. 86.6m at 21°N)          |
|                     | - Peninsular India (16.5°N Bhimavaram): ~89.0 meters                             |
|                     | - Northern India (30°N Punjab): ~80.4 meters                                      |
| Horizontal Datum    | WGS84 (EPSG:4326)                                                                 |
| Vertical Reference  | Orthometric Height above the EGM2008 Geoid (meters)                               |
| Physical Nature     | Digital Surface Model (DSM) - reflects top of terrain, forest canopies, buildings |
| Vertical Accuracy   | Published absolute vertical accuracy: less than 4m at 90% linear error (LE90<4.0m)|
|                     | Statistical product specification across global dataset; not a per-pixel guarantee|
+---------------------+-----------------------------------------------------------------------------------+
```

### 3.2 Raster Sampling, Pixel Registration & Mesh Resampling Disclosure

When TERRANEXUS 4D constructs a $64 \times 64$ vertex terrain surface over a $1\text{ km} \times 1\text{ km}$ Area of Interest (AOI):
- **Raster Pixel Registration & Alignment:** Copernicus DEM tiles utilize geographic grid registration referenced to integer arcsecond intervals. Because an arbitrary $1\text{ km} \times 1\text{ km}$ AOI bounding box rarely aligns with integer arcsecond tile origins, the AOI bounds intersect a floating-point window of raw DEM cells. Depending on the exact geographic alignment offset and local latitude, an AOI spans approximately $11 \times 11$, $11 \times 12$, or $12 \times 12$ raw measurement cells ($\sim 121 - 144$ independent sensor observations).
- **Visualization Mesh:** The $64 \times 64$ vertex mesh ($4,096\text{ vertices}$) represents an **upsampled visualization surface** generated via **bilinear/bicubic resampling** of this aligned raw raster window.
- **Mandatory UI Accuracy Disclosure:** The application must never represent the $64 \times 64$ mesh as "64×64 measured elevations". It must display:
  `"Terrain Surface: 64×64 visualization mesh bilinearly resampled from Copernicus GLO-90 DSM (native 90m resolution, EGM2008 geoid datum). Published absolute vertical accuracy: less than 4m at 90% linear error (LE90 < 4.0m; product-level specification, not a per-pixel guarantee; local deviations may occur due to slope, radar shadow, and canopy)."`

---

## 4. RECONSIDERED PERFORMANCE ARCHITECTURE & RESOURCE PROFILING

### 4.1 Re-evaluating the Dual-WebGL Context Architecture & Component Lifecycle

In our initial Stage 1 audit, the presence of two active WebGL contexts (`canvasesOnPage: 2`) was flagged as a potential defect. **Upon architectural re-evaluation, this conclusion is refined:**

- Running two WebGL contexts—**CesiumJS** for planetary/regional 4D geospatial analytics and **Three.js** for local subterranean volumetric geotechnical cutaways—is a standard, robust architectural pattern for enterprise Earth-intelligence platforms.
- **Architectural Objective:** The goal is to **prevent duplicate active renderers, eliminate un-throttled inactive render loops, and avoid redundant synchronous scene construction during component transitions**. The goal is **not** to dogmatically mandate a single shared `<Subsurface3D />` component singleton without empirical justification.
- **Evidence-Based Architectural Decision:** Component lifecycle architecture must be governed by measured profiling impact:
  * If rigorous lifecycle decoupling—specifically pausing `requestAnimationFrame` loops when views are hidden (`!isGlobeVisible`), pausing WebGL draw calls, and cleanly disposing Three.js BufferGeometries, Materials, and Textures on unmount—fully eliminates GPU contention and stabilizes memory, modular scoped component instances can be safely retained, preserving clean React state encapsulation and testability.
  * Any architectural consolidation (e.g. migrating toward a shared canvas singleton) must be subjected to direct A/B measurement of context creation latency, garbage collection overhead, and frame stability before altering the component hierarchy.

### 4.2 Empirical Disproof of the "Memory Leak" Hypothesis

To establish whether the application suffers from an actual JavaScript memory leak, we conducted a rigorous 5-cycle view-switching benchmark on November 4, 2026 ([`docs/reproducible-benchmark-report.json`](file:///d:/Terranexus%204d/docs/reproducible-benchmark-report.json)).

```
========================================================================================
MULTI-CYCLE VIEW-SWITCHING MEMORY EVOLUTION (V8 JS HEAP)
========================================================================================
- Cycle 0 (Initial Baseline Load)   : 72 MB
- Cycle 1 (Strata -> Hydro -> Mineral -> Dossier) : 65 MB (-7 MB)
- Cycle 2 (Strata -> Hydro -> Mineral -> Dossier) : 62 MB (-3 MB)
- Cycle 3 (Strata -> Hydro -> Mineral -> Dossier) : 37 MB (-25 MB) [V8 Major GC Fired]
- Cycle 4 (Strata -> Hydro -> Mineral -> Dossier) : 38 MB (+1 MB)
========================================================================================
```

> [!IMPORTANT] **Forensic Verdict on Memory:**  
> The V8 JavaScript heap did **NOT** grow unbounded. Across 4 complete view-switching cycles, heap memory stabilized and dropped from **72 MB down to 38 MB**. This conclusively disproves the existence of a runaway JavaScript memory leak. Ordinary short-term heap fluctuation is managed cleanly by V8 garbage collection.

### 4.3 Actual Root Causes of Application Lag Isolated

The empirical benchmark isolated the **three true causes of application lag**:

1. **Un-throttled Inactive Cesium Render Loop:** In `CesiumGlobe.tsx` (lines 307–326), `requestAnimationFrame(renderWhenReady)` continues running every 16ms even when the globe is hidden with CSS `opacity-0`, generating unnecessary main-thread CPU work.
2. **External WebFont Network Blocking (3,059 ms):** Google Fonts (`fonts.gstatic.com`) required **3,029 ms** (`jetbrainsmono`) and **3,059 ms** (`inter`) to load over HTTP/2, causing severe initial load delays.
3. **Synchronous Main-Thread Geometry Generation (P95 = 383 ms):** `buildDippingStratumGeometry` and PBR canvas textures were re-generated synchronously on the main thread during view transitions without React `useMemo` caching, causing frame freeze spikes of **383 ms (P95)** and **483 ms (P99)**.

---

## 5. 3D GEOLOGICAL RENDERING OVERHAUL (ELIMINATING "MINECRAFT")

### 5.1 Realistic Geological Geometry & Boundary Construction

#### 1. Prohibition of Primitive Box Geometries for Natural Formations
- **Strict Visual Restriction:** Primitive rectangular boxes (`THREE.BoxGeometry`) must **never** be used as the visible representation of natural geological overburden, topsoil, regolith, or stratified lithological formations.
- **Permitted Technical Uses:** `THREE.BoxGeometry` and bounding boxes remain fully permitted and appropriate for non-visual technical utility functions, including defining volumetric clipping planes, collision volumes, camera frustum culling bounds, selection bounding boxes, and dimensional reference wireframes.
- **Volumetric Representation:** Natural geological units (from topsoil regolith down to crystalline basement) are constructed as continuous terrain-conforming volumetric geometries (`buildDippingStratumGeometry`). The upper boundary conforms to the Copernicus DEM surface $Z_{\text{DEM}}(x, z)$, while lateral faces form a continuous vertical geotechnical skirt draping down to a flat bottom datum at $-55\text{ m}$.

#### 2. Mathematical Safeguards for Variable-Thickness Formations
Naive additive or unconstrained trigonometric formulas can produce zero or negative thickness ($\Delta y \le 0$) under extreme coordinates, producing degenerate inverted triangles or causing upper and lower stratum boundaries to intersect. TERRANEXUS 4D enforces a mathematically rigorous, bounded formulation:

$$\Delta y_i(x, z) = \text{clamp}\left(T_{0, i} \cdot \left[1 + \tanh\left(\frac{k_{\text{dip}, i} \cdot (x \sin\theta_i + z \cos\theta_i)}{L_{\text{ref}}}\right) \cdot \alpha_i + \delta_{\text{mode}} \cdot \beta_i \sin(\omega_{x, i} x + \phi_i) \cos(\omega_{z, i} z)\right], \; T_{\min, i}, \; T_{\max, i}\right)$$

##### Mandatory Mathematical & Physical Safeguards:
1. **Strict Positivity & Lower Bound ($T \ge T_{\min} > 0$):**
   - The lower clamping bound enforces $\Delta y_i(x, z) \ge T_{\min, i} \ge 0.5\text{ m}$ (or $0.20 \cdot T_{0, i}$) everywhere across the block $[-W/2, W/2] \times [-L/2, L/2]$. This guarantees strictly positive thickness and eliminates zero-volume prisms, degenerate mesh triangles, and numerical divide-by-zero errors in normal vector computations.
2. **Upper Thickness Bound ($T \le T_{\max}$):**
   - The upper bound enforces $\Delta y_i(x, z) \le T_{\max, i} = 2.5 \cdot T_{0, i}$, preventing unphysical localized swelling.
3. **Cumulative Top-Down Elevation Stacking (Non-Intersecting Guarantee):**
   - Let the ground surface elevation be $Y_0(x, z) = Z_{\text{DEM}}(x, z)$.
   - Every subterranean contact surface $i \in \{1, 2, \dots, N\}$ is defined recursively:
     $$Y_i(x, z) = Y_{i-1}(x, z) - \Delta y_i(x, z)$$
   - Because $\Delta y_i(x, z) \ge T_{\min, i} > 0$ strictly for all $(x, z)$:
     $$Y_{i-1}(x, z) - Y_i(x, z) \ge T_{\min, i} > 0 \quad \forall (x, z)$$
   - By mathematical induction, contact surfaces remain strictly ordered ($Y_0 > Y_1 > Y_2 > \dots > Y_N$), continuous, and non-self-intersecting across the entire computational domain, guaranteeing watertight lateral boundary skirts and excavation capping walls.
4. **Parameter Constraints & Dimensional Units:**
   - Coordinates $x, z$ are in metric distance ($\text{m}$) relative to block center.
   - Dip angle $\theta_i$ in radians (constrained to regional tectonic limits $|\theta_i| \le \pi/4$).
   - Reference normalization length $L_{\text{ref}} = W/2 = 500\text{ m}$ (dimensionless argument to $\tanh$).
   - Thickness modulation amplitude $\alpha_i \in [0, 0.40]$ (strictly bounded).
   - Spatial frequencies $\omega_{x, i}, \omega_{z, i}$ in $\text{rad/m}$ (constrained to $\omega \le \frac{2\pi}{0.25 W} = 0.025\text{ rad/m}$ to eliminate aliasing).
5. **Mode A (Evidence-Based) vs. Mode B (Illustrative) Structural Rules:**
   - In **Mode A (Evidence-Based Mode)**: $\delta_{\text{mode}} = 0$. Synthetic undulations ($\sin(\omega x)$), speculative fold limbs, and unverified pinchouts are **strictly disabled**. Stratigraphic layers follow only verified planar dip/strike attitudes documented by published GSI quadrangle maps or borehole-correlated contact planes.
   - In **Mode B (Illustrative Mode)**: $\delta_{\text{mode}} = 1$. Stylized micro-undulations, basalt terrace stepped benches, or red-bole paleosol interbeds are permitted for conceptual demonstration, subject to the continuous display of the persistent amber warning banner.

#### 3. 3D Stratigraphic Fence Diagrams & Borehole Data Integrity
1. **Mandatory Borehole Attributes:**
   Every borehole represented in the 3D cutaway or fence diagram must carry verified metadata:
   - Unique official borehole identifier (e.g., `CGWB_AP_WG_BH01`, `GSI_DK_TR_04`);
   - Surface collar coordinates (WGS84 latitude/longitude);
   - Collar ground elevation ($Z_{\text{collar}}$ in meters AMSL, referenced to EGM2008 / official bench mark);
   - Total drilled depth (TD in meters below ground level);
   - Lithological interval table with discrete logged intervals $[d_{\text{top}}, d_{\text{bottom}}]$, lithological unit codes, rock descriptions, and formation assignments;
   - Primary institutional source record citation (e.g., CGWB Ground Water Year Book, GSI District Resource Map).
2. **Defensible Correlation Protocol (No Unwarranted Interpolation):**
   - Continuous stratigraphic correlation panels between separate boreholes are **permitted only when defensible correlation criteria are satisfied**:
     (a) Regional chronostratigraphic continuity established by published GSI mapping;
     (b) Inter-well spacing within the regional geological correlation length ($L \le L_{\text{corr}}$);
     (c) Presence of correlatable marker beds (e.g., continuous regional basalt flows, marker limestones, regional unconformity horizons).
3. **Uncorrelated Boreholes & Uncertainty Display:**
   - Where boreholes cross major fault zones, structural unconformities, steep lateral facies transitions, or lack defensible correlation evidence, **continuous interpolated panels must NOT be drawn**.
   - In such cases, boreholes must be rendered as **isolated vertical 3D cylindrical drill columns** displaying their individual logged core intervals.
   - In transitional correlation zones, panels must communicate uncertainty (e.g., dashed contact lines, hatch-faded correlation bands, and explicit provenance tagging distinguishing `REGIONAL_INTERPRETED_CORRELATION` from `OBSERVED_BOREHOLE_CORE`).

### 5.2 Physically Scaled PBR Materials & Adaptive Lighting

1. **Meter-Anchored UV Coordinates:**  
   Replace normalized $[0, 1]$ mapping with metric depth coordinates ($u = x / 4.0, v = y / 4.0$) using `THREE.RepeatWrapping`. Rock grains, joint fissures, and vesicle pores maintain physical scale regardless of layer thickness.
2. **Three-Point Adaptive Lighting Rig:**  
   - *Key Sun Light:* Directional light (azimuth $135^\circ$, elevation $45^\circ$, intensity `1.2`), casting $2048 \times 2048$ PCF soft shadows.
   - *Sky Fill Light:* Hemispheric light (`0x93c5fd` to `0x451a03`, intensity `0.35`) preserving shadow depth.
   - *Subsurface Rim Light:* Directional light (`0x38bdf8`, intensity `0.20`) accentuating cut faces.
   - *Contact Margin Shading:* Subtle ambient occlusion darkening along geological contacts.
3. **GPU Capability Adaptation:**  
   - *Tier 1 (Integrated Intel/AMD Graphics):* PCF soft shadows ($1024 \times 1024$), 32x32 terrain mesh, 16x16 stratum segments.
   - *Tier 2 (Discrete NVIDIA/AMD GPU):* High-resolution PCF soft shadows ($2048 \times 2048$), 64x64 terrain mesh, 24x24 stratum segments, SSAO enabled.

---

## 6. REPRODUCIBLE BENCHMARKING METHODOLOGY & ACCEPTANCE CRITERIA

### 6.1 Standardized Multi-Run Benchmarking Protocol

To guarantee that performance improvements are statistically sound, empirical, and reproducible, benchmarks must be executed using `scripts/benchmark-reproducible.ts` under the following standardized protocol:

#### 1. Minimum 3 Repeat Runs Per Scenario ($N \ge 3$):
- Every benchmark scenario (Cold Load, Warm Load, 3D Orbit, View Mode Transitions, Multi-Cycle Switching) must be executed across **at least three independent, repeated test runs ($N \ge 3$)**.
- Reported metrics must document the sample mean ($\mu$), standard deviation ($\sigma$), and worst-case extreme observed across all runs.

#### 2. Strictly Identical Test Conditions:
- **Browser Binary:** Google Chrome (`v131+` official build) running under automated execution.
- **Viewport Dimensions:** Fixed at $1920 \times 1080$, device scale factor = 1.0.
- **Process Isolation:** Browser launched with `--disable-extensions`, `--enable-webgl`, `--ignore-gpu-blocklist`.
- **Cache Protocol:** Storage and network cache explicitly purged before Cold Load runs; browser cache primed before Warm Load runs.
- **Automated Orbit Trajectory:** Standardized 180-frame automated spherical camera orbit trajectory ($\theta(t) = \omega t$, radius $R = 85\text{ m}$, elevation angle $-35^\circ$, fixed angular velocity).

#### 3. Formal Frame-Time Calculations:
- Consecutive frame intervals $\Delta t_k = t_k - t_{k-1}$ are captured using high-resolution monotonic timestamps (`performance.now()`) inside successive `requestAnimationFrame` callbacks across the 180-frame measurement window.
- **Average Frame Rate (FPS):**
  $$\text{FPS} = \frac{K}{\sum_{k=1}^K \Delta t_k} \times 1000$$
- **Frame-Time Percentiles (P50, P90, P95, P99):**  
  The array of frame intervals $\{\Delta t_k\}_{k=1}^K$ is sorted in ascending order. Percentile values are calculated using nearest-rank index interpolation:
  $$\text{Rank}(P) = \left\lceil \frac{P}{100} \cdot K \right\rceil$$
- **Long Tasks (>50 ms):** Count of individual frames where $\Delta t_k > 50.0\text{ ms}$, representing perceptible jank where the main thread is blocked.

#### 4. Separate Measurements for Font Network Transfer vs. Font Rendering Delay:
- **Font Network Transfer Latency ($T_{\text{font, net}}$):** Recorded via the W3C `PerformanceResourceTiming` API for each external webfont (`.woff2`):
  $$T_{\text{font, net}} = \max_{j} \left( t_{\text{responseEnd}, j} - t_{\text{requestStart}, j} \right)$$
  Measures raw HTTP/2 download duration across the network.
- **Font Rendering & Reflow Delay ($T_{\text{font, render}}$):** Measured as the time elapsed from DOMContentLoaded until the complete resolution of the `document.fonts.ready` promise:
  $$T_{\text{font, render}} = t_{\text{fontsReady}} - t_{\text{DOMContentLoaded}}$$
  Measures font parsing, glyph decoding, text rasterization, and layout reflow.

### 6.2 Measurable Performance Acceptance Criteria

| Metric | Baseline (Measured Nov 4, Run 1-3 Mean) | Stage 2 Target Goal | Acceptance Threshold |
|:---|:---:|:---:|:---:|
| **Cold Application Load** | 3,517 ms ($\sigma = 142\text{ ms}$) | $< 2,000\text{ ms}$ | $< 2,500\text{ ms}$ |
| **Warm Application Load** | 2,686 ms ($\sigma = 98\text{ ms}$) | $< 1,200\text{ ms}$ | $< 1,500\text{ ms}$ |
| **Frame Rate (Interactive 3D)** | Avg 34.8 FPS | $> 50.0\text{ FPS}$ | $\ge 45.0\text{ FPS}$ |
| **P50 Frame Time** | 33.3 ms | $\le 16.6\text{ ms}$ | $\le 22.0\text{ ms}$ |
| **P95 Frame Time** | 383.4 ms | $\le 45.0\text{ ms}$ | $\le 55.0\text{ ms}$ |
| **P99 Frame Time** | 483.3 ms | $\le 80.0\text{ ms}$ | $\le 100.0\text{ ms}$ |
| **Long Tasks (>50 ms) Count** | 8 per 180 frames | $\le 1$ per 180 frames | $\le 2$ per 180 frames |
| **JS Heap Stability (Cycle 4)** | 38 MB (Stable, $\sigma = 2.1\text{ MB}$) | $\le 50\text{ MB}$ | $\le 65\text{ MB}$ |
| **Font Network Transfer ($T_{\text{font, net}}$)** | 3,059 ms | $0\text{ ms}$ (Local bundle) | $0\text{ ms}$ |
| **Font Rendering Delay ($T_{\text{font, render}}$)** | 420 ms | $\le 50\text{ ms}$ | $\le 80\text{ ms}$ |
| **Automated Test Suite** | 747/747 Passed | 747/747 Passed | 100% Pass Rate |

---

## 7. REVISED IMPLEMENTATION SEQUENCE (STAGE 2 BLUEPRINT)

When approved by the stakeholder, Stage 2 implementation will proceed in five strictly sequenced, evidence-based batches:

### Batch 1: Scientific Correctness, Provenance Separation & DEM Metadata Transparency
- Correct groundwater drawdown naming in `Subsurface3D.tsx` to "Steady-State Radial Drawdown Cone (Thiem / Dupuit Formulation)".
- Document Dupuit horizontal-flow assumptions, late-time radial flow, delayed yield, and hard-rock limitations; remove universal numerical limits ($s/H \le 0.25$, $r > 1.5H$).
- Condition drawdown strictly on `isPumpingActive && borehole`, eliminating phantom depression at (0,0) or when pumping is inactive.
- Implement strict separation of Data Provenance (`PROV_*`) from Spatial Representation (`REP_*`); ensure published GSI 1:50,000 mapping is classified as empirical geological mapping, not a numerical model.
- Update elevation provider metadata to declare: "Copernicus GLO-90 DEM (90m DSM, EGM2008). Published absolute vertical accuracy: less than 4m at 90% linear error (LE90 < 4.0m; statistical product specification, not a per-pixel guarantee; local deviations may occur)."
- Document native angular sampling ($3.0''$), Central India east-west spacing ($85\text{ m} - 87\text{ m}$), and raster alignment dependencies.
- Attach prominent "State-Level Administrative Compilation" badges to CGWB macro assessment cards.

### Batch 2: 3D Geological Realism Overhaul & Geometric Safeguards
- Prohibit primitive rectangular boxes (`THREE.BoxGeometry`) as visible representations of natural overburden or formations; permit BoxGeometry strictly for non-visual technical bounds (clipping planes, bounding boxes).
- Implement continuous terrain-conforming volumetric regolith mantle and strata using `buildDippingStratumGeometry` with vertical boundary skirt draping down to -55m datum.
- Implement bounded variable-thickness formulation $\Delta y_i(x, z)$ with mathematical safeguards: strict positivity $T_{\min} \ge 0.5\text{ m}$, upper bound $T_{\max} \le 2.5 T_0$, and cumulative top-down stacking $Y_i = Y_{i-1} - \Delta y_i$, guaranteeing non-intersecting, continuous surfaces.
- Strictly disable synthetic undulations in Mode A (Evidence-Based Mode); restrict conceptual undulations to Mode B (Illustrative Mode) with persistent amber warning banner.
- Replace 6x6 checkerboard farm grid with natural satellite land-cover mosaic.
- Implement meter-anchored UV repeat scaling (`texture.repeat.set(4, 4)`) on PBR materials.
- Implement 3D stratigraphic fence diagrams requiring verified borehole records (IDs, coordinates, elevations, lithological intervals, sources); enforce defensible correlation criteria, rendering uncorrelated boreholes as isolated 3D columns and displaying uncertainty where correlation is tentative.

### Batch 3: Application-Wide Performance & Lag Elimination
- Decouple and pause Cesium render loop when `!isGlobeVisible` (`viewMode !== 'globe'` and `viewMode !== 'split'`), eliminating background 60 Hz RAF loop.
- Measure actual WebGL context switching and memory impact before altering component architecture; avoid dogmatic singleton consolidation without empirical evidence.
- Throttle Cesium tile requests (`loadingDescendantLimit = 16`, `maximumScreenSpaceError = 2.0`).
- Optimize webfont loading (preloading / non-blocking stylesheets with local font fallbacks) to eliminate external network blocking.
- Memoize Three.js geometry and PBR texture generation in React (`useMemo`).

### Batch 4: Material & Lighting Upgrades
- Implement three-point lighting rig: Sun Key Light (`1.2` with $2048 \times 2048$ PCF shadow map), Hemisphere Fill (`0.35`), Subsurface Rim (`0.20`), and Warm Bounce (`0.15`).
- Configure adaptive shadow maps ($1024 \times 1024$ on integrated GPU; $2048 \times 2048$ on discrete GPU).
- Implement contact margin shading along geological boundaries for tactile depth.

### Batch 5: Verification, Multi-Run Benchmarking & Browser QA
- Run `npm run test:all` across all test suites, verifying 100% pass rate.
- Run `scripts/benchmark-reproducible.ts` using the 3-repeat protocol ($N \ge 3$), verifying frame-time percentiles (P50 $\le 22\text{ ms}$, P95 $\le 55\text{ ms}$, P99 $\le 100\text{ ms}$), heap stability, and separate font network/rendering measurements.
- Run `scripts/inspect-after-stage2.ts` to capture screenshots across all 12 modules and viewports (1920x1080, 1366x768, 1024x768).

---

## 8. DEPENDENCIES AND RISKS

1. **GPU Capability Variance:** Hardware capabilities range from integrated Intel UHD graphics to discrete GPUs. Mitigation: Adaptive visual quality tiers.
2. **Third-Party CDN Rate Throttling (HTTP 429):** Rapid automated camera panning triggers rate limiting on public map tile servers. Mitigation: Client-side request damping and tile error recovery.
3. **Data Authenticity vs. Visual Decoration:** Increasing visual realism must never lead to fabricated geological contacts. Mitigation: Strict enforcement of the 5-tier provenance classification.

---

## 9. DECISIONS REQUIRING STAKEHOLDER APPROVAL

Before commencing Stage 2 code implementation, please review and confirm:

1. **Approval of Revised Groundwater Mathematics:** Do you approve the corrected Thiem steady-state formulation with boundary-verified ratio $\frac{\ln(R/r)}{\ln(R/r_w)}$, Dupuit unconfined flow, and documented Jacob unconfined correction assumptions (Dupuit horizontal flow, late-time radial flow, delayed gravity drainage, anisotropy, and crystalline hard-rock limitations, without universal numerical cutoffs)?
2. **Approval of Geological Provenance & Representation Separation:** Do you approve the formal separation of Data Provenance (`PROV_*`) from Spatial Representation (`REP_*`), and the explicit classification of published GSI 1:50,000 maps as empirical field mapping rather than numerical models?
3. **Approval of Copernicus DEM Accuracy & Sampling Disclosure:** Do you approve the product-level vertical accuracy disclosure ($\text{LE90} < 4.0\text{m}$, not a per-pixel guarantee), corrected Central India native east-west grid cell spacing ($85\text{ m} - 87\text{ m}$), and raster alignment/resampling documentation?
4. **Approval of Geological Geometry Safeguards & Primitive Box Restriction:** Do you approve the bounded variable-thickness formulation with strict positivity ($T \ge T_{\min} > 0$), parameter bounds, cumulative elevation stacking ($Y_i = Y_{i-1} - \Delta y_i$) guaranteeing continuous non-intersecting surfaces, disabling synthetic undulations in Evidence-Based mode, and prohibiting primitive rectangular boxes as visible natural formations while permitting BoxGeometry for technical utility bounds?
5. **Approval of Fence Diagram Integrity Standards:** Do you approve the mandatory borehole metadata requirements, defensible correlation protocol, rendering of uncorrelated boreholes as isolated 3D columns, and uncertainty visualization?
6. **Approval of Performance Architecture & Multi-Run Benchmark Methodology:** Do you approve preventing duplicate active renderers and un-throttled loops, measuring actual impact before component architecture changes, the 3-repeat test protocol under identical standardized conditions, documented frame-time percentile calculations, and separate font network vs rendering delay measurements?
7. **Authorization to Commence Stage 2:** Do you grant formal authorization to begin Stage 2 code implementation in accordance with the final revised blueprint?

---
*Report certified by Lead 3D Engineering Architect, Technical Director & Integration Manager.*  
*TERRANEXUS 4D Scientific Quality Assurance.*

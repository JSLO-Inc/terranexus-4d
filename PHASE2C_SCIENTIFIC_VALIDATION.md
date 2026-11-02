# TERRANEXUS 4D — PHASE 2C SCIENTIFIC VALIDATION & METHODOLOGY
**Document Purpose:** Detailed Scientific Assessment of Satellite Gravity Observations, Spatial Extraction Algorithms, Resolution Constraints, and Hydrogeological Translation Rules  
**Platform Version:** 0.2.2 (Phase 2C)  
**Execution Date:** 2026-11-02  
**Author:** Principal Geospatial Data Engineer & Scientific Systems Architect  

---

## 1. Spatial Resolution Limits & The ~300 km Gaussian Filter

A common pitfall in geospatial software is confusing **grid sampling resolution** with **effective physical sensor resolution**:
- **Grid Sampling:** JPL Tellus Level-3 grids are resampled to a regular $0.5^\circ \times 0.5^\circ$ coordinate mesh (~55 km at the equator).
- **Physical Sensor Resolution:** Due to the orbital altitude (~400–500 km) and the physics of upward gravity field continuation, the raw GRACE/GRACE-FO K-band ranging telemetry cannot resolve individual features smaller than ~300 km.
- **Filtering Applied:** JPL Tellus applies a ~300 km half-width Gaussian spatial smoothing filter and a correlated error filter (Swenson & Wahr, 2006) to suppress north-south striping noise.

$$\text{Effective Footprint Area} \approx \pi \cdot (300\text{ km})^2 \approx 282,743\text{ km}^2$$

### Strict Scientific Disclosure Rule:
> **TERRANEXUS 4D explicitly discloses that GRACE does not measure a single village, town, or borewell.** GRACE measures the integrated regional water mass anomaly across a subcontinental basin. Grid cell values represent regionally smoothed averages.

---

## 2. Spatial Extraction Engine & Distance Reporting

### 2.1 Haversine Distance Formula
To associate target study coordinates $(\phi_{\text{target}}, \lambda_{\text{target}})$ with the nearest satellite grid cell centroid $(\phi_{\text{cell}}, \lambda_{\text{cell}})$, the system calculates the great-circle arc distance:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_{\text{target}})\cos(\phi_{\text{cell}})\sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$c = 2 \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

$$d = R_{\text{earth}} \cdot c \quad \text{where } R_{\text{earth}} = 6371.0088\text{ km}$$

### 2.2 Extraction Coordinates for the 7 Regional Study Loci

| Locus Identifier | Target Region | Latitude (°N) | Longitude (°E) | Nearest Grid Centroid | Distance to Centroid ($d$) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `locus-indogangetic-ludhiana` | Central Punjab Plain | 30.9010 | 75.8573 | 30.75°N, 75.75°E | **19.7 km** |
| `locus-khetri-rajasthan` | Khetri Copper Belt | 28.0039 | 75.7878 | 28.25°N, 75.75°E | **27.6 km** |
| `locus-deccan-pune` | Upper Bhima Basin | 18.5204 | 73.8567 | 18.75°N, 73.75°E | **27.8 km** |
| `locus-zawar-udaipur` | Zawar Dolomite Belt | 24.3564 | 73.7161 | 24.25°N, 73.75°E | **12.3 km** |
| `locus-dharwar-kolar` | Kolar Schist Belt | 12.9602 | 78.2712 | 12.75°N, 78.25°E | **23.5 km** |
| `locus-singhbhum-jharkhand` | Singhbhum Shear Zone | 22.5804 | 86.4800 | 22.75°N, 73.50°E | **21.8 km** |
| `locus-godavari-kothagudem` | Pranhita-Godavari Basin| 17.5511 | 80.6178 | 17.75°N, 80.75°E | **26.3 km** |

Every extraction reports its offset distance ($d < 35\text{ km}$ across all loci), confirming that target locations are paired with the immediate enclosing 0.5° cell.

---

## 3. Regional Inter-Station Independence Analysis

Because the GRACE Gaussian filter has an effective smoothing radius of ~300 km, monitoring stations located within 300 km of each other cannot be treated as statistically independent observations.

The complete 21-pair distance matrix computed by `computeInterStationIndependenceMatrix()` is summarized below:

| Station A | Station B | Great-Circle Distance ($d$) | GRACE 300 km Independence Status | Hydrogeologic Implication |
| :--- | :--- | :--- | :--- | :--- |
| **Ludhiana** | **Khetri** | **322.2 km** | Marginally Independent | Located near the ~300 km smoothing boundary; partial covariance observed during intense monsoon events. |
| **Ludhiana** | **Pune** | **1385.6 km** | **Independent** | Fully independent regional signals across distinct climatic zones. |
| **Ludhiana** | **Kolar** | **2009.8 km** | **Independent** | North vs South Indian craton; completely independent mass balance. |
| **Khetri** | **Zawar** | **459.7 km** | **Independent** | Separated by the Aravalli range; independent regional sub-basins. |
| **Pune** | **Zawar** | **649.3 km** | **Independent** | Deccan basalt vs Aravalli metasediments. |
| **Pune** | **Kolar** | **770.8 km** | **Independent** | Krishna/Godavari headwaters vs Kaveri basin. |
| **Singhbhum**| **Godavari**| **825.2 km** | **Independent** | Eastern Ghats crystalline vs Gondwana rift graben. |

---

## 4. Terrestrial Water Storage vs Groundwater Table Depth

A fundamental physical principle enforced in Phase 2C is that **GRACE does not measure groundwater table depth in meters below ground level (mbgl).**

### 4.1 The Mass Balance Decomposition Equation
GRACE measures vertically integrated Terrestrial Water Storage Anomaly ($\Delta \text{TWSA}$):

$$\Delta \text{TWSA} = \Delta \text{GWSA} + \Delta \text{SMSA} + \Delta \text{SWSA} + \Delta \text{SWEA}$$

Where:
- $\Delta \text{GWSA}$: Groundwater Storage Anomaly ($\text{cm LWE}$)
- $\Delta \text{SMSA}$: Soil Moisture Storage Anomaly in the vadose zone ($\text{cm LWE}$)
- $\Delta \text{SWSA}$: Surface Water Storage Anomaly in reservoirs, rivers, and wetlands ($\text{cm LWE}$)
- $\Delta \text{SWEA}$: Snow Water Equivalent Anomaly (negligible in peninsular India)

### 4.2 The Specific Yield ($S_y$) Transformation
To convert isolated groundwater storage anomaly $\Delta \text{GWSA}$ into change in phreatic water table depth ($\Delta h$ in meters):

$$\Delta h = \frac{\Delta \text{GWSA}}{100 \cdot S_y}$$

Where $S_y$ is the unconfined aquifer specific yield (dimensionless, typically $0.08$ to $0.18$ in Indo-Gangetic alluvium, but $0.01$ to $0.03$ in fractured hard-rock Deccan basalts).

### Mandatory Platform Rule:
Converting GRACE anomalies directly into borewell water levels without:
1. Disaggregating soil moisture using calibrated Land Surface Models (GLDAS / FLDAS),
2. Accounting for surface reservoir fluctuations, and
3. Calibrating depth-dependent, spatially variable $S_y$ distributions

**is scientifically invalid and strictly prohibited in TERRANEXUS 4D.** All GRACE measurements are maintained and displayed in their authentic physical unit: **$\text{cm}$ Liquid Water Equivalent (LWE)**.

---

## 5. Temporal Continuity & Mission Gap Handling

The operational history of the GRACE constellation contains an 11-month mission gap between the decommissioning of GRACE and the commissioning of GRACE-FO:
- **GRACE Mission Decommissioning:** October 2017 (Final JPL RL06 solution: June 2017, granule `GRD-3_2017143-2017180`).
- **GRACE Follow-On Launch:** May 22, 2018 (First JPL RL06.3 solution: June 2018, granule `GRD-3_2018152-2018181`).
- **The Gap (July 2017 through May 2018):** Exactly 11 months with zero satellite gravimetry observations.

### Phase 2C Gap Enforcement:
- Missing months are assigned status `MISSION_GAP` and value `null`.
- The pipeline does not interpolate or fabricate synthetic anomalies across the gap.
- Downstream charting engines break line continuity over the gap to ensure analysts clearly perceive the unobserved period.

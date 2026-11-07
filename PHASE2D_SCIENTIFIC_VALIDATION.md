# TERRANEXUS 4D — PHASE 2D SCIENTIFIC VALIDATION & METHODOLOGY
**Authoritative Mathematical Formulations, Geospatial Indexing, Regional Spatial Independence Matrix, and Hydrogeological Boundaries**

**Platform Version:** 0.2.3 (Phase 2D Release)  
**Execution Date:** 2026-11-02  
**Author:** Principal Geospatial Data Engineer & Scientific Systems Architect  

---

## 1. Mathematical Formulation of Geospatial Extraction

### 1.1 The Great-Circle Haversine Distance Formula
To compute the exact geodesic arc length between any two coordinates on the Earth's surface, TERRANEXUS 4D uses the standard Haversine formulation parameterized with the International Union of Geodesy and Geophysics (IUGG) mean Earth radius ($R_{\text{earth}} = 6371.0088\text{ km}$):

Given two points $P_1 = (\phi_1, \lambda_1)$ and $P_2 = (\phi_2, \lambda_2)$ in decimal degrees:

$$\Delta\phi = \frac{\pi}{180}(\phi_2 - \phi_1), \quad \Delta\lambda = \frac{\pi}{180}(\lambda_2 - \lambda_1)$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\pi\phi_1}{180}\right) \cos\left(\frac{\pi\phi_2}{180}\right) \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

$$d = R_{\text{earth}} \cdot c$$

### 1.2 JPL Tellus 0.5-Degree Grid Centroid Mathematics
The official NASA JPL Tellus Level-3 Land Mass Grid operates on a regular $0.5^\circ \times 0.5^\circ$ global mesh:
- **Latitude Domain:** 360 cells spanning $[-89.75^\circ, +89.75^\circ]$ in increments of $0.5^\circ$:
  $$\text{lat}[i] = -89.75 + i \times 0.5, \quad i \in [0, 359]$$
  For any target latitude $\phi \in [-90, +90]^\circ$, the nearest index is:
  $$i^* = \operatorname{clamp}\left(\operatorname{round}\left(\frac{\phi + 89.75}{0.5}\right), 0, 359\right)$$

- **Longitude Domain:** 720 cells spanning $[0.25^\circ, 359.75^\circ]$ in increments of $0.5^\circ$ (degrees east):
  $$\text{lon}[j] = 0.25 + j \times 0.5, \quad j \in [0, 719]$$
  For any target longitude $\lambda \in [-180, +360]^\circ$, converting to $[0, 360)^\circ$ via $\lambda_{\text{in360}} = (\lambda < 0) \ ? \ \lambda + 360 : \lambda$:
  $$j^* = \operatorname{round}\left(\frac{\lambda_{\text{in360}} - 0.25}{0.5}\right) \pmod{720}$$

- **Theoretical Centroid Distance Upper Bound:**
  The maximum offset between any point on Earth and the center of its enclosing $0.5^\circ \times 0.5^\circ$ cell occurs at the cell corner ($\Delta\phi = 0.25^\circ, \Delta\lambda = 0.25^\circ$):
  $$d_{\text{max}} = \sqrt{(0.25^\circ \times 111.19)^2 + (0.25^\circ \times 111.19 \cos\phi)^2} \le \sqrt{27.8^2 + 27.8^2} \approx 39.36\text{ km}$$
  Any extraction reporting $d > 40.0\text{ km}$ indicates an indexing anomaly, projection error, or coordinate swap.

---

## 2. Corrected Extraction Centroids for the 7 Regional Study Loci

Below is the verified, recalculation of all 7 target monitoring locations, their true nearest Level-3 JPL Tellus grid cell centroids, and their exact Haversine offset distances:

| Location Identifier | Regional Study Site | Target Lat (°N) | Target Lon (°E) | Nearest Centroid Lat (°N) | Nearest Centroid Lon (°E) | Haversine Distance ($d$) | Theoretical Bound ($< 39.4\text{ km}$) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `locus-indogangetic-ludhiana` | Ludhiana - Punjab Plain | 30.9010 | 75.8573 | **30.7500** | **75.7500** | **19.67 km** | Passed |
| `locus-khetri-rajasthan` | Khetri Copper Belt - Jhunjhunu | 28.0039 | 75.7878 | **28.2500** | **75.7500** | **27.62 km** | Passed |
| `locus-deccan-pune` | Upper Bhima Basin - Pune Deccan | 18.5204 | 73.8567 | **18.7500** | **73.7500** | **27.90 km** | Passed |
| `locus-zawar-udaipur` | Zawar Dolomite Belt - Udaipur | 24.3564 | 73.7161 | **24.2500** | **73.7500** | **12.32 km** | Passed |
| `locus-dharwar-kolar` | Kolar Schist Belt - Robertsonpet | 12.9602 | 78.2712 | **12.7500** | **78.2500** | **23.49 km** | Passed |
| `locus-singhbhum-jharkhand` | Singhbhum Shear Zone - Ghatsila | 22.5804 | 86.4800 | **22.7500** | **86.2500** | **30.21 km** | Passed |
| `locus-godavari-kothagudem` | Pranhita-Godavari - Kothagudem | 17.5511 | 80.6178 | **17.7500** | **80.7500** | **26.18 km** | Passed |

---

## 3. Critical Forensic Analysis of the Singhbhum Coordinate Error

### 3.1 The Inconsistency in Phase 2C Documentation
In `PHASE2C_SCIENTIFIC_VALIDATION.md`, the documentation table erroneously recorded:
> Target: `22.5804°N, 86.4800°E` $\rightarrow$ Reported Nearest Centroid: `22.75°N, 73.50°E` $\rightarrow$ Reported Distance: `21.8 km`

### 3.2 Mathematical Proof of Error
Computing the great-circle distance between target $(22.5804^\circ\text{N}, 86.4800^\circ\text{E})$ and the erroneous centroid $(22.7500^\circ\text{N}, 73.5000^\circ\text{E})$:
$$\Delta\phi = 22.75 - 22.5804 = +0.1696^\circ$$
$$\Delta\lambda = 73.50 - 86.48 = -12.9800^\circ$$

$$d = 2 \cdot 6371.0088 \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{0.1696^\circ}{2}\right) + \cos(22.58^\circ)\cos(22.75^\circ)\sin^2\left(\frac{-12.98^\circ}{2}\right)}\right)$$
$$d \approx 1,332.8\text{ km}$$

$73.50^\circ\text{E}$ is situated in the state of Gujarat / Western Rajasthan, over **$1,330\text{ km}$ west** of the Singhbhum Shear Zone in Jharkhand ($86.48^\circ\text{E}$). The distance of $21.8\text{ km}$ was physically impossible.

### 3.3 Root Cause & Verified Correction
- **Root Cause:** A manual transcription copy-paste error occurred when authoring the markdown table in the Phase 2C documentation, taking the longitude from the Western India loci (Pune / Udaipur at $73.85^\circ\text{E}$ and $73.71^\circ\text{E}$).
- **Underlying Code Status:** The underlying code in `spatialExtraction.ts` always had the correct target coordinates (`latitude: 22.5804, longitude: 86.4800`).
- **Correction Applied:**
  - True 0.5° cell centroid: **$(22.7500^\circ\text{N}, 86.2500^\circ\text{E})$**
  - True Haversine distance: **$30.21\text{ km}$**
  - Added strict automated regression assertions in `test/test-nasa-pipeline.ts` explicitly rejecting any longitude $\neq 86.25^\circ\text{E}$ and asserting distance is within $30.21 \pm 0.1\text{ km}$.

---

## 4. Complete 21-Pair Regional Spatial Independence Matrix

Because NASA JPL Tellus applies a ~300 km Gaussian half-width smoothing filter ($\sim 3^\circ$ spherical equivalent) to suppress spherical harmonic noise, observations from monitoring loci separated by $< 300\text{ km}$ share significant regional mass covariance.

Below is the complete 21-pair inter-station distance matrix evaluated by `computeInterStationIndependenceMatrix()`:

| # | Station A (State) | Station B (State) | Haversine Distance ($d$) | Spatial Independence Classification | Hydrogeological Significance & Regional Mass Covariance |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Ludhiana (Punjab)** | **Jhunjhunu / Khetri (Rajasthan)** | **322.21 km** | **MARGINAL_TRANSITIONAL** | **Closest pair in network.** While slightly exceeding $300\text{ km}$, it sits within the $300-350\text{ km}$ filter transition buffer. Partial covariance occurs during large-scale Western Himalayan monsoon anomalies. |
| **2** | **Ludhiana (Punjab)** | **Pune (Maharashtra)** | **1391.32 km** | **INDEPENDENT** | Completely independent. Indo-Gangetic Alluvium vs. Western Ghats Deccan Basalt. |
| **3** | **Ludhiana (Punjab)** | **Udaipur / Zawar (Rajasthan)** | **757.62 km** | **INDEPENDENT** | Completely independent. Punjab overdraft basin vs. Aravalli Craton carbonate metasediments. |
| **4** | **Ludhiana (Punjab)** | **Kolar (Karnataka)** | **2010.22 km** | **INDEPENDENT** | **Furthest pair in network ($> 2,000\text{ km}$).** North Indian alluvial plain vs. South Indian Dharwar craton. Zero mutual mass influence. |
| **5** | **Ludhiana (Punjab)** | **Singhbhum (Jharkhand)** | **1401.66 km** | **INDEPENDENT** | Completely independent. Indus-Ganges divide vs. Chota Nagpur crystalline shield. |
| **6** | **Ludhiana (Punjab)** | **Kothagudem (Telangana)** | **1560.41 km** | **INDEPENDENT** | Completely independent. Sub-Himalayan basin vs. Pranhita-Godavari Gondwana rift. |
| **7** | **Jhunjhunu / Khetri (Rajasthan)** | **Pune (Maharashtra)** | **1072.75 km** | **INDEPENDENT** | Completely independent. Semi-arid Proterozoic schists vs. Deccan basaltic flow traps. |
| **8** | **Jhunjhunu / Khetri (Rajasthan)** | **Udaipur / Zawar (Rajasthan)** | **455.20 km** | **INDEPENDENT** | Independent. North Aravalli copper belt vs. South Aravalli lead-zinc mineral belt. |
| **9** | **Jhunjhunu / Khetri (Rajasthan)** | **Kolar (Karnataka)** | **1692.51 km** | **INDEPENDENT** | Completely independent across distinct latitude and climatic zones. |
| **10** | **Jhunjhunu / Khetri (Rajasthan)** | **Singhbhum (Jharkhand)** | **1231.73 km** | **INDEPENDENT** | Completely independent. Western arid zone vs. Eastern humid crystalline belt. |
| **11** | **Jhunjhunu / Khetri (Rajasthan)** | **Kothagudem (Telangana)** | **1262.97 km** | **INDEPENDENT** | Completely independent. Trans-Aravalli plain vs. Godavari basin. |
| **12** | **Pune (Maharashtra)** | **Udaipur / Zawar (Rajasthan)** | **649.10 km** | **INDEPENDENT** | Independent. Separated by Narmada-Tapi rift structure; distinct monsoonal catchment systems. |
| **13** | **Pune (Maharashtra)** | **Kolar (Karnataka)** | **777.98 km** | **INDEPENDENT** | Independent. Krishna river basin headwaters vs. Kaveri/Ponnaiyar crystalline basin. |
| **14** | **Pune (Maharashtra)** | **Singhbhum (Jharkhand)** | **1389.02 km** | **INDEPENDENT** | Completely independent. Western India volcanic plateau vs. Eastern India craton. |
| **15** | **Pune (Maharashtra)** | **Kothagudem (Telangana)** | **722.89 km** | **INDEPENDENT** | Independent. Upper Bhima basalt catchment vs. Lower Godavari sedimentary graben. |
| **16** | **Udaipur / Zawar (Rajasthan)** | **Kolar (Karnataka)** | **1354.64 km** | **INDEPENDENT** | Completely independent. Aravalli belt vs. South Indian gold fields. |
| **17** | **Udaipur / Zawar (Rajasthan)** | **Singhbhum (Jharkhand)** | **1316.27 km** | **INDEPENDENT** | Completely independent. Western metamorphic domain vs. Singhbhum copper-uranium thrust. |
| **18** | **Udaipur / Zawar (Rajasthan)** | **Kothagudem (Telangana)** | **1041.78 km** | **INDEPENDENT** | Completely independent across central peninsular divide. |
| **19** | **Kolar (Karnataka)** | **Singhbhum (Jharkhand)** | **1377.46 km** | **INDEPENDENT** | Completely independent. Peninsular Gneissic Complex vs. Singhbhum Granite complex. |
| **20** | **Kolar (Karnataka)** | **Kothagudem (Telangana)** | **569.14 km** | **INDEPENDENT** | Independent. Southern granulite-gneiss terrain vs. Eastern Deccan-Gondwana contact. |
| **21** | **Singhbhum (Jharkhand)** | **Kothagudem (Telangana)** | **829.01 km** | **INDEPENDENT** | Independent. Subarnarekha river basin vs. Lower Godavari river valley. |

---

## 5. Hydrogeological Principles & Mass Balance Decomposition

### 5.1 What GRACE Measures
GRACE satellite gravimetry measures the integrated column mass variation of the Earth system:

$$\Delta \text{TWSA} = \Delta \text{GWSA} + \Delta \text{SMSA} + \Delta \text{SWSA} + \Delta \text{SWEA}$$

Where:
- $\Delta \text{TWSA}$: Total Terrestrial Water Storage Anomaly ($\text{cm LWE}$)
- $\Delta \text{GWSA}$: Groundwater Storage Anomaly ($\text{cm LWE}$)
- $\Delta \text{SMSA}$: Soil Moisture Storage Anomaly in root and vadose zone ($\text{cm LWE}$)
- $\Delta \text{SWSA}$: Surface Water Storage Anomaly in rivers, lakes, and wetlands ($\text{cm LWE}$)
- $\Delta \text{SWEA}$: Snow Water Equivalent Anomaly (negligible in peninsular India)

### 5.2 Strict Prohibition on Direct Groundwater Level Conversion
Converting $\Delta \text{TWSA}$ directly into water table depth in meters below ground level ($\text{mbgl}$) via a single scaling factor is **physically invalid** because:
1. **Soil Moisture Dynamics:** Up to $40-60\%$ of seasonal $\Delta \text{TWSA}$ variability in India is stored in the upper 2 meters of soil, not the saturated aquifer.
2. **Specific Yield Variability:** Specific yield ($S_y$) varies by orders of magnitude across hydrogeologic environments:
   - Deep Indo-Gangetic Alluvium (Ludhiana): $S_y \approx 0.10 - 0.16$
   - Weathered/Fractured Deccan Basalts (Pune): $S_y \approx 0.015 - 0.035$
   - Crystalline Schists and Granites (Singhbhum / Kolar): $S_y \approx 0.005 - 0.020$
3. **Aquifer Confinement:** In semi-confined and confined aquifers, water release is governed by the storativity ($S \approx 10^{-5}$ to $10^{-3}$), meaning piezometric head changes do not equal physical drainage of pore volume.

**Mandatory Rule:** In TERRANEXUS 4D, GRACE observations are maintained exclusively in **$\text{cm}$ Liquid Water Equivalent (LWE)**. Any translation into water table depth must be derived from independently calibrated land-surface models (GLDAS/FLDAS) and borewell hydrograph networks, carrying the explicit classification label `MODELLED`.

---

## 6. Mission Gap Preservation

The transition between the decommissioned GRACE mission and the operational GRACE-FO mission spans an 11-month observation void:
- **Last GRACE Observation Month:** June 2017 (`GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04`)
- **First GRACE-FO Observation Month:** June 2018 (`GRD-3_2018152-2018181_GRFO_JPLEM_BA01_0600_LND_v04`)
- **The Observation Gap:** July 2017 through May 2018 (11 consecutive months)

**Rule:** These 11 months are strictly represented as `status: 'MISSION_GAP'` with `val: null`. Interpolation, spline fitting, or machine learning infilling is disabled in observation mode.

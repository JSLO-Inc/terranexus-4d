# TERRANEXUS 4D — PHASE 2E SCIENTIFIC INTERPRETATION & HYDROLOGIC METHODOLOGY REVIEW
**Critical Evaluation of Satellite Gravimetry, Spatial Resolution, Signal Leakage & Groundwater Decoupling**

**Document Version:** 1.0.0  
**Audit Date:** 2026-11-02  
**Starting Commit:** `7fc02ab`  
**Focus Dataset:** JPL TELLUS GRACE / GRACE-FO Level-3 Land Water-Equivalent-Thickness (RL06 / RL06.3, DOI: `10.5067/TELND-3AJ64`)  
**Auditor Roles:** Principal Geospatial Data Engineer, NASA Earth Observation Specialist, Scientific Software Architect  

---

## 1. Executive Summary & Purpose

The purpose of this scientific review is to establish rigorous hydrologic boundaries, spatial limitations, and analytical definitions for the integration of NASA GRACE (Gravity Recovery and Climate Experiment) and GRACE-FO (Follow-On) observations within TERRANEXUS 4D.

Satellite gravimetry is fundamentally different from conventional hydrologic monitoring (e.g., in-situ piezometers, hydrological models, radar altimetry). A failure to understand the physics of K-band / Laser ranging inter-satellite tracking and spherical harmonic truncation leads to severe scientific errors:
1. **Conflating nominal grid spacing ($1.0^\circ \times 1.0^\circ$) with true spatial resolution ($\sim 300\text{ km}$ half-width).**
2. **Equating Terrestrial Water Storage Anomaly ($\Delta\text{TWSA}$) with direct in-situ groundwater table elevation changes ($\Delta h_{\text{gw}}$).**
3. **Ignoring signal attenuation, leakage bias, and correlated orbital error de-striping.**
4. **Treating independent point loci as physically uncorrelated when separated by less than the spatial resolution footprint.**

This document provides mathematical and physical justifications for every architectural constraint enforced in TERRANEXUS 4D.

---

## 2. Spatial Resolution vs. Nominal Grid Representation

### 2.1 The Physics of Resolution in Spherical Harmonic Truncation
GRACE twin satellites orbit at an initial altitude of $\sim 450\text{ km}$ with an along-track separation of $\sim 220\text{ km}$. They measure inter-satellite range-rate perturbations induced by Earth's mass redistribution. The global gravity field is expanded into spherical harmonics of degree $l$ and order $m$:

$$V(r, \theta, \lambda) = \frac{GM}{r} \sum_{l=0}^{l_{\max}} \left(\frac{a}{r}\right)^l \sum_{m=0}^l P_{lm}(\cos\theta) \left( C_{lm} \cos m\lambda + S_{lm} \sin m\lambda \right)$$

For the JPL Level-3 RL06 land products, spherical harmonic solutions are truncated at maximum degree $l_{\max} = 60$. The half-wavelength spatial resolution corresponding to degree $l$ at Earth's equatorial circumference ($2\pi R_{\oplus} \approx 40,075\text{ km}$) is given by:

$$\lambda_{\text{half}} = \frac{\pi R_{\oplus}}{l_{\max}} \approx \frac{20,037.5\text{ km}}{60} \approx 334\text{ km}$$

### 2.2 Gaussian Smoothing Filter (300 km Half-Width)
Because high-degree spherical harmonic coefficients suffer from high-frequency noise and north-south correlated orbital errors ("striping"), JPL applies a symmetric Gaussian averaging filter with a radius of $r_0 = 300\text{ km}$ (half-width at half-maximum). The Gaussian smoothing weight $W_l$ as a function of spherical harmonic degree $l$ follows Jekeli (1981) and Wahr et al. (1998):

$$W_0 = 1, \quad W_1 = \left[\frac{1+e^{-2b}}{1-e^{-2b}} - \frac{1}{b}\right], \quad b = \frac{\ln(2)}{1 - \cos(r_0 / R_{\oplus})}$$
$$W_{l+1} = -\frac{2l+1}{b} W_l + W_{l-1}$$

The effective averaging area corresponding to a $300\text{ km}$ radius disk is:

$$A_{\text{footprint}} = \pi r_0^2 = \pi \times (300\text{ km})^2 \approx 282,743\text{ km}^2$$

### 2.3 Grid Spacing ($1.0^\circ$) vs. Footprint ($\sim 282,700\text{ km}^2$)
Although the JPL Level-3 NetCDF product is sampled on a $1.0^\circ \times 1.0^\circ$ geographic grid ($\Delta\text{lat} = 1^\circ \approx 111\text{ km}$; $\Delta\text{lon} = 1^\circ \cos(\text{lat}) \approx 96\text{ km}$ at $30^\circ\text{N}$):
- **The $1^\circ$ grid is an interpolated discretization, NOT the independent spatial resolution.**
- Adjacent $1^\circ$ cells share $>85\%$ of the same physical gravitational mass signal.
- **Rule in TERRANEXUS 4D:** The UI must display the warning label:
  $$\mathbf{Effective\ Spatial\ Resolution:\ \sim 300\ km\ (\sim 282,700\ km^2)\ Gaussian\ Smoothing\ Footprint}$$
  Individual $1^\circ$ grid centroids must never be presented as point observations.

---

## 3. Decorrelation De-Striping Filter (Swenson & Wahr 2006)

Satellite orbit geometry (near-polar inclination of $89^\circ$) induces strong correlations between spherical harmonic coefficients of specific odd/even degree parities at a given order $m$. When synthesized in the spatial domain without filtering, these correlated errors manifest as intense north-south oriented linear artifacts ("stripes") that overwhelm real hydrologic mass signals.

JPL applies the decorrelation algorithm developed by Swenson and Wahr (2006, *doi:10.1029/2005GL025285*):
1. For each spectral order $m \ge 5$, a moving polynomial (quadratic or cubic) is fitted to the coefficients $C_{lm}$ and $S_{lm}$ as a function of degree $l$, separately for even and odd $(l-m)$.
2. The fitted correlated error is subtracted from the original coefficients:
   $$C_{lm}^{\text{clean}} = C_{lm} - C_{lm}^{\text{fit}}, \quad S_{lm}^{\text{clean}} = S_{lm} - S_{lm}^{\text{fit}}$$
3. The residual coefficients undergo the $300\text{ km}$ Gaussian smoothing.

This explains why GRACE anomalies exhibit smooth, spatially continuous regional patterns across northern India rather than localized, high-frequency boundaries.

---

## 4. Spatial Autocorrelation & Inter-Locus Proximity

### 4.1 Geodesic Distances Between the Seven Study Locations
Using the WGS-84 ellipsoid and Haversine geodesic formulations, the distance matrix between all seven study loci in TERRANEXUS 4D is calculated below:

| Target Location | Lat (°N) | Lon (°E) | Nearest Pair Locus | Inter-Locus Distance | Spatial Coupling Ratio ($d / 300\text{ km}$) |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **Ludhiana (Punjab)** | 30.9010 | 75.8573 | Khetri (Rajasthan) | **322.8 km** | $1.08$ (Partially Coupled) |
| **Khetri (Jhunjhunu)** | 28.0039 | 75.7878 | Zawar (Udaipur) | **454.1 km** | $1.51$ (Distinct) |
| **Zawar (Udaipur)** | 24.3564 | 73.7161 | Upper Bhima (Pune) | **650.3 km** | $2.17$ (Independent) |
| **Upper Bhima (Pune)** | 18.5204 | 73.8567 | Godavari Basin | **727.5 km** | $2.43$ (Independent) |
| **Godavari Basin** | 17.5511 | 80.6178 | Singhbhum (Jharkhand) | **826.9 km** | $2.76$ (Independent) |
| **Singhbhum (East)** | 22.5804 | 86.4800 | Godavari Basin | **826.9 km** | $2.76$ (Independent) |
| **Kolar Gold Fields** | 12.9602 | 78.2712 | Godavari Basin | **570.6 km** | $1.90$ (Distinct) |

### 4.2 Hydrological Implications for Ludhiana and Khetri
The distance between Ludhiana and Khetri is **$322.8\text{ km}$**, which is only slightly greater than the $300\text{ km}$ Gaussian smoothing radius ($r_0$). Consequently:
- Ludhiana's footprint overlaps the northern buffer of Khetri.
- The severe northwestern India groundwater depletion signal (documented by Rodell et al. 2009, *Nature*, *doi:10.1038/nature08238*) spans Punjab, Haryana, and northern Rajasthan.
- The high negative anomalies observed in both Ludhiana ($-23.2\text{ cm}$) and Khetri ($-29.6\text{ cm}$) in June 2017 are physically coupled through both regional agricultural over-abstraction and the spatial averaging kernel of GRACE.

---

## 5. Terrestrial Water Storage Anomaly vs. Groundwater Table Depth

### 5.1 Mass Decoupling Equation
The Terrestrial Water Storage Anomaly ($\Delta\text{TWSA}$) measured by GRACE represents the vertically integrated total column water mass change expressed in equivalent water thickness (cm or m):

$$\Delta\text{TWSA} = \Delta\text{GWS} + \Delta\text{SMS} + \Delta\text{SWS} + \Delta\text{SWE} + \Delta\text{BIO}$$

Where:
- $\Delta\text{GWS}$: Groundwater Storage Anomaly
- $\Delta\text{SMS}$: Vadose Zone Soil Moisture Storage Anomaly (typically down to 2 m depth)
- $\Delta\text{SWS}$: Surface Water Storage Anomaly (lakes, reservoirs, rivers, wetlands)
- $\Delta\text{SWE}$: Snow Water Equivalent Anomaly (negligible in peninsular India; relevant in Himalayan catchments)
- $\Delta\text{BIO}$: Biomass Water Content Anomaly (generally $<1\text{ cm}$, often neglected)

To isolate the groundwater storage anomaly $\Delta\text{GWS}$, independent observation or modeling systems are strictly required:

$$\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS}_{\text{GLDAS/SMAP}} - \Delta\text{SWS}_{\text{altimetry/SWOT}} - \Delta\text{SWE}$$

### 5.2 Converting Groundwater Mass Anomaly to In-Situ Borehole Water Level
To relate the groundwater equivalent water thickness ($\Delta\text{GWS}$, in meters) to actual groundwater table depth changes ($\Delta h_{\text{gw}}$, in meters measured in a monitoring well):

$$\Delta h_{\text{gw}} = \frac{\Delta\text{GWS}}{S_y}$$

Where $S_y$ is the **specific yield** (dimensionless storage coefficient for unconfined aquifers, typically ranging from $0.02$ to $0.25$ depending on lithology: $0.03-0.08$ in fractured hard rock, $0.12-0.22$ in alluvial sands).

**Crucial Scientific Principle:**
$$\text{If } \Delta\text{TWSA} = -23.2\text{ cm } (-0.232\text{ m}) \text{ and } S_y \approx 0.08, \text{ the water table drop is: }$$
$$\Delta h_{\text{gw}} \approx \frac{-0.232\text{ m}}{0.08} \approx -2.90\text{ meters}$$

Equating a $-23.2\text{ cm}$ TWSA directly to a $-23.2\text{ cm}$ well level change is an elementary scientific blunder that underestimates water table fluctuations by a factor of $4$ to $50\times$.

### 5.3 Enforced Rule in TERRANEXUS 4D
TERRANEXUS 4D strictly enforces:
1. **Never display TWSA as borehole depth in meters.**
2. When independent validated soil moisture ($\Delta\text{SMS}$) and specific yield ($S_y$) datasets are absent, display the prominent warning:
   $$\mathbf{GROUNDWATER-SPECIFIC\ ESTIMATE\ UNAVAILABLE\ —\ INSUFFICIENT\ VALIDATED\ INPUTS}$$
   along with the complete mass balance decoupling equation.

---

## 6. Mission Continuity, Missing Months & Calibration Breaks

### 6.1 The 11-Month Transition Gap (July 2017 – May 2018)
GRACE science operations ceased in June 2017 following orbital decay and battery failure of GRACE-2 (contact lost September 2017; re-entry December 2017). GRACE-FO was launched on May 22, 2018, aboard a SpaceX Falcon 9 from Vandenberg AFB. The first validated science month for GRACE-FO RL06 is June 2018.

- **Gap Duration:** July 2017 through May 2018 (11 calendar months).
- **Physical Reality:** No satellite gravimetry observations exist anywhere on Earth during this window.
- **Rule:** Never interpolate, spline, or fill this gap. In line graphs, visual breaks must be preserved using `connectNulls={false}`.

### 6.2 Eclipse Season Battery-Conservation Outages in GRACE
Between 2014 and 2017, the aging GRACE satellites suffered multiple battery capacity degradations. To maintain satellite health during orbital eclipse seasons, JPL shut down the microwave ranging instrument. This resulted in 10 officially missing months:
- 2014: Feb, Jul, Dec
- 2015: May, Jun, Oct, Nov
- 2016: Apr, Sep, Oct
- 2017: Feb

Each missing month must be flagged as `OFFICIALLY_MISSING (Battery conservation shutoff)` and rendered as a null discontinuity.

### 6.3 GRACE-FO In-Orbit Calibration (August – September 2018)
Following initial commissioning, GRACE-FO instruments underwent comprehensive calibration and accelerometer reconfiguration in August and September 2018. These months have no published Level-3 land grids and must be treated as `OFFICIALLY_MISSING (Instrument calibration)`.

---

## 7. Conclusions for TERRANEXUS 4D Architecture

1. All time-series endpoints and frontend charts must explicitly denote the variable as **Terrestrial Water Storage Anomaly (TWSA)** with units of **cm liquid water equivalent**.
2. Uncertainty bounds must be rendered using shaded confidence envelopes ($\pm \sigma_{\text{lwe}}$).
3. The spatial scale disclaimer must be displayed persistently in Nexus Hydro.
4. Exported data products must include metadata headers citing the JPL Level-3 processing version, Gaussian filter radius, baseline climatology period (2005–2010), and explicit warnings against uncorrected groundwater interpretation.

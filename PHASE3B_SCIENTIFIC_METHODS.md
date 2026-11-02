# TERRANEXUS 4D — PHASE 3B SCIENTIFIC METHODS & MATHEMATICAL FOUNDATIONS
**Rigorous Formulations for Satellite Gravimetry, Spherical Harmonics, Spatial Filtering & Mass Decoupling**

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Dataset Architecture:** NASA JPL Tellus Level-3 Land Water-Equivalent-Thickness (RL06 v04 / RL06.3 v04)  
**Auditor Roles:** Principal Geospatial Data Engineer, NASA Earth Observation Specialist, Scientific Software Architect  

---

## 1. Gravitational Potential to Equivalent Water Thickness

The twin GRACE / GRACE-FO satellites do not measure water directly; they measure inter-satellite range-rate perturbations $\dot{\rho}(t)$ using microwave K-band ranging (KBR) and laser ranging interferometry (LRI). Global mass anomalies are derived through spherical harmonic expansion of the gravitational potential.

### 1.1 Spherical Harmonic Expansion
The perturbation in Earth's gravitational potential $V(r, \theta, \lambda)$ at geocentric distance $r$, co-latitude $\theta$, and longitude $\lambda$ is expressed as:

$$V(r, \theta, \lambda) = \frac{GM}{r} \sum_{l=0}^{l_{\max}} \left(\frac{a}{r}\right)^l \sum_{m=0}^l P_{lm}(\cos\theta) \left( \Delta C_{lm} \cos m\lambda + \Delta S_{lm} \sin m\lambda \right)$$

Where:
- $GM$: Geocentric gravitational constant ($3.986004418 \times 10^{14}\text{ m}^3/\text{s}^2$)
- $a$: Earth's equatorial semi-major axis ($6,378,137\text{ m}$)
- $P_{lm}$: Fully normalized Associated Legendre Functions of degree $l$ and order $m$
- $\Delta C_{lm}, \Delta S_{lm}$: Residual spherical harmonic coefficients relative to a static background gravity field (e.g., GGM05C)
- $l_{\max}$: Truncation limit ($l_{\max} = 60$ for JPL RL06 products)

### 1.2 Surface Mass Density & Liquid Water Equivalent (LWE)
Following Wahr, Molenaar, and Bryan (1998, *JGR*, *doi:10.1029/98JB02844*), the surface mass change $\Delta \sigma(\theta, \lambda)$ (in $\text{kg/m}^2$) and equivalent water thickness $\Delta h_{\text{lwe}}(\theta, \lambda)$ (in $\text{meters}$ or $\text{cm}$) is computed by:

$$\Delta h_{\text{lwe}}(\theta, \lambda) = \frac{a \rho_{\text{ave}}}{3 \rho_w} \sum_{l=0}^{l_{\max}} \frac{2l + 1}{1 + k_l} \sum_{m=0}^l P_{lm}(\cos\theta) \left( \Delta C_{lm} \cos m\lambda + \Delta S_{lm} \sin m\lambda \right)$$

Where:
- $\rho_{\text{ave}}$: Average density of the solid Earth ($\approx 5,517\text{ kg/m}^3$)
- $\rho_w$: Density of fresh liquid water ($1,000\text{ kg/m}^3$)
- $k_l$: Elastic load Love number of degree $l$, accounting for the elastic yielding and self-gravitation of the solid Earth beneath the surface water mass.

---

## 2. Spatial Filtering, Truncation & Attenuation

### 2.1 Resolution Truncation at Degree 60
Truncating the expansion at $l_{\max} = 60$ imposes an absolute physical spatial resolution limit. The half-wavelength spatial resolution $\lambda_{\text{half}}$ at Earth's equator is:

$$\lambda_{\text{half}} = \frac{\pi a}{l_{\max}} = \frac{\pi \times 6,378.137\text{ km}}{60} \approx 333.95\text{ km}$$

Any spatial feature narrower than $\sim 334\text{ km}$ cannot be resolved independently by GRACE spherical harmonics.

### 2.2 Symmetric Gaussian Smoothing Filter ($r_0 = 300\text{ km}$)
High-degree coefficients ($l > 30$) contain significant noise and north-south striping. JPL applies a symmetric Gaussian averaging kernel with averaging radius $r_0 = 300\text{ km}$. The degree-dependent weighting coefficients $W_l$ are generated recursively (Jekeli 1981):

$$W_0 = 1, \quad W_1 = \left[\frac{1+e^{-2b}}{1-e^{-2b}} - \frac{1}{b}\right], \quad b = \frac{\ln(2)}{1 - \cos(r_0 / a)}$$
$$W_{l+1} = -\frac{2l+1}{b} W_l + W_{l-1}$$

The modified surface mass expansion with Gaussian smoothing is:

$$\Delta h_{\text{lwe}}^{\text{smooth}}(\theta, \lambda) = \frac{a \rho_{\text{ave}}}{3 \rho_w} \sum_{l=0}^{l_{\max}} \frac{2l + 1}{1 + k_l} W_l \sum_{m=0}^l P_{lm}(\cos\theta) \left( \Delta C_{lm} \cos m\lambda + \Delta S_{lm} \sin m\lambda \right)$$

### 2.3 Effective Footprint
The effective spatial integration disk has an area of:

$$A_{\text{footprint}} = \pi r_0^2 = \pi \times (300\text{ km})^2 \approx 282,743.3\text{ km}^2$$

This proves why adjacent points within $\sim 300\text{ km}$ (e.g., Ludhiana and Khetri separated by $322.8\text{ km}$) share partially coupled gravitational mass signals.

---

## 3. Atmospheric, Tidal & Geodynamic Pre-Processing

Before Level-3 land grids are published, JPL applies rigorous background geophysical corrections:
1. **Atmosphere & Ocean De-Aliasing (AOD1B RL06):** Removes high-frequency atmospheric surface pressure and ocean bottom pressure variations using ECMWF weather models and the MPIOM baroclinic ocean model.
2. **Solid Earth Tides & Ocean Tides:** Evaluated using the IERS Conventions 2010 and GOT4.8 ocean tide models.
3. **Geocenter Motion (Degree-1 Coefficients):** Because GRACE cannot measure mass shifts relative to Earth's center of mass, $C_{10}, C_{11}, S_{11}$ are replaced using combined Satellite Laser Ranging (SLR) and GRACE ocean model solutions (Sun et al. 2016).
4. **Earth Oblateness ($C_{20}$ and $C_{30}$ Replacement):** Accelerometer and orbital geometry errors degrade $C_{20}$ and $C_{30}$. These are replaced with independent SLR solutions (Loomis et al. 2019).
5. **Glacial Isostatic Adjustment (GIA):** Viscoelastic solid Earth rebound from the last deglaciation is removed using the ICE-6G_D model (Peltier et al. 2018).
6. **Climatological Baseline Period:** The monthly mean removed from each grid cell is calculated over the official 6-year baseline: **January 1, 2005 through December 31, 2010**.

---

## 4. Hydrologic Mass Balance Decoupling

### 4.1 Total Column Water Storage Partitioning
The Terrestrial Water Storage Anomaly ($\Delta\text{TWSA}$) measured by satellite gravimetry represents the vertically integrated mass anomaly:

$$\Delta\text{TWSA} = \Delta\text{GWS} + \Delta\text{SMS} + \Delta\text{SWS} + \Delta\text{SWE} + \Delta\text{BIO}$$

Where:
- $\Delta\text{GWS}$: Groundwater storage anomaly
- $\Delta\text{SMS}$: Soil moisture storage anomaly (vadose zone, $0-2\text{ m}$)
- $\Delta\text{SWS}$: Surface water storage anomaly (rivers, lakes, wetlands, artificial reservoirs)
- $\Delta\text{SWE}$: Snow water equivalent anomaly (relevant in Himalayan headwaters; negligible in peninsular India)
- $\Delta\text{BIO}$: Biomass water content anomaly (typically $<1\text{ cm}$, often neglected)

### 4.2 Decoupling Formulation
To isolate the groundwater component $\Delta\text{GWS}$, independent observation systems or validated Land Surface Models (LSMs) must be assimilated:

$$\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS}_{\text{GLDAS/NOAH/SMAP}} - \Delta\text{SWS}_{\text{altimetry/SWOT}} - \Delta\text{SWE}_{\text{IMS/AMSR2}}$$

### 4.3 Conversion to In-Situ Borehole Water Table Depth
To relate equivalent water thickness ($\Delta\text{GWS}$, in meters) to the change in physical water table elevation ($\Delta h_{\text{gw}}$, in meters):

$$\Delta h_{\text{gw}} = \frac{\Delta\text{GWS}}{S_y}$$

Where $S_y$ is the **specific yield** (dimensionless storage coefficient for unconfined aquifers, defined as the ratio of the volume of water that rock or soil will yield by gravity drainage to the volume of the rock or soil).

#### Specific Yield Sensitivities Across Indian Formations:
- **Indo-Gangetic Alluvial Sand:** $S_y \approx 0.12 - 0.20$ ($1\text{ cm LWE} \implies 5 - 8\text{ cm}$ water table change)
- **Weathered Deccan Basalt (Trap Contacts):** $S_y \approx 0.03 - 0.08$ ($1\text{ cm LWE} \implies 12 - 33\text{ cm}$ water table change)
- **Fractured Precambrian Quartzite / Schist (Aravalli/Singhbhum):** $S_y \approx 0.01 - 0.04$ ($1\text{ cm LWE} \implies 25 - 100\text{ cm}$ water table change)

**The Architectural Non-Negotiable Rule:**
Because $S_y$ varies by up to $20\times$ within a single watershed and vadose decoupling is strictly required, **displaying TWSA as a borehole water depth in meters is scientifically fraudulent**. TERRANEXUS 4D strictly denotes TWSA in $\text{cm Liquid Water Equivalent}$ ($\text{cm LWE}$) and preserves the prominent decoupling disclaimer.

---

## 5. Non-Interpolation & Missing Data Mathematics

### 5.1 The Mathematical Fallacy of Missing Month Interpolation
Let $\mathbf{y} = [y_1, y_2, \dots, y_N]^T$ be an observed time series sampled at non-uniform intervals $\{t_i\}_{i=1}^N$ with missing intervals $(t_a, t_b)$ where $t_b - t_a > 1\text{ month}$.

Applying cubic spline or polynomial interpolation across an 11-month transition gap:
1. **Creates artificial inflection points:** Cubic splines minimize second derivatives ($\int [f''(t)]^2 dt$), forcing smooth curvatures through gaps that completely miss real monsoon recharge peaks or severe summer droughts that occurred while the sensor was unpowered.
2. **Corrupts statistical trend variance:** Interpolated points introduce artificial zero-residual observations that artificially deflate the formal uncertainty of linear regressions ($\sigma_{\text{trend}} = \sqrt{\frac{\sum (y_i - \hat{y}_i)^2}{(N-2)\sum (t_i - \bar{t})^2}}$).

### 5.2 Discrete Linear Regression Over Valid Time Steps
TERRANEXUS 4D computes long-term decadal trends ($d\text{TWSA}/dt$) strictly over the set of verified observation indices $\mathcal{I} = \{i \mid y_i \ne \text{null}\}$ with $|\mathcal{I}| = 108$:

$$\bar{t} = \frac{1}{|\mathcal{I}|} \sum_{i \in \mathcal{I}} t_i, \quad \bar{y} = \frac{1}{|\mathcal{I}|} \sum_{i \in \mathcal{I}} y_i$$
$$\beta = \frac{\sum_{i \in \mathcal{I}} (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i \in \mathcal{I}} (t_i - \bar{t})^2}$$

All missing time steps ($N=24$) are strictly excluded from the regression sums rather than zero-filled or mean-imputed.

---

## 6. Summary

The mathematical and scientific formulations implemented in TERRANEXUS 4D conform rigorously to peer-reviewed geodesy, satellite gravimetry, and hydrogeological physics.

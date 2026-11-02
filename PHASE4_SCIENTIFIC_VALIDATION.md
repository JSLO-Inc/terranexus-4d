# TERRANEXUS 4D — PHASE 4 SCIENTIFIC VALIDATION REPORT
## Comprehensive Physical Principles, Mathematical Formulations & Data Provenance

**Platform:** TERRANEXUS 4D  
**Document:** Scientific Integrity & Remote Sensing Validation  
**Version:** v0.4.0  
**Date:** November 2026  

---

### 1. Physics and Mathematics of Satellite Gravimetry (NASA GRACE / GRACE-FO)

#### 1.1 Spherical Harmonic Truncation and Spatial Resolution
NASA GRACE and GRACE-FO measure spatiotemporal perturbations in Earth's gravitational geoid by tracking the inter-satellite distance between twin co-orbiting spacecraft (K-band Microwave Ranging and Laser Ranging Interferometer) at orbital altitudes of $\sim 450\text{--}500\text{ km}$.

The raw monthly gravity field solutions are parameterized in terms of spherical harmonic Stokes coefficients $(C_{lm}, S_{lm})$ up to degree and order $l_{\max} = 60$ or $l_{\max} = 96$. At degree 60, the half-wavelength spatial resolution on the Earth's surface corresponds to:
$$\lambda_{1/2} = \frac{2\pi R_{\text{Earth}}}{2 \cdot l_{\max}} = \frac{\pi \cdot 6371\text{ km}}{60} \approx 333\text{ km}$$

To suppress high-degree noise and longitudinal striping errors caused by the north-south orbital geometry, standard Level-3 processing pipelines (such as JPL Tellus RL06 v04) apply isotropic Gaussian spatial smoothing with an effective half-width radius $r = 300\text{ km}$.

#### 1.2 The Non-Discrete Radial Gaussian Smoothing Kernel
The Gaussian smoothing filter in the spatial domain is formulated as:
$$W(\theta) = \frac{b}{2\pi} \exp\left( -b \cdot \frac{1 - \cos\theta}{1 - \cos(r/R_{\text{Earth}})} \right)$$
where:
- $\theta$ is the angular spherical distance from the observation center point.
- $r = 300\text{ km}$ is the Gaussian filter radius at which the filter weight drops to $1/2$ (half-power radius).
- $b = \ln(2)$.

**Key Scientific Takeaway:**  
Because the filter weight decays smoothly with distance $\theta$, **the sensor does not have a sharp or impermeable physical boundary**. An observation centered at a study locus represents a weighted integral over an area extending outward into surrounding terrain.

#### 1.3 Nominal Footprint Area Derivation
The nominal spatial envelope corresponding to the $300\text{ km}$ Gaussian half-power radius on a spherical Earth is calculated as:
$$A_{\text{nominal}} = \pi \cdot r^2 = \pi \cdot (300\text{ km})^2 = 90,000\pi \approx 282,743.34\text{ km}^2$$

In TERRANEXUS 4D, this boundary is rendered on the CesiumJS globe with the explicit label:
```
Illustrative ~300 km Footprint
Nominal Envelope ~282,743 km²
(Non-Discrete Radial Response)
```

---

### 2. Hydrological Mass Decoupling and Piezometric Head Conversion

#### 2.1 Terrestrial Water Storage Anomaly (TWSA)
GRACE Level-3 products deliver Terrestrial Water Storage Anomaly ($\Delta\text{TWSA}$), expressed in centimeters of Liquid Water Equivalent (cm LWE):
$$1\text{ cm LWE} = 10\text{ kg/m}^2 = 0.01\text{ m}^3\text{ water/m}^2$$

$\Delta\text{TWSA}$ represents the vertical sum of all hydrological mass components:
$$\Delta\text{TWSA} = \Delta\text{SMS} + \Delta\text{GWS} + \Delta\text{SWS} + \Delta\text{SWE} + \Delta\text{Bio}$$
where:
- $\Delta\text{SMS}$: Soil Moisture Storage (typically top $2\text{ meters}$).
- $\Delta\text{GWS}$: Groundwater Storage anomaly in unconfined and semi-confined aquifers.
- $\Delta\text{SWS}$: Surface Water Storage (rivers, reservoirs, wetlands, irrigation canals).
- $\Delta\text{SWE}$: Snow Water Equivalent (negligible in peninsular and plains India; significant in Himalayan catchments).
- $\Delta\text{Bio}$: Biomass moisture changes (typically minor on seasonal/interannual timescales).

#### 2.2 Decoupling Groundwater Storage ($\Delta\text{GWS}$)
To determine whether aquifer storage is accumulating or depleting, the non-groundwater mass components must be decoupled:
$$\Delta\text{GWS} = \Delta\text{TWSA} - \Delta\text{SMS} - \Delta\text{SWS} - \Delta\text{SWE}$$

#### 2.3 Conversion to Piezometric Depth Below Ground Level
To convert change in volume of groundwater storage ($\Delta\text{GWS}$) into change in water table elevation or piezometric head ($\Delta h_{\text{gw}}$), the storage property of the aquifer medium—the **Specific Yield** ($S_y$) for unconfined aquifers or the **Storativity** ($S$) for confined aquifers—is mandatory:
$$\Delta h_{\text{gw}} = \frac{\Delta\text{GWS}}{S_y}$$

For example, in the Indo-Gangetic alluvium near Ludhiana ($S_y \approx 0.12\text{ to }0.15$):
- A gravimetric depletion of $-1.5\text{ cm/year LWE}$ corresponds to an unconfined water table drop of:
  $$\Delta h_{\text{gw}} = \frac{-0.015\text{ m/year}}{0.13} \approx -0.115\text{ m/year (unconfined regional mean)}$$
- Localized tube-well concentration in agricultural pumping zones produces localized drawdown cones exceeding $-0.5\text{ to }-0.8\text{ m/year}$ in monitored CGWB borewells.

**Scientific Rule Enforced:**  
It is physically invalid to equate $\Delta\text{TWSA}$ (cm) directly to well depth below ground level ($m\text{ bgl}$). TERRANEXUS 4D strictly enforces this distinction in all UI charts, telemetry metrics, and AI copilot responses.

---

### 3. Preservation of Sensor Discontinuities & The Mission Gap

#### 3.1 The 11-Month GRACE to GRACE-FO Mission Gap
- **GRACE Mission Decommissioning:** July 2017 (Orbit decay and battery depletion).
- **GRACE Follow-On Launch & Calibration:** May 2018 (Successful insertion and sensor validation).
- **Discontinuity Period:** July 2017 to May 2018 ($11\text{ calendar months}$).

#### 3.2 Spacecraft Outages
Across the 2014–2024 decadal observation window, 13 additional calendar months suffered accelerometer power shutdowns or battery conservation modes (e.g., February 2014, June 2014, October 2015).

#### 3.3 Strict Prohibition of Gap Interpolation
In TERRANEXUS 4D:
- Missing months are preserved as strict `null` values in all historical time series.
- Time-series charts display a clean visual gap rather than a fabricated connecting line.
- Linear regression models compute slope using Ordinary Least Squares over observed timestamp pairs $(t_i, y_i)$, avoiding synthetic bias.

---

### 4. Classification of Geological Basins and Borehole Stratigraphy

| Data Asset | Physical Basis | Classification | Caveat Documented in Platform |
|:---|:---|:---:|:---|
| **NASA GRACE L3 TWSA** | Inter-satellite gravimetric range rate | `OBSERVED` | ~300 km Gaussian averaging; integrated mass |
| **Regional Basin Polygons** | Literature envelopes (GSI/CGWB NAQUIM) | `DEMONSTRATION` | Illustrative study approximation; not cadastral boundaries |
| **WGS84 Ellipsoid Terrain** | Mathematical reference ellipsoid | `DEMONSTRATION` | Flat surface; 3D topography unmodeled in current viewport |
| **CGWB Piezometer Logs** | Monitored tape/dipper readings | `DEMONSTRATION` | Representative station fixtures; point measurement scale |
| **Stratigraphic Columns** | GSI exploration composite lithologies | `DEMONSTRATION` | Regional lithostratigraphic model; non-continuous |
| **Sentinel-2 Alteration** | Top-micron optical reflectance | `MODELLED` | Surface outcrop only; cannot detect blind concealed ore |

---

### 5. Verification Checkpoints

1. **Singhbhum Coordinate Accuracy:**
   - Centroid: `(22.75°N, 86.25°E)` in Jharkhand.
   - Distance to target: `30.21 km` ($< 35\text{ km}$ maximum grid centroid offset).
   - Erroneous Gujarat coordinate (`73.50°E`) completely rejected.
2. **Spatial Separation Matrix:**
   - All 21 station pairs across 7 loci have separation $\ge 300\text{ km}$.
   - Closest pair: Ludhiana–Khetri at $322.21\text{ km}$ (classified as Transitional).
   - Furthest pair: Ludhiana–Kolar at $2010.22\text{ km}$ (fully independent).
3. **NASA PO.DAAC Provenance:**
   - 108 authentic NetCDF-4 granules stored in `server/data/raw/`.
   - 108 JSON provenance sidecars containing granule metadata, PO.DAAC download URL, and SHA-256 cryptographic hashes.

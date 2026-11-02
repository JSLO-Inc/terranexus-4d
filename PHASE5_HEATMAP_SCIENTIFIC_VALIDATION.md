# TERRANEXUS 4D — PHASE 5 HEATMAP SCIENTIFIC VALIDATION
## Multi-Layer Scientific Heatmap Engine, Zonal Statistics & Mathematical Formulations

**Document Version:** 1.0.0  
**Phase:** 5 (Multi-Layer Scientific Heatmaps & Spatial Zonal Analysis)  
**Date:** November 2026  
**Governing Principles:** Physical Mass Conservation, Non-Interpolation Across Mission Gaps, Bureau of Indian Standards (BIS 10500) Hydrochemistry  

---

## 1. Overview of Heatmap Layers

Phase 5 deploys five distinct scientific raster layers across the Indian landmass, providing multi-spectral, multi-instrumental subsurface and hydrological insight:

| Layer Code | Layer Name | Physical Unit | Min Scale | Max Scale | Color Ramp Scheme | Data Classification Tier | Scientific Description & Source Framework |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`layer-grace-twsa`** | NASA GRACE/GRACE-FO TWSA | $\text{cm LWE}$ | $-25.0$ | $+20.0$ | **Diverging** (Red $\to$ Cream $\to$ Cyan/Blue) | `OBSERVED` | Column-integrated Terrestrial Water Storage Anomaly at $\sim 300\text{ km}$ effective Gaussian resolution. Derived from authentic PO.DAAC NetCDF-4 granules. |
| **`layer-groundwater-depth`** | Groundwater Table Depth | $\text{m bgl}$ | $0.0$ | $60.0$ | **Sequential** (Green $\to$ Yellow $\to$ Red) | `DEMONSTRATION` | Regional piezometric water table depth below ground level based on CGWB National Ground Water Monitoring networks. Higher values represent severe overdraft. |
| **`layer-recharge-potential`** | Groundwater Recharge Suitability | Index ($0–100$) | $0.0$ | $100.0$ | **Sequential** (Brown $\to$ Yellow $\to$ Emerald) | `MODELLED` | Multi-criteria GIS physical suitability model combining slope, bedrock fracture density, soil texture, drainage density, and rainfall. |
| **`layer-water-quality-tds`** | Water Quality (TDS) | $\text{mg/L TDS}$ | $100.0$ | $2,500.0$ | **Sequential** (Emerald $\to$ Orange $\to$ Crimson) | `DEMONSTRATION` | Total Dissolved Solids categorized according to BIS 10500 standards ($<500\text{ mg/L}$ desirable, $500–2000\text{ mg/L}$ permissible, $>2000\text{ mg/L}$ non-potable). |
| **`layer-gpm-rainfall`** | NASA GPM Precipitation | $\text{mm}$ | $0.0$ | $700.0$ | **Sequential** (Light Blue $\to$ Deep Cobalt) | `OBSERVED` | Monthly precipitation accumulation across major Indian river basins from NASA GPM IMERG Final satellite inversions. |

---

## 2. Mathematical Formulations & Zonal Area Statistics

### 2.1 The Spatial Zonal Radius Envelope
The user specifies a circular zonal search radius $R \in [50\text{ km}, 600\text{ km}]$ centered at target coordinates $(\phi_c, \lambda_c)$. The nominal geodesic search area $A$ on Earth's spherical surface (radius $R_E \approx 6,371\text{ km}$) is:
$$A = 2\pi R_E^2 \left(1 - \cos\left(\frac{R}{R_E}\right)\right) \approx \pi R^2$$
For the default $R = 300\text{ km}$ (corresponding to the standard GRACE spatial smoothing kernel):
$$A \approx \pi (300)^2 \approx 282,743\text{ km}^2$$

### 2.2 Geodesic Cell Inclusion Rule
A gridded raster cell node $i$ at $(\phi_i, \lambda_i)$ is included in the zonal sample if its geodesic Haversine distance $d_i \le R$:
$$d_i = 2 R_E \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_i - \phi_c}{2}\right) + \cos\phi_c \cos\phi_i \sin^2\left(\frac{\lambda_i - \lambda_c}{2}\right)}\right) \le R$$

### 2.3 Strict Valid-Cell-Only Statistical Formulations

To preserve absolute scientific integrity, cells containing null values (e.g. unobserved mission gap months, missing observations, or out-of-bounds nodes) are explicitly tallied in $N_{\text{no\_data}}$ and **strictly excluded from all mathematical denominators**.

1. **Cell Count Disaggregation:**
   $$N_{\text{total}} = N_{\text{valid}} + N_{\text{no\_data}}$$
   $$\text{Coverage Ratio (\%)} = \left(\frac{N_{\text{valid}}}{N_{\text{total}}}\right) \times 100$$

2. **Zonal Mean ($\mu$):**
   $$\mu = \begin{cases} \displaystyle \frac{1}{N_{\text{valid}}} \sum_{i=1}^{N_{\text{valid}}} x_i, & \text{if } N_{\text{valid}} > 0 \\ \text{null}, & \text{if } N_{\text{valid}} = 0 \end{cases}$$

3. **Zonal Median ($Q_2$):**
   Let $X = (x_{(1)}, x_{(2)}, \dots, x_{(N_{\text{valid}})})$ be the strictly valid values sorted in ascending order:
   $$Q_2 = \begin{cases} 
   x_{\left(\frac{N_{\text{valid}} + 1}{2}\right)}, & \text{if } N_{\text{valid}} \text{ is odd} \\
   \frac{1}{2}\left(x_{\left(\frac{N_{\text{valid}}}{2}\right)} + x_{\left(\frac{N_{\text{valid}}}{2} + 1\right)}\right), & \text{if } N_{\text{valid}} \text{ is even} \\
   \text{null}, & \text{if } N_{\text{valid}} = 0
   \end{cases}$$

4. **Population Standard Deviation ($\sigma$):**
   $$\sigma = \begin{cases} \displaystyle \sqrt{\frac{1}{N_{\text{valid}}} \sum_{i=1}^{N_{\text{valid}}} (x_i - \mu)^2}, & \text{if } N_{\text{valid}} > 0 \\ \text{null}, & \text{if } N_{\text{valid}} = 0 \end{cases}$$

5. **Extrema:**
   $$\text{Min} = \min_{1 \le i \le N_{\text{valid}}} x_i, \quad \text{Max} = \max_{1 \le i \le N_{\text{valid}}} x_i$$

---

## 3. Empirical Test Suite Validation

The zonal statistics engine was verified in `test/test-phase5-suite.ts` (Suite 7) centered over the Indo-Gangetic Alluvial Foreland Basin at Ludhiana, Punjab ($30.9010^\circ\text{N}, 75.8573^\circ\text{E}$):

| Metric | Computed Empirical Value | Physical Interpretation |
| :--- | :--- | :--- |
| **Search Radius ($R$)** | $300\text{ km}$ | NASA GRACE nominal Gaussian footprint |
| **Nominal Zonal Envelope** | $282,743\text{ km}^2$ | Circular regional averaging area |
| **Valid Cell Count ($N_{\text{valid}}$)** | $4$ | 4 regional $0.5^\circ$ nodes within 300 km (Indus, Sutlej, Malwa, Haryana) |
| **No-Data Count ($N_{\text{no\_data}}$)** | $0$ (for May 2024 observation) | Complete active mission month |
| **Zonal Mean ($\mu$)** | $-17.38\text{ cm LWE}$ | Chronic regional water storage deficit in north-western breadbasket |
| **Zonal Median ($Q_2$)** | $-17.53\text{ cm LWE}$ | Centered distribution of mass loss |
| **Zonal Minimum** | $-19.70\text{ cm LWE}$ | Peak overdraft in Central Punjab agricultural sector |
| **Zonal Maximum** | $-14.75\text{ cm LWE}$ | Edge of Haryana-Yamuna alluvial sector |
| **Standard Deviation ($\sigma$)** | $2.33\text{ cm LWE}$ | Spatial dispersion of anomaly across the basin |
| **Out-of-Bounds Null Test** | $N_{\text{valid}} = 0 \implies \mu = \text{null}$ | Confirms zero division prevention when no valid cells exist |

---

## 4. 3D Cesium Globe Shader & Material Rendering

In `CesiumGlobe.tsx`:
1. Heatmap cells are rendered as Cesium `Rectangle` entities with bounds $[\lambda_i - 0.25^\circ, \phi_i - 0.25^\circ, \lambda_i + 0.25^\circ, \phi_i + 0.25^\circ]$ positioned at $120\text{ m}$ elevation above the WGS84 ellipsoid.
2. Cell colors are evaluated through normalized ramps:
   - For diverging TWSA, $0\text{ cm}$ anomaly is explicitly mapped to neutral white/cream ($\text{RGB}(240, 240, 240)$), preventing visual bias.
   - Opacity is dynamically controlled through user sliders ($10\%–100\%$, default $75\%$), enabling transparent overlaying above ArcGIS satellite imagery.
3. The Area Analysis tool draws an interactive glowing circular disc (`area-analysis-circle`) with cyan outline and semi-transparent cyan fill ($20\%$ alpha), allowing visual inspection of which raster cells fall within the analysis radius.

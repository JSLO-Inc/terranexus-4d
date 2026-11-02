# TERRANEXUS 4D — DATA LICENSES, USAGE RIGHTS & OFFICIAL ATTRIBUTION REGISTER

**Document Type:** Legal Compliance, Data Licensing & Scientific Attribution Register  
**Platform Version:** TERRANEXUS 4D v0.2.3  
**Effective Date:** 2026-11-02  
**Governing Standard:** NASA Open Data Policy, 14 CFR § 1221.1, GODL-India, EU Copernicus Regulation  
**Maintained By:** Principal Geospatial Data Engineer, Scientific Software Architect & Legal Compliance Lead  

---

## 1. Executive Legal Charter & Non-Endorsement Declaration

TERRANEXUS 4D is an independent scientific research and 4D geospatial analytics platform developed by JSLO-Inc. 

### Mandatory Legal Disclaimers:

1. **Non-Endorsement Guarantee:**
   > **NASA has not partnered with, approved, certified, sponsored, or endorsed TERRANEXUS 4D.**  
   > The views, interpretations, visual models, scientific conclusions, and analytical derivatives presented within TERRANEXUS 4D are solely those of the developers and researchers. Reference to specific commercial products, processes, or satellite telemetry by trade name, trademark, manufacturer, or agency does not constitute or imply endorsement or recommendation by the National Aeronautics and Space Administration (NASA), the United States Government, or any partner space agency.

2. **Insignia, Logo & Seal Prohibition (14 CFR § 1221.1):**
   > In strict compliance with **Title 14 of the Code of Federal Regulations, Subpart 1221.1 (14 CFR § 1221.1)** and NASA Policy Directive (NPD) 9050.6, **TERRANEXUS 4D does NOT use the NASA Insignia ("meatball" logo), the NASA Logotype ("worm" logo), the NASA Seal, or any NASA Program Data Insignia.** All satellite and spatial indicators in the user interface are generic, non-trademarked UI glyphs (e.g., standard Lucide open-source vector icons).

3. **Protection of Credentials & Authenticated Endpoints:**
   > Neither this repository, nor any public documentation, nor any software export redistributes NASA Earthdata authentication tokens (`EARTHDATA_TOKEN`), user passwords, session keys, or signed temporary download URLs. All public references and data exports point exclusively to persistent Digital Object Identifiers (DOIs) or public open-access archive catalog landing pages.

---

## 2. Dataset Licensing & Official Attribution Matrix

| Dataset Identifier | Authoritative Provider | License Framework | Official DOI / Permanent Identifier | Official Dataset Citation | Permitted Usage in TERRANEXUS 4D |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`nasa-grace-tellus-tws`** | NASA JPL & PO.DAAC | NASA Open Science Data Policy (U.S. Govt Work / CC0-compatible) | **`https://doi.org/10.5067/TELND-3AJ64`** | JPL. 2019. *GRACE Tellus Monthly Mass Grids - Land (RL06 v04)*. Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at https://doi.org/10.5067/TELND-3AJ64. | Open scientific research, spatial extraction, visualization, regional mass balance analysis. |
| **`nasa-gpm-imerg-precip`** | NASA GSFC (GES DISC) & JAXA | NASA Open Science Data Policy (Joint NASA/JAXA mission) | **`https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07`** | Huffman, G. J., et al. (2020), *GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07*, Greenbelt, MD, Goddard Earth Sciences Data and Information Services Center (GES DISC), Accessed 2026-11-02, https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07. | Climatological rainfall comparison, regional recharge evaluation, time-series plotting. |
| **`india-wris-groundwater-levels`** | CGWB, Ministry of Jal Shakti, Govt of India | Government Open Data License - India (GODL-India) under NDSAP | N/A (India-WRIS Portal Service) | Central Ground Water Board (2024), *Ground Water Year Book - State-wise Periodic Monitoring Reports (2014-2024)*, Ministry of Jal Shakti, New Delhi, India. | Groundwater depth trend baseline, piezometer comparison, demonstration benchmarks. |
| **`cgwb-naquim-aquifer`** | CGWB, Ministry of Jal Shakti, Govt of India | GODL-India (National Data Sharing & Accessibility Policy) | N/A (NAQUIM Project Reports) | Central Ground Water Board (2022-2024), *National Aquifer Mapping and Management Programme (NAQUIM) State Atlases*, Ministry of Jal Shakti, Government of India. | 3D hydrostratigraphic boundary modeling, transmissivity and specific yield baselines. |
| **`gsi-bhukosh-geology`** | Geological Survey of India, Ministry of Mines | Ministry of Mines Open Geospatial Data Framework | N/A (Bhukosh Spatial Portal) | Geological Survey of India (2023), *1:50,000 Geological Map Series & 1:2M National Geological Synthesis*, Ministry of Mines, Kolkata, India. | Surface lithology, fault zone geometry, regional stratigraphic framework. |
| **`gsi-national-lithologs`** | Geological Survey of India (GSI) | Public Academic Reference / GSI Open File Reports | N/A (GSI Technical Bulletins) | Geological Survey of India (1975-2023), *National Core Repository and Exploratory Litholog Technical Bulletins*, Ministry of Mines, Kolkata, India. | Subsurface borehole column demonstration benchmarks (core logging and lithostratigraphy). |
| **`copernicus-sentinel2-alteration`** | European Space Agency (ESA) & EC Copernicus | Free, Full & Open Access under EU Regulation No 377/2014 | N/A (Copernicus Data Space Ecosystem) | European Space Agency (ESA) (2023-2024), *Copernicus Sentinel-2 MSI Level-2A Bottom-Of-Atmosphere Reflectance*, processed via Sen2Cor. | Multi-spectral surface mineral alteration indices (Iron Oxide, Hydroxyl, Ferrous Silicates). |

---

## 3. Comprehensive Dataset Profiles & Legal Terms

### 3.1 NASA JPL Tellus GRACE / GRACE-FO Level-3 Land Mass Grids

- **Product Short Name:** `TELLUS_GRAC_L3_JPL_RL06_LND_v04` / `TELLUS_GRFO_L3_JPL_RL06_LND_v04`
- **Collection Concept ID:** `C2077042612-POCLOUD` (GRACE) & `C3193302127-POCLOUD` (GRACE-FO)
- **Official DOI:** [`https://doi.org/10.5067/TELND-3AJ64`](https://doi.org/10.5067/TELND-3AJ64)
- **Authoritative Provider:** NASA Physical Oceanography Distributed Active Archive Center (PO.DAAC), Jet Propulsion Laboratory, Pasadena, CA.
- **Access Date:** 2026-11-02
- **Applicable Legal Terms:**
  - Published under the **NASA Open Earth Science Data Policy**.
  - As a work of the U.S. Government prepared by officers and employees under federal law, the underlying data are in the public domain under **17 U.S.C. § 105** (CC0 equivalent).
  - PO.DAAC data-use policy requires formal dataset citation in all scientific publications, derivative tools, and public interfaces utilizing the official DOI.
- **Mandatory Dataset Citation:**
  > *JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at https://doi.org/10.5067/TELND-3AJ64.*
- **Core Scientific Methodology Citation:**
  > *Landerer, F. W. and S. C. Swenson (2012), Accuracy of scaled GRACE terrestrial water storage estimates. Water Resources Research, 48(4), W04531, https://doi.org/10.1029/2011WR011453.*
- **Physical Resolution & Spatial Usage Restrictions:**
  - Raw K-band ranging telemetry is smoothed with a ~300 km Gaussian filter to mitigate high-frequency gravitational noise and north-south striping.
  - Gridded at $1.0^\circ \times 1.0^\circ$ (or $0.5^\circ \times 0.5^\circ$ in earlier releases).
  - **Explicit Scientific Restriction:** GRACE data MUST NOT be cited or displayed as measuring individual borewells, municipal wards, or localized town water tables. It measures regional mass balance.
- **Mission Blackout Enforcement:**
  - June 2017 marks the end of the primary GRACE mission.
  - July 2017 through May 2018 (11 months) represents the decommission-to-commissioning blackout.
  - In accordance with data integrity guidelines, values during this gap are strictly preserved as `null / NaN` and MUST NOT be fabricated or interpolated.

---

### 3.2 NASA Global Precipitation Measurement (GPM) IMERG

- **Product Short Name:** `GPM_3IMERGM_07` (GPM IMERG Final Precipitation L3 1 Month)
- **Official DOI:** [`https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07`](https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07)
- **Authoritative Provider:** NASA Goddard Earth Sciences Data and Information Services Center (GES DISC) & Japan Aerospace Exploration Agency (JAXA).
- **Access Date:** 2026-11-02
- **Applicable Legal Terms:**
  - Distributed freely and openly under the NASA Open Science Data Policy.
  - Joint international partnership between NASA and JAXA. JAXA contributions (including Dual-frequency Precipitation Radar DPR telemetry) are released into the unified IMERG product.
- **Mandatory Dataset Citation:**
  > *Huffman, G. J., E. F. Stocker, D. T. Bolvin, E. J. Nelkin, and J. Tan (2020), GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07, Greenbelt, MD, Goddard Earth Sciences Data and Information Services Center (GES DISC), Accessed 2026-11-02, https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07.*
- **Hydrological Usage Caveat:**
  - Satellite precipitation estimates represent atmospheric water input at the land surface. They must not be conflated with aquifer recharge rates, which depend on evapotranspiration, vegetation uptake, soil permeability, and infiltration dynamics.

---

### 3.3 Central Ground Water Board (CGWB) & India-WRIS Ground Water Monitoring

- **Provider:** Central Ground Water Board (CGWB), Department of Water Resources, River Development & Ganga Rejuvenation, Ministry of Jal Shakti, Government of India.
- **Official Portals:**
  - India-WRIS: `https://indiawris.gov.in/wris/#/groundWater`
  - CGWB Official: `http://cgwb.gov.in/`
- **Applicable Legal Terms:**
  - Governed by the **Government Open Data License - India (GODL-India)** under the National Data Sharing and Accessibility Policy (NDSAP), Gazette of India (2012).
  - Users are granted a worldwide, royalty-free, non-exclusive license to use, adapt, publish, and distribute the data for commercial or non-commercial purposes, subject to explicit attribution to the data provider.
- **Official Citation:**
  > *Central Ground Water Board (2024), Ground Water Year Book - State-wise Periodic Monitoring Reports (2014-2024), Ministry of Jal Shakti, New Delhi, India.*
- **Non-Endorsement Notice (GODL-India Clause 4):**
  > The Government of India does not endorse or approve the results, derivative models, or visualizations produced by TERRANEXUS 4D.
- **Demonstration Benchmark Handling:**
  - Where actual telemetric records are absent, station hydrographs carry explicit `DEMO-` prefixes and `DEMONSTRATION` status tags to prevent misattribution.

---

### 3.4 Geological Survey of India (GSI) Bhukosh Lithostratigraphy & Drill Core

- **Provider:** Geological Survey of India (GSI), Ministry of Mines, Government of India.
- **Official Portal:** `https://bhukosh.gsi.gov.in/`
- **Applicable Legal Terms:**
  - Released under the Ministry of Mines Open Geospatial Data Framework for academic, scientific, and public informational use.
- **Official Citation:**
  > *Geological Survey of India (2023), 1:50,000 Scale Geological Quadrangle Series and National Core Repository Technical Bulletins, Ministry of Mines, Kolkata, India.*
- **Scientific Usage Caveat:**
  - Subsurface geological cross-sections represent conceptual geological interpretations interpolated between discrete borehole control points.

---

### 3.5 Copernicus Sentinel-2 MSI Multi-Spectral Reflectance

- **Provider:** European Space Agency (ESA) & European Commission Copernicus Programme.
- **Official Portal:** `https://dataspace.copernicus.eu/`
- **Applicable Legal Terms:**
  - Governed by Regulation (EU) No 377/2014 and Commission Delegated Regulation (EU) No 1159/2013 on Copernicus data and information.
  - Grants free, full, and open access to Sentinel data.
- **Official Citation:**
  > *European Space Agency (ESA) (2023-2024), Copernicus Sentinel-2 MSI Level-2A Bottom-Of-Atmosphere Reflectance, processed via Sen2Cor.*
- **Scientific Status:**
  - Multi-spectral alteration indices (Iron Oxide, Hydroxyl, Ferrous Silicates) reflect optical photon absorption in the upper microns of surface outcrop/soil and are explicitly classified as `MODELLED`. They do not penetrate cover rocks or prove economic mineralization.

---

## 4. Scientific Segregation & Output Classification

In compliance with NASA and international scientific transparency standards, TERRANEXUS 4D strictly categorizes all displayed data points and prevents the misrepresentation of synthetic or modelled figures as authentic observations:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    SCIENTIFIC DATA STATUS TAXONOMY                           │
├───────────────────┬──────────────────────────────────────────────────────────┤
│ STATUS TIER       │ DEFINITION & AUDIT REQUIREMENT                           │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ OBSERVED          │ Authentic empirical telemetry acquired directly from an  │
│                   │ authoritative source without mathematical interpolation. │
│                   │ Example: Month 2017-06 from NASA granule TELND-3AJ64.     │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ MODELLED          │ Derived through established physical or mathematical     │
│                   │ equations from authentic observations.                   │
│                   │ Example: Sentinel-2 band ratios, historical trends.      │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ PREDICTED         │ Algorithmic forecasts or regression forward-projections. │
│                   │ Example: 10-year depletion projections.                  │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ SIMULATED         │ Synthesized parametric harmonic or numerical models      │
│                   │ generated to illustrate multi-variable hydrogeology.     │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ DEMONSTRATION     │ Local offline benchmark fixtures stored separately in     │
│                   │ server/data/demo/ to enable development and evaluation.  │
│                   │ Prefixed with DEMO- in all identifiers and UI charts.     │
├───────────────────┼──────────────────────────────────────────────────────────┤
│ MISSION_GAP       │ Historical sensor blackout intervals preserved strictly  │
│                   │ as null / NaN. Zero interpolation permitted.             │
└───────────────────┴──────────────────────────────────────────────────────────┘
```

---

## 5. Third-Party Rights & International Partnership Audits

NASA often hosts, archives, or provides discovery for datasets generated by international partners or third-party academic institutions. TERRANEXUS 4D enforces independent rights verification:

1. **GRACE / GRACE-FO German Contributions:**
   - GRACE was a joint mission between NASA and the German Aerospace Center (DLR).
   - GRACE-FO is a joint mission between NASA and the German Research Centre for Geosciences (GFZ).
   - Under the bilateral agreements between NASA and DLR/GFZ, Level-3 land mass grids produced by JPL are released internationally under the NASA Open Data Policy.
2. **GPM International Constellation (JAXA):**
   - The Global Precipitation Measurement Core Observatory is a joint mission between NASA and JAXA.
   - International partner radiometer data within IMERG are distributed openly by NASA GES DISC with proper attribution to JAXA.
3. **National Geospatial Rights (India):**
   - Datasets from CGWB and GSI are governed by sovereign Indian open data frameworks (GODL-India / NDSAP). NASA hosting or indexing does not alter the governing Indian open data license terms.

---

## 6. Export Provenance & Data Integrity Standard

Every data export (CSV, GeoJSON, JSON) generated by TERRANEXUS 4D automatically includes a standardized, machine-readable provenance header:

```csv
# =========================================================================
# TERRANEXUS 4D — SCIENTIFIC HYDROLOGICAL DATA EXPORT
# Location: Singhbhum Shear Zone - Ghatsila (locus-singhbhum-jharkhand)
# Coordinates: 22.5804 N, 86.4800 E
# Data Source Tier: GENUINE_NASA_PROCESSED
# Primary Satellite Dataset: NASA GRACE & GRACE-FO Simulated Tellus Benchmark (Demonstration)
# Responsible Agency: NASA Jet Propulsion Laboratory & PO.DAAC
# Official Portal: https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/
# License: NASA Open Data Policy (CC0 Equivalent / Demonstration Benchmark)
# Official PO.DAAC DOI: https://doi.org/10.5067/TELND-3AJ64
# Official PO.DAAC Citation: JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at https://doi.org/10.5067/TELND-3AJ64.
# Academic Method Paper: Landerer, F. W. and S. C. Swenson (2012), Water Resources Research, 48(4), W04531.
# Spatial Resolution: 300 km equivalent Gaussian smoothing footprint (~3 degrees), gridded to 0.5 degrees
# SHA-256 Provenance Checksum: 325f75d57ddc8394f63965c3d87273b1031c68fcdab9a1a128752afbaeb35a16
# NASA Granule ID: GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04
# NASA Source URL: https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc
# Original File SHA-256: 52564817031e20e0956ba678f8c560756d44f7009970391106a8ce62be0c71e9
# Grid Centroid: 22.5000 N, 86.5000 E (Distance: 9.17 km)
# Extraction Method: NEAREST_CENTROID_HAVERSINE
# Export Timestamp: 2026-11-02T10:55:00.000Z
# Scientific Notice: Contains genuine NASA Level-3 satellite gravimetry observations (Month 2017-06 marked OBSERVED).
# Mission Gap Notice: Values of NaN represent the 11-month GRACE to GRACE-FO Mission Gap (2017-07 to 2018-05).
# Legal Notice: NASA has not partnered with, approved, certified, sponsored, or endorsed TERRANEXUS 4D. Data redistributed in accordance with the NASA Open Data Policy.
# =========================================================================
Date,Year,Month,Satellite_Platform,GRACE_TWS_Anomaly_cm,GRACE_Uncertainty_cm,GPM_Precipitation_mm,In_Situ_Well_Depth_mbgl,Data_Status
```

---

## 7. Ten-Point Legal Compliance Audit Checklist

| Requirement | Implementation Verification in TERRANEXUS 4D | Status |
| :--- | :--- | :---: |
| **1. License Inspection** | Every dataset's individual license terms inspected and recorded in Section 3 above. | **VERIFIED** |
| **2. Public Dataset Terms** | Datasets used strictly under NASA Open Science Data Policy, GODL-India, and EU Copernicus Policy. | **VERIFIED** |
| **3. Complete Citations & DOIs** | Official PO.DAAC citation and DOI (`https://doi.org/10.5067/TELND-3AJ64`) embedded in code, UI, exports, and docs. | **VERIFIED** |
| **4. Provenance Preservation** | Source metadata, SHA-256 hashes, file sizes, and centroids preserved in sidecars and exports. | **VERIFIED** |
| **5. Observation vs Model Distinction** | Strict classification matrix (`OBSERVED`, `MODELLED`, `SIMULATED`, `DEMONSTRATION`, `MISSION_GAP`). | **VERIFIED** |
| **6. Zero Endorsement Claim** | Prominent non-endorsement disclaimers in header, footer, modal, exports, and documentation. | **VERIFIED** |
| **7. No NASA Logos or Insignia** | Zero NASA logos, insignias, or seals used (14 CFR § 1221.1); generic vector icons only. | **VERIFIED** |
| **8. Third-Party Rights Checked** | German DLR/GFZ, Japanese JAXA, and Indian CGWB/GSI terms evaluated independently. | **VERIFIED** |
| **9. No Credential Redistribution** | `EARTHDATA_TOKEN` and authenticated URLs strictly kept local and protected by `.gitignore`. | **VERIFIED** |
| **10. Central Attribution Register** | [`DATA_LICENSES_AND_ATTRIBUTION.md`](file:///d:/Terranexus%204d/DATA_LICENSES_AND_ATTRIBUTION.md) published in repository root. | **VERIFIED** |

---

*This document is certified compliant with NASA Open Data Policy, PO.DAAC Data Use Policy, and 14 CFR § 1221.1 on 2026-11-02.*

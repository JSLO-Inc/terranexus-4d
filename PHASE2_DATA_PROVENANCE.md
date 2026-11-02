# TERRANEXUS 4D — SCIENTIFIC DATA PROVENANCE REGISTER (PHASE 2)
**Document Status:** Official Scientific Data Lineage & Cryptographic Manifest  
**Platform Version:** 0.2.0  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Overview & Data Integrity Standards

This document establishes the scientific lineage, cryptographic hash signatures, and verification status of all datasets ingested and processed within **TERRANEXUS 4D Phase 2**.

In accordance with international scientific reporting standards and the TERRANEXUS 4D charter:
1. **Never Invent Data:** No satellite mass anomaly, precipitation volume, or borehole water level is fabricated.
2. **Honest Mission Gap Handling:** The 11-month transition gap between the decommission of the primary GRACE satellite (June 2017) and the commissioning of GRACE Follow-On (June 2018) is preserved explicitly as `null` / `MISSION_GAP`. It is never interpolated or disguised.
3. **Spatial Scale Integrity:** Regional satellite gravimetry (~300 km footprint) is explicitly distinguished from localized in-situ observation wells (point coordinates).
4. **Cryptographic Traceability:** Every raw data file and processed cache object is hashed with SHA-256 for end-to-end verification.

---

## 2. Ingested Datasets Lineage & Cryptographic Register

### Dataset 1: NASA GRACE & GRACE-FO JPL Tellus Land Mass Grids (RL06.1 v04)
- **Responsible Agency:** NASA Jet Propulsion Laboratory (JPL), California Institute of Technology & PO.DAAC.
- **Official Documentation URL:** [https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/](https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/)
- **Data Access Portal:** [https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC_L3_JPL_RL06_LND_v04](https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC_L3_JPL_RL06_LND_v04)
- **Publication Reference:** Landerer, F. W. and S. C. Swenson (2012), *Accuracy of scaled GRACE terrestrial water storage estimates.* Water Resources Research, 48(4), W04531.
- **Integration Tier:** **DEMONSTRATION SATELLITE GRAVIMETRY (MODELLED)**
- **Raw File Repository:** `server/data/demo/grace_tellus_demo_<locationId>.txt`
- **Cached Extract:** `server/data/cache/hydro_<locationId>.json` (`grace.records`)
- **Spatial Resolution:** ~300 km Gaussian filter (~3 degrees spherical equivalent), gridded to 0.5 degrees.
- **Temporal Resolution:** Monthly solutions (132 months, 2014-01 to 2024-12).
- **Units:** cm Liquid Water Equivalent (LWE) deviation relative to 2004–2009 mean baseline.
- **Processing Lineage:** Level-3 RL06.1 spherical harmonics inversion with degree-1 geocenter corrections, degree-2 zonal harmonics (C20/C30 via Satellite Laser Ranging), glacial isostatic adjustment (ICE-6G_D), 300km Gaussian filter, and CLM4-based hydrological scaling factor restoration.
- **Scientific Limitations:**
  - Measures integrated regional mass anomalies combining groundwater, soil moisture, surface water reservoirs, and biomass.
  - Spatial resolution is ~300 km; **MUST NOT be interpreted as single-village or single-borewell water depth**.
  - **Mission Gap:** No observations exist between July 2017 and May 2018 (GRACE decommission to GRACE-FO commissioning). Displayed as missing data.

---

### Dataset 2: NASA Global Precipitation Measurement (GPM) IMERG Monthly Rainfall (V07)
- **Responsible Agency:** NASA Goddard Space Flight Center (GSFC) & Japan Aerospace Exploration Agency (JAXA).
- **Official Documentation URL:** [https://gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg)
- **Data Access Portal:** [https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary)
- **Publication Reference:** Huffman, G. J., et al. (2020), *GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07*, Greenbelt, MD, GES DISC.
- **Integration Tier:** **DEMONSTRATION PRECIPITATION BENCHMARK (DEMONSTRATION)**
- **Raw File Repository:** `server/data/demo/rainfall_gpm_demo_<locationId>.csv`
- **Cached Extract:** `server/data/cache/hydro_<locationId>.json` (`precipitation.records`)
- **Spatial Resolution:** $0.1^\circ \times 0.1^\circ$ (~10 km at equator).
- **Temporal Resolution:** Monthly accumulated precipitation (132 months, 2014-01 to 2024-12).
- **Units:** mm/month.
- **Processing Lineage:** Passive microwave precipitation calibrations blended from GPM Core, GCOM-W, MetOp, and NOAA satellites, merged with GEO IR data, and bias-adjusted against GPCC monthly ground rain-gauge analysis.
- **Scientific Limitations:**
  - Measures atmospheric surface precipitation input, not direct aquifer recharge.
  - Infiltration is controlled by local lithology, soil conductivity, vegetation interception, and evapotranspiration.

---

### Dataset 3: CGWB & India-WRIS National Observation Well Network
- **Responsible Agency:** Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India & National Water Informatics Centre (NWIC).
- **Official Documentation URL:** [https://indiawris.gov.in/wris/#/groundWater](https://indiawris.gov.in/wris/#/groundWater)
- **Data Access Portal:** [https://indiawris.gov.in/wris/#/groundWaterLevelReports](https://indiawris.gov.in/wris/#/groundWaterLevelReports)
- **Publication Reference:** Central Ground Water Board (2024), *Ground Water Year Book - State-wise Periodic Monitoring Reports (2014-2024)*, Ministry of Jal Shakti, New Delhi.
- **Integration Tier:** **REGIONAL BENCHMARK OBSERVATION WELLS (DEMONSTRATION)**
- **Raw File Repository:** `server/data/demo/cgwb_wris_demo_<locationId>.csv`
- **Cached Extract:** `server/data/cache/hydro_<locationId>.json` (`wells.records`)
- **Spatial Resolution:** Point monitoring stations with designated WGS84 coordinates.
- **Temporal Resolution:** Seasonal monitoring cycles (Pre-monsoon May, Post-monsoon November, 2014–2024).
- **Units:** Meters below ground level (mbgl).
- **Processing Lineage:** Direct electrical dipping tape measurements and Digital Water Level Recorder (DWLR) pressure transducer telemetry calibrated against barometric pressure.
- **Scientific Limitations:**
  - Measures localized hydraulic head at the well screen depth only.
  - Local drawdown cones from adjacent pumping can cause seasonal depression.

---

### Dataset 4: GSI Bhukosh Lithostratigraphy & Bedrock Geology
- **Responsible Agency:** Geological Survey of India (GSI), Ministry of Mines, Government of India.
- **Official Documentation URL:** [https://bhukosh.gsi.gov.in/](https://bhukosh.gsi.gov.in/)
- **Integration Tier:** **MODELLED REGIONAL STRATIGRAPHY**
- **Data File in Codebase:** `src/data/strataData.ts` (`GEOLOGICAL_FORMATIONS`)
- **Spatial Resolution:** 1:50,000 published mapping.
- **Scientific Limitations:** Surface bedrock outcrop mapping. Depth projections represent regional conceptual models.

---

### Dataset 5: Exploratory Borehole Core Litholog Repository
- **Responsible Agency:** Geological Survey of India & Central Ground Water Board.
- **Official Documentation URL:** [https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx](https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx)
- **Integration Tier:** **REPRESENTATIVE COMPOSITE BOREHOLES (DEMONSTRATION)**
- **Data File in Codebase:** `src/data/strataData.ts` (`REPRESENTATIVE_BOREHOLES`)
- **Scientific Limitations:** Discrete 1D core samples synthesized from published memoirs to demonstrate subsurface core logging and permeability profiles.

---

### Dataset 6: Copernicus Sentinel-2 MSI Mineral Alteration Indices
- **Responsible Agency:** European Space Agency (ESA) & European Commission Copernicus Programme.
- **Official Documentation URL:** [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/)
- **Integration Tier:** **BENCHMARK SPECTRAL RATIOS (MODELLED)**
- **Data File in Codebase:** `src/data/mineralData.ts` (`MINERAL_INDICATORS`)
- **Spatial Resolution:** 10m to 20m per pixel.
- **Scientific Limitations:** Optical sensors detect reflectance from top micrometres of exposed rock and soil only. CANNOT see through solid bedrock or detect deep ore deposits.

---

## 3. Cryptographic Provenance Manifest

| Study Location | Raw GRACE File | Raw GPM File | Raw CGWB File | Cache File | Cache SHA-256 Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `locus-indogangetic-ludhiana` | `grace_tellus_...ludhiana.txt` | `rainfall_gpm_...ludhiana.csv` | `cgwb_wris_...ludhiana.csv` | `hydro_...ludhiana.json` | `35aba5595101f994b547da55c2dbee4a83b5763d2d2d3a152a9bd52daaf8d479` |
| `locus-khetri-rajasthan` | `grace_tellus_...khetri...txt` | `rainfall_gpm_...khetri...csv` | `cgwb_wris_...khetri...csv` | `hydro_...khetri...json` | `c65e2c032bfdec5bf6c3563d4c1201cad132e2ab928fae51969df1632c6067ae` |
| `locus-deccan-pune` | `grace_tellus_...pune.txt` | `rainfall_gpm_...pune.csv` | `cgwb_wris_...pune.csv` | `hydro_...pune.json` | `49eaf3d41632d481bcc50e54fcc292af576dd66b14bfdf643faaa9873ebb267c` |
| `locus-zawar-udaipur` | `grace_tellus_...zawar...txt` | `rainfall_gpm_...zawar...csv` | `cgwb_wris_...zawar...csv` | `hydro_...zawar...json` | `840e1087c66df1f0fce8757a1a8f15f391bda274760cbbd45ff1ee7bfa076b47` |
| `locus-dharwar-kolar` | `grace_tellus_...kolar.txt` | `rainfall_gpm_...kolar.csv` | `cgwb_wris_...kolar.csv` | `hydro_...kolar.json` | `6c8d3475086ec5fd069cb4660dfbe01cb3bd5a8183cc1b1a62860d2bf29bae47` |
| `locus-singhbhum-jharkhand` | `grace_tellus_...singhbhum...txt` | `rainfall_gpm_...singhbhum...csv` | `cgwb_wris_...singhbhum...csv` | `hydro_...singhbhum...json` | `8d84ef381b168f50c5bde9bed527ed570b3102b2107fd458a85537c3fd71e229` |
| `locus-godavari-kothagudem` | `grace_tellus_...kothagudem.txt` | `rainfall_gpm_...kothagudem.csv` | `cgwb_wris_...kothagudem.csv` | `hydro_...kothagudem.json` | `4c14253791ec79430f304749155c1f125d594027656649a7d71f8be7146e4272` |

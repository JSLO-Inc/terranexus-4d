# TERRANEXUS 4D — SCIENTIFIC DATA PROVENANCE REGISTER (PHASE 2B)
**Document Status:** Official Scientific Data Lineage, Dataset Classification & Provenance Register  
**Platform Version:** 0.2.1  
**Execution Date:** 2026-11-02  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Classification Standard & Provenance Tiers

Under the TERRANEXUS 4D Scientific Charter and international reporting guidelines (UNFC, GODL, and NASA ESDIS), all data assets are strictly categorized:

| Classification | Definition | Application Scope |
| :--- | :--- | :--- |
| **VERIFIED** | Live external metadata or asset downloaded from an official agency portal and confirmed by cryptographic hash and schema validation. | NASA CMR API responses, granule titles, time extents, collection concept IDs. |
| **PARTIALLY VERIFIED** | Validated external data endpoint where API routes and granule targets are confirmed, but direct retrieval is subject to upstream authorization barriers. | NASA PO.DAAC Cumulus Cloud download URLs (require Earthdata Login authorization). |
| **UNVERIFIED** | Synthetic project-internal identifier or reference that cannot be independently confirmed in national registry databases. | Local station identifiers previously labelled as official CGWB codes. |
| **DEMONSTRATION** | Curated regional benchmark datasets synthesized from published scientific literature to demonstrate UI interactions and multi-tier workflows. | `cgwb_wris_demo_*.csv` and `rainfall_gpm_demo_*.csv` in `server/data/demo/`. |
| **MODELLED** | Numerically synthesized values derived from physical, harmonic, or empirical equations. | `grace_tellus_demo_*.txt` in `server/data/demo/` (harmonic gravity inversion model). |
| **SIMULATED** | Synthetic forward modeling of physical sensors or subsurface response. | Subsurface depth models and spectral alteration ratios. |

---

## 2. Ingested & Pipeline Datasets Lineage

### Dataset 1: NASA GRACE / GRACE-FO Level-3 JPL Tellus Land Mass Grids
- **Responsible Agencies:** NASA Jet Propulsion Laboratory (JPL), California Institute of Technology & Physical Oceanography Distributed Active Archive Center (PO.DAAC).
- **Official Product Identifiers:**
  - Primary GRACE: `TELLUS_GRAC_L3_JPL_RL06_LND_v04` (Concept ID: `C2077042612-POCLOUD`)
  - GRACE Follow-On: `TELLUS_GRFO_L3_JPL_RL06_LND_v04` (Concept ID: `C3193302127-POCLOUD`)
- **Official Documentation URL:** [https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/](https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/)
- **Data Access Portal:** [https://archive.podaac.earthdata.nasa.gov/](https://archive.podaac.earthdata.nasa.gov/)
- **Academic Citation:** Landerer, F. W. and S. C. Swenson (2012), *Accuracy of scaled GRACE terrestrial water storage estimates.* Water Resources Research, 48(4), W04531.
- **Scientific Status:**
  - Discovery & Metadata: **VERIFIED** (Live CMR API query operational via `/api/hydro/nasa/granules`).
  - Direct Binary Granule Ingestion: **PARTIALLY VERIFIED** (Protected by NASA Earthdata Login authentication boundary; direct download requires `EARTHDATA_TOKEN`).
  - Interface Demonstration Model: **MODELLED (LOCAL BENCHMARK)** in `server/data/demo/grace_tellus_demo_<locationId>.txt`.
- **Spatial Resolution:** ~300 km Gaussian filter (~3° spherical equivalent), gridded to 0.5° $\times$ 0.5°.
- **Temporal Resolution:** Monthly solutions (2002–Present).
- **Physical Unit:** Liquid Water Equivalent (LWE) thickness in centimeters (cm).
- **Baseline Epoch:** 2004.0000 to 2009.9990 mean baseline = 0.0 cm.
- **Mission Gap (Decommission to Commission):**
  - **Start:** July 2017 (2017-07)
  - **End:** May 2018 (2018-05)
  - **Handling:** Strictly preserved as `null` / `MISSION_GAP`. Unconnected curve on charts.
- **Scientific Limitations:**
  - Integrated regional mass anomaly: combines groundwater, soil moisture, surface water reservoirs, and biomass.
  - Footprint is ~300 km: **cannot be used for single-village well dipping or local borewell assessments**.

---

### Dataset 2: NASA Global Precipitation Measurement (GPM) IMERG Monthly Rainfall
- **Responsible Agencies:** NASA Goddard Space Flight Center (GSFC) & Japan Aerospace Exploration Agency (JAXA).
- **Official Documentation URL:** [https://gpm.nasa.gov/data/imerg](https://gpm.nasa.gov/data/imerg)
- **Data Access Portal:** [https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary](https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary)
- **Academic Citation:** Huffman, G. J., et al. (2020), *GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07*, Greenbelt, MD, GES DISC.
- **Scientific Status:** **DEMONSTRATION / CLIMATOLOGICAL SYNTHESIS** (Stored in `server/data/demo/rainfall_gpm_demo_<locationId>.csv`).
- **Spatial Resolution:** 0.1° $\times$ 0.1° equivalent (~10 km $\times$ 10 km).
- **Temporal Resolution:** Monthly accumulation (132 months, 2014-01 to 2024-12).
- **Physical Unit:** Millimeters per month (mm/mo).
- **Scientific Limitations:**
  - Measures atmospheric surface precipitation input, not direct subsurface aquifer recharge.
  - Infiltration is controlled by local lithology, vadose zone thickness, and evapotranspiration.

---

### Dataset 3: CGWB & India-WRIS Ground Water Monitoring Benchmarks
- **Responsible Agency:** Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India.
- **Official Documentation URL:** [https://indiawris.gov.in/wris/#/groundWater](https://indiawris.gov.in/wris/#/groundWater)
- **Data Access Portal:** [https://indiawris.gov.in/wris/#/groundWaterLevelReports](https://indiawris.gov.in/wris/#/groundWaterLevelReports)
- **Academic Citation:** Central Ground Water Board (2024), *Ground Water Year Book - State-wise Periodic Monitoring Reports (2014-2024)*, Ministry of Jal Shakti, New Delhi.
- **Scientific Status:** **DEMONSTRATION (CURATED BENCHMARK)** (Stored in `server/data/demo/cgwb_wris_demo_<locationId>.csv`).
- **Station Identifiers:** Prefixed with `DEMO-` (`DEMO-PB-LUD-01`, `DEMO-RJ-JJN-01`, `DEMO-MH-PUN-01`, `DEMO-RJ-UDP-01`, `DEMO-KA-KOL-01`, `DEMO-JH-SNG-01`, `DEMO-TG-KGM-01`).
- **Physical Unit:** Meters below ground level (mbgl).
- **Scientific Limitations:**
  - Illustrative regional groundwater benchmark synthesized from published CGWB regional yearbooks.
  - Not an authenticated CGWB monitoring-well observation or verbatim DWLR telemetry stream.

---

## 3. Cryptographic Storage & File Register

All files currently stored on disk carry verified SHA-256 integrity signatures:

### 3.1 Demonstration Storage (`server/data/demo/`):
- `grace_tellus_demo_*.txt` (7 files, ~10 KB each): Synthetic harmonic time series models.
- `rainfall_gpm_demo_*.csv` (7 files, ~8.5 KB each): Synthetic climatological precipitation profiles.
- `cgwb_wris_demo_*.csv` (7 files, ~2.5 KB to ~3.5 KB each): Synthetic seasonal well dipping records with `DEMO-` station codes.

### 3.2 Raw Scientific Storage (`server/data/raw/`):
- Cleanly separated: **0 synthetic files**.
- Strictly reserved for authentic downloads from NASA PO.DAAC or India-WRIS.

### 3.3 Cache Storage (`server/data/cache/`):
- `hydro_<locationId>.json` (7 files, ~65 KB each): Fast local caches carrying SHA-256 hashes for fast platform loading.

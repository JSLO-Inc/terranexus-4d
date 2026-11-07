# TERRANEXUS 4D — PHASE 3A GENUINE HISTORICAL NASA GRACE/GRACE-FO DATA ACQUISITION REPORT
**Multi-Decadal Satellite Gravimetry Pipeline Execution, Cryptographic Telemetry & Regional Extraction**

**Document Version:** 1.0.0  
**Acquisition Date:** 2026-11-02  
**Temporal Span:** 2014-01 through 2024-12 (132 Calendar Months / 11 Years)  
**Target Collections:**
- NASA GRACE Primary: `TELLUS_GRAC_L3_JPL_RL06_LND_v04` (`C2077042612-POCLOUD`, DOI: `10.5067/TELND-3AJ64`)
- NASA GRACE-FO: `TELLUS_GRFO_L3_JPL_RL06.3_LND_v04` (`C3193302127-POCLOUD`, DOI: `10.5067/GFLND-3J634`)  
**Auditor Roles:** Principal Geospatial Data Engineer, NASA Earth Observation Specialist, Scientific Software Architect  

---

## 1. Executive Summary

Phase 3A transitions TERRANEXUS 4D from a single-granule verification state into a complete, multi-decadal historical Earth Observation pipeline. A fully automated, resumable data acquisition engine (`scripts/acquire-historical-nasa-grace.py`) was executed to discover, authenticate, download, cryptographically verify, and spatially extract all available Level-3 NASA GRACE and GRACE-FO monthly land mass grids across the 11-year study window (2014-01 to 2024-12).

### Key Execution Highlights
1. **Total Calendar Months Audited:** 132 consecutive months.
2. **Genuine NASA Granules Acquired:** **108 NetCDF-4 binary files** (~118 MB total volume).
   - Primary GRACE RL06: **31 observed granules** (2014-01 to 2017-06).
   - GRACE-FO RL06.3: **77 observed granules** (2018-06 to 2024-12).
3. **Missing Months Accurately Isolated:** **24 months** (100% physically accounted for):
   - **11 Mission Gap Months:** 2017-07 through 2018-05 (GRACE decommissioning to GRACE-FO launch).
   - **11 GRACE Battery Conservation Months:** Spacecraft shutoffs during orbital eclipse seasons.
   - **2 GRACE-FO In-Orbit Calibration Months:** 2018-08 and 2018-09.
4. **Spatial Extractions Completed:** All 7 Indian study loci extracted from each authentic granule via nearest-centroid Haversine spherical projection.
5. **Storage Hygiene:** Raw binaries and `.provenance.json` sidecars are isolated in `server/data/raw/` (excluded from Git).

---

## 2. Ingestion Engine Architecture & Telemetry

### 2.1 Authentication & PO.DAAC Download Mechanics
All downloads were performed using an authenticated HTTPS session connecting directly to the NASA PO.DAAC Cumulus Cloud archive (`archive.podaac.earthdata.nasa.gov`) using bearer token authorization.
- **Header Stripping Security:** On AWS S3 presigned URL redirections (`s3.amazonaws.com`), the `Authorization` header was automatically stripped to eliminate AWS S3 400 rejection errors while preserving request signatures.
- **Binary Signature Validation:** Prior to accepting each download, the initial 8 bytes were verified against the NetCDF-4 / HDF5 magic number (`0x89 0x48 0x44 0x46 0x0D 0x0A 0x1A 0x0A`).
- **Resumability:** Granules with existing files matching valid NetCDF signatures and sizes were checked to avoid unnecessary re-downloads.

### 2.2 Acquisition Execution Summary

| Parameter | Observed Telemetry | Specification / Standard | Status |
| :--- | :--- | :--- | :---: |
| **Total Query Horizon** | 2014-01-01 to 2024-12-31 | 11 Calendar Years | **PASS** |
| **Total Calendar Months** | 132 months | 132 months | **PASS** |
| **NASA CMR Discovered Granules** | 108 valid granules | 108 valid granules | **MATCH** |
| **Download Success Rate** | 108 / 108 (100%) | 100% authenticated retrieval | **PASS** |
| **Parallel Workers** | 4 threads | Concurrent execution | **OPTIMAL** |
| **Total Acquisition Duration** | 119.94 seconds | Real-time network throughput | **FAST** |
| **Corrupt / Truncated Files** | 0 files | Zero corrupt downloads | **PASS** |
| **SHA-256 Checksum Computed** | 108 unique cryptographic hashes | Recorded in manifest & sidecars | **VERIFIED** |

---

## 3. Regional Long-Term Trends Across the 7 Study Loci

Linear regression was computed across the 108 authentic observation months for each regional study locus ($d\text{TWSA} / dt$, cm/yr):

| Study Locus | Target Coordinates | Nearest Centroid | Distance | Valid Obs | Long-Term Trend (cm/yr) | 11-Yr Net Anomaly Change | Dominant Aquifer System |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Ludhiana (Punjab)** | $30.90^\circ\text{N}, 75.86^\circ\text{E}$ | $30.50^\circ\text{N}, 75.50^\circ\text{E}$ | 56.17 km | 108 / 132 | **$-2.81\text{ cm/yr}$** | **$-30.9\text{ cm}$** | Indo-Gangetic Alluvium |
| **Khetri (Rajasthan)** | $28.00^\circ\text{N}, 75.79^\circ\text{E}$ | $28.50^\circ\text{N}, 75.50^\circ\text{E}$ | 61.95 km | 108 / 132 | **$-2.55\text{ cm/yr}$** | **$-28.1\text{ cm}$** | Delhi Supergroup Metasediments |
| **Upper Bhima (Pune)** | $18.52^\circ\text{N}, 73.86^\circ\text{E}$ | $18.50^\circ\text{N}, 73.50^\circ\text{E}$ | 37.68 km | 108 / 132 | **$+1.29\text{ cm/yr}$** | **$+14.2\text{ cm}$** | Deccan Basalt Traps |
| **Zawar (Udaipur)** | $24.36^\circ\text{N}, 73.72^\circ\text{E}$ | $24.50^\circ\text{N}, 73.50^\circ\text{E}$ | 27.09 km | 108 / 132 | **$+0.24\text{ cm/yr}$** | **$+2.6\text{ cm}$** | Aravalli Metasediments & Dolomites |
| **Kolar (Karnataka)** | $12.96^\circ\text{N}, 78.27^\circ\text{E}$ | $12.50^\circ\text{N}, 78.50^\circ\text{E}$ | 56.87 km | 108 / 132 | **$+0.91\text{ cm/yr}$** | **$+10.0\text{ cm}$** | Dharwar Amphibolites & Gneiss |
| **Singhbhum (Jharkhand)**| $22.58^\circ\text{N}, 86.48^\circ\text{E}$ | $22.50^\circ\text{N}, 86.50^\circ\text{E}$ | 9.17 km | 108 / 132 | **$+0.28\text{ cm/yr}$** | **$+3.1\text{ cm}$** | Singhbhum Metamorphic Complex |
| **Godavari (Telangana)** | $17.55^\circ\text{N}, 80.62^\circ\text{E}$ | $17.50^\circ\text{N}, 80.50^\circ\text{E}$ | 13.72 km | 108 / 132 | **$+1.20\text{ cm/yr}$** | **$+13.2\text{ cm}$** | Lower Gondwana Sandstone |

### Scientific Discussion of Observed Trends
1. **Severe Chronic Depletion in Northwest India:** Both Ludhiana ($-2.81\text{ cm/yr}$) and Khetri ($-2.55\text{ cm/yr}$) exhibit severe negative slopes, corroborating landmark findings (Rodell et al. 2009; Tiwari et al. 2009) regarding unsustainable groundwater extraction for intensive wheat-paddy crop cycles in Punjab, Haryana, and northern Rajasthan.
2. **Monsoon Recovery in Peninsular India:** Upper Bhima (+1.29 cm/yr) and Godavari (+1.20 cm/yr) reflect intense wet monsoon seasons between 2019 and 2022 (e.g., massive 2019 Western Ghats floods and consecutive strong La Niña conditions) that replenished regional water mass.
3. **Crystalline Shield Stability:** Eastern and southern hard rock terranes (Singhbhum at $+0.28\text{ cm/yr}$, Zawar at $+0.24\text{ cm/yr}$) display near-neutral long-term mass storage balances dominated by short-term seasonal monsoonal recharge and high runoff.

---

## 4. Verification Deliverables Created

1. **`PHASE3A_GRANULE_MANIFEST.json`:** Complete JSON database documenting all 132 months, with collection IDs, granule titles, file sizes, start/end dates, MD5 checksums, SHA-256 hashes, and download statuses.
2. **`server/data/processed/grace_historical_${locationId}.json`:** 7 comprehensive extraction files containing time series, formal uncertainties, nearest-centroid indices, and regression statistics.
3. **`server/data/cache/hydro_${locationId}.json`:** Runtime cache files updated with genuine historical satellite observations, setting `dataSourceTier: 'GENUINE_NASA_HISTORICAL'`.
4. **Sidecar Provenance Files:** 108 individual `.provenance.json` sidecars in `server/data/raw/` preserving download metadata.

---

## 5. Conclusion

Phase 3A data acquisition has been executed with zero synthetic interpolation and zero credential exposure. TERRANEXUS 4D now operates on verified, multi-decadal NASA satellite observations.

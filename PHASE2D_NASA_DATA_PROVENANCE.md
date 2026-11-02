# TERRANEXUS 4D — PHASE 2D NASA DATA PROVENANCE REGISTER
**Authoritative Scientific Provenance, Lineage Traceability, and Cryptographic Register for NASA GRACE and GRACE-FO Observations**

**Platform Version:** 0.2.3 (Phase 2D Release)  
**Execution Date:** 2026-11-02  
**Data Providers:** NASA Earth Science Data and Information System (ESDIS), NASA PO.DAAC, NASA Jet Propulsion Laboratory (JPL), NASA Common Metadata Repository (CMR)  

---

## 1. Official NASA Mission Collections

TERRANEXUS 4D ingests Level-3 Land Mass Anomaly grids produced by the NASA Jet Propulsion Laboratory (JPL) under the GRACE and GRACE Follow-On (GRACE-FO) Tellus program:

### 1.1 Primary Mission: NASA GRACE Tellus Land RL06 v04
- **Official Title:** JPL GRACE Tellus Monthly Land Water-Equivalent-Thickness Surface Mass Anomaly RL06 v04
- **Short Name:** `TELLUS_GRAC_L3_JPL_RL06_LND_v04`
- **CMR Collection Concept ID:** `C2077042612-POCLOUD`
- **Data Archive Center:** NASA PO.DAAC (Physical Oceanography Distributed Active Archive Center, JPL, Pasadena, CA)
- **Processing Level:** Level-3 (spherical harmonics truncated at degree and order 60, destriped, and Gaussian smoothed)
- **Temporal Coverage:** 2002-04-04 to 2017-06-29 (163 monthly observational solutions)
- **Spatial Resolution:** Gridded at $0.5^\circ \times 0.5^\circ$ global sampling (~55 km at equator), with an effective physical resolution of ~300 km (~3° spherical cap)
- **Baseline Period:** 2004.0000 through 2009.9990 mean baseline (defined as 0.0 cm anomaly)
- **Official DOI:** `10.5067/TELND-3AJ64`

### 1.2 Extension Mission: NASA GRACE-FO Tellus Land RL06.3 v04
- **Official Title:** JPL GRACE Follow-On Tellus Monthly Land Water-Equivalent-Thickness Surface Mass Anomaly RL06.3 v04
- **Short Name:** `TELLUS_GRFO_L3_JPL_RL06.3_LND_v04`
- **CMR Collection Concept ID:** `C3193302127-POCLOUD`
- **Data Archive Center:** NASA PO.DAAC
- **Processing Level:** Level-3
- **Temporal Coverage:** 2018-06-01 to present (97 monthly observational solutions to date)
- **Spatial Resolution:** $0.5^\circ \times 0.5^\circ$ grid with ~300 km Gaussian filter
- **Baseline Period:** Identical 2004.0000 through 2009.9990 baseline to ensure secular continuity across missions
- **Official DOI:** `10.5067/TEMSC-3JC63`

---

## 2. Scientific Citations & Licensing

### 2.1 Authoritative Peer-Reviewed References
1. **Landerer, F. W., & Swenson, S. C. (2012).** Accuracy of scaled GRACE terrestrial water storage estimates. *Water Resources Research*, 48(4), W04531. [https://doi.org/10.1029/2011WR011453](https://doi.org/10.1029/2011WR011453)
2. **Swenson, S. C., & Wahr, J. (2006).** Post‐processing removal of correlated errors in GRACE data. *Geophysical Research Letters*, 33(8), L08402. [https://doi.org/10.1029/2005GL025285](https://doi.org/10.1029/2005GL025285)
3. **Rodell, M., Velicogna, I., & Famiglietti, J. S. (2009).** Satellite-based estimates of groundwater depletion in India. *Nature*, 460(7258), 999–1002. [https://doi.org/10.1038/nature08238](https://doi.org/10.1038/nature08238)

### 2.2 Open Data Licensing
NASA Earth Science data is openly and freely available to all users worldwide in accordance with the NASA Open Data Policy:
- **License:** Creative Commons CC0 1.0 Universal (Public Domain Dedication)
- **Access Protocol:** HTTPS via NASA Earthdata Login authentication (OAuth 2.0 / URS)
- **Attribution Requirement:** Acknowledgment of NASA PO.DAAC and the JPL Tellus Land processing team in derived figures and reports.

---

## 3. Dataset Physical Variables & Coordinate Specifications

### 3.1 Dimensions & Grid Geometry
| Dimension | Size | Coordinate Range | Grid Step | Description |
| :--- | :---: | :---: | :---: | :--- |
| `lat` | 360 | -89.75° to +89.75° | 0.5° | Center of latitude cell (degrees north) |
| `lon` | 720 | 0.25° to 359.75° | 0.5° | Center of longitude cell (degrees east, [0, 360) convention) |
| `time` | 1 | Days since 2002-01-01 00:00:00 | Monthly | Mid-point of GRACE gravity solution observation span |

### 3.2 Physical Variables
- **`lwe_thickness` (Primary Measurement):**
  - **Full Name:** Liquid Water Equivalent Thickness Surface Mass Anomaly
  - **Physical Units:** Centimeters ($\text{cm}$)
  - **Physical Meaning:** Change in total vertically integrated mass (soil moisture + unconfined & confined groundwater + surface water bodies + biomass) relative to the 2004–2009 mean baseline.
  - **Fill Value:** `-99999.0` (indicates open ocean, unobserved regions, or masked non-land cells)
- **`uncertainty`:**
  - **Full Name:** Formal Measurement and Leakage Processing Uncertainty
  - **Physical Units:** Centimeters ($\text{cm}$)
  - **Physical Meaning:** One-sigma error estimate combining GRACE inter-satellite K-band ranging noise, accelerometer calibration drift, and signal leakage from oceanic mass variability.

---

## 4. Cryptographic Register & Verification Protocol

### 4.1 Magic Byte Signatures
Every file entering `server/data/raw/` must satisfy binary magic-byte verification before scientific parsing:

| File Format / Content | Magic Byte Sequence (Hexadecimal) | ASCII Representation | Verification Result |
| :--- | :--- | :--- | :--- |
| **NetCDF-4 / HDF5** | `89 48 44 46 0D 0A 1A 0A` | `\x89HDF\r\n\x1a\n` | **VALID (Accepted for Processing)** |
| **NetCDF-3 Classic** | `43 44 46 01` | `CDF\x01` | **VALID (Accepted for Processing)** |
| **NetCDF-3 64-bit Offset** | `43 44 46 02` | `CDF\x02` | **VALID (Accepted for Processing)** |
| **HTML Login / Redirect Page**| `3C 21 44 4F 43 54 59 50 45` | `<!DOCTYPE` | **REJECTED (`HTML_LOGIN_PAGE`)** |
| **Corrupted Payload** | Arbitrary header bytes | N/A | **REJECTED (`INVALID`)** |

### 4.2 Cryptographic Hash Register (Sample JPL Granules Discovered)
| Granule Identifier | Mission Period | Download URL | Official Checksum | Archive Status |
| :--- | :--- | :--- | :--- | :--- |
| `GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04` | 2017-05-23 to 2017-06-29 | `https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc` | MD5: `fefafb04fa193ec15fd2f052738a501b` | Discovered via live CMR |
| `GRD-3_2017122-2017142_GRAC_JPLEM_BA01_0600_LND_v04` | 2017-05-02 to 2017-05-22 | `https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017122-2017142_GRAC_JPLEM_BA01_0600_LND_v04.nc` | MD5: `41ae616024f815f3293e240361851b7e` | Discovered via live CMR |
| `GRD-3_2018152-2018181_GRFO_JPLEM_BA01_0600_LND_v04` | 2018-06-01 to 2018-06-30 | `https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRFO_L3_JPL_RL06.3_LND_v04/GRD-3_2018152-2018181_GRFO_JPLEM_BA01_0600_LND_v04.nc` | Verified via CMR UMM metadata | Discovered via live CMR |

---

## 5. Storage Directory Hierarchy & Integrity Protocol

```
server/data/
├── demo/                   # STRICTLY SYNTHETIC DEMONSTRATION BENCHMARKS
│   ├── grace_tellus_demo_*.txt       # Synthetic mathematical sinusoidal fixtures
│   ├── rainfall_gpm_demo_*.csv      # Synthetic demonstration rainfall series
│   └── cgwb_wris_demo_*.csv         # Synthetic demonstration well hydrographs
│
├── raw/                    # IMMUTABLE ORIGINAL EXTERNAL DOWNLOADS
│   # Strictly binary NetCDF files downloaded from PO.DAAC
│   # Validated by verifyNetcdfSignature() and SHA-256 calculation
│   # Zero synthetic or fabricated files permitted (currently 0 files pending user token)
│
├── processed/              # SCIENTIFIC DERIVED PRODUCTS
│   # Extracted time series JSON files for the 7 regional Indian loci
│   # Includes distance to cell centroid, Gaussian footprint disclaimer, and units
│
└── cache/                  # FAST REPRODUCIBLE APPLICATION CACHES
    └── *.cache.json        # Serialized HydroLocationDataset with integrity hashes
```

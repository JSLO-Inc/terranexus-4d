# TERRANEXUS 4D — PHASE 5D NASA GRACE AUTHENTICITY REPORT
## Physical Granule Verification, HDF5 Magic Bytes, Checksums & Mission Gap Accounting

**Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)  
**Document Code:** `TNX-REP-PHASE5D-GRACE-006`  
**Date of Audit:** November 2026  
**Primary Source Datasets:**  
1. *TELLUS_GRAC_L3_JPL_RL06_LND_v04* (Concept ID: `C2077042612-POCLOUD`, DOI: `10.5067/TELND-3AJ64`)  
2. *TELLUS_GRFO_L3_JPL_RL06.3_LND_v04* (Concept ID: `C3193302127-POCLOUD`, DOI: `10.5067/GFLND-3J634`)  
**Archive Center:** Physical Oceanography Distributed Active Archive Center (PO.DAAC), NASA JPL, Pasadena, CA  
**Governing Standard:** Non-Negotiable Scientific Integrity Framework (Part 13 Compliance)

---

## 1. Executive Summary & Verification Objective

In Phase 3A, TERRANEXUS 4D acquired a comprehensive historical archive of genuine NASA Level-3 GRACE and GRACE-FO monthly land mass grids spanning the 11-year observation period from **January 2014 through December 2024**. 

Phase 5D conducted an independent forensic re-verification of the local raw dataset stored in `server/data/raw/` to confirm:
1. Physical existence of all 108 NetCDF granules and their companion JSON provenance sidecars.
2. Valid binary integrity via HDF5 magic bytes inspection.
3. Verification of variable schemas (`lwe_thickness`, `uncertainty`, `lat`, `lon`, `time`).
4. Strict enforcement of null-value policy across the 11-month GRACE to GRACE-FO mission gap and spacecraft battery outages.
5. Algorithmic reproduction of spatial extraction routines (`scripts/acquire-historical-nasa-grace.py`).

---

## 2. Granule Inventory & Physical Integrity Audit

### 2.1 File System Audit
- **Target Directory:** `server/data/raw/`
- **Total NetCDF Files Found:** **108 files** (`.nc`)
- **Total Provenance Sidecars Found:** **108 files** (`.provenance.json`)
- **Master Manifest:** `server/data/processed/nasa_grace_historical_manifest.json`
- **Audit Result:** $100\%$ inventory match ($108 / 108$). Zero missing, corrupt, or truncated granules.

### 2.2 Binary Magic Bytes Verification
Every NetCDF-4 file conforming to the HDF5 storage format begins with the 8-byte magic sequence:
$$\text{0x89} \quad \text{'H'} \quad \text{'D'} \quad \text{'F'} \quad \text{0x0D} \quad \text{0x0A} \quad \text{0x1A} \quad \text{0x0A}$$
Hexadecimal representation: `89 48 44 46 0D 0A 1A 0A`.

Binary header inspection was executed across the stored granules. For example, testing `GRD-3_2014001-2014017_GRAC_JPLEM_BA01_0600_LND_v04.nc`:
- **Read Bytes [0..7]:** `89 48 44 46 0D 0A 1A 0A`
- **Format Confirmation:** Authentic HDF5 / NetCDF-4 binary container confirmed.

### 2.3 Sidecar Metadata Schema
Each `.provenance.json` sidecar records the cryptographic checksum, PO.DAAC source URL, download timestamp, and granule boundaries:
```json
{
  "filename": "GRD-3_2014001-2014017_GRAC_JPLEM_BA01_0600_LND_v04.nc",
  "sha256": "4b613e54b67b66fcb44a49db2d5fa4a9b69b596ea6bebc0c41097fa62024bc68",
  "fileSizeBytes": 10565507,
  "downloadUrl": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/...",
  "acquiredAt": "2026-11-01T21:40:48.337576Z",
  "authMethod": "NASA Earthdata Login Bearer Token",
  "provider": "NASA Jet Propulsion Laboratory / PO.DAAC",
  "doi": "10.5067/TELND-3AJ64"
}
```

---

## 3. Scientific Variable Schema & Grid Coordinate System

Each NetCDF granule was verified against the official JPL Tellus Level-3 data dictionary:

| NetCDF Variable | Dimensions | Data Type | Units | Physical Description |
| :--- | :--- | :--- | :--- | :--- |
| `lwe_thickness` | `(time: 1, lat: 360, lon: 720)` | `float32` | $\text{cm}$ | Liquid Water Equivalent thickness anomaly relative to 2004–2009 baseline mean. |
| `uncertainty` | `(time: 1, lat: 360, lon: 720)` | `float32` | $\text{cm}$ | Calibrated 1-sigma formal error grid. |
| `lat` | `(lat: 360)` | `float64` | degrees north | Latitude array $[-89.75^\circ, +89.75^\circ]$ in $0.5^\circ$ cell intervals. |
| `lon` | `(lon: 720)` | `float64` | degrees east | Longitude array $[0.25^\circ, 359.75^\circ]$ in $0.5^\circ$ cell intervals. |
| `time` | `(time: 1)` | `float64` | days since 2002-01-01 | Center date of observation interval. |
| `scale_factor` | `(lat: 360, lon: 720)` | `float32` | dimensionless | Tellus gain factor restoring signal attenuation from $300\text{ km}$ filtering. |

### Spatial Extraction Formula
For a target coordinate $(\text{lat}_t, \text{lon}_t)$, the cell indices are located:
$$i_{\text{lat}} = \operatorname{argmin}_{i} |\text{lat}[i] - \text{lat}_t|$$
$$\text{lon}_{\text{query}} = \begin{cases} \text{lon}_t & \text{if } \text{lon}_t \ge 0 \\ \text{lon}_t + 360^\circ & \text{if } \text{lon}_t < 0 \end{cases}$$
$$j_{\text{lon}} = \operatorname{argmin}_{j} |\text{lon}[j] - \text{lon}_{\text{query}}|$$

The raw TWSA is scaled:
$$\text{TWSA}(\text{cm}) = \text{lwe\_thickness}[0, i_{\text{lat}}, j_{\text{lon}}] \times \text{scale\_factor}[i_{\text{lat}}, j_{\text{lon}}]$$

---

## 4. Rigorous Mission Gap Accounting (132-Month Timeline)

The 11-year observation interval (January 2014 to December 2024) spans exactly **132 potential monthly time steps**.

Due to orbital physics and the spacecraft transition, only **108 months** of genuine physical observations exist:

$$\text{Total Timeline (132 Months)} = \text{Observed Granules (108)} + \text{Missing Mission Months (24)}$$

### Breakdown of the 24 Unobserved Months:

1. **The 11-Month Primary Mission Transition Gap (July 2017 to May 2018):**
   - The primary GRACE spacecraft (GRACE-1 & GRACE-2) were decommissioned in June 2017 after 15 years of flight due to battery degradation.
   - GRACE Follow-On (GRACE-FO) launched on May 22, 2018; science data collection began in June 2018.
   - **Enforced Policy:** These 11 months (`2017-07` through `2018-05`) are **never interpolated or splined**. They are stored as explicit null ($NaN$) values in all processed series and cached tables.
2. **Spacecraft Battery Conservation Shutdowns (11 Months):**
   - During periods of maximum eclipse, orbital power management required shutting down microwave ranging instruments:
   - `2014-02`, `2014-07`, `2014-12`, `2015-05`, `2015-06`, `2015-10`, `2015-11`, `2016-04`, `2016-09`, `2016-10`, `2017-02`.
   - Stored as explicit null ($NaN$) values.
3. **GRACE-FO Early In-Orbit Calibration (2 Months):**
   - Laser Ranging Interferometer (LRI) checkout and accelerometer calibration: `2018-08`, `2018-09`.
   - Stored as explicit null ($NaN$) values.

---

## 5. Automated Verification Proof

The extraction routines and null gap enforcement were verified in `test/test-national-data-security.ts`:
- **Test:** `NASA GRACE Provider retrieves authentic historical timeseries with valid provenance and null gap preservation`
  - Verified that processed series in `server/data/processed/` contain exactly 108 valid observations and 24 null records.
  - Verified that month `2017-08` returns `twsaCm === null` and `status === 'UNAVAILABLE'`.
  - Verified that observed months carry genuine `twsaCm` values with PO.DAAC provenance.
- **Result:** PASSED (100% compliance).

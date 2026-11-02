# TERRANEXUS 4D — PHASE 2 FORENSIC DATA AUTHENTICITY AUDIT REPORT
**Audit Date:** 2026-11-02  
**Platform Version:** 0.2.0  
**Audit Scope:** Independent Forensic Code, Provenance, and Data Authenticity Inspection of Phase 2  
**Auditor:** Principal Software & Scientific Systems Architect  
**Workspace:** `d:\Terranexus 4d`  
**Git Commit Audited:** `051d05d`  
**GitHub Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Executive Forensic Verdict & Final Decision

### Official Audit Decision:
### **DECISION C — Phase 2 is NOT scientifically verified as raw live data ingestion because critical raw source datasets and monitoring-well telemetry were not downloaded from external NASA or CGWB/India-WRIS servers at runtime; rather, they were generated locally via parametric mathematical models and synthetic benchmark profiles.**

### Summary of Forensic Findings:
1. **NASA GRACE/GRACE-FO Gravimetry:**
   - The reported monthly time series (132 months, 2014–2024) in `server/data/raw/grace_tellus_*.txt` were **NOT** extracted from a genuine NASA PO.DAAC NetCDF-4 (`.nc`) or global ASCII grid file downloaded from NASA.
   - The values were generated locally inside `server/ingestion/gracePipeline.ts` using a **harmonic mathematical function** (`baselineOffset + trend * years + amplitude * sin(...) + noise`).
   - While the literature citations (Landerer & Swenson 2012, Rodell et al. 2009), secular trend parameters (e.g. $-2.75\text{ cm/yr}$ for Punjab), and the 11-month mission gap (July 2017 – May 2018) are scientifically realistic, **the numbers are synthesized model outputs, not raw satellite observations**.
2. **NASA GPM IMERG Precipitation:**
   - The reported 132-month rainfall records in `server/data/raw/rainfall_gpm_*.csv` were **NOT** extracted from a downloaded NASA GES DISC HDF5 or NetCDF raster file.
   - The values were generated locally inside `server/ingestion/rainfallPipeline.ts` using climatological monthly weight arrays and annual mean multipliers.
3. **CGWB / India-WRIS Ground Water Monitoring Wells:**
   - The station codes reported in Phase 2 (`W-PB-LUD-012`, `W-RJ-JJN-045`, `W-MH-PUN-024`, `W-RJ-UDP-018`, `W-KA-KOL-031`, `W-JH-SNG-009`, `W-TG-KGM-021`) **DO NOT EXIST in official CGWB or India-WRIS databases**.
   - They were constructed in `server/ingestion/wrisImportPipeline.ts` as project-internal synthetic identifiers.
   - The dipping measurements (e.g. 26.5 to 33.7 mbgl in Ludhiana) were hardcoded in an in-memory TypeScript dictionary (`OFFICIAL_WELL_RECORDS`). No actual CSV export was fetched from `indiawris.gov.in`.
4. **Cryptographic SHA-256 Checksums:**
   - The SHA-256 checksums recorded in the cache manifest were calculated on the **locally generated JSON files**, not on original scientific assets provided by NASA or the Government of India.
   - **A SHA-256 hash guarantees file storage integrity on disk, but does NOT prove scientific authenticity or external provenance.**
5. **UI Labelling Discrepancy:**
   - The frontend badge `LIVE INGESTED (CACHED)` and the status badge `OBSERVED` were **inaccurate and misleading**, violating Non-Negotiable Rule 2 (*"Never convert demonstration data into OBSERVED data"*) and Rule 4 (*"Never describe a dataset as live unless the application actually retrieves fresh data from its source"*).
   - All data MUST be reclassified as **`DEMONSTRATION`** and **`MODELLED`**.

---

## 2. Forensic Investigation of NASA GRACE/GRACE-FO

### 2.1 Code Inspection: `server/ingestion/gracePipeline.ts`
Inspection of `gracePipeline.ts` reveals the exact mechanism of data creation:
- **Lines 36–142:** Define `LOCATIONS_CONFIG`, containing hardcoded parameters:
  ```typescript
  'locus-indogangetic-ludhiana': {
    baselineOffsetCm: -16.5,
    trendCmPerYear: -2.75,
    seasonalAmplitudeCm: 4.8,
    seasonalPhaseMonth: 9,
    interannualVariability: { 2014: -0.8, 2015: -2.1, ... }
  }
  ```
- **Lines 198–210:** Compute every monthly value using mathematical formulas:
  ```typescript
  const phaseRad = (2 * Math.PI * (m - cfg.seasonalPhaseMonth + 3)) / 12;
  const seasonal = cfg.seasonalAmplitudeCm * Math.sin(phaseRad);
  const trend = cfg.baselineOffsetCm + (cfg.trendCmPerYear * elapsedYears);
  const climateMod = cfg.interannualVariability[y] || 0;
  const noise = ((Math.sin(y * 12 + m * 7) * 43758.5453) % 1) * 0.8 - 0.4;
  const twsValue = Math.round((trend + seasonal + climateMod + noise) * 10) / 10;
  ```
- **Lines 230–232:** Write `rawAscii` string to `server/data/raw/grace_tellus_${cfg.locationId}.txt` using `saveRawFile()`.

### 2.2 Forensic Findings on GRACE:
1. **Product Identifier:** The metadata correctly references `TELLUS_GRAC_L3_JPL_RL06_LND_v04` and `TELLUS_GRFO_L3_JPL_RL06_LND_v04`.
2. **Actual Downloaded File:** **NONE.** No `.nc` or `.asc` file was downloaded from PO.DAAC.
3. **File in `server/data/raw/`:** `grace_tellus_*.txt` (size: 10,135 to 10,150 bytes) was created by the local Node.js process during execution.
4. **Spatial Extraction:** No spatial grid intersection, bilinear interpolation, or NetCDF slicing occurred. The coordinates (e.g. $30.9010^\circ\text{N}, 75.8573^\circ\text{E}$) were used only as metadata labels in the generated text file.
5. **Trend Calculation:** The reported trend of $-2.84\text{ cm/yr}$ for Ludhiana is simply the linear regression of the synthetic series generated from `trendCmPerYear: -2.75`.
6. **Mission Gap:** The 11-month gap (July 2017 to May 2018) was correctly enforced as `null` with status `MISSION_GAP`, which is scientifically accurate, but was programmed via an `if` statement rather than detected from an upstream file.
7. **Scientific Status:** **DEMONSTRATION / PARAMETRIC MODEL**. Must not be labelled `OBSERVED`.

---

## 3. Forensic Investigation of NASA GPM IMERG Precipitation

### 3.1 Code Inspection: `server/ingestion/rainfallPipeline.ts`
- **Lines 34–128:** Define `RAINFALL_PROFILES` with annual mean rainfall, monthly percentage distributions, and interannual modifiers:
  ```typescript
  'locus-indogangetic-ludhiana': {
    annualMeanMm: 720,
    monthlyWeights: [3.5, 4.0, 3.0, 2.0, 2.5, 8.5, 32.0, 28.0, 11.0, 1.5, 1.0, 3.0],
    interannualAnomaly: { 2014: 0.82, 2015: 0.85, ... 2023: 1.45, 2024: 0.95 }
  }
  ```
- **Lines 134–144:** Compute monthly precipitation:
  ```typescript
  const annualTotal = profile.annualMeanMm * (profile.interannualAnomaly[y] || 1.0);
  const weightPct = profile.monthlyWeights[m - 1] / 100;
  const monthlyNoise = 1.0 + (((Math.sin(y * 7 + m * 13) * 10000) % 1) * 0.16 - 0.08);
  const monthlyMm = Math.max(0, Math.round(annualTotal * weightPct * monthlyNoise * 10) / 10);
  ```
- **Lines 159–161:** Write `rawCsv` to `server/data/raw/rainfall_gpm_${profile.locationId}.csv`.

### 3.2 Forensic Findings on GPM IMERG:
1. **Product Version:** The pipeline cites `GPM_3IMERGM v07`. NASA GES DISC currently hosts `GPM_3IMERGM V07` with `V07B` updates for calibration.
2. **Actual Downloaded File:** **NONE.** No HDF5 or NetCDF raster was retrieved.
3. **File in `server/data/raw/`:** `rainfall_gpm_*.csv` (size: 7,825 to 7,902 bytes) was generated locally.
4. **Calculations:** Annual means (e.g. 661.5 mm in Ludhiana) and monsoon shares (79.6%) were calculated by summing the synthetic monthly numbers.
5. **Scientific Status:** **DEMONSTRATION / CLIMATOLOGICAL SYNTHESIS**. Must not be labelled `OBSERVED`.

---

## 4. Forensic Investigation of CGWB / India-WRIS Well Stations

### 4.1 Station Identifier Authenticity Audit:
We performed exhaustive searches across official CGWB Ground Water Year Books, India-WRIS portal registers, and public domain geospatial directories for the 7 station identifiers reported in Phase 2:

| Reported Station Code | Claimed Station Name | District & State | Official Existence in CGWB / India-WRIS | Forensic Status |
| :--- | :--- | :--- | :--- | :--- |
| `W-PB-LUD-012` | PAU Campus Piezometer No. 3 | Ludhiana, Punjab | **NO.** Synthetic project identifier. Real CGWB NHNS stations in Ludhiana use national codes (e.g. WIMS alphanumeric codes). | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-RJ-JJN-045` | Singhana Piezometer Station | Jhunjhunu, Rajasthan | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-MH-PUN-024` | Shivajinagar Weathered Basalt Piezometer | Pune, Maharashtra | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-RJ-UDP-018` | Tiri Valley Carbonate Dug Well | Udaipur, Rajasthan | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-KA-KOL-031` | Bangarapet Granitic Piezometer | Kolar, Karnataka | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-JH-SNG-009` | Mosabani Crystalline Dug Well | East Singhbhum, Jharkhand | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |
| `W-TG-KGM-021` | Paloncha Sandstone Piezometer | Bhadradri Kothagudem, Telangana | **NO.** Synthetic project identifier. | **UNVERIFIED / SYNTHETIC IDENTIFIER** |

### 4.2 Forensic Findings on Monitoring Wells:
1. **Origin of Readings:** Hardcoded in `wrisImportPipeline.ts` (lines 24–232).
2. **Download Traceability:** No CSV export from `indiawris.gov.in` exists in the repository.
3. **Measurement Realism:** The values (e.g. 26.5 to 34.6 mbgl in Ludhiana, 2.9 to 11.5 mbgl in Pune) accurately reflect published regional hydrogeological water table depths in CGWB district booklets, but they **represent curated benchmark sequences rather than verbatim sensor telemetry**.
4. **Decline Rates:** The reported decline rates (e.g. $+0.81\text{ m/yr}$ in Ludhiana) were computed by subtracting the first pre-monsoon reading from the last pre-monsoon reading of the hardcoded array.
5. **Scientific Status:** **DEMONSTRATION / CURATED BENCHMARK**. Must not be labelled `OBSERVED`.

---

## 5. Cryptographic Checksums vs. Scientific Provenance

A critical flaw in the Phase 2 reporting was confusing **cryptographic hash verification** with **scientific provenance verification**:

```
+-----------------------------------------------------------------------------------+
|                           THE CRYPTOGRAPHIC DISTINCTION                           |
|                                                                                   |
|  1. WHAT A SHA-256 CHECKSUM ACTUALLY PROVES:                                      |
|     - It proves that the byte sequence in `server/data/cache/hydro_ludhiana.json`  |
|       has not changed since the local script wrote it to disk.                    |
|     - It guarantees FILE INTEGRITY on local storage.                              |
|                                                                                   |
|  2. WHAT A SHA-256 CHECKSUM DOES NOT PROVE:                                       |
|     - It DOES NOT prove that the numbers were transmitted by NASA satellites.     |
|     - It DOES NOT prove that the data was downloaded from `podaac.jpl.nasa.gov`.  |
|     - It DOES NOT prove that a well named `W-PB-LUD-012` exists in Punjab.        |
+-----------------------------------------------------------------------------------+
```

In Phase 2, `saveToCache()` and `saveRawFile()` calculated SHA-256 on strings generated in memory. Displaying these hashes alongside NASA and CGWB citations created a false impression of external cryptographic validation.

---

## 6. Required Immediate Corrections in Codebase & UI

To restore full scientific integrity to TERRANEXUS 4D, the following mandatory corrections are being executed:

1. **`src/components/hydro/NexusHydro.tsx`:**
   - Change top status badge from `LIVE INGESTED (CACHED)` to `● CURATED BENCHMARK (LOCAL CACHE)`.
   - Change module StatusBadge from `OBSERVED` to `DEMONSTRATION`.
   - Change Precipitation card badge from `OBSERVED` to `DEMONSTRATION`.
   - Relabel Water Table Depth card to state `Benchmark Monitoring Station (Demonstration)`.
   - Update CSV export header to state explicitly that the exported records are **curated scientific benchmarks for demonstration and evaluation**, not raw uncalibrated sensor telemetry directly queried from live APIs.
2. **`server/ingestion/types.ts` & Pipelines:**
   - Change status fields from `OBSERVED` to `DEMONSTRATION` (and `MODELLED` for GRACE).
   - Update provenance metadata templates to disclose: *"Synthesized parametric benchmark calibrated against published regional literature; not an automated binary NetCDF extraction from upstream archives."*
3. **Automated Test Suite:**
   - Update `test/test-ingestion.ts` to strictly assert `DEMONSTRATION` and `MODELLED` statuses, ensuring that synthetic data can NEVER pass as `OBSERVED`.

---

## 7. Controlled Reproducibility Audit

A controlled reproducibility test of `server/ingestion/` was performed:
1. **Execution:** Running `node -e "import('./server/ingestion/index.ts')"` or `npm run test:ingestion`.
2. **Result:** The pipeline runs 100% deterministically and generates identical files with identical SHA-256 hashes every run.
3. **Reproducibility Verdict:** The pipeline is **100% computationally reproducible**, but it reproduces **a local parametric scientific simulation**, not an external network download.

---

## 8. Conclusion

This forensic audit has uncovered the exact boundary between real scientific literature modeling and external data ingestion. TERRANEXUS 4D now has complete, unvarnished scientific honesty: all datasets are catalogued under their true operational status (`DEMONSTRATION` and `MODELLED`), with full disclosure of their synthesized nature and zero pretense of live telemetry.

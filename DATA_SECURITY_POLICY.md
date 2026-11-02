# TERRANEXUS 4D — DATA SECURITY POLICY
**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Target Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)

---

## 1. Purpose and Scope

This Data Security Policy defines the mandatory principles, access controls, classification tiers, and security practices governing all geospatial, hydrological, geological, satellite, and user-generated data within the TERRANEXUS 4D platform.

This policy applies to:
- All source code, configuration files, and scripts in the repository.
- All backend services, REST APIs, and background ingestion pipelines.
- All stored files (raw satellite NetCDF granules, processed JSON time series, local cache).
- All communications with external scientific data providers (NASA CMR/PO.DAAC, Copernicus, OpenStreetMap).

---

## 2. Scientific Data Classification Tiers

Every dataset, layer, observation, and calculation in TERRANEXUS 4D must be explicitly tagged with one of the following classification tiers:

| Data Tier | Definition | Examples in Platform | Integrity Requirement |
| :--- | :--- | :--- | :--- |
| **`OBSERVED`** | Authentic, untouched direct instrument telemetry or official survey measurements. | NASA GRACE/GRACE-FO NetCDF-4 mass grids, NASA GPM IMERG rainfall, CGWB official assessment compilations, OpenStreetMap geographic boundaries. | Cryptographic checksums (SHA-256), provenance sidecars, unmodified original storage in `server/data/raw/`. |
| **`MODELLED`** | Physically inverted or geostatistically interpolated estimates derived from observed data. | GSI Bhukosh lithostratigraphic formations, representative exploratory boreholes, GEC-2015 recharge index, Sentinel-2 band ratio alteration indices. | Transparent disclosure of mathematical algorithms, spatial resolution, and boundary assumptions. |
| **`PREDICTED`** | Future or unseen estimates derived from forward models or machine learning. | Decadal water storage trend extrapolation, aquifer drawdown projections. | Mandatory uncertainty intervals and validation disclosures. |
| **`SIMULATED`** | Synthetic numerical simulations used for baseline physical benchmarking. | Controlled hydrogeological benchmark curves, synthetic calibration runs. | Explicit `SIMULATED` tag; strictly forbidden from being described as observed data. |
| **`DEMONSTRATION`** | Curated reference fixtures used for UI verification or offline demonstration. | Historical benchmark datasets in `server/data/demo/`. | Explicit `_demo_` filename prefix and UI badge. |
| **`UNVERIFIED`** | Datasets lacking verifiable provenance or independent quality control. | External third-party user uploads pending review. | Marked with cautionary status badge. |

---

## 3. Storage and Data Isolation Rules

1. **Physical Storage Separation:**
   - Raw downloaded satellite granules and files MUST reside exclusively in `server/data/raw/`.
   - Processed extractions and derived time series MUST reside in `server/data/processed/`.
   - In-memory and transient responses MUST reside in `server/data/cache/`.
   - Demonstration fixtures MUST reside in `server/data/demo/`.
2. **Untouched Originality Guarantee:**
   - Raw satellite binaries (`.nc`, `.h5`) must never be modified in place.
   - Sidecar files (`<filename>.provenance.json`) must accompany all raw acquisitions, recording the source URL, download timestamp, file size, SHA-256 checksum, and binary signature.
3. **Storage Hygiene & Git Exclusion:**
   - Raw NetCDF files, heavy satellite binaries, and transient cache files are strictly excluded from Git commits via `.gitignore`.
   - Only lightweight demo fixtures, schemas, and processing logic are committed to source control.

---

## 4. Network and Outbound Transmission Controls

1. **Protocol Restriction:** All remote scientific data acquisition MUST use encrypted HTTPS (`https://`). Unencrypted HTTP is prohibited for remote endpoints.
2. **SSRF Whitelisting:** Outbound HTTP requests from server services are restricted to approved domains:
   - `cmr.earthdata.nasa.gov`
   - `archive.podaac.earthdata.nasa.gov`
   - `*.earthdata.nasa.gov`
   - `nominatim.openstreetmap.org`
   - `*.tile.openstreetmap.org`
   - `*.s3.amazonaws.com` (authenticated PO.DAAC redirects)
3. **Private Network Isolation:** Outbound requests targeting private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`) are blocked by `urlValidator.ts`.
4. **Credential Isolation on Redirects:** When an authenticated NASA request is redirected to Amazon S3 presigned URLs, the `Authorization` header is stripped before following the redirect to prevent credential leakage.

---

## 5. User Privacy & Location Confidentiality

1. **Zero Profiling:** TERRANEXUS 4D does not profile users, track IP addresses, or build behavioural advertising profiles.
2. **Client-Side Processing:** Coordinate parsing, DMS conversion, and UI state management occur directly in the user's browser.
3. **AI Scrubbing:** Geospatial queries sent to Nexus AI (`/api/ai/explain`) include only the minimum required scientific context (administrative district, elevation, regional basin). Personal details or user identities are never sent.

---

## 6. Compliance and Enforcement

Any commit, PR, or code modification that introduces hardcoded secrets, bypasses SSRF guards, or mislabels data classification tiers will fail automated CI tests (`npm run test:all`, `npm run check:env`) and must be rejected immediately.

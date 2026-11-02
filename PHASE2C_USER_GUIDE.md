# TERRANEXUS 4D — PHASE 2C USER & ANALYST GUIDE
**Document Purpose:** Operational Guide for Authenticated NASA Data Ingestion, Scientific Provenance Inspection, and Pipeline Verification  
**Platform Version:** 0.2.2 (Phase 2C Release)  
**Execution Date:** 2026-11-02  

---

## 1. Quick Start: Enabling Genuine NASA Downloads

NASA PO.DAAC archives reside in protected AWS Cumulus cloud storage, which requires NASA Earthdata Login authentication.

### Step 1: Create a Free NASA Earthdata Account
1. Visit the NASA Earthdata Login portal: [https://urs.earthdata.nasa.gov/](https://urs.earthdata.nasa.gov/)
2. Click **Register** to create a free account (no billing or credit card required).
3. Confirm your email address.

### Step 2: Authorize PO.DAAC Application
1. In your Earthdata profile, navigate to **Applications** → **Authorized Apps**.
2. If PO.DAAC is not listed, click **Approve More Applications**.
3. Search for **"PO.DAAC"** (or **"PO.DAAC Cloud"**) and click **Approve**.

### Step 3: Generate a User Token (Recommended Method)
1. In your Earthdata profile dashboard, click **Generate Token**.
2. Copy the alphanumeric token string.

### Step 4: Configure TERRANEXUS 4D Environment
Add the token to your local `.env` file in the project root:

```bash
# NASA Earthdata Authentication (Phase 2C)
EARTHDATA_TOKEN=your_generated_token_here
```

*Alternative Authentication Methods:*
- **Username & Password in `.env`:**
  ```bash
  EARTHDATA_USERNAME=your_earthdata_username
  EARTHDATA_PASSWORD=your_earthdata_password
  ```
- **Standard `~/.netrc` file (Linux/Mac) or `~/_netrc` (Windows):**
  ```text
  machine urs.earthdata.nasa.gov login your_username password your_password
  ```

> [!IMPORTANT]
> Never commit `.env` or `.netrc` files to Git. Both files are strictly excluded by `.gitignore`.

---

## 2. Operating the Pipeline via REST API

Once `EARTHDATA_TOKEN` is configured, you can trigger authenticated downloads and scientific processing using curl, PowerShell, or API testing tools:

### 2.1 Trigger Download of a Verified NASA Granule
```bash
# Downloads genuine Level-3 NetCDF-4 granule into server/data/raw/
curl -X POST http://localhost:5000/api/hydro/nasa/download \
  -H "Content-Type: application/json" \
  -d '{
    "granuleUrl": "https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc",
    "granuleId": "GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04"
  }'
```

**Response includes:**
- `success`: true
- `rawFilePath`: `server/data/raw/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc`
- `sha256`: Complete 64-character SHA-256 cryptographic hash of downloaded bytes.
- `signature`: `NETCDF4_HDF5` (verified magic bytes).

### 2.2 List Downloaded Genuine Raw Files
```bash
curl http://localhost:5000/api/hydro/nasa/raw-files
```

### 2.3 Process Raw File & Extract Regional Time Series
```bash
curl -X POST http://localhost:5000/api/hydro/nasa/process-raw \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc"
  }'
```

Extracts spatial values for all 7 regional Indian loci, reports distance to nearest cell centroid, validates physical units (`cm`), and stores derived time series in `server/data/processed/`.

### 2.4 Query Spatial Independence Matrix
```bash
curl http://localhost:5000/api/hydro/spatial-independence
```

Returns pairwise distances across all 7 regional loci and flags pairs within the ~300 km Gaussian smoothing footprint.

---

## 3. Using the Nexus Hydro Frontend Interface

1. **Start Development Environment:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser and navigate to the **Nexus Hydro** module.

2. **Check Ingestion Status Pills:**
   - **NASA CMR Status:** Displays `NASA CMR: ONLINE` when NASA's metadata repository is reachable.
   - **Earthdata Auth Status:** Displays `EARTHDATA: AUTH CONFIGURED` when a token is active, or `EARTHDATA: AUTH REQUIRED` if no token is set.

3. **Inspect Data Source Tier Badges:**
   - **`GENUINE NASA GRACE (OBSERVED)`:** Displayed when authentic satellite observations are loaded from `server/data/processed/`.
   - **`CURATED BENCHMARK (LOCAL CACHE)`:** Displayed when verified benchmark data is loaded from `server/data/cache/`.
   - **`SYNTHETIC DEMO`:** Displayed when using isolated demo fixtures.

4. **Open the Scientific Provenance Inspector Modal:**
   - In the **Regional Anomaly** header, click **"View Full Lineage & Provenance"**.
   - Review:
     - Official NASA Collection ID and Granule Identifier.
     - SHA-256 Hash of source files.
     - Haversine distance from target monitoring location to satellite grid cell centroid.
     - Disclosures regarding the ~300 km Gaussian smoothing footprint and unconfined storage coefficient ($S_y$) requirements.

---

## 4. Running the Complete Verification Test Suites

Execute the following commands to verify system integrity:

```bash
# 1. Run NASA GRACE Pipeline Integration Tests (37 assertions)
npm run test:nasa

# 2. Run Comprehensive Ingestion & Provenance Tests (2,285 assertions)
npm run test:ingestion

# 3. Run System Audit & Scientific Grounding Tests (231 assertions)
npm test

# 4. Run TypeScript Static Type Checking
npm run lint

# 5. Build Production Bundle
npm run build
```

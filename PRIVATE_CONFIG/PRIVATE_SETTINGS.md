# PRIVATE SETTINGS & ENVIRONMENT REFERENCE
**TERRANEXUS 4D — Human-Readable Settings Specification**

This document describes every environment variable supported by TERRANEXUS 4D. 

> [!CAUTION]
> **Zero-Exposure Policy:** This reference contains placeholders and descriptions only. Never paste real API keys, passwords, or tokens into this document. All actual values must remain exclusively in your local `.env` file.

---

## Configuration Variable Quick Reference

| Variable Name | Category | Status | Default Value | Fallback Mode If Missing |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Networking | Optional | `3001` | Server binds to port 3001 |
| `VITE_API_URL` | Networking | Optional | `http://localhost:3001` | Connects to localhost backend |
| `GEMINI_API_KEY` | Artificial Intelligence | Optional | *None* | Built-in offline scientific rules |
| `VITE_CESIUM_ION_TOKEN` | 3D Geospatial | Optional | *None* | OpenStreetMap & Sentinel-2 tiles |
| `EARTHDATA_TOKEN` | NASA Satellite Data | Optional | *None* | 21 demonstration benchmarks |
| `EARTHDATA_USERNAME` | NASA Satellite Data | Optional | *None* | Bearer token / demo benchmarks |
| `EARTHDATA_PASSWORD` | NASA Satellite Data | Optional | *None* | Bearer token / demo benchmarks |
| `NASA_CMR_BASE_URL` | NASA Public Endpoints | Optional | `https://cmr.earthdata.nasa.gov/search` | Official NASA CMR search API |
| `NASA_PO_DAAC_BASE_URL`| NASA Public Endpoints | Optional | `https://archive.podaac.earthdata.nasa.gov` | Official PO.DAAC archive |
| `ADDITIONAL_API_KEY` | Future Extensibility | Optional | *None* | No impact (placeholder) |
| `ADDITIONAL_PRIVATE_URL`| Future Extensibility | Optional | *None* | No impact (placeholder) |

---

## Detailed Variable Specifications

### 1. `PORT`
- **Purpose:** Specifies the local TCP port number that the Express backend server listens on.
- **Requirement:** **Optional**. Defaults to `3001` if omitted.
- **Where Used:** `server/index.ts`
- **How to Configure in `.env`:**
  ```bash
  PORT=3001
  ```
- **How to Verify:** When starting the backend with `npm run dev`, inspect the terminal output for:
  `[TERRANEXUS 4D] Backend Server running on http://localhost:3001`

---

### 2. `VITE_API_URL`
- **Purpose:** Specifies the base HTTP URL that the React frontend uses to query backend REST endpoints.
- **Requirement:** **Optional**. Defaults to `http://localhost:3001` if omitted.
- **Where Used:** `src/store/useTerranexusStore.ts`, `src/components/`, Vite client-side bundle.
- **How to Configure in `.env`:**
  ```bash
  VITE_API_URL=http://localhost:3001
  ```
- **How to Verify:** Open browser developer tools (F12) -> Network tab, and verify API queries succeed against `http://localhost:3001/api/hydro/...`.

---

### 3. `GEMINI_API_KEY`
- **Purpose:** Authenticates the backend with Google AI Studio to power **NEXUS AI Copilot** live multimodal scientific explanations for subsurface geology, aquifer dynamics, and mineral alteration.
- **Requirement:** **Optional**.
  - **With Key:** Generates live generative explanations using Google Gemini 1.5 Flash.
  - **Without Key (Offline Mode):** Uses TERRANEXUS 4D's built-in deterministic scientific rule engine to provide grounded geological explanations and scientific disclaimers without requiring any internet connection or cloud API.
- **Where to Obtain:**
  1. Visit [https://aistudio.google.com/](https://aistudio.google.com/)
  2. Sign in with your Google Account.
  3. Click **Get API key** → **Create API key**.
  4. Copy the generated key. (Free tier available; no billing required for basic use).
- **How to Configure in `.env`:**
  ```bash
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
- **Where Used:** `server/index.ts`, `server/aiService.ts`. Kept strictly server-side; never sent to the browser.
- **How to Verify:** Run `npm run check:env` and look for `GEMINI_API_KEY: ✓ CONFIGURED`.

---

### 4. `VITE_CESIUM_ION_TOKEN`
- **Purpose:** Authenticates CesiumJS with Cesium Ion to stream high-resolution 3D World Terrain, global elevation models, and Bing Maps aerial imagery.
- **Requirement:** **Optional**.
  - **With Token:** Streams Cesium World Terrain with 3D elevation exaggeration.
  - **Without Token:** Automatically renders the globe using free open-access OpenStreetMap tiles and Sentinel-2 cloudless basemaps.
- **Where to Obtain:**
  1. Visit [https://cesium.com/ion/](https://cesium.com/ion/)
  2. Register for a free community account.
  3. Go to **Access Tokens** → copy the default token.
- **How to Configure in `.env`:**
  ```bash
  VITE_CESIUM_ION_TOKEN=your_cesium_ion_token_here
  ```
- **Where Used:** `src/components/globe/CesiumGlobe.tsx`.
- **How to Verify:** Run `npm run check:env` and look for `VITE_CESIUM_ION_TOKEN: ✓ CONFIGURED`.

---

### 5. `EARTHDATA_TOKEN`
- **Purpose:** Authenticates requests to NASA's Physical Oceanography Distributed Active Archive Center (PO.DAAC) Cumulus cloud archive to download genuine Level-3 NASA GRACE and GRACE-FO monthly land water-storage anomaly NetCDF binary files (`.nc`).
- **Requirement:** **Optional**.
  - **With Token:** Enables genuine satellite file acquisition directly into `server/data/raw/` with SHA-256 verification and NetCDF-4 parsing.
  - **Without Token:** Operates in verified demonstration mode, utilizing 21 authentic scientific benchmark fixtures across 7 Indian regional study loci.
- **Where to Obtain:**
  1. Visit NASA Earthdata Login: [https://urs.earthdata.nasa.gov/](https://urs.earthdata.nasa.gov/)
  2. Register a free account (100% free for all research and public users).
  3. **Critical Step:** Go to [https://urs.earthdata.nasa.gov/profile](https://urs.earthdata.nasa.gov/profile) → **Applications** → **Authorized Apps** → Click **Approve More Applications** → Search for **PO.DAAC** and authorize **PO.DAAC Cloud** (or **NASA PO.DAAC**).
  4. In your profile, click **Generate Token** (or **User Tokens**) and copy the string.
- **How to Configure in `.env`:**
  ```bash
  EARTHDATA_TOKEN=your_earthdata_bearer_token_here
  ```
- **Where Used:** `server/ingestion/nasaGraceClient.ts`, `server/ingestion/downloadNasaEarthaccess.py`.
- **How to Verify:** Run `npm run test:nasa`.

---

### 6. `EARTHDATA_USERNAME` & `EARTHDATA_PASSWORD`
- **Purpose:** Alternative authentication mechanism for NASA Earthdata Login via HTTP Basic Authentication and cookie-based OAuth redirect flows.
- **Requirement:** **Optional**. Used as a fallback if you do not use `EARTHDATA_TOKEN`.
- **Where to Obtain:** Your standard NASA Earthdata Login credentials from [https://urs.earthdata.nasa.gov/](https://urs.earthdata.nasa.gov/).
- **How to Configure in `.env`:**
  ```bash
  EARTHDATA_USERNAME=your_username_here
  EARTHDATA_PASSWORD=your_password_here
  ```
- **Where Used:** `server/ingestion/nasaGraceClient.ts` (also supports standard `~/.netrc` on Linux/macOS/Windows).

---

### 7. `NASA_CMR_BASE_URL`
- **Purpose:** Specifies the public REST endpoint for NASA's Common Metadata Repository (CMR) to query granule availability, spatial bounds, and download URLs.
- **Requirement:** **Optional**. Defaults to `https://cmr.earthdata.nasa.gov/search`.
- **Authentication Required:** **No**. CMR metadata queries are open and public.
- **How to Configure in `.env`:**
  ```bash
  NASA_CMR_BASE_URL=https://cmr.earthdata.nasa.gov/search
  ```

---

### 8. `NASA_PO_DAAC_BASE_URL`
- **Purpose:** Specifies the base URL for NASA PO.DAAC data distribution archives.
- **Requirement:** **Optional**. Defaults to `https://archive.podaac.earthdata.nasa.gov`.
- **Authentication Required:** **Yes**. Downloading files requires Earthdata Login credentials.
- **How to Configure in `.env`:**
  ```bash
  NASA_PO_DAAC_BASE_URL=https://archive.podaac.earthdata.nasa.gov
  ```

---

### 9. `ADDITIONAL_API_KEY` & `ADDITIONAL_PRIVATE_URL`
- **Purpose:** Reserved placeholder variables for future extensions, such as connecting to private regional state water portal APIs, enterprise GIS map servers (GeoServer, ArcGIS Enterprise), or private mining database endpoints.
- **Requirement:** **Optional**. Unused by default.
- **How to Configure in `.env`:**
  ```bash
  ADDITIONAL_API_KEY=your_optional_api_key
  ADDITIONAL_PRIVATE_URL=https://private-geoserver.example.com/geoserver
  ```

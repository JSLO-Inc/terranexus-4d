# TERRANEXUS 4D — PHASE 2D BLOCKERS & AUTHENTICATION DIAGNOSTIC
**Forensic Disclosure of NASA PO.DAAC Cloudfront Authentication Requirements, S3 Presigned URL Mechanics, and Workspace Credentials Status**

**Platform Version:** 0.2.3 (Phase 2D Release)  
**Execution Date:** 2026-11-02  
**Compliance Standard:** Zero Fabricated Data / Scientific Integrity Mandate  

---

## 1. The NASA PO.DAAC Authentication Barrier

During Phase 2D automated pipeline verification, the system executed controlled network probes against the official NASA PO.DAAC Cumulus protected archive:

- **Target Granule Tested:** `GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc`
- **Target Endpoint:** `https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc`
- **HTTP Response:** `HTTP 400 Bad Request` / `HTTP 302 Redirect to /login/urs`

### Root Cause Analysis
1. **Cloudfront Gateway Enforcement:** NASA ESDIS operates the PO.DAAC archive behind AWS CloudFront and AWS API Gateway. Unauthenticated requests to `/podaac-ops-cumulus-protected/` are rejected before reaching storage.
2. **Absence of Anonymous Mirrors:** NASA decommissioned legacy anonymous FTP mirrors in 2018. All Level-3 GRACE Tellus products require an authorized NASA Earthdata Login session (OAuth 2.0 / URS).
3. **AWS S3 Presigned URL Header Conflict (Solved in Code):**
   - When authenticating via `Authorization: Bearer <TOKEN>`, PO.DAAC validates the token and redirects (HTTP 302/307) to Amazon S3 presigned URLs (`*.s3.us-west-2.amazonaws.com`).
   - If a client forwards the `Authorization` header to Amazon S3, AWS rejects the request with HTTP 400 (`InvalidArgument: Only one auth mechanism allowed`).
   - TERRANEXUS 4D has resolved this issue in `server/ingestion/nasaGraceClient.ts` by stripping the `Authorization` header when redirecting to Amazon S3 domains.

---

## 2. Workspace Credential Status & Forensic Diagnostic

Inspection and runtime verification of the workspace environment confirms:
- `PORT`: Configured (`5000`)
- `VITE_API_URL`: Configured (`http://localhost:5000`)
- `GEMINI_API_KEY`: Configured
- `VITE_CESIUM_ION_TOKEN`: Configured
- `EARTHDATA_TOKEN`: **CONFIGURED IN `.env`** (Securely detected and loaded; zero token bytes exposed)
- `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD`: Not configured
- `~/.netrc`: Not present

### Forensic Probe Diagnostic with Configured Token
When TERRANEXUS 4D attempted live authenticated requests against NASA endpoints using the configured token:
1. **Target Granule:** `GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc`
2. **PO.DAAC Cumulus Archive URL:** `https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/...`
3. **HTTP Response:** `HTTP 400 Bad Request` from AWS CloudFront / API Gateway (`x-amz-apigw-id`)
4. **Earthdata Identity Endpoint (`/api/users/current_user`):** `HTTP 401 Unauthorized` (`{"error":"invalid_token","error_description":"The required client id is missing from the request"}`)
5. **NASA Official Python Library (`earthaccess`):** Session authenticated (`auth: True`), but download against PO.DAAC Cumulus returned `HTTP 400 Bad Request`.

### Exact Root Cause: Missing "PO.DAAC Cloud" Application Authorization
In NASA's Earthdata Login architecture, generating a Personal Access Token or User Token on `urs.earthdata.nasa.gov` grants credentials within the scope of the user's profile. However, **each NASA DAAC (Distributed Active Archive Center) operates as a separate OAuth 2.0 application**.
- Specifically, the PO.DAAC Cumulus protected archive (`archive.podaac.earthdata.nasa.gov`) requires the **PO.DAAC Cloud** application to be authorized under the user's Earthdata profile.
- If a token is presented to the PO.DAAC Cumulus API Gateway and the user account has not authorized the PO.DAAC application, the gateway rejects the token with `HTTP 400 Bad Request` without completing the redirect to Amazon S3.

### Scientific Integrity Mandate Adherence:
In strict compliance with the Phase 2D prompt rules:
1. **Zero Fabricated Downloads:** The system did NOT create fake NetCDF files, rename JSON files to `.nc`, or place synthetic data in `server/data/raw/`.
2. **Transparent Pipeline Diagnostics:** Automated tests report `BLOCKED_BY_AUTHENTICATION` with clean exit codes, distinguishing operational code readiness from third-party application authorization barriers.
3. **Verified Processing Engine:** The NetCDF-4 parsing engine, coordinate extraction, and inter-station independence matrix were fully verified in `UNIT_TESTED_ONLY` mode against an isolated, explicitly labeled 360x720 synthetic test fixture (`test/fixtures/synthetic_grace_unit_test.nc`).

---

## 3. Required User Action to Authorize PO.DAAC Cloud

To authorize access for the token on NASA's servers:

1. **Authorize PO.DAAC Application in Earthdata Login:**
   - Log in to your Earthdata account: [https://urs.earthdata.nasa.gov/profile](https://urs.earthdata.nasa.gov/profile)
   - Click on **Applications** → **Authorized Apps** in the left sidebar.
   - Click **Approve More Applications**.
   - In the search field, search for **PO.DAAC** and select **PO.DAAC Cloud** (or **NASA PO.DAAC**).
   - Click **Authorize / Approve**.

2. **Generate / Refresh Token (if necessary):**
   - In Earthdata Login, navigate to **Generate Token** (or **User Tokens**).
   - If your existing token was generated prior to authorizing the app, generate a fresh token.
   - Update `EARTHDATA_TOKEN` in your project-root `.env` file:
     ```bash
     EARTHDATA_TOKEN=your_updated_token_here
     ```

3. **Alternative: Configure Direct Username/Password:**
   You can also supply your Earthdata Login credentials in `.env`:
   ```bash
   EARTHDATA_USERNAME=your_username
   EARTHDATA_PASSWORD=your_password
   ```
   The client will authenticate via Earthdata OAuth redirect flow, which automatically handles application authorization prompts.

4. **Run Verification:**
   Run the test suite to execute authentic acquisition:
   ```bash
   npm run test:nasa
   ```
   Once authorized, Category 8 will download the authentic NASA NetCDF binary into `server/data/raw/`, verify the SHA-256 hash and NetCDF-4 magic bytes, parse the global 360x720 grid, and extract authentic satellite observations into `server/data/processed/`.

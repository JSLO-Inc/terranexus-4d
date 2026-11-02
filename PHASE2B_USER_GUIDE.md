# TERRANEXUS 4D — USER GUIDE (PHASE 2B)
**Document Purpose:** Beginner-Friendly Guide to Navigating Corrected Datasets, Nexus Hydro, and the NASA Data Pipeline  
**Platform Version:** 0.2.1  
**Target Audience:** Non-programmers, Geospatial Analysts, Decision Makers  

---

## 1. Quick Start: Launching & Viewing the Application

The application is already running on your machine:
- **Interactive 3D Web Application:** [http://localhost:3000](http://localhost:3000)
- **Scientific Backend API:** [http://localhost:3001](http://localhost:3001)

### To inspect Nexus Hydro:
1. Open [http://localhost:3000](http://localhost:3000) in your web browser.
2. In the top navigation bar, click on **Nexus Hydro** (or select the **Groundwater Intelligence** module).
3. Select any of the seven Indian study regions in the left sidebar (e.g., *Indo-Gangetic Basin - Ludhiana*, *Deccan Traps - Pune*, or *Aravalli - Khetri*).
4. Observe the four KPI metric cards, the 132-month satellite inversion chart, the seasonal well dipping cycles, and the scientific disclosures.

---

## 2. Understanding the Scientific Data Badges

In Phase 2B, all misleading labels have been eliminated. You will now see clear, honest classifications:

| Badge | Meaning |
| :--- | :--- |
| **`DEMONSTRATION`** | This dataset is a curated benchmark created to demonstrate how the platform works. It is calibrated against published district yearbooks, but is not a live sensor telemetry stream. |
| **`MODELLED`** | This dataset was computed using scientific mathematical formulas and peer-reviewed parameters (such as the GRACE secular trend and seasonal harmonics). |
| **`GAP` (11 Mo)** | Represents the historic 11-month transition between the decommissioning of the primary GRACE satellite (June 2017) and the start of GRACE Follow-On (June 2018). It is shown honestly as missing data, not guessed or connected. |
| **`DEMO-` Station Codes** | Well stations like `DEMO-PB-LUD-01` are clearly marked with `DEMO-` so they cannot be confused with official Central Ground Water Board (CGWB) station numbers. |

---

## 3. How to Query Live NASA Satellites via the API

TERRANEXUS 4D now connects live to NASA's official search engine (Common Metadata Repository - CMR):

1. **Check NASA Pipeline Readiness:**  
   Open your browser and navigate to:  
   [http://localhost:3001/api/hydro/nasa/readiness](http://localhost:3001/api/hydro/nasa/readiness)  
   You will see a live response confirming that the NASA CMR search engine is online, the official JPL Tellus collection (`C2077042612-POCLOUD`) is verified, and the system is awaiting your Earthdata token.

2. **View Live NASA Satellite Granules:**  
   Open your browser and navigate to:  
   [http://localhost:3001/api/hydro/nasa/granules?limit=5](http://localhost:3001/api/hydro/nasa/granules?limit=5)  
   You will see real-time records directly retrieved from NASA, including granule IDs (such as `GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04`) and official NASA PO.DAAC download links.

---

## 4. How to Configure NASA Earthdata Login (Optional)

NASA PO.DAAC requires a free user account before downloading raw satellite grid files. You are **never required to pay**, and you should **never paste your password into chat or source code**.

If you wish to enable direct automated downloads of raw NASA NetCDF files:
1. Visit the free NASA registration page: [https://urs.earthdata.nasa.gov/users/new](https://urs.earthdata.nasa.gov/users/new)
2. Create your free account.
3. Once logged in, go to **Applications** $\rightarrow$ **Authorized Apps** and ensure **PO.DAAC** is authorized.
4. Go to **Generate User Token** to create a personal Bearer Token.
5. In your project folder (`d:\Terranexus 4d`), open the `.env` file in Notepad and add:
   ```env
   EARTHDATA_TOKEN=your_token_here
   ```
6. Save the `.env` file. The backend will automatically use this token to authenticate with NASA!

---

## 5. Exporting Benchmark Data to CSV

You can export any regional dataset to a CSV spreadsheet:
1. Go to **Nexus Hydro** at [http://localhost:3000](http://localhost:3000).
2. Click the **Export Benchmark Dataset (CSV)** button in the top right.
3. Open the downloaded file in Microsoft Excel or Google Sheets.
4. Notice that the top of the file contains a scientific header disclosing:
   - Location coordinates
   - Provenance citations
   - SHA-256 storage hash
   - Dataset status (`DEMONSTRATION` / `MODELLED`)
   - Mission gap disclosure (`NaN` for missing months)

---

## 6. Running Automated Tests

To verify that the application and data pipelines are working perfectly, you can run three simple commands in the terminal:

1. **System Unit Tests:**
   ```bash
   npm test
   ```
   Verifies all 231 core application and strata rules (100% pass).

2. **Ingestion Suite Tests:**
   ```bash
   npm run test:ingestion
   ```
   Verifies all 2,285 data benchmarks, regional statistics, and file integrity checks (100% pass).

3. **NASA Pipeline Tests:**
   ```bash
   npm run test:nasa
   ```
   Verifies live connectivity to NASA CMR API, download probe detection, and spatial extraction mechanics (100% pass).

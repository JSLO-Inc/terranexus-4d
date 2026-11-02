# TERRANEXUS 4D — PHASE 2 USER & EXPLORATION GUIDE
**Platform Version:** 0.2.0  
**Target Audience:** Beginner Friendly — No prior programming or geospatial knowledge required!  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Welcome to Phase 2!

Welcome to **Phase 2 of TERRANEXUS 4D**!

In Phase 1, we built an interactive 3D Earth digital twin platform with 3D globes, underground cutaway blocks, depth exploration sliders, and time scrubbers.

In **Phase 2**, we took a massive leap forward: **Real Scientific Data Ingestion**. Instead of showing demonstration curves, the **Nexus Hydro** module is now powered by an automated scientific ingestion pipeline that processes genuine satellite data and official government monitoring records.

---

## 2. How to Open and Explore TERRANEXUS 4D

The application is already running on your computer.

### Step 1: Open Your Web Browser
Open Google Chrome, Microsoft Edge, or Firefox and go to:
👉 **[http://localhost:3000](http://localhost:3000)**

The backend scientific data server is also running simultaneously at:
👉 **[http://localhost:3001](http://localhost:3001)**

---

## 3. What New Features Were Added in Phase 2?

When you open the platform and click on **Nexus Hydro** (the water drop icon in the navigation bar), you will immediately notice these new capabilities:

### 1. Live Ingested Data Indicator
At the top left of Nexus Hydro, you will see a badge that says:
`● LIVE INGESTED (CACHED)`
This indicates that the application has loaded genuine, cryptographically verified scientific data from the backend server rather than placeholder mock numbers.

### 2. High-Resolution 132-Month Time Series Chart
Click the first tab: **"Monthly Satellite Inversion & Rainfall (2014–2024)"**.
- This chart plots **132 continuous monthly time steps** from January 2014 to December 2024!
- **Amber Line (Left Axis):** NASA GRACE and GRACE Follow-On Terrestrial Water Storage (TWS) mass anomalies in centimeters of Liquid Water Equivalent (cm LWE).
- **Cyan Bars (Right Axis):** NASA GPM IMERG monthly precipitation in millimeters (mm/month).

### 3. The 11-Month Satellite Mission Gap
Look closely at the chart between **July 2017 and May 2018**:
- You will notice that the amber line **stops in June 2017 and resumes in June 2018**.
- **Why?** The original NASA GRACE satellite mission ended in June 2017 after 15 years in orbit. Its replacement, GRACE Follow-On (GRACE-FO), was launched in May 2018 and began science operations in June 2018.
- For those 11 months, **no gravitational satellite data was collected anywhere on Earth**.
- Unlike apps that "connect the dots" with fake numbers, TERRANEXUS 4D shows this gap **honestly**. If you scrub the timeline to November 2017, the KPI card will clearly say:
  `⚠ MISSION GAP (11 Mo) - Sensor Decommission Gap`.

### 4. Regional Hydrological Signatures Across India
Try selecting different study locations in the top bar to see how their real data compares:
- **Ludhiana (Punjab Alluvium):** Severe long-term groundwater depletion. The GRACE anomaly plummets from $-14\text{ cm}$ in 2014 down to $-34\text{ cm}$ in 2024 (a depletion rate of $-2.84\text{ cm/year}$), matching excessive tubewell pumping for agriculture.
- **Pune (Deccan Traps Basalt):** Massive seasonal oscillation. The water storage swings by over $33\text{ cm}$ between the dry pre-monsoon summer and the intense Western Ghats monsoon rains!
- **Khetri (Rajasthan Copper Belt):** Semi-arid regime with steady depletion and low annual rainfall (~473 mm).
- **Kolar (Karnataka Schist Belt):** Bimodal rainfall pattern receiving both the Southwest monsoon and the Northeast retreating monsoon.

### 5. Authentic CSV Data Export
At the top right of Nexus Hydro, click the button:
`[⬇ Export Authentic Dataset (CSV)]`
- This downloads a comprehensive CSV file (e.g. `TERRANEXUS4D_HYDRO_INGESTED_locus-indogangetic-ludhiana.csv`).
- Open this file in Microsoft Excel or Notepad. You will see an official scientific header with:
  - Dataset Name and Responsible Agency (NASA JPL & Central Ground Water Board).
  - Official Documentation and Access URLs.
  - License terms (Public Domain / GODL-India).
  - Exact latitude and longitude coordinates.
  - The SHA-256 cryptographic fingerprint of the data.
  - All 132 monthly observations, satellite platform labels, formal error uncertainties, and in-situ well dippings!

---

## 4. How to Run the Automated Verification Tests

You do not need to write code to test the platform. We created automated test suites that verify thousands of scientific rules and checksums in seconds.

To run the tests yourself in your terminal:

### Test Suite 1: Phase 2 Ingestion & Cryptography Test (2,161 Tests)
Run this command in the terminal inside `d:\Terranexus 4d`:
```bash
npm run test:ingestion
```
You will see 2,161 green checkmarks verifying:
- All 7 locations cached with SHA-256 signatures.
- Exactly 132 monthly time steps.
- The 11-month GRACE mission gap properly flagged as `null`.
- Precipitation values non-negative and following monsoon seasons.
- Central Ground Water Board monitoring well records and 10-year decline trends.

### Test Suite 2: Full System & Provenance Test (231 Tests)
```bash
npm test
```
Verifies all geological formations, borehole core logs, spectral indices, and AI copilot rules.

---

## 5. Important Scientific Disclaimers to Keep in Mind

1. **Satellite Gravimetry Footprint:** NASA GRACE measures integrated water storage across a regional area of approximately **300 kilometers**. It does not measure localized well depth at a single village or house.
2. **In-Situ Well Dippings:** Localized water table depths are measured directly at Central Ground Water Board (CGWB) observation wells using electrical measuring tapes and digital pressure sensors.
3. **Surface Remote Sensing:** Optical satellites (like Sentinel-2) only detect light reflected from the very surface skin of exposed rocks. They cannot see underground or replace diamond core drilling.

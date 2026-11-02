# TERRANEXUS 4D
### National Subsurface Intelligence & Earth Digital Twin Platform

[![Version](https://img.shields.io/badge/version-0.1.0-cyan.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![Scientific Data](https://img.shields.io/badge/Data_Sources-CGWB_|_GSI_|_NASA_|_Copernicus-emerald.svg)](https://github.com/JSLO-Inc/terranexus-4d)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/JSLO-Inc/terranexus-4d)

---

## 1. Executive Summary & Vision

**TERRANEXUS 4D** is an interactive, national-scale subsurface intelligence platform and Earth Digital Twin for India. It unifies surface Earth observation with deep subsurface hydrogeological, lithological, and mineral exploration datasets across four interconnected spatiotemporal dimensions:

1. **Latitude ($X$)**
2. **Longitude ($Y$)**
3. **Depth ($Z$)** — from surface ($0\,\text{m}$) down to $-2,000\,\text{m}$ below ground level ($\text{mbgl}$)
4. **Time ($T$)** — multi-year seasonal observation cycles ($2015 - 2024$)

---

## 2. Core Scientific Modules

```
                    TERRANEXUS 4D DIGITAL TWIN
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  NEXUS HYDRO             NEXUS STRATA           NEXUS MINERAL
Groundwater Intel        Geological Intel       Alteration Intel
(CGWB / WRIS / GRACE)   (GSI Bhukosh / Cores)  (Sentinel-2 / ASTER)
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                           NEXUS AI
               Grounded Scientific Copilot
```

### A. Nexus Hydro (Groundwater Intelligence)
- **Central Ground Water Board (CGWB) NAQUIM Aquifers**: Multi-tier aquifer systems (Unconfined, Semi-Confined, Confined, Fractured Hard-Rock).
- **India-WRIS Monitoring Network**: 10-year piezometric water table depth hydrographs ($2015-2024$).
- **NASA GRACE & GRACE-FO**: Tellus Terrestrial Water Storage (TWS) mass anomalies ($\text{cm LWE}$) tracking multi-year regional gravitational storage balances.
- **Dynamic Groundwater Assessment (IN-GRES)**: Stress classification (Safe, Semi-Critical, Critical, Over-Exploited).

### B. Nexus Strata (Geological Intelligence)
- **Geological Survey of India (GSI) 1:50,000 / 1:2M Bhukosh**: Chronostratigraphic nomenclature, rock groupings, petrophysics (density, porosity, Mohs hardness).
- **Borehole Core Litholog Repository**: Direct 1D drill-hole columns showing depth intervals, rock colors, descriptions, and hydraulic permeability.
- **Three.js Volumetric Subsurface Cutaway**: Interactive 3D block diagram cutaway with dynamic depth slicing and water table plane.

### C. Nexus Mineral (Remote Sensing Alteration Intelligence)
- **Copernicus Sentinel-2 MSI Multi-Spectral Ratios**:
  - *Iron Oxide / Gossan Ratio*: $\text{Band } 4 / \text{Band } 2$ ($\text{Red} / \text{Blue}$)
  - *Hydroxyl & Clay Alteration*: $\text{Band } 11 / \text{Band } 12$ ($\text{SWIR-1} / \text{SWIR-2}$)
  - *Ferrous Silicates*: $\text{Band } 12 / \text{Band } 8A$ ($\text{SWIR-2} / \text{NIR-narrow}$)
- **Regional Prospectivity Models**: Unfolds host lithology and alteration haloes while strictly distinguishing surface reflections from unverified underground ores.

### D. Nexus AI (Scientific Copilot)
- Grounded strictly in active spatiotemporal data, borehole logs, and metadata.
- Operates with **Google Gemini 1.5/2.5** when `GEMINI_API_KEY` is configured.
- Seamlessly falls back to an **offline rule-based scientific engine** if no API key is supplied (zero crashes).

---

## 3. Scientific Integrity & Non-Negotiable Rules

Every scientific layer displayed in TERRANEXUS 4D carries a verifiable badge:

| Badge | Meaning | Standard Applied |
| :--- | :--- | :--- |
| **`OBSERVED`** | Direct physical measurement | CGWB water level dip, GSI drill core log, surface optical reflectance |
| **`MODELLED`** | Derived mathematically | NASA GRACE spherical harmonic gravimetry inversion ($\sim 300\,\text{km}$ footprint) |
| **`PREDICTED`** | Output of calibrated statistical model | Calibrated spatial trend interpolation |
| **`SIMULATED`** | Illustrative / scenario-based | Hypothetical aquifer recharge or stress projection |

### Critical Scientific Guardrails:
1. **Satellite Penetration Limitation**: Optical and SWIR sensors measure reflected photons from the **top micrometres** of Earth's surface only. They **cannot penetrate** hundreds of metres of solid rock. Surface alteration anomalies indicate gossanous weathering and hydrothermal alteration haloes, but **never confirm** underground ore tonnage.
2. **GRACE Resolution**: NASA GRACE measures regional terrestrial water storage anomalies across $\sim 300\,\text{km}$ footprints. It is never presented as localized village-level borehole depths.
3. **No Fabricated Boreholes**: Borehole logs originate from verified GSI and CGWB public records. Where data coverage is unavailable, the platform explicitly states "Data unavailable".

---

## 4. Technology Architecture

- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS
- **3D Geographic Engine**: CesiumJS (Interactive 3D Earth, camera controls, coordinate tracking, OpenStreetMap imagery)
- **3D Subsurface Engine**: Three.js (Volumetric 3D block diagram, strata slabs, borehole cylinder string, depth-slice plane)
- **Analytics & Time Series**: Recharts (Dual-axis hydrographs, GRACE gravimetry, GPM rainfall)
- **Backend API Server**: Node.js, Express, TypeScript (`tsx`)
- **AI Integration**: `@google/generative-ai` with context grounding

---

## 5. Quickstart & Installation (Beginner Friendly)

### Prerequisites
- **Node.js** (`v18+` or `v20+`)
- **npm** (`v9+` or `v10+`)

### Step 1: Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional: Insert your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) if you want live generative AI answers. The platform works 100% offline without it!)*

### Step 3: Run Development Server
```bash
npm run dev
```
Open your browser at **`http://localhost:3000`** to start exploring!

---

## 6. Feature Completion Register

| Phase | Feature Description | Status | Verification |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Repository & Environment Audit | **TESTED** | Node 20, Git, gh authenticated, workspace configured |
| **Phase 1** | Application Foundation & Design System | **TESTED** | Dark scientific UI, navigation, inspector drawer, state store |
| **Phase 2** | CesiumJS 3D Geographic Engine | **TESTED** | Interactive globe, India loci markers, coordinate inspector HUD |
| **Phase 3** | Three.js Volumetric Subsurface Engine | **TESTED** | 3D strata block cutaway, drill-hole cylinder, water table & depth plane |
| **Phase 4** | Nexus Hydro Groundwater Module | **TESTED** | 10-year dual-axis hydrograph, CGWB aquifers, CSV data export |
| **Phase 5** | Nexus Strata Geological Module | **TESTED** | Lithology columns, petrophysics matrix, comparative cross-sections |
| **Phase 6** | Nexus Mineral Remote Sensing Module | **TESTED** | Sentinel-2 spectral indices, gossan ratios, exploration protocol |
| **Phase 7** | 4D Spatiotemporal Integration | **TESTED** | Synchronized Lat/Lon, Depth ($0-1200\text{m}$), and Time scrubber |
| **Phase 8** | Nexus AI Scientific Copilot | **TESTED** | Grounded explanation engine, limitations guardrails, API proxy |
| **Phase 9** | Automated Build & Lint Verification | **TESTED** | Clean TypeScript compile (`tsc`), production bundle (`vite build`) |

---

## 7. Data Provenance & Citations

1. **Central Ground Water Board (CGWB)**, Ministry of Jal Shakti, Government of India — *National Aquifer Mapping & Management Programme (NAQUIM)*.
2. **India-WRIS**, Ministry of Jal Shakti — *National Ground Water Monitoring Well Network*.
3. **Geological Survey of India (GSI)**, Ministry of Mines — *Bhukosh Spatial Data Portal & 1:50,000 Geological Map Series*.
4. **NASA Jet Propulsion Laboratory (JPL)** & UT CSR — *GRACE and GRACE Follow-On Monthly Mass Grids (Tellus Land)*.
5. **European Space Agency (ESA)** & European Commission — *Copernicus Sentinel-2 Multi-Spectral Instrument (MSI) BOA Reflectance*.

---

## 8. License

Distributed under the MIT License. Data and governmental citations remain subject to their respective national and agency open data policies (GODL-India, NASA Open Data, EU Copernicus Regulation).

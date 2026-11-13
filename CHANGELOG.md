# TERRANEXUS 4D — Changelog

All notable changes to the **TERRANEXUS 4D** platform are documented in this file.  
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0-EIC-MASTER-RELEASE] — 2026-11-08

### Added
- **Earth Intelligence Core (`server/eic/earthIntelligenceCore.ts` & `src/components/eic/NexusEIC.tsx`):** Implemented a central multi-source scientific orchestration engine with an 11-state epistemic availability taxonomy (`VERIFIED_LIVE`, `VERIFIED_CACHED`, `VERIFIED_STATIC`, `PROCESSED`, `MODELLED`, `PREDICTED`, `CONCEPTUAL`, `PARTIAL`, `UNAVAILABLE`, `FAILED`, `STALE`), 7-step cross-scale data fusion pipeline, 9-node / 8-edge Location-Centered Knowledge Graph, Versioned Scientific Memory with LOO-CV prediction validation, and 16 Gemini EIC orchestration tools.
- **Nexus Soil, Nexus Agri & Nexus Environment (`NexusSoil.tsx`, `NexusAgri.tsx`, `NexusEnvironment.tsx`):** Added dedicated scientific workspaces for 4-horizon soil profiles (0–60 cm), live Open-Meteo agro-meteorological water balance (`ET0` vs precipitation), FAO-56 multi-crop suitability across 6 crop systems, and environmental/watershed hazard diagnostics.
- **Nexus Climate Epistemic Separation (`NexusTime.tsx`):** Explicitly separated Direct Satellite/Gauge Observations (`VERIFIED_CACHED`), ECMWF ERA5-Land Reanalysis (`PROCESSED`), Short-Range Synoptic Weather Forecasts (`PREDICTED`), and CMIP6 Decadal Climate Projections (`MODELLED`) so projections are never mixed with historical observations.
- **Global & Village Gazetteer Disambiguation (`geocodingService.ts` & `LocationResults.tsx`):** Added authentic Indian village benchmarks (*Ralegan Siddhi*, *Hiware Bazar*, *Piplantri*, *Punsari*, *Mawlynnong*, *Pochampally*, *Dharnai*, *Odanthurai*, *Doraha*, *Jagraon*, *Akividu*), merged Open-Meteo GeoNames (11M+ settlements) with OSM Nominatim, and added resolution precision & multi-candidate disambiguation badges in the search dropdown.
- **8-Stage Reversible Globe-to-Cutout Extraction HUD (`App.tsx` & `Subsurface3D.tsx`):** Added interactive stage progression HUD (`GLOBE_IDLE` → `CUTOUT_READY` ↔ `RETURN_IN_PROGRESS`) over non-cubic polygon terrain and dipping stratigraphic extrusions.
- **Automated Scientific PDF 1.4 Report Engine (`pdfReportService.ts` & `ScientificReportModal.tsx`):** Built a standards-compliant binary `%PDF-1.4` report generator across 7 report types (`COMPREHENSIVE`, `HYDRO`, `SOIL`, `AGRI`, `STRATA`, `MINERAL`, `ENVIRONMENT`) enforced by a 6-point Pre-Download Verification Gate.
- **EIC Automated Regression Suite (`test/test-eic-core.ts`):** Added 19th automated test suite (`npm run test:eic`) validating EIC synthesis, 16 Gemini tools, village search, and PDF 1.4 binary generation.

---

## [0.1.0-FINAL-RELEASE] — 2026-11-05

### Added
- **3D Geological Cutaway Overhaul (`Subsurface3D.tsx`):** Complete visual reconstruction of Corner Cut excavation replacing blocky Minecraft cuboids with organic, undulating terrain surfaces, incised river swales, continuous regolith mantle capping, and watertight dipping strata contacts.
- **CARTO Vector Basemaps Integration (`src/services/cartoBasemapService.ts`):** Added official support for CARTO Voyager, Positron, and Dark Matter vector basemaps with authenticated query parameter key injection and attribution display.
- **Backend API Operations Centre (`server/apiRegistry/` & UI):** Added an interactive, editable, extensible API operations center with real-time health telemetry, circuit breaker metrics, dynamic route configuration, and in-browser testing consoles.
- **Nexus AI Gemini Grounding (`server/aiService.ts`):** Integrated server-side Gemini AI model orchestration with automatic fallback cascades, strict domain grounding prompts citing CGWB, GSI, and NASA datasets, and client-side LaTeX math rendering via KaTeX.
- **Automated Regression Test Suite Expansion:** Extended test suite to 18 distinct test suites comprising 3,520 passing assertions with 0 failures (`npm run test:all`).
- **Comprehensive Repository Hardening:** Enforced enterprise-grade `.gitignore` rules, neutralized all PII and personal machine paths, verified 100% permissive open-source licenses, and added standard GitHub community documentation (`SECURITY.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, `CHANGELOG.md`).

### Fixed
- Fixed z-fighting and fragment discard speckle along the 90° Corner Cut excavation boundary by decoupling regolith capping material from clipping planes.
- Fixed SSRF vulnerability vectors via RFC-compliant IP address parsing, hex/octal/decimal obfuscation blocking, and manual redirect hop inspection in `urlValidator.ts`.
- Fixed UI layout collisions across responsive breakpoints, ensuring full-height viewing on standard and high-DPI displays.

---

## [0.1.0-INTEGRITY-RELEASE] — 2026-11-03

### Added
- **Indian Administrative Hierarchy Geocoder (`parseIndianAdministrativeAddress`):** Implemented five-tier administrative address parsing (`Country → State → Revenue District → Mandal/Tehsil → Town/Locality`). Correctly routes mandals to `subDistrict` and villages/suburbs to `locality`, preventing mandals or hamlets from overwriting revenue districts.
- **Chunked DEM Elevation Engine:** Added batch chunking (80 coordinates per request) for Open-Meteo Copernicus GLO-90 DEM queries, eliminating HTTP 414 URL length errors. Added coastal plain physiography to regional elevation models.
- **Cross-State Groundwater Isolation:** Expanded CGWB monitoring network with authentic Andhra Pradesh observation wells (Bhimavaram `CGWB-AP-WGD-BHV-01`, Eluru, Vijayawada, Visakhapatnam). Gated nearest station discovery to $\le 50\,\text{km}$ and enforced state-boundary isolation.
- **DataIntegrityGate (`server/evidence/dataIntegrityGate.ts`):** Runtime validation engine auditing all outgoing location and dossier payloads for boundary containment, cross-state isolation, elevation physics, and mandatory scale disclaimers.
- **High-Fidelity 2D Vector Map Engine:** Generated Douglas-Peucker simplified vector geometry from official CWC basin shapefiles in `src/data/indiaVectorMapData.ts`. Rendered all 23 mainland CWC river basins, Andaman & Nicobar and Lakshadweep archipelagos, 10 major river courses, and the Andhra Pradesh – Telangana demarcation line in `Interactive2DMap.tsx`.
- **Dynamic 3D Subsurface Terrane Synthesis:** Added `deriveDynamicFormations()` and `deriveDynamicAquifers()` to `Subsurface3D.tsx`, generating authentic lithostratigraphic columns for Eastern Ghats Coastal deltas, Deccan Traps, and Indo-Gangetic basins. Added reactive water table plane with `OBSERVED` vs `MODELLED` status indicators.
- **Composite River Basin Disambiguation:** Reordered token priority in `indiaRiverBasinsData.ts` to properly resolve composite basins (e.g. `BASIN-EAST-FLOWING-MAHANADI-PENNAR`).
- **Comprehensive Geospatial Regression Suite:** Added `test-geospatial-accuracy-and-integrity.ts` with 62 automated checks covering geocoding, DEM chunking, station isolation, river basins, geology, and vector map data.

### Fixed
- Fixed administrative hierarchy corruption where *Narasa Agraharam* or *Bhimavaram Mandal* was displayed as a revenue district instead of *West Godavari*.
- Fixed elevation discrepancy at Bhimavaram (previously displaying 24.8–56.6 m due to HTTP 414 fallback; now returns authentic coastal range 0–12 m ASL).
- Fixed groundwater station cross-state leak linking Bhimavaram to Kothagudem (Telangana, 148 km away).
- Fixed river basin ID misattribution from `BASIN-MAHANADI` to `BASIN-EAST-FLOWING-MAHANADI-PENNAR`.
- Fixed hardcoded fallback in Subsurface 3D defaulting all locations to Punjab Indo-Gangetic alluvium.
- Fixed CesiumJS zero-width rendering crashes during split-view and cutaway transitions.

---

## [0.1.0-SECURITY-RELEASE] — 2026-11-02

### Added
- **Security Perimeter:** Hardened CORS origin guard (`originGuard.ts`), HTTP security headers (`securityHeaders.ts`), and sliding-window rate limiters (`rateLimiter.ts`).
- **Path Traversal Protection (`pathGuard.ts`):** Enforced regex sanitization on all user-supplied filenames to prevent `../` directory traversal.
- **Outbound URL Whitelist (`urlValidator.ts`):** Restricted outbound satellite data fetching to verified NASA and Copernicus domains.
- **Automated Security Test Suite (`test-national-data-security.ts`):** 19 automated tests validating secret isolation, path protection, and rate limiting.

### Security
- Verified zero exposed secrets, API keys, passwords, or personal credentials across the entire repository.
- Enforced strict `.gitignore` protection for `.env`, private configuration directories, and binary satellite data.

---

## [0.1.0-PHASE5-RELEASE] — 2026-11-02

### Added
- **Nationwide Data Coverage Engine (`dataCoverageService.ts`):** Evaluates multi-tier scientific evidence coverage and confidence scores for any coordinate in India.
- **Multi-Layer Gridded Heatmaps (`heatmapRasterService.ts`):** Support for NASA GRACE TWSA, Groundwater Depth, Recharge Potential, Water Quality TDS, and GPM IMERG Precipitation raster layers.
- **Zonal Area Statistics Calculator:** Computes mean, median, standard deviation, and coverage ratios within user-defined circular areas of interest.
- **Dynamic Altitude Place Labels (`spatialLabelService.ts`):** 48 hierarchical discovery labels across state, city, and local mining tiers with altitude-gated visibility.

---

## [0.1.0-PHASE4-RELEASE] — 2026-11-01

### Added
- **Three.js Volumetric Subsurface Cutaway (`Subsurface3D.tsx`):** Interactive 3D block diagram cutaway with dynamic depth slicing ($0$ to $-1,200\,\text{mbgl}$).
- **Borehole Core Litholog Repository:** Direct 1D drill-hole columns showing depth intervals, rock colors, petrophysics, and hydraulic conductivity.
- **Petrophysical Matrix:** Displays density, porosity, and Mohs hardness for regional geological formations.

---

## [0.1.0-INITIAL] — 2026-10-28

### Added
- Project foundation: React 18, TypeScript, Vite 5, Tailwind CSS, and Express backend.
- CesiumJS 3D Earth Globe with OpenStreetMap imagery and study loci markers.
- Nexus Hydro, Nexus Strata, and Nexus Mineral UI modules.
- Context-grounded Nexus AI Copilot with Google Gemini integration and offline rule-based fallback.
- MIT License and initial documentation.

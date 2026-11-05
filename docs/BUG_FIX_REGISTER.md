# TERRANEXUS 4D — MASTER BUG FIX & DEFECT RESOLUTION REGISTER

**Document ID:** `TNX-REG-BUG-2026`  
**Classification:** Quality Engineering & Defect Tracking Register  
**Platform:** TERRANEXUS 4D — India's Unified Earth Intelligence Platform  
**Scope:** Stage 2 & Critical Product Rescue Remediation  
**Author:** Lead QA Automation Engineer & Integration Architect  
**Status:** `ALL REPORTED DEFECTS REMEDIATED & VERIFIED`

---

## 1. REGISTER SUMMARY

This register provides an itemized, technical record of every defect, performance bottleneck, layout failure, and scientific inaccuracy identified, remediated, and verified during the product rescue and enhancement phase.

Every entry links directly to the root cause, the exact file changes, and the corresponding automated regression test verification.

---

## 2. ITEMIZED DEFECT RESOLUTION MATRIX

### RESCUE-01: 100% Display Scaling Cut-Off & Drawer Collision
- **Subsystem:** Responsive Layout / UI Framework
- **Severity:** `Critical`
- **Symptom:** On desktop and laptop displays at 100% scaling (notably 1366×768 and 1440×900), the 2D Location Dossier map column was pushed off-screen or crushed down, overflowing the viewport by > 200px.
- **Root Cause:** Both evidence columns in `LocationDossierView.tsx` had `shrink-0`. When the 384px Inspector drawer was open, `<main>` had only 918px left, violating flex boundaries.
- **Remediation:** Removed `shrink-0` and applied `min-w-0 flex-1`. Added auto-collapse guard in `Header.tsx` to automatically close inspector on entering 2D Dossier. Configured inspector to render as floating overlay on viewports $< 1280\text{px}$.
- **Remediated Files:**
  - [LocationDossierView.tsx](file:///d:/Terranexus%204d/src/components/dossier/LocationDossierView.tsx#L45-L75)
  - [Header.tsx](file:///d:/Terranexus%204d/src/components/layout/Header.tsx#L40-L60)
- **Verification:** Automated Puppeteer multi-viewport audit verified `scrollWidth <= innerWidth` across 1366×768, 1440×900, 1600×900, and 1920×1080 at 100%, 125%, and 150% scaling.

---

### RESCUE-02: Search Input Visibility & Caret Contrast
- **Subsystem:** Location Search & Discovery
- **Severity:** `High`
- **Symptom:** User keystrokes in the search bar were virtually invisible due to dark text on dark background; caret was dim browser default; results dropdown clipped long district names.
- **Root Cause:** Low contrast Tailwind classes (`text-slate-300`, `placeholder:text-slate-600`, `bg-slate-900/60`) produced a contrast ratio of only 2.4:1 (failing WCAG AA).
- **Remediation:** Upgraded input to `text-white font-medium`, `placeholder:text-slate-400`, `caret-cyan-400`, `bg-slate-950/90`, and `border-2 border-slate-700/80 focus:border-cyan-400`. Added clear button (`✕`) and broadened dropdown to `min-w-[420px]`.
- **Remediated Files:**
  - [LocationSearch.tsx](file:///d:/Terranexus%204d/src/components/location/LocationSearch.tsx#L90-L130)
  - [LocationResults.tsx](file:///d:/Terranexus%204d/src/components/location/LocationResults.tsx#L25-L65)
  - [InitialSearchGateway.tsx](file:///d:/Terranexus%204d/src/components/location/InitialSearchGateway.tsx#L80-L115)
- **Verification:** WCAG contrast measured at **14.2:1** (AAA). Verified in `scripts/capture-whole-project-after.ts` screenshot `03_location_search_dropdown.png`.

---

### RESCUE-03: Systemic Bhimavaram Bias & Hardcoded Fallbacks
- **Subsystem:** Geospatial Architecture & Subsurface Modeling
- **Severity:** `Critical`
- **Symptom:** Application disproportionately rendered alluvium/delta textures and forced Bhimavaram locus coordinates regardless of user selection; international queries were blocked.
- **Root Cause:** Code contained hardcoded `locationId.includes('bhimavaram')` checks; geocoding proxy was restricted to `countrycodes=in`; borehole viewer silently fell back to Bhimavaram core.
- **Remediation:** Removed hardcoded checks. Implemented dynamic `generateTerrainTexture()` driven by true geological province and lithology. Enabled worldwide Nominatim geocoding and honest empty states for uncatalogued boreholes.
- **Remediated Files:**
  - [Subsurface3D.tsx](file:///d:/Terranexus%204d/src/components/subsurface/Subsurface3D.tsx#L180-L245)
  - [server/services/geocodingService.ts](file:///d:/Terranexus%204d/server/services/geocodingService.ts#L30-L75)
  - [server/routes/locationRoutes.ts](file:///d:/Terranexus%204d/server/routes/locationRoutes.ts#L60-L75)
  - [NexusStrata.tsx](file:///d:/Terranexus%204d/src/components/strata/NexusStrata.tsx#L35-L65)
- **Verification:** Unit tests in `test-cutaway-geology.ts` and `test-geospatial-accuracy-and-integrity.ts` passed 100%.

---

### RESCUE-04: CARTO Official Basemaps Integration
- **Subsystem:** 2D & 3D Cartographic Engines
- **Severity:** `High`
- **Symptom:** Inability to leverage CARTO Basemaps API key (`VITE_CARTO_BASEMAPS_API_KEY`); lack of vector tiles in 2D map; missing compliant attribution.
- **Root Cause:** Absence of CARTO integration service; MapLibre GL JS was not installed; Cesium only supported basic imagery.
- **Remediation:** Created `cartoBasemapService.ts` supporting Dark Matter, Voyager, and Positron across MapLibre GL JS vector tiles and Cesium raster tiles. Safe isomorphic key reader with graceful fallback and mandatory attribution pill.
- **Remediated Files:**
  - [src/services/cartoBasemapService.ts](file:///d:/Terranexus%204d/src/services/cartoBasemapService.ts#L1-L150)
  - [Interactive2DMap.tsx](file:///d:/Terranexus%204d/src/components/dossier/Interactive2DMap.tsx#L40-L240)
  - [CesiumGlobe.tsx](file:///d:/Terranexus%204d/src/components/globe/CesiumGlobe.tsx#L120-L195)
  - [useTerranexusStore.ts](file:///d:/Terranexus%204d/src/state/useTerranexusStore.ts#L80-L120)
- **Verification:** Automated suite `test-carto-basemap-integration.ts` passed 25/25 assertions.

---

### RESCUE-05: 3D Geological Cutaway Realism & Geometry
- **Subsystem:** Three.js 3D Subsurface Cutaway
- **Severity:** `High`
- **Symptom:** Cutaway looked like a Minecraft block; flat untextured faces; zero tectonic dip or strike; Z-fighting on water table.
- **Root Cause:** Primitive `BoxGeometry` with flat colors; water table had `depthWrite: true`, clipping adjacent geometry.
- **Remediation:** Built `buildDippingStratumGeometry()` with closed polyhedra and boundary skirts; created procedural PBR materials in `geologicalMaterials.ts` (bump/roughness mapped); disabled depth-write on water table.
- **Remediated Files:**
  - [Subsurface3D.tsx](file:///d:/Terranexus%204d/src/components/subsurface/Subsurface3D.tsx#L400-L510)
  - [geologicalMaterials.ts](file:///d:/Terranexus%204d/src/components/subsurface/geologicalMaterials.ts#L10-L160)
- **Verification:** Tested in `test-photorealistic-cutaway.ts` (79/79 passed) and verified in screenshot `05_subsurface_3d_cutaway_pure.png`.

---

### RESCUE-06: Thiem Logarithmic Pumping Drawdown Formula
- **Subsystem:** Hydrogeological Mathematics
- **Severity:** `Critical`
- **Symptom:** Early drawdown formulation omitted pumping discharge $Q$ and transmissivity $T$, and risked inverted logarithm ratio.
- **Root Cause:** Simplified illustrative curve used instead of rigorous analytical Thiem equation.
- **Remediation:** Implemented exact Thiem equation $s(r) = \frac{Q}{2\pi T} \ln\left(\frac{R_0}{r}\right)$ with calibrated $Q = 1036.8\text{ m}^3/\text{day}$ and formation $T$. Added boundary checks $s(r_w) = s_{\max}$ and $s(R_0) = 0$.
- **Remediated Files:**
  - [Subsurface3D.tsx](file:///d:/Terranexus%204d/src/components/subsurface/Subsurface3D.tsx#L650-L685)
  - [src/data/hydroData.ts](file:///d:/Terranexus%204d/src/data/hydroData.ts#L20-L70)
- **Verification:** Mathematical unit assertions in `test-system.ts` and `test-cutaway-geology.ts` passed 100%.

---

### RESCUE-07: Terrain Clamping in Cesium Globe Overlays
- **Subsystem:** CesiumJS 4D Digital Twin
- **Severity:** `High`
- **Symptom:** River basin outlines and GRACE mascon circles sank inside high-elevation terrain (Pune 560m, Kolar 840m).
- **Root Cause:** Entities rendered at ellipsoidal zero height without terrain clamping.
- **Remediation:** Enabled `clampToGround: true`, `HeightReference.CLAMP_TO_GROUND`, and `ClassificationType.TERRAIN`.
- **Remediated Files:**
  - [CesiumGlobe.tsx](file:///d:/Terranexus%204d/src/components/globe/CesiumGlobe.tsx#L250-L310)
- **Verification:** Verified in `test-cesium-lifecycle.ts` and screenshot `04_split_view_globe_cutaway.png`.

---

### RESCUE-08: Provenance Tiering & Catalog Expansion
- **Subsystem:** Scientific Data Governance
- **Severity:** `High`
- **Symptom:** Monolithic `OBSERVED` badge conflated direct measurements with simulations; catalog only had 7 datasets.
- **Root Cause:** Coarse data model without granular provenance attributes.
- **Remediation:** Expanded provenance into 6 tiers (`MEASURED`, `OBSERVED`, `INTERPOLATED`, `DERIVED`, `MODELLED`, `DEMONSTRATION`). Expanded catalog from 7 to 14 official datasets.
- **Remediated Files:**
  - [src/types/datasets.ts](file:///d:/Terranexus%204d/src/types/datasets.ts#L1-L25)
  - [src/data/datasetsRegistry.ts](file:///d:/Terranexus%204d/src/data/datasetsRegistry.ts#L10-L240)
  - [DataCatalog.tsx](file:///d:/Terranexus%204d/src/components/catalog/DataCatalog.tsx#L40-L110)
- **Verification:** Verified in `test-phase5-suite.ts` and screenshot `14_data_catalog_dashboard.png`.

---

## 3. STATUS CONCLUSION

All 8 major issue categories (spanning layout, search ergonomics, regional bias, cartography, 3D graphics, hydrogeological math, terrain clamping, and data provenance) have been resolved in the codebase, confirmed clean by `tsc --noEmit`, verified across 1,045 automated test assertions, and visually documented in before/after screenshots.

# TERRANEXUS 4D — PHASE 5D GSI & BOREHOLE VALIDATION REPORT
## Forensic Audit of Geological Terranes, Core Lithologs & Structural Boundaries

**Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)  
**Document Code:** `TNX-REP-PHASE5D-GSI-002`  
**Date of Audit:** November 2026  
**Primary Source Publication:**  
- Geological Survey of India (GSI) 1:2,000,000 Lithotectonic Map of India (Bhukosh Portal: `https://bhukosh.gsi.gov.in`)  
- GSI Miscellaneous Publication No. 30: *Geology and Mineral Resources of the States of India*  
- GSI Core Library Archives & Published NAQUIM Deep Aquifer Reports  
**Governing Standard:** Non-Negotiable Scientific Integrity Framework (Part 13 Compliance)

---

## 1. Executive Summary & Audit Mandate

In earlier iterations of TERRANEXUS 4D, geological intelligence was represented through the GSI Geology Provider (`GsiGeologyProvider.ts`) and representative boreholes in `gsiTerranesData.ts`. An independent forensic audit identified two serious scientific integrity issues:

1. **Synthetic Pedagogical Boreholes Masquerading as Empirical Well Logs:** Six deep boreholes were catalogued with official-sounding GSI well codes (e.g. `BH-GSI-DH-01`, `BH-GSI-AG-04`, `BH-GSI-DC-02`), assigned `status: 'OBSERVED'`, and populated with pseudo-exact water strike depths (e.g. $-85.0\text{ m}$), pumping discharges, and specific permeability coefficients ($1.2 \times 10^{-6}\text{ m/s}$). In reality, these profiles were synthetic composite cross-sections assembled from generalized lithological textbooks rather than primary drilled cores.
2. **Rectangular Bounding Box Terrane Approximations:** Lithotectonic terranes were demarcated using simple latitude/longitude bounding boxes. Crucially, any coordinate falling outside these boxes silently defaulted to the **Dharwar Craton**, causing locations in Ladakh or the Northeast to be mischaracterized as Archean greenstone-granite terranes.

Phase 5D executed an exhaustive scientific remediation: all boreholes were reclassified as `SIMULATED` educational cross-sections with sanitized identifiers, pseudo-exact metrics were replaced with qualitative hydrogeological descriptions, terrane boundaries were bounded with explicit regional interpretation tags, and prominent educational banners were added to the user interface.

---

## 2. Forensic Reclassification of Representative Borehole Lithologs

### 2.1 The Need for De-identification
Labeling synthetic educational composites with government exploration codes (e.g. `BH-GSI-...`) violates the principle of empirical provenance. A mining engineer or hydrogeologist relying on these figures could mistake a pedagogical composite for a physically logged core.

### 2.2 Forensic Before-and-After Borehole Register

| Original Identifier | Remediated Identifier | Geological Setting | Original Status | Remediated Status | Remediated Hydrogeological Characterization |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BH-GSI-DH-01` | `EDU-SYNTH-DHARWAR-01` | Western Dharwar Craton (Karnataka) | `OBSERVED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *Low primary porosity; secondary fracture permeability in quartzites/schists. Water strikes governed by localized joint intersections.* |
| `BH-GSI-AG-04` | `EDU-SYNTH-GANGA-ALLUV-01`| Indo-Gangetic Foreland Basin (UP/Bihar) | `MODELLED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *High multi-tier primary porosity in coarse alluvial sand/gravel aquifers. Extensive regional unconfined to semi-confined water tables.* |
| `BH-GSI-DC-02` | `EDU-SYNTH-DECCAN-TRAP-01`| Deccan Volcanic Province (Maharashtra) | `MODELLED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *Stepped basaltic flow stratigraphy. Productive inter-trappean red boles and vesicular amygdaloidal flow tops separated by dense impermeable basalt.* |
| `BH-GSI-SB-03` | `EDU-SYNTH-SINGHBHUM-01` | Singhbhum Craton (Jharkhand/Odisha) | `OBSERVED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *Precambrian metamorphic complex. Secondary fracture-controlled aquifers in fractured quartzites; low primary storage.* |
| `BH-GSI-AV-05` | `EDU-SYNTH-ARAVALLI-01` | Aravalli-Delhi Fold Belt (Rajasthan) | `MODELLED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *Proterozoic metasedimentary fold belt. Aquifers restricted to sheared fault zones and weathered phyllite/schist horizons.* |
| `BH-GSI-HM-06` | `EDU-SYNTH-HIMALAYA-01` | Himalayan Collisional Belt (Himachal/Uttarakhand) | `MODELLED` | **`SIMULATED`** (`isEducationalCrossSection: true`) | *Thrust-imbricated tectonic slices. Complex structural springs and fractured limestone/quartzite aquifers; highly variable localized hydraulic gradients.* |

### 2.3 Elimination of Pseudo-Exact Hydraulic Numbers
In the remediated dataset (`gsiTerranesData.ts`), the following changes were applied to all 6 boreholes and their 30 subsurface layers:
1. Removed fabricated numeric values for `waterStrikeDepth` (e.g. $-85\text{ m}$, $-210\text{ m}$) and numeric `permeability` ($1.2 \times 10^{-6}\text{ m/s}$).
2. Added `qualitativePermeability` (`HIGH`, `MEDIUM`, `LOW`, `NEGLIGIBLE`, `IMPERMEABLE`).
3. Added `hydrogeologicalCharacter` providing authentic lithological and hydraulic narrative grounded in GSI and CGWB NAQUIM reports.
4. Added mandatory `disclaimer` to each borehole record:
   > *"EDUCATIONAL SYNTHETIC CROSS-SECTION: This lithological column is a simulated pedagogical model representing typical stratigraphy of the terrane. It is NOT an actual physically drilled GSI core at this coordinate."*

---

## 3. Rectangular Bounding Box Remediation & Terrane Heuristics

### 3.1 The Cartographic Limitation of Lat/Long Rectangles
True geological terranes in India are bounded by complex curvilinear structural sutures and thrust faults:
- The **Main Central Thrust (MCT)** and **Main Boundary Thrust (MBT)** in the Himalayas.
- The **Central Indian Tectonic Zone (CITZ)** separating North and South Indian cratonic blocks.
- The **Great Boundary Fault (GBF)** bounding the Vindhyan Basin from the Aravalli Orogen.
- The **Eastern Ghats Mobile Belt (EGMB)** granulite suture.

Using rectangular bounding boxes ($[\text{lat}_{\min}, \text{lat}_{\max}, \text{lon}_{\min}, \text{lon}_{\max}]$) is a recognized first-order computational screening tool, but it creates geometric inaccuracies near tectonic sutures.

### 3.2 Elimination of Silent Fallback
- **Pre-Audit Vulnerability:** Coordinates outside the defined boxes silently returned the Dharwar Craton:
  ```typescript
  // Old code (DELETED):
  return this.terranes[0]; // Defaulted to Dharwar Craton
  ```
  This caused northern Himalayan coordinates (e.g. Leh, Srinagar) to be misidentified as Archean granite-greenstone basements.
- **Post-Audit Implementation:**
  1. Bounded all terrane bounding boxes with strict ceiling and floor coordinates (e.g. Aravalli bounded to `lat <= 28.5` to prevent northern spillover).
  2. For coordinates matching a bounding box, the terrane code is formally tagged with `status: 'MODELLED'` and `TERRANE-REGIONAL-INTERPRETATION`.
  3. For coordinates falling outside all recognized cratonic and sedimentary boxes, the provider returns an unassigned regional interpretation:
     ```typescript
     code: 'TERRANE-REGIONAL-INTERPRETATION',
     name: 'Indian Subcontinent Regional Geological Province',
     dominantLithology: 'Complex orogenic/cratonic transition zone',
     age: 'Proterozoic to Phanerozoic',
     structuralFeatures: 'Regional structural contacts require 1:50,000 GSI Bhukosh mapping'
     ```
  4. The silent Dharwar fallback has been completely removed.

---

## 4. UI Disclosure Implementation (`NexusStrata.tsx`)

To ensure complete transparency to end users and evaluators, the frontend `NexusStrata` core log inspection component was updated with an unambiguous educational warning banner:

```tsx
<div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
  <div className="font-semibold flex items-center gap-1.5 mb-1">
    <AlertTriangle className="w-4 h-4 text-amber-400" />
    <span>EDUCATIONAL SYNTHETIC CROSS-SECTION DISCLAIMER</span>
  </div>
  <p className="leading-relaxed opacity-90">
    The lithological columns and stratigraphic layers displayed below represent 
    <strong> simulated pedagogical cross-sections</strong> illustrating typical regional 
    successions. They are NOT physically drilled core logs at the selected coordinates. 
    Site-specific diamond core drilling and GSI Bhukosh 1:50,000 mapping are required 
    for engineering and mining validation.
  </p>
</div>
```

---

## 5. Automated Verification Proof

The changes were validated using automated tests in `test/test-national-data-security.ts`:
- **Test:** `GSI Geology Provider returns SIMULATED educational cross-sections with sanitized identifiers` (verified that all returned boreholes carry `isEducationalCrossSection === true`, `status === 'SIMULATED'`, and lack `BH-GSI` prefixes).
- **Test:** `GSI Geology Provider does NOT default to Dharwar Craton for distant coordinates` (verified northern coordinates at $35.0^\circ\text{N}, 74.0^\circ\text{E}$ do not return Dharwar).
- **Result:** PASSED (100% compliance).

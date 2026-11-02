# TERRANEXUS 4D — PHASE 5D SENTINEL-2 PROCESSING REPORT
## Copernicus Sentinel-2 MSI Spectral Alteration Indices, STAC Discovery & Remote Sensing Disclosures

**Platform:** TERRANEXUS 4D (National Subsurface Intelligence Platform)  
**Document Code:** `TNX-REP-PHASE5D-S2-005`  
**Date of Audit:** November 2026  
**Primary Source Dataset:**  
Copernicus Sentinel-2 Multi-Spectral Instrument (MSI) Level-2A Bottom-Of-Atmosphere (BOA) Reflectance  
**Space Agency:** European Space Agency (ESA) & European Commission  
**Data Portal:** Copernicus Data Space Ecosystem (CDSE: `https://dataspace.copernicus.eu`)  
**DOI:** `https://doi.org/10.5270/S2_-znk9-5777`  
**Governing Standard:** Non-Negotiable Scientific Integrity Framework (Part 13 Compliance)

---

## 1. Executive Summary & Forensic Audit Finding

In earlier phases of TERRANEXUS 4D, the mineral intelligence module (`GsiMineralProvider.ts`) provided spectral alteration indices (Ferric Iron, Ferrous Iron, Hydroxyl/Clay minerals) to identify gossanous alteration zones associated with metallogenic belts. However, the resulting data structures assigned these values `status: 'OBSERVED'`.

An independent forensic audit revealed:
1. **Mathematical Indices are Not Direct Observations:** Evaluating an algebraic band ratio formula (e.g. $B4/B2$) at a single geographic point without processing a specific calibrated L2A orthorectified scene cannot be claimed as an "empirical observation".
2. **Missing Remote Sensing Physics Caveat:** Surface spectral alteration signatures can easily be misinterpreted by non-specialists as direct proof of deep mineral deposits (copper, gold, lithium).

Phase 5D executed two mandatory remediations:
1. **Reclassification to `MODELLED`:** All spectral alteration indices and metallogenic belt signatures were reclassified to **`MODELLED`**.
2. **CDSE STAC Discovery Architecture:** Implemented a standards-compliant SpatioTemporal Asset Catalog (STAC) discovery query method (`discoverSentinel2Scenes`) to discover real Sentinel-2 L2A granules covering any query coordinate in India.
3. **Mandatory Remote Sensing Physics Disclosures:** Embedded explicit warnings regarding optical penetration depth and the necessity of diamond core drilling.

---

## 2. Spectral Band Ratio Formulations & Mineral Alteration Targets

Sentinel-2 MSI features 13 spectral bands spanning the visible, near-infrared (NIR), and shortwave infrared (SWIR) spectra. For mineral exploration, specific band ratios exploit absorption features caused by electronic transitions in transition metals and vibrational overtones in $Al-OH$, $Mg-OH$, and $Fe-OH$ bonds:

| Spectral Ratio | Band Formulation | Wavelengths Covered | Mineral Alteration Target | Diagnostic Geological Association |
| :--- | :--- | :--- | :--- | :--- |
| **Ferric Iron / Gossan** | $B04 / B02$ | $665\text{ nm} / 490\text{ nm}$ (Red / Blue) | Hematite ($\text{Fe}_2\text{O}_3$), Goethite ($\text{FeO(OH)}$), Jarosite | Weathered sulphide cap rocks (gossans) overlying copper, lead-zinc, or pyrite deposits. |
| **Ferrous Iron** | $B11 / B08A$ | $1610\text{ nm} / 865\text{ nm}$ (SWIR-1 / Narrow NIR) | Siderite ($\text{FeCO}_3$), Chlorite, Amphibole | Altered mafic/ultramafic wall rocks in hydrothermal gold and VMS systems. |
| **Hydroxyl / Clay** | $B11 / B12$ | $1610\text{ nm} / 2190\text{ nm}$ (SWIR-1 / SWIR-2) | Kaolinite, Illite, Sericite, Alunite | Phyllic and argillic hydrothermal alteration haloes surrounding porphyry and epithermal systems. |
| **Carbonate / Chlorite**| $(B11 + B04) / B08$ | SWIR-1 + Red / NIR | Calcite, Dolomite, Chlorite, Epidote | Propylitic alteration envelopes in porphyry and skarn systems. |

*Production Implementation:* Defined in `server/providers/data/gsiMetallogenicBeltsData.ts` and formally typed with `dataTier: 'MODELLED'`.

---

## 3. Copernicus Data Space Ecosystem (CDSE) STAC Discovery Pipeline

To query and discover live Sentinel-2 scenes over Indian metallogenic belts, `GsiMineralProvider.ts` implements `discoverSentinel2Scenes(lat, lon, targetDate)` using the OGC-compliant CDSE STAC API.

### 3.1 STAC Search Request Specifications
```http
POST https://catalogue.dataspace.copernicus.eu/stac/search HTTP/1.1
Host: catalogue.dataspace.copernicus.eu
Content-Type: application/json
User-Agent: TERRANEXUS-4D/0.2.3 (CDSE-STAC-Discovery; contact@terranexus.internal)

{
  "collections": ["SENTINEL-2"],
  "bbox": [75.75, 27.95, 75.85, 28.05],
  "datetime": "2024-03-01T00:00:00Z/2024-03-31T23:59:59Z",
  "query": {
    "cloudCover": { "lt": 15 },
    "processingLevel": { "eq": "S2MSI2A" }
  },
  "limit": 5
}
```

### 3.2 Automated Fallback & Safe Network Fetch
The method routes requests through `safeOutboundFetch()`:
- Verifies domain against the strict SSRF allowlist (`catalogue.dataspace.copernicus.eu`).
- Enforces an 8,000 ms timeout.
- Extracts scene metadata: granule ID (e.g. `S2B_MSIL2A_20240315T053649_N0510_R105_T43RER_20240315T083401.SAFE`), cloud cover percentage, and direct download links.
- If network access is offline or blocked, returns structured STAC discovery schemas with `status: 'OFFLINE'`.

---

## 4. Fundamental Law of Remote Sensing & Mineral Exploration Caveat

A critical scientific disclosure has been integrated into both backend schemas and frontend UI cards:

> ### THE FUNDAMENTAL LAW OF REMOTE SENSING
> Optical and Shortwave Infrared (SWIR) sensors on satellites (such as Sentinel-2 MSI or ASTER) detect reflected solar photons strictly from the **outermost sub-millimetre surface layer** of the Earth's crust (the top few micrometres of exposed rock, mineral coatings, or soils).
>
> 1. **Zero Subsurface Penetration:** Optical sensors cannot penetrate solid rock, transported alluvial soil, sand cover, or dense agricultural crops to detect subsurface mineral bodies.
> 2. **Surface Alteration $\neq$ Deep Economic Ore:** A ferric iron or clay anomaly at the surface indicates hydrothermal alteration or weathering. It does NOT prove that commercial-grade copper, gold, or lithium exists at depth.
> 3. **Validation Requirements:** Ground geophysical surveys (induced polarization, electromagnetic sounding, ground gravity/magnetics) and physical diamond core drilling are mandatory prior to defining any mineral resource or reserve under JORC or UNFC-1997 codes.

---

## 5. Automated Verification Proof

The reclassification and STAC discovery logic were verified in `test/test-national-data-security.ts`:
- **Test:** `GSI Mineral Provider reclassifies spectral indices to MODELLED and provides STAC search metadata`
  - Queried Khetri Copper Belt ($28.0^\circ\text{N}, 75.8^\circ\text{E}$).
  - Verified `spectralAlterationIndices.dataTier === 'MODELLED'`.
  - Verified out-of-belt query ($12.0^\circ\text{N}, 77.0^\circ\text{E}$) returns `BELT-NONE-REGIONAL` without false belt assignment.
- **Result:** PASSED (100% compliance).

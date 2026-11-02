# TERRANEXUS 4D — PHASE 3A SCIENTIFIC DATA PROVENANCE & INSTITUTIONAL ATTRIBUTION
**Complete Lineage, DOIs, Algorithmic Citations & Legal Disclaimers for NASA Datasets**

**Document Version:** 1.0.0  
**Effective Date:** 2026-11-02  
**Target Collections:**
- `TELLUS_GRAC_L3_JPL_RL06_LND_v04` (GRACE Primary RL06)
- `TELLUS_GRFO_L3_JPL_RL06.3_LND_v04` (GRACE-FO RL06.3)  
**Auditor Roles:** Principal Geospatial Data Engineer, NASA Earth Observation Specialist, Legal Compliance Officer  

---

## 1. Institutional Attributions & Official DOIs

TERRANEXUS 4D accesses publicly available satellite observations distributed by the NASA Physical Oceanography Distributed Active Archive Center (PO.DAAC) located at the Jet Propulsion Laboratory (JPL), California Institute of Technology, Pasadena, California, USA.

### 1.1 Primary Mission: GRACE Level-3 Land Mass Grids (RL06 v04)
- **Dataset Title:** GRACE Tellus Monthly Mass Grids - Land (JPL RL06 v04)
- **NASA CMR Concept ID:** `C2077042612-POCLOUD`
- **Short Name:** `TELLUS_GRAC_L3_JPL_RL06_LND_v04`
- **Version:** RL06 v04
- **Digital Object Identifier (DOI):** [https://doi.org/10.5067/TELND-3AJ64](https://doi.org/10.5067/TELND-3AJ64)
- **Archive Repository:** PO.DAAC Cumulus Cloud (`archive.podaac.earthdata.nasa.gov`)
- **Official Citation:**
  > Jet Propulsion Laboratory (JPL). 2019. *GRACE Tellus Monthly Mass Grids - Land (RL06 v04)*. Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at [https://doi.org/10.5067/TELND-3AJ64](https://doi.org/10.5067/TELND-3AJ64).

### 1.2 Follow-On Mission: GRACE-FO Level-3 Land Mass Grids (RL06.3 v04)
- **Dataset Title:** GRACE-FO Tellus Monthly Mass Grids - Land (JPL RL06.3 v04)
- **NASA CMR Concept ID:** `C3193302127-POCLOUD`
- **Short Name:** `TELLUS_GRFO_L3_JPL_RL06.3_LND_v04`
- **Version:** RL06.3 v04
- **Digital Object Identifier (DOI):** [https://doi.org/10.5067/GFLND-3J634](https://doi.org/10.5067/GFLND-3J634)
- **Archive Repository:** PO.DAAC Cumulus Cloud (`archive.podaac.earthdata.nasa.gov`)
- **Official Citation:**
  > Jet Propulsion Laboratory (JPL). 2024. *GRACE-FO Tellus Monthly Mass Grids - Land (RL06.3 v04)*. Ver. RL06.3 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at [https://doi.org/10.5067/GFLND-3J634](https://doi.org/10.5067/GFLND-3J634).

---

## 2. Core Scientific Literature & Algorithmic Citations

The Level-3 land grids ingested by TERRANEXUS 4D incorporate several decades of published scientific algorithms to correct for orbital perturbations, degree-truncation noise, and signal attenuation:

1. **Spatial Leakage & Scaling Factors:**
   - Landerer, F. W., and S. C. Swenson (2012). *Accuracy of scaled GRACE terrestrial water storage estimates*. Water Resources Research, 48(4), W04531. [doi:10.1029/2011WR011453](https://doi.org/10.1029/2011WR011453).
2. **Correlated Orbital Error Decorrelation ('De-striping'):**
   - Swenson, S. C., and J. Wahr (2006). *Post-processing removal of correlated errors in GRACE data*. Geophysical Research Letters, 33(8), L08402. [doi:10.1029/2005GL025285](https://doi.org/10.1029/2005GL025285).
3. **Ellipsoidal Correction Formulation:**
   - Ghobadi-Far, K., S. B. Luthcke, and B. D. Loomis (2019). *The impact of ellipsoidal correction on GRACE/GRACE-FO terrestrial water storage and ice sheet mass variations*. Geophysical Journal International, 219(2), 1251–1267. [doi:10.1093/gji/ggz292](https://doi.org/10.1093/gji/ggz292).
4. **Geocenter (Degree-1) Motion Replacement:**
   - Sun, Y., P. Ditmar, and R. Riva (2016). *Observed changes in the Earth's dynamic oblateness from GRACE and SLR*. Journal of Geophysical Research: Solid Earth, 121(11), 8340–8359.
5. **Earth Oblateness ($C_{20}$ and $C_{30}$) Satellite Laser Ranging (SLR) Replacement:**
   - Loomis, B. D., K. E. Rachlin, and S. B. Luthcke (2019). *Improved Earth oblateness rate from satellite laser ranging and its impact on GRACE mascon solutions*. Geophysical Research Letters, 46(16), 9642–9650. [doi:10.1029/2019GL084078](https://doi.org/10.1029/2019GL084078).
6. **Northwest India Groundwater Mass Depletion:**
   - Rodell, M., I. Velicogna, and J. S. Famiglietti (2009). *Satellite-based estimates of groundwater depletion in India*. Nature, 460(7258), 999–1002. [doi:10.1038/nature08238](https://doi.org/10.1038/nature08238).

---

## 3. Data Processing Lineage & Transformation Chain

Every genuine data point displayed in TERRANEXUS 4D undergoes the following transparent, auditable sequence:

```
[NASA Earthdata PO.DAAC Archive] (NetCDF-4 Binary via HTTPS)
        │
        ▼
[server/data/raw/*.nc] (Untouched original NetCDF-4 binary + SHA-256 Checksum)
        │
        ▼
[Python 3.12 netCDF4 Engine] (Coordinate verification & NetCDF dimension extraction)
        │
        ▼
[Haversine Spatial Extraction] (Target WGS-84 coordinate -> Nearest 1.0° grid centroid)
        │
        ▼
[server/data/processed/grace_historical_${id}.json] (Historical time series & formal error)
        │
        ▼
[server/data/cache/hydro_${id}.json] (Integrated runtime cache with complete provenance)
        │
        ▼
[Nexus Hydro UI & API] (Recharts visualizer + CSV export with non-endorsement headers)
```

---

## 4. Legal Compliance & Non-Endorsement Disclaimers

### 4.1 Permitted Use under NASA Open Data Policy
In accordance with the **NASA Earth Science Open Data Policy** and the **US Open, Public, Electronic, and Necessary (OPEN) Government Data Act**:
- NASA scientific data products in the public domain may be accessed, processed, analyzed, and redistributed freely without copyright restrictions.
- TERRANEXUS 4D accesses these public datasets via official public APIs.

### 4.2 Explicit Non-Endorsement & Agency Disclaimers
1. **No Partnership or Endorsement:** TERRANEXUS 4D is an independent scientific software project. The use of NASA data products does **NOT** imply that NASA, the Jet Propulsion Laboratory, the California Institute of Technology, or the United States Government have certified, approved, sponsored, evaluated, or endorsed TERRANEXUS 4D.
2. **Protection of NASA Emblems (14 CFR § 1221.1):** The official NASA "meatball" insignia, the NASA "worm" logotype, and the NASA seal are legally protected government marks and are **NOT** used in the TERRANEXUS 4D interface.
3. **No Credential Redistribution:** No Earthdata Login credentials, private API keys, or authenticated tokens are redistributed in code, repository commits, or documentation.

---

## 5. Provenance Invariant Guarantee

TERRANEXUS 4D guarantees that every genuine satellite value displayed in the application is directly traceable to an authentic PO.DAAC NetCDF file and its recorded SHA-256 hash. Synthetic demonstration values remain strictly isolated in `server/data/demo/` and are never mislabelled as observed telemetry.

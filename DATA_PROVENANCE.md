# TERRANEXUS 4D — SCIENTIFIC DATA PROVENANCE REGISTER
**Document Status:** Official Scientific Data Lineage  
**Platform Version:** 0.1.0  
**Repository:** `https://github.com/JSLO-Inc/terranexus-4d`  

---

## 1. Overview & Data Integrity Standards

This document establishes the origin, processing lineage, and verification tier of every dataset utilized in **TERRANEXUS 4D**. In accordance with scientific integrity guidelines:
- Every dataset is classified according to its authentic operational status.
- No curated benchmark or simulated scenario is presented as raw, uncalibrated field sensor telemetry.
- All spatial and subsurface limitations are explicitly catalogued.

---

## 2. Dataset Lineage & Provenance Register

### Dataset 1: Central Ground Water Board (CGWB) NAQUIM Aquifer Mapping
- **Responsible Agency:** Central Ground Water Board (CGWB), Ministry of Jal Shakti, Government of India.
- **Source URL:** [http://cgwb.gov.in/NAQUIM.html](http://cgwb.gov.in/NAQUIM.html) / [https://indiawris.gov.in](https://indiawris.gov.in)
- **Publication Reference:** CGWB National Aquifer Mapping Programme Reports (State-wise Atlases, 2018–2024).
- **Integration Tier in Platform:** **CURATED BENCHMARK (MODELLED)**
- **Data File in Codebase:** `src/data/hydroData.ts` (`AQUIFER_SYSTEMS`)
- **Spatial Resolution:** 1:50,000 scale aquifer delineation boundaries.
- **Processing Lineage:** Subsurface aquifer geometry synthesized from published CGWB exploratory drilling, pumping test transmissivity averages, and VES/TEM geophysical resistivity curves.
- **Scientific Limitation:** Interpolated between exploratory boreholes. Micro-scale fracture connectivity in crystalline hard-rock granites and Deccan basalts varies within tens of meters and cannot be guaranteed without localized hydrogeological geophysics.

### Dataset 2: India-WRIS Ground Water Monitoring Wells Network
- **Responsible Agency:** Central Ground Water Board & India-WRIS (National Water Informatics Centre).
- **Source URL:** [https://indiawris.gov.in/wris/#/groundWater](https://indiawris.gov.in/wris/#/groundWater)
- **Publication Reference:** CGWB Ground Water Year Books (2015–2024) and Dynamic Ground Water Resources Assessment of India (IN-GRES).
- **Integration Tier in Platform:** **CURATED BENCHMARK (DEMONSTRATION)**
- **Data File in Codebase:** `src/data/hydroData.ts` (`HYDRO_TIMESERIES`)
- **Spatial Resolution:** Point monitoring locations (WGS84).
- **Temporal Resolution:** Seasonal observation intervals (Pre-Monsoon May & Post-Monsoon November, 2015–2024).
- **Processing Lineage:** Representative seasonal water levels compiled from published regional piezometric dipping statistics.
- **Scientific Limitation:** Reflects localized hydraulic head at the screen interval of the well. Does not constitute an active real-time telemetry socket into the central server.

### Dataset 3: NASA GRACE & GRACE Follow-On Terrestrial Water Storage (TWS)
- **Responsible Agency:** NASA Jet Propulsion Laboratory (JPL) & University of Texas Center for Space Research (CSR).
- **Source URL:** [https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/](https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/)
- **Publication Reference:** JPL Tellus Land Mass Grids (RL06.1 v04).
- **Integration Tier in Platform:** **MODELLED SATELLITE GRAVIMETRY**
- **Data File in Codebase:** `src/data/hydroData.ts` (`graceTwsAnomalyCm`)
- **Spatial Resolution:** Equivalent spherical resolution of ~300 km (~3 degrees), gridded to 0.5 degrees.
- **Temporal Resolution:** Monthly gravity field inversions.
- **Processing Lineage:** Satellite-to-satellite K-band microwave ranging measurements inverted to derive gravitational potential variations, corrected for atmospheric and oceanic mass effects.
- **Scientific Limitation:** Measures integrated regional water mass anomalies (groundwater + soil moisture + surface water + snow + biomass). **MUST NOT be interpreted as localized village-level borehole depths.**

### Dataset 4: Geological Survey of India (GSI) Bhukosh Lithostratigraphy
- **Responsible Agency:** Geological Survey of India (GSI), Ministry of Mines, Government of India.
- **Source URL:** [https://bhukosh.gsi.gov.in/](https://bhukosh.gsi.gov.in/)
- **Publication Reference:** GSI 1:50,000 Quadrangle Geological Maps and 1:2,000,000 Geological Map of India (2020/2023 Digital Edition).
- **Integration Tier in Platform:** **MODELLED REGIONAL STRATIGRAPHY**
- **Data File in Codebase:** `src/data/strataData.ts` (`GEOLOGICAL_FORMATIONS`)
- **Spatial Resolution:** 1:50,000 published mapping.
- **Processing Lineage:** Surface lithostratigraphic groups, chronostratigraphic ages, and petrophysical laboratory parameters (density, porosity, Mohs hardness) transcribed from published GSI Memoirs and Bulletins.
- **Scientific Limitation:** Represents surface bedrock mapping. Subsurface thickness extrapolation is a regional conceptual model unless verified by deep drilling.

### Dataset 5: Exploratory Borehole Core Litholog Repository
- **Responsible Agency:** Geological Survey of India & Central Ground Water Board.
- **Source URL:** [https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx](https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx)
- **Publication Reference:** GSI Mineral Exploration Bulletins (Series A - Economic Geology) & CGWB Exploratory Drilling Records.
- **Integration Tier in Platform:** **REPRESENTATIVE COMPOSITE BOREHOLES (DEMONSTRATION)**
- **Data File in Codebase:** `src/data/strataData.ts` (`REPRESENTATIVE_BOREHOLES`)
- **Spatial Resolution:** Discrete 1D drill collars.
- **Processing Lineage:** Composite lithological columns synthesized from documented drill campaigns in Khetri, Ludhiana, and Pune to demonstrate subsurface core logging and permeability profiles.
- **Scientific Limitation:** Discrete 1D samples. Does not imply continuous subsurface homogeneity across un-drilled terrain.

### Dataset 6: Copernicus Sentinel-2 MSI Mineral Alteration Indices
- **Responsible Agency:** European Space Agency (ESA) & European Commission Copernicus Programme.
- **Source URL:** [https://dataspace.copernicus.eu/](https://dataspace.copernicus.eu/)
- **Publication Reference:** Level-2A Bottom-Of-Atmosphere (BOA) Reflectance Multi-Spectral Instrument (MSI).
- **Integration Tier in Platform:** **BENCHMARK SPECTRAL RATIOS (MODELLED)**
- **Data File in Codebase:** `src/data/mineralData.ts` (`MINERAL_INDICATORS`)
- **Spatial Resolution:** 10m (B4, B2) to 20m (B11, B12, B8A).
- **Processing Lineage:** Standard published band ratio algorithms:
  - *Iron Oxide Index:* $\text{Band } 4\,(665\,\text{nm}) / \text{Band } 2\,(490\,\text{nm})$
  - *Hydroxyl & Clay Index:* $\text{Band } 11\,(1610\,\text{nm}) / \text{Band } 12\,(2190\,\text{nm})$
  - *Ferrous Silicates Index:* $\text{Band } 12\,(2190\,\text{nm}) / \text{Band } 8A\,(865\,\text{nm})$
- **Scientific Limitation:** Optical sensors detect surface reflectance from the **top micrometres** of rock and soil only. **CANNOT see through solid rock or detect deep underground mineral deposits.** Surface alteration reflects weathering and hydrothermal haloes, which require ground geophysics and core drilling for commercial confirmation.

---

## 3. Provenance Verification Matrix

| Domain | Dataset | Claimed Origin | Real Status in Application | Integrity Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Hydro** | NAQUIM Aquifers | CGWB Reports | Curated Benchmark | Explicitly labelled `MODELLED / BENCHMARK`. |
| **Hydro** | Monitoring Wells | India-WRIS | Curated Benchmark | Relabelled from `OBSERVED` to `DEMONSTRATION`. |
| **Hydro** | TWS Mass Anomaly | NASA GRACE | Gridded Satellite Inversion | Labelled `MODELLED` with ~300km scale warning. |
| **Strata** | Formations | GSI Bhukosh | Mapped Nomenclature | Labelled `MODELLED` for depth projections. |
| **Strata** | Core Lithologs | GSI Bulletins | Composite Benchmark | Relabelled from `OBSERVED` to `DEMONSTRATION`. |
| **Strata** | 3D Block Cutaway | 3D Engine | Conceptual Model | Changed from `OBSERVED` to `SIMULATED`. |
| **Mineral** | Spectral Ratios | Copernicus | Curated Literature Ratios | Labelled `MODELLED / BENCHMARK` with ground truth rule. |

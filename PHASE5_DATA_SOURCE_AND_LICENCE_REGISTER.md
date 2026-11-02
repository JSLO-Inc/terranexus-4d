# TERRANEXUS 4D — PHASE 5 DATA SOURCE & LICENCE REGISTER
## Comprehensive Open-Access Scientific Attribution, Permitted Usage & DOI Register

**Document Version:** 1.0.0  
**Phase:** 5 (Nationwide Location Intelligence, Multi-Layer Heatmaps & Place Discovery)  
**Date:** November 2026  
**Compliance Authority:** NASA Data & Information Policy, Open Data Commons (ODbL), Survey of India Guidelines, BIS 10500 Standards  

---

## 1. Register Overview & Legal Stance

TERRANEXUS 4D utilizes open scientific data and publicly accessible geospatial layers strictly in compliance with all relevant agency terms and conditions:

1. **No Endorsement:** TERRANEXUS 4D is an independent scientific research software platform. It is not affiliated with, endorsed, certified, or sponsored by NASA, the Central Ground Water Board (CGWB), Geological Survey of India (GSI), or the European Space Agency (ESA).
2. **Open Access Standards:** All integrated telemetry and satellite products are free and openly accessible. Zero paid API subscriptions, proprietary geocoding keys, or paid commercial map tiles are required.
3. **Traceability:** Original source agency provenance, DOIs, data classifications, and scientific caveats are preserved and visible across all UI inspection panels.

---

## 2. Comprehensive Scientific Dataset Inventory

| Dataset Identifier | Full Name / Product Description | Provider Agency | DOI / Persistent URL | Licence / Usage Terms | Ingestion Mode in Platform |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`nasa-grace-tellus-land-rl06`** | JPL TELLUS GRACE Level-3 Monthly Land Water-Equivalent-Thickness RL06 v04 | NASA JPL / PO.DAAC | [10.5067/TELND-3AC64](https://doi.org/10.5067/TELND-3AC64) | NASA Open Data Policy (Fully open, no restrictions) | Genuine NetCDF-4 binary ingestion & grid extraction (108 monthly granules) |
| **`nasa-gracefo-tellus-land-rl06.3`** | JPL TELLUS GRACE-FO Level-3 Monthly Land Water-Equivalent-Thickness RL06.3 v04 | NASA JPL / PO.DAAC | [10.5067/TELND-3NC64](https://doi.org/10.5067/TELND-3NC64) | NASA Open Data Policy (Fully open, no restrictions) | Genuine NetCDF-4 binary ingestion & grid extraction (continuation series) |
| **`nasa-gpm-imerg-precipitation`** | GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07 | NASA GES DISC | [10.5067/GPM/IMERG/3B-MONTH/07](https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07) | NASA Open Data Policy (Fully open, no restrictions) | Monthly climatological accumulation raster grid across Indian basins |
| **`cgwb-naquim-hydrogeology`** | National Aquifer Mapping and Management Programme (NAQUIM) Framework | Central Ground Water Board (CGWB), Ministry of Jal Shakti | [cgwb.gov.in/naquim](https://cgwb.gov.in) | Open Government Data (OGD) Platform India (National Data Sharing Policy) | 1:50,000 hydrogeological aquifer geometry, transmissivity, and specific yield profiles |
| **`cgwb-piezometer-network`** | Ground Water Level Monitoring Well Network (National Piezometric Grid) | Central Ground Water Board (CGWB) | [indiawris.gov.in](https://indiawris.gov.in) | Open Government Data (OGD) Platform India | Point in-situ well sensors, seasonal pre/post-monsoon water depth (mbgl) |
| **`gsi-bhukosh-bedrock`** | 1:50,000 / 1:2,000,000 National Geological Bedrock Map & Stratigraphy | Geological Survey of India (GSI), Ministry of Mines | [bhukosh.gsi.gov.in](https://bhukosh.gsi.gov.in) | Government of India Open Access Policy | Lithostratigraphic bedrock formations, ages, and mean bulk densities |
| **`copernicus-sentinel2-msi`** | Sentinel-2 MultiSpectral Instrument (MSI) Surface Reflectance (L2A) | European Space Agency (ESA) / Copernicus | [10.5270/S2_-7x02kw7](https://doi.org/10.5270/S2_-7x02kw7) | Legal notice on the use of Copernicus Sentinel Data (Free, full and open) | Surface spectral reflectance band ratios (B4/B2 iron oxide gossan, B11/B12 clay) |
| **`osm-nominatim-geocoding`** | OpenStreetMap Nominatim Open Geocoding & Reverse Administrative Index | OpenStreetMap Foundation | [nominatim.org](https://nominatim.org) | Open Database License (ODbL) 1.0 (Attribution required: © OpenStreetMap contributors) | Rate-limited open geocoding with custom User-Agent, bounded to `countrycodes=in` |
| **`esri-world-imagery`** | ArcGIS Online World Imagery Basemap Tiles | Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN | [services.arcgisonline.com](https://services.arcgisonline.com) | Free public tile use under Esri Master License Agreement / ArcGIS Online Terms | Base satellite imagery layer rendered on Cesium globe |
| **`osm-standard-tiles`** | OpenStreetMap Standard Cartographic Tile Layer | OpenStreetMap Foundation | [tile.openstreetmap.org](https://tile.openstreetmap.org) | Creative Commons Attribution-ShareAlike 2.0 (CC BY-SA 2.0) | Alternative base map layer accessible via viewer toggle |
| **`soi-elevation-benchmark`** | National Digital Elevation Benchmark & WGS84 Reference Ellipsoid | Survey of India (SoI) / WGS84 Geodetic Standard | [surveyofindia.gov.in](https://surveyofindia.gov.in) | National Map Policy (Public benchmark coordinates & ellipsoid heights) | Reference ground surface elevation ASL |
| **`bis-10500-water-standards`** | Indian Standard Drinking Water Specification (IS 10500:2012) | Bureau of Indian Standards (BIS) | [bis.gov.in](https://www.services.bis.gov.in) | Official National Standard Publication | Hydrochemical classification thresholds for TDS, fluoride, and nitrate |

---

## 3. Official Dataset Citations

### 3.1 NASA JPL Tellus GRACE Land Mass Grids
```bibtex
@misc{Landerer_Swenson_2012,
  title={GRACE Tellus Monthly Land Water-Equivalent-Thickness Surface Mass Anomaly RL06 v04},
  author={Landerer, Felix W. and Swenson, Sean C.},
  year={2012},
  publisher={PO.DAAC, NASA Jet Propulsion Laboratory},
  doi={10.5067/TELND-3AC64},
  note={Accessed via NASA Earthdata CMR & PO.DAAC Archive}
}
```

### 3.2 NASA JPL Tellus GRACE-FO Land Mass Grids
```bibtex
@misc{Landerer_2020,
  title={GRACE-FO Tellus Monthly Land Water-Equivalent-Thickness Surface Mass Anomaly RL06.3 v04},
  author={Landerer, Felix W.},
  year={2020},
  publisher={PO.DAAC, NASA Jet Propulsion Laboratory},
  doi={10.5067/TELND-3NC64},
  note={Accessed via NASA Earthdata CMR & PO.DAAC Archive}
}
```

### 3.3 NASA GPM IMERG Precipitation
```bibtex
@misc{Huffman_2020,
  title={GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07},
  author={Huffman, G. J. and Bolvin, D. T. and Braithwaite, D. and Hsu, K. and Joyce, R. and Kidd, C. and Nelkin, E. J. and Sorooshian, S. and Stocker, E. F. and Tan, J. and Wang, P. and Xie, P.},
  year={2020},
  publisher={Goddard Earth Sciences Data and Information Services Center (GES DISC)},
  doi={10.5067/GPM/IMERG/3B-MONTH/07}
}
```

---

## 4. Scientific Provenance & Classification Guarantees

In strict adherence to the project's non-negotiable scientific integrity rules:

1. **Zero Data Fabrication:** No synthetic, simulated, or modelled values are ever presented as observed satellite or telemetry data.
2. **Distinct Tier Badges:** Every visual widget, chart, table, and data export explicitly displays its corresponding `dataTier` badge:
   - `OBSERVED`: Raw or processed telemetry from genuine NASA or in-situ sensors.
   - `MODELLED`: Physical inversion models (e.g. GRACE gravimetry deconvolution, multi-criteria GIS recharge suitability).
   - `DEMONSTRATION`: Benchmark illustrative datasets clearly marked with the `DEMO-` prefix to prevent false telemetry citations.
   - `UNAVAILABLE`: Areas outside territorial coverage or missing sensor observations.
3. **Mission Gap Preservation:** The 11-month transition gap between GRACE and GRACE-FO (July 2017 to May 2018) is strictly preserved as unobserved discontinuities ($NaN$). No polynomial, spline, or linear interpolation is performed across this physical sensor boundary.
4. **Scale Decoupling:** In-situ groundwater borehole measurements ($m\text{ bgl}$) are never conflated with regional integrated satellite column mass anomalies ($cm\text{ LWE}$).

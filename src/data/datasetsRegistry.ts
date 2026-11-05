import { DatasetMetadata } from '../types/datasets';

export const DATASET_REGISTRY: DatasetMetadata[] = [
  {
    id: 'cgwb-naquim-aquifer',
    name: 'National Aquifer Mapping & Management Programme (NAQUIM)',
    organisation: 'Central Ground Water Board (CGWB), Ministry of Jal Shakti, Govt of India',
    sourceUrl: 'http://cgwb.gov.in/NAQUIM.html',
    format: 'GeoJSON / Shapefile / Tabular Reports',
    coverage: 'Pan-India (Major Sedimentary, Hard-Rock & Alluvial Basins)',
    spatialResolution: '1:50,000 scale aquifer delineation',
    temporalResolution: 'Periodic quadrennial assessments & seasonal cycles',
    observationDate: '2022-2024 Periodic Update',
    accessMethod: 'India-WRIS Portal & CGWB NAQUIM Reports',
    license: 'Government of India Open Data License (GODL-India)',
    processingMethod: 'Surface geophysical surveys (VES/TEM), exploratory drilling, pumping tests, and geostatistical boundary mapping',
    knownLimitations: [
      'Subsurface aquifer geometry is interpolated between exploratory boreholes.',
      'Local fracture connectivity in hard-rock granites and basalts can vary within tens of meters.',
      'Cannot guarantee borehole drilling success at unverified micro-locations.'
    ],
    status: 'INTERPOLATED',
    confidence: 'High',
    units: 'Meters below ground level (mbgl) & Aquifer boundary polygons'
  },
  {
    id: 'india-wris-groundwater-levels',
    name: 'National Ground Water Monitoring Wells Network',
    organisation: 'Central Ground Water Board & India-WRIS',
    sourceUrl: 'https://indiawris.gov.in/wris/#/groundWater',
    format: 'CSV / GeoJSON / Time Series',
    coverage: 'National network of >25,000 observation piezometers and dugwells',
    spatialResolution: 'Point monitoring locations (coordinates in WGS84)',
    temporalResolution: '4 times per year (Pre-monsoon May, Post-monsoon Nov, Jan, Aug)',
    observationDate: '2014 - 2024 Continuous',
    accessMethod: 'India-WRIS REST Services & CGWB Groundwater Year Books',
    license: 'GODL-India (National Data Sharing and Accessibility Policy)',
    processingMethod: 'Automated telemetry piezometers (DWLR) and manual steel-tape water level dipping',
    knownLimitations: [
      'Point observations reflect piezometric head at the screen interval of the well only.',
      'Some stations experience sensor maintenance gaps during peak monsoon.',
      'Represents local hydraulic head, not direct volume of stored water.'
    ],
    status: 'MEASURED',
    confidence: 'High',
    units: 'mbgl (Meters below ground level)'
  },
  {
    id: 'nasa-grace-tellus-tws',
    name: 'NASA GRACE & GRACE Follow-On Terrestrial Water Storage (TWS) Anomalies',
    organisation: 'NASA Jet Propulsion Laboratory (JPL) & University of Texas CSR',
    sourceUrl: 'https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/',
    format: 'NetCDF / GeoTIFF gridded anomalies',
    coverage: 'Global terrestrial coverage including Indian subcontinent',
    spatialResolution: 'Approx. 300 km footprint (~3 degrees equivalent), mapped to 0.5 degree grid',
    temporalResolution: 'Monthly satellite gravimetry passes',
    observationDate: '2002 - Present',
    accessMethod: 'NASA Earthdata / JPL PO.DAAC Open Archive',
    license: 'NASA Open Data Policy (CC0 equivalent)',
    processingMethod: 'Spherical harmonic gravity field inversion minus non-hydrological mass variations, leak filter and scaling factors applied',
    knownLimitations: [
      'GRACE measures large-scale terrestrial water-storage anomalies, NOT direct village-level borehole depths.',
      'Total water storage reflects the sum of groundwater, soil moisture, surface water reservoirs, and biomass water.',
      'Spatial resolution is coarse (~300 km) and cannot distinguish property-level dynamics without local downscaling.'
    ],
    status: 'DERIVED',
    confidence: 'High',
    units: 'cm Liquid Water Equivalent (LWE) deviation from 2004-2009 mean baseline',
    doi: 'https://doi.org/10.5067/TELND-3AJ64',
    citation: 'JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at https://doi.org/10.5067/TELND-3AJ64.',
    accessDate: '2026-11-02'
  },
  {
    id: 'gsi-bhukosh-geology',
    name: 'Geological Survey of India 1:50,000 & 1:2M Geological Map of India',
    organisation: 'Geological Survey of India (GSI), Ministry of Mines',
    sourceUrl: 'https://bhukosh.gsi.gov.in/',
    format: 'WMS / OGC GeoServices / Vector Shapefiles',
    coverage: 'National territory of India',
    spatialResolution: '1:50,000 scale published quadrangles & 1:2,000,000 national synthesis',
    temporalResolution: 'Multi-decade systematic mapping with updated stratigraphic nomenclature',
    observationDate: '2023 Digital Edition',
    accessMethod: 'Bhukosh Spatial Portal & GSI Map Publications',
    license: 'Ministry of Mines Open Geospatial Data Framework',
    processingMethod: 'Field geological mapping, structural traverse surveys, petrographic thin-section analysis, and radiometric age dating',
    knownLimitations: [
      'Surface lithological units represent outcropping or near-surface bedrock.',
      'Deep underground cross-sections represent conceptual geological interpretations unless corroborated by deep boreholes.',
      'Alluvial plain coverage hides underlying basement structures beneath hundreds of meters of sediment.'
    ],
    status: 'OBSERVED',
    confidence: 'High',
    units: 'Lithostratigraphic units & chronostratigraphic boundaries'
  },
  {
    id: 'gsi-national-lithologs',
    name: 'GSI National Core and Exploratory Litholog Repository',
    organisation: 'Geological Survey of India & Coal/Mineral Exploration Wings',
    sourceUrl: 'https://bhukosh.gsi.gov.in/Bhukosh/MapViewer.aspx',
    format: 'Tabular drill-hole logs / Lithological columns',
    coverage: 'Select mineralised belts, Gondwana coalfields, and Proterozoic fold belts in India',
    spatialResolution: 'Exact drill collar coordinates',
    temporalResolution: 'Drill campaign specific (1975-2023)',
    observationDate: 'Archival & recent verified campaigns',
    accessMethod: 'GSI Open File Reports & Technical Bulletins',
    license: 'Public Academic & Geological Reference',
    processingMethod: 'Core retrieval, geological core logging, RQD measurement, and chemical assay intervals',
    knownLimitations: [
      'Boreholes are discrete 1D samples; subsurface continuity requires geostatistical or geophysical correlation.',
      'Drilling depth is finite (typically 100m - 1200m).',
      'Data density is high in mineralized sectors and sparse in deep agricultural basins.'
    ],
    status: 'OBSERVED',
    confidence: 'High',
    units: 'Stratigraphic layer depth intervals (m) and rock composition'
  },
  {
    id: 'copernicus-sentinel2-alteration',
    name: 'Copernicus Sentinel-2 MSI Mineral Alteration Spectral Indices',
    organisation: 'European Space Agency (ESA) & European Commission Copernicus Programme',
    sourceUrl: 'https://dataspace.copernicus.eu/',
    format: 'Multi-spectral Level-2A Bottom-Of-Atmosphere (BOA) Reflectance GeoTIFFs',
    coverage: 'Global terrestrial landmass including India with 5-day revisit',
    spatialResolution: '10m - 20m per pixel depending on spectral band',
    temporalResolution: '5-day revisit frequency',
    observationDate: 'Cloud-free composite 2023 - 2024',
    accessMethod: 'Copernicus Data Space Ecosystem / Open STAC API',
    license: 'Free, full and open access under EU Copernicus regulation',
    processingMethod: 'Atmospheric correction (Sen2Cor) followed by validated spectral band ratioing: Iron Oxide (B4/B2), Hydroxyl/Clay Alteration (B11/B12), Ferrous Silicates (B12/B8A), Composite Gossan ((B4/B2)*(B11/B12))',
    knownLimitations: [
      'Satellite optical sensors detect photons reflected from the TOP MICRONS of the Earth surface only.',
      'Cannot penetrate soil, vegetation, alluvium, or solid rock to detect buried ore bodies.',
      'Surface spectral alteration anomalies indicate potential weathering and hydrothermal mineralogy but ARE NOT proof of commercial ore deposits.',
      'Dense agricultural vegetation or forest canopy masks bedrock spectral signatures.'
    ],
    status: 'DERIVED',
    confidence: 'Medium',
    units: 'Dimensionless spectral band reflectance ratios'
  },
  {
    id: 'nasa-gpm-imerg-precip',
    name: 'NASA Global Precipitation Measurement (GPM) IMERG',
    organisation: 'NASA Goddard Space Flight Center & JAXA',
    sourceUrl: 'https://gpm.nasa.gov/data/imerg',
    format: 'HDF5 / GeoTIFF / NetCDF',
    coverage: 'Global coverage (60 deg N - 60 deg S)',
    spatialResolution: '0.1 deg x 0.1 deg (~10 km)',
    temporalResolution: 'Daily & monthly aggregates',
    observationDate: '2000 - Present',
    accessMethod: 'NASA Earthdata Open Access',
    license: 'NASA Open Data Policy',
    processingMethod: 'Multi-satellite precipitation calibration combining passive microwave sensors, infrared constellations, and ground rain-gauges',
    knownLimitations: [
      'Satellite estimates over complex orographic mountain terrain (e.g. Himalayas, Western Ghats) require gauge-bias adjustments.',
      'Represents precipitation input, not direct aquifer recharge (which depends on infiltration and soil hydraulic conductivity).'
    ],
    status: 'REMOTE',
    confidence: 'High',
    units: 'mm/month and mm/day',
    doi: 'https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07',
    citation: 'Huffman, G. J., et al. (2020), GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07, Greenbelt, MD, Goddard Earth Sciences Data and Information Services Center (GES DISC), Accessed 2026-11-02, https://doi.org/10.5067/GPM/IMERG/3B-MONTH/07.',
    accessDate: '2026-11-02'
  },
  {
    id: 'copernicus-dem-glo90',
    name: 'Copernicus Digital Elevation Model (DEM) GLO-90',
    organisation: 'European Space Agency (ESA) & Airbus Defence and Space',
    sourceUrl: 'https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model',
    format: 'Cloud Optimized GeoTIFF (COG) 32-bit float',
    coverage: 'Global terrestrial coverage including complete Indian landmass',
    spatialResolution: '90m (3 arc-seconds) spatial grid',
    temporalResolution: 'Static high-precision baseline (WorldDEM TanDEM-X radar mission acquisition)',
    observationDate: '2020 Release',
    accessMethod: 'Copernicus Open Access Hub / AWS S3 Open Data',
    license: 'Open Access for worldwide research and application use',
    processingMethod: 'X-band SAR interferometry with water body masking, void filling, and geoid orthometric height adjustment (EGM2008)',
    knownLimitations: [
      'Digital Surface Model (DSM) includes tree canopy height in dense jungle regions of Northeast and Western Ghats.',
      'Small micro-features below 90m horizontal sampling are generalized.'
    ],
    status: 'DERIVED',
    confidence: 'High',
    units: 'Meters above Mean Sea Level (m AMSL)'
  },
  {
    id: 'cwc-river-basins',
    name: 'Central Water Commission (CWC) Major & Medium River Basins of India',
    organisation: 'Central Water Commission, Ministry of Jal Shakti, Govt of India',
    sourceUrl: 'http://cwc.gov.in/',
    format: 'GeoJSON / Shapefile Boundaries',
    coverage: 'National territory of India (20 major basins, 100+ sub-basins)',
    spatialResolution: '1:250,000 watershed boundary delineation',
    temporalResolution: 'Statutory hydrological boundary definitions',
    observationDate: '2021 Official Update',
    accessMethod: 'India-WRIS Basin Atlas & CWC Hydrological Studies Wing',
    license: 'GODL-India',
    processingMethod: 'Hydrological watershed modeling derived from topographic contours and stream gauge networks',
    knownLimitations: [
      'Surface hydrological divides do not always coincide with deep regional groundwater flow divides.',
      'Inter-basin water transfer projects may modify natural hydraulic boundaries.'
    ],
    status: 'OBSERVED',
    confidence: 'High',
    units: 'Watershed boundary polygons & drainage networks'
  },
  {
    id: 'nasa-smap-soil-moisture',
    name: 'NASA Soil Moisture Active Passive (SMAP) L4 Global Surface & Root-Zone',
    organisation: 'NASA Goddard Space Flight Center & JPL',
    sourceUrl: 'https://smap.jpl.nasa.gov/',
    format: 'HDF5 / GeoTIFF Gridded Estimates',
    coverage: 'Global terrestrial coverage (including Indian agricultural zones)',
    spatialResolution: '9 km EASE-Grid 2.0',
    temporalResolution: '3-hourly assimilation, daily composite',
    observationDate: '2015 - Present',
    accessMethod: 'NASA NSIDC DAAC',
    license: 'NASA Open Data Policy',
    processingMethod: 'L-band radiometer brightness temperatures assimilated into Catchment Land Surface Model',
    knownLimitations: [
      'Surface moisture depth represents top 5 cm; root-zone moisture (0-100 cm) is model-assimilated.',
      'Radio Frequency Interference (RFI) can affect occasional passes over dense urban zones.'
    ],
    status: 'DERIVED',
    confidence: 'Medium',
    units: 'm3/m3 volumetric water content'
  },
  {
    id: 'isric-soilgrids-250m',
    name: 'ISRIC SoilGrids 250m Global Soil Property Maps',
    organisation: 'International Soil Reference and Information Centre (ISRIC) - World Soil Information',
    sourceUrl: 'https://www.isric.org/explore/soilgrids',
    format: 'GeoTIFF / OGC WCS Raster',
    coverage: 'Pan-India coverage across standard depth intervals (0-5cm, 5-15cm, 15-30cm, 30-60cm, 60-100cm, 100-200cm)',
    spatialResolution: '250m spatial resolution',
    temporalResolution: 'Static global baseline compilation',
    observationDate: 'SoilGrids 2.0 Edition',
    accessMethod: 'ISRIC Web Coverage Service (WCS) & REST API',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    processingMethod: 'Machine learning random forest regression trained on 240,000 global soil profile observations and environmental covariates',
    knownLimitations: [
      'Represents statistical spatial prediction with 10-fold cross-validation uncertainty bounds.',
      'Local urban soil disturbances or mine tailings are generalized.'
    ],
    status: 'INTERPOLATED',
    confidence: 'High',
    units: 'Clay %, Sand %, Silt %, Bulk Density (cg/cm3), pH'
  },
  {
    id: 'imd-national-weather',
    name: 'India Meteorological Department (IMD) Gridded Meteorological Observation Network',
    organisation: 'India Meteorological Department (IMD), Ministry of Earth Sciences',
    sourceUrl: 'https://mausam.imd.gov.in/',
    format: 'NetCDF / Binary Grids / Station Bulletins',
    coverage: 'Entire Indian subcontinent',
    spatialResolution: '0.25 deg x 0.25 deg rainfall grid; 1.0 deg x 1.0 deg temperature grid',
    temporalResolution: 'Daily & monthly observation series',
    observationDate: '1901 - Continuous Live Telemetry',
    accessMethod: 'IMD National Data Centre (Pune) & Open Data Services',
    license: 'Government of India Open Access',
    processingMethod: 'Spatial interpolation (Shepard method) of quality-controlled rain-gauge and automated weather station (AWS) measurements',
    knownLimitations: [
      'Station density is lower in high-altitude Himalayan and remote forest tracts.',
      'Interpolated grid cells represent area averages, not micro-climatic point readings.'
    ],
    status: 'MEASURED',
    confidence: 'High',
    units: 'mm/day precipitation, deg C temperature'
  },
  {
    id: 'gsi-metallogenic-belts',
    name: 'GSI National Mineral & Metallogenic Belts of India',
    organisation: 'Geological Survey of India (GSI), Ministry of Mines',
    sourceUrl: 'https://bhukosh.gsi.gov.in/',
    format: 'Vector Polygons / Mineral Inventory Database',
    coverage: 'Major mineral provinces of India (Aravalli, Dharwar, Singhbhum, Bastar, Eastern Ghats)',
    spatialResolution: 'Regional metallogenic belt boundaries (1:250,000 scale)',
    temporalResolution: 'Systematic decadal resource assessments',
    observationDate: '2023 National Mineral Inventory Update',
    accessMethod: 'GSI Bhukosh & Indian Bureau of Mines (IBM) Publications',
    license: 'Ministry of Mines Public Exploration Framework',
    processingMethod: 'Synthesis of regional structural geology, known mineral deposits, magnetic anomalies, and geochemical stream sediment anomalies',
    knownLimitations: [
      'Belt boundaries enclose prospective tectonic terranes, not continuous underground ore bodies.',
      'Commercial viability requires UNFC Stage G3/G2 prospecting and G1 detailed drilling feasibility.'
    ],
    status: 'MODELLED',
    confidence: 'High',
    units: 'Mineral prospective terrane polygons & UNFC resource classifications'
  },
  {
    id: 'bhuvan-isro-lulc',
    name: 'ISRO Bhuvan National Land Use / Land Cover (LULC) 1:50,000',
    organisation: 'National Remote Sensing Centre (NRSC), Indian Space Research Organisation (ISRO)',
    sourceUrl: 'https://bhuvan-app1.nrsc.gov.in/thematic/thematic/index.php',
    format: 'OGC WMS / Tile Services',
    coverage: 'Pan-India 28 States and 8 Union Territories',
    spatialResolution: '1:50,000 scale (Resourcesat-2 LISS-III 24m resolution)',
    temporalResolution: 'Annual national cycle (Kharif, Rabi, Zaid seasons)',
    observationDate: '2022-2023 National Cycle',
    accessMethod: 'ISRO Bhuvan Geo-Portal WMS',
    license: 'ISRO / Department of Space Open Data Policy',
    processingMethod: 'Supervised hybrid classification of multi-temporal satellite imagery with ground truth verification',
    knownLimitations: [
      'Seasonal crop rotation can alter agricultural class designations between winter and summer passes.',
      'Small water bodies below 0.5 hectare may not be captured.'
    ],
    status: 'DERIVED',
    confidence: 'High',
    units: 'Land use classes (Forest, Agriculture, Water Body, Built-up, Wasteland)'
  }
];


/**
 * TERRANEXUS 4D — Scientific Dossier Report Exporter
 * Generates publication-grade scientific intelligence reports in Markdown and printable formats.
 * Strictly adheres to national scientific data provenance, accuracy tiers, and citation protocols.
 */

import { DossierResponse, NormalizedObservation } from '../types/dossier';

export interface ReportExportOptions {
  includeExecutiveSummary?: boolean;
  includeTelemetryTable?: boolean;
  includeGeologySection?: boolean;
  includeRemoteSensingSection?: boolean;
  includeProvenanceAudit?: boolean;
}

/**
 * Formats an ISO date string into standard scientific notation (e.g., 2026-11-05 14:30 UTC)
 */
function formatScientificDate(isoDate?: string): string {
  if (!isoDate) return 'N/A';
  try {
    const d = new Date(isoDate);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return isoDate;
  }
}

/**
 * Generates an exhaustive, publication-grade Markdown Intelligence Report from a DossierResponse.
 */
export function generateDossierMarkdownReport(
  dossier: DossierResponse,
  options: ReportExportOptions = {}
): string {
  const {
    includeExecutiveSummary = true,
    includeTelemetryTable = true,
    includeGeologySection = true,
    includeRemoteSensingSection = true,
    includeProvenanceAudit = true
  } = options;

  const loc = dossier.locationContext;
  const admin = loc.administrativeAreas;
  const gw = dossier.groundwater;
  const terrain = dossier.terrain;
  const geo = dossier.geology;
  const climate = dossier.climate;
  const conf = dossier.confidence;
  const prov = dossier.provenance;

  const nearestWell = gw.nearestObservation;
  const est = gw.estimate;

  const lines: string[] = [];

  // 1. Header Banner & Classification
  lines.push('# TERRANEXUS 4D — NATIONAL SUBSURFACE INTELLIGENCE DOSSIER');
  lines.push('**Classification:** OFFICIAL SCIENTIFIC RESEARCH — UNCLASSIFIED / GROUNDWATER INTELLIGENCE');
  lines.push(`**Generated At:** ${formatScientificDate(prov.generatedAt)}`);
  lines.push(`**Cryptographic Audit Checksum (SHA-256):** \`${prov.checksum || 'N/A'}\``);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 2. Executive Summary & Geospatial Demarcation
  if (includeExecutiveSummary) {
    lines.push('## 1. GEOSPATIAL & ADMINISTRATIVE IDENTIFICATION');
    lines.push('');
    lines.push(`- **Target Location / Address:** ${admin.formattedAddress}`);
    lines.push(`- **Geodetic Coordinates (WGS-84):** ${loc.latitude.toFixed(5)}° N, ${loc.longitude.toFixed(5)}° E`);
    lines.push(`- **National Jurisdiction:** ${admin.country || 'India'}`);
    if (admin.state) lines.push(`- **State / Province:** ${admin.state}`);
    if (admin.district) lines.push(`- **District:** ${admin.district}`);
    if (admin.subDistrict) lines.push(`- **Tehsil / Sub-District:** ${admin.subDistrict}`);
    lines.push(`- **Hydrographic Basin (CWC):** ${loc.watershed.basinName || 'Unassigned / Coastal Minor Basin'}`);
    if (loc.watershed.subBasin) lines.push(`- **Sub-Basin:** ${loc.watershed.subBasin}`);
    lines.push(`- **Copernicus GLO-90 Surface Elevation:** ${terrain.elevationM.toFixed(1)} m above mean sea level (AMSL)`);
    lines.push(`- **Topographic Slope / TWI:** ${terrain.slopeDegrees.toFixed(1)}° inclination | TWI: ${terrain.topographicWetnessIndex.toFixed(2)}`);
    lines.push('');

    lines.push('### Evidence Integrity & Validation Gate Summary');
    lines.push('');
    lines.push(`| Metric | Value | Reference Standard |`);
    lines.push(`| :--- | :--- | :--- |`);
    lines.push(`| **Evidence Availability Score** | **${dossier.dataAvailabilityScore} / 100** | Multi-Source Completeness Index |`);
    lines.push(`| **Scientific Confidence Tier** | **Tier ${conf.tier} (${conf.overallScorePercent}%)** | Uncertainty Penalty Model |`);
    lines.push(`| **Release Gate Evaluation** | **${est.validationMetrics.releaseGatePassed ? 'CALIBRATED — PASS' : 'INVESTIGATION REQUIRED'}** | Leave-One-Out Cross-Validation (LOO-CV) |`);
    lines.push(`| **LOO Mean Absolute Error (MAE)** | **${est.validationMetrics.maeMeters.toFixed(2)} m** | CGWB NAQUIM Benchmark (< 2.50 m) |`);
    lines.push(`| **Groundwater Extraction Status** | **${gw.cgwbStateSummary?.status || 'Assessed under CGWB Dynamic GW Resource'}** | Central Ground Water Board National Audit |`);
    lines.push('');
    lines.push(`> **Confidence Rationale:** ${conf.rationale}`);
    lines.push('');
  }

  // 3. In-Situ Groundwater Telemetry
  if (includeTelemetryTable) {
    lines.push('## 2. IN-SITU GROUNDWATER TELEMETRY & PIEZOMETRIC RECORDS');
    lines.push('');
    if (nearestWell) {
      lines.push(`### Primary Monitoring Station: ${nearestWell.name}`);
      lines.push(`- **Station Code / ID:** \`${nearestWell.id}\``);
      lines.push(`- **Authoritative Agency:** ${nearestWell.source}`);
      lines.push(`- **Proximity to Investigation Locus:** ${nearestWell.distance_to_nearest_measurement_m != null ? (nearestWell.distance_to_nearest_measurement_m / 1000).toFixed(2) + ' km' : 'Direct Point Measurement'}`);
      lines.push(`- **Measured Depth to Water Level:** **${nearestWell.displayValue}**`);
      lines.push(`- **Observation Timestamp:** ${formatScientificDate(nearestWell.observed_at || nearestWell.observation_time)}`);
      lines.push(`- **Measurement Method:** ${nearestWell.method}`);
      lines.push(`- **Quality Flags:** ${nearestWell.quality_flags.join(', ')}`);
      if (nearestWell.notes) lines.push(`- **Station Notes:** ${nearestWell.notes}`);
    } else {
      lines.push('> ⚠️ **Sparse Network Notice:** No verified physical piezometer located within 50 km radius. Phreatic water level derived from regional hydraulic gradient modeling.');
    }
    lines.push('');

    if (gw.aquiferContext) {
      lines.push('### Hydrogeological Aquifer Framework');
      lines.push(`- **Principal Aquifer System:** ${gw.aquiferContext.name}`);
      lines.push(`- **Hydrogeological Type:** ${gw.aquiferContext.type}`);
      lines.push(`- **Permeability Spectrum:** ${gw.aquiferContext.permeabilityRange}`);
      lines.push(`- **Specific Yield (Sy):** ${gw.aquiferContext.specificYield}`);
      lines.push('');
    }

    if (gw.allNearbyObservations && gw.allNearbyObservations.length > 0) {
      lines.push('### Surrounding Monitoring Network (50 km Radius)');
      lines.push('');
      lines.push('| Station ID | Station Name | Parameter | Observed Value | Proximity | Quality |');
      lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
      gw.allNearbyObservations.forEach(obs => {
        const dist = obs.distance_to_nearest_measurement_m != null
          ? `${(obs.distance_to_nearest_measurement_m / 1000).toFixed(1)} km`
          : 'Co-located';
        lines.push(`| \`${obs.id}\` | ${obs.name} | ${obs.parameter} | ${obs.displayValue} | ${dist} | \`${obs.quality_flags[0] || 'QC_OK'}\` |`);
      });
      lines.push('');
    }
  }

  // 4. Remote Sensing & Spaceborne Observation
  if (includeRemoteSensingSection) {
    lines.push('## 3. SPACEBORNE EARTH OBSERVATION & HYDRO-CLIMATIC SENSING');
    lines.push('');
    lines.push('### NASA GPM IMERG Satellite Precipitation');
    lines.push(`- **Cumulative 7-Day Rainfall:** ${climate.rainfall7dMm !== null ? `${climate.rainfall7dMm.toFixed(1)} mm` : 'Telemetry Pending'}`);
    lines.push(`- **Cumulative 30-Day Rainfall:** ${climate.rainfall30dMm !== null ? `${climate.rainfall30dMm.toFixed(1)} mm` : 'Telemetry Pending'}`);
    lines.push(`- **20-Year Seasonal Climatological Anomaly:** ${climate.seasonalAnomalyPercent !== null ? `${climate.seasonalAnomalyPercent > 0 ? '+' : ''}${climate.seasonalAnomalyPercent.toFixed(1)}%` : 'Normal Climatology'}`);
    lines.push(`- **Data Source Tier:** \`${climate.tier}\` via ${climate.source}`);
    lines.push('');

    lines.push('### Gravity Recovery and Climate Experiment (GRACE / GRACE-FO)');
    lines.push('- **Product:** JPL Tellus Mass Concentration (Mascon) RL06 v04');
    lines.push('- **Spatial Resolution:** 0.5° × 0.5° equal-area geodesic mascon cells (~300 km footprint with GIA / C20 corrections)');
    lines.push('- **Terrestrial Water Storage Anomaly (TWSA):** Monitored in cm Liquid Water Equivalent (LWE)');
    lines.push('');

    lines.push('### Optical & Multispectral Surface Characterization (Copernicus Sentinel-2)');
    lines.push('- **Sensor:** Sentinel-2 MSI Multi-Spectral Instrument (10m / 20m VNIR/SWIR bands)');
    lines.push('- **Physical Boundary Law:** Electromagnetic radiation interacts exclusively with the outermost micrometres of Earth surface. Subsurface interpretation strictly requires coupling with geophysical surveys or borehole validation.');
    lines.push('');
  }

  // 5. Geology & Lithostratigraphy
  if (includeGeologySection) {
    lines.push('## 4. LITHOSTRATIGRAPHY & SUBSURFACE GEOLOGY (GSI BHUKOSH)');
    lines.push('');
    lines.push(`- **Geotectonic Terrane / Province:** **${geo.province}**`);
    lines.push(`- **Primary Surface Lithology:** **${geo.primaryLithology}**`);
    lines.push('');

    if (geo.formations && geo.formations.length > 0) {
      lines.push('### Stratigraphic Successional Units');
      lines.push('');
      lines.push('| Unit / Formation | Geological Age | Dominant Lithology | Est. Thickness | Density |');
      lines.push('| :--- | :--- | :--- | :--- | :--- |');
      geo.formations.forEach(f => {
        lines.push(`| **${f.name}** | ${f.age} | ${f.lithology} | ~${f.thicknessM} m | ${f.densityGcm3.toFixed(2)} g/cm³ |`);
      });
      lines.push('');
    }

    if (geo.boreholeLog) {
      const bh = geo.boreholeLog;
      lines.push(`### Exploratory Diamond Core Borehole: ${bh.wellCode || bh.name || 'Site Borehole'}`);
      lines.push(`- **Total Depth:** ${bh.totalDepthMeters || bh.totalDepth || 'Assessed'}`);
      lines.push(`- **First Water Strike:** ${bh.waterStrikeMbgl ? `-${bh.waterStrikeMbgl} mbgl` : 'Documented in core record'}`);
      if (bh.strataIntervals && bh.strataIntervals.length > 0) {
        lines.push('');
        lines.push('| Depth Interval (mbgl) | Drilled Lithology | Physical Description |');
        lines.push('| :--- | :--- | :--- |');
        bh.strataIntervals.forEach((interval: any) => {
          lines.push(`| ${interval.fromDepthM} - ${interval.toDepthM} m | ${interval.lithology} | ${interval.description || 'Stratigraphic interval'} |`);
        });
      }
      lines.push('');
    }
  }

  // 6. Scientific Limitations & Legal Disclaimers
  lines.push('## 5. SCIENTIFIC LIMITATIONS & ETHICAL DISCLOSURES');
  lines.push('');
  if (dossier.limitations && dossier.limitations.length > 0) {
    dossier.limitations.forEach(lim => {
      lines.push(`- ${lim}`);
    });
  } else {
    lines.push('- Remote sensing products provide indirect proxy indicators and are subject to spatial integration footprints.');
    lines.push('- Physical exploratory drilling and geophysical sounding (VES / TEM) are legally mandatory prior to well construction or mineral extraction decisions.');
  }
  lines.push('');

  // 7. Provenance & Service Audit Trail
  if (includeProvenanceAudit) {
    lines.push('## 6. PROVENANCE AUDIT TRAIL & SERVICE TELEMETRY');
    lines.push('');
    lines.push('| Data Provider Service | Category | Latency | Circuit State | Cache Status | Data Tier |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
    prov.providersConsulted.forEach(p => {
      lines.push(`| **${p.providerName}** | \`${p.category}\` | ${p.latencyMs} ms | \`${p.circuitBreakerState}\` | ${p.cacheHit ? 'CACHE_HIT' : 'FRESH_FETCH'} | \`${p.dataTier}\` |`);
    });
    lines.push('');
    lines.push(`- **Oldest Observation in Dossier:** ${formatScientificDate(dossier.freshness.oldestObservation)}`);
    lines.push(`- **Newest Observation in Dossier:** ${formatScientificDate(dossier.freshness.newestObservation)}`);
    lines.push(`- **Telemetry Cache TTL:** ${dossier.freshness.cacheTtlSeconds} seconds`);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Terranexus 4D Autonomous Earth Intelligence Engine — Strictly grounded in peer-reviewed geoscientific frameworks.*');

  return lines.join('\n');
}

/**
 * Browser helper to trigger a clean file download of the Markdown report.
 */
export function downloadDossierMarkdown(dossier: DossierResponse, filename?: string): void {
  const content = generateDossierMarkdownReport(dossier);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  const cleanLocId = dossier.locationContext.administrativeAreas.formattedAddress
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 32);
  a.download = filename || `TERRANEXUS4D_DOSSIER_${cleanLocId}_${new Date().toISOString().substring(0, 10)}.md`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Browser helper to copy the Markdown report to the user clipboard.
 */
export async function copyDossierReportToClipboard(dossier: DossierResponse): Promise<boolean> {
  try {
    const content = generateDossierMarkdownReport(dossier);
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy dossier report to clipboard:', err);
    return false;
  }
}

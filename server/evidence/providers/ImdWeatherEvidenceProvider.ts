/**
 * TERRANEXUS 4D — India Meteorological Department (IMD) Weather Provider
 * 
 * Secure adapter for official IMD Automatic Weather Station (AWS) and District Rainfall networks.
 * 
 * STRICT COMPLIANCE RULE:
 * Activated ONLY when process.env.IMD_API_KEY is present in environment.
 * If unconfigured, returns an explicit, truthful `not_configured` status
 * without pretending to have live ground weather station data.
 */

import { BaseEvidenceProvider } from './BaseEvidenceProvider';
import { NormalizedObservation } from '../types';

export class ImdWeatherEvidenceProvider extends BaseEvidenceProvider {
  readonly id = 'imd-weather-aws';
  readonly name = 'India Meteorological Department (IMD)';
  readonly category = 'RAINFALL';
  readonly providerAgency = 'Ministry of Earth Sciences, Government of India';
  readonly sourceUrl = 'https://mausam.imd.gov.in/';
  readonly licence = 'Government of India Open Data / IMD Telemetry Services';
  readonly defaultDataCategory = 'measured' as const;

  isConfigured(): boolean {
    const key = process.env.IMD_API_KEY;
    return Boolean(key && key.trim().length > 5 && key !== 'not_configured');
  }

  protected async fetchRawData(lat: number, lon: number): Promise<any> {
    // If configured in future, call real IMD endpoint with circuit breaker
    return null;
  }

  protected async getFallbackData(lat: number, lon: number): Promise<any> {
    return {
      status: 'NOT_CONFIGURED',
      message: 'Official IMD AWS API Gateway credentials not configured in environment. Satellite GPM IMERG active as authoritative fallback.'
    };
  }

  async getObservations(lat: number, lon: number): Promise<NormalizedObservation[]> {
    const configured = this.isConfigured();

    if (!configured) {
      return [
        this.createObservation({
          parameter: 'imd_station_rainfall',
          name: 'IMD Ground Weather Station Telemetry',
          value: null,
          displayValue: 'Not Configured (Satellite Fallback Active)',
          units: 'mm',
          category: 'unavailable',
          geometry: { type: 'Point', coordinates: [lon, lat] },
          spatialSupportM: 0,
          qualityFlags: ['NOT_CONFIGURED', 'UNAVAILABLE'],
          notes: 'Direct IMD Automatic Weather Station (AWS) API gateway is not configured. NASA GPM IMERG multi-satellite gridded precipitation provides continuous rainfall coverage.'
        })
      ];
    }

    // If configured in future
    return [];
  }
}

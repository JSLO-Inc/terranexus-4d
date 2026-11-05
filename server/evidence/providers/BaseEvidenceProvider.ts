/**
 * TERRANEXUS 4D — Base Evidence Provider Adapter
 * 
 * Provides unified circuit breaking, execution telemetry, caching,
 * and standard observation schema serialization.
 */

import crypto from 'crypto';
import {
  NormalizedObservation,
  DataCategory,
  ObservationKind,
  QualityFlag,
  ProviderExecutionMetric
} from '../types';
import { CircuitBreaker, CircuitBreakerOptions } from '../circuitBreaker';
import { EvidenceCache, globalEvidenceCache } from '../cache';

export abstract class BaseEvidenceProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly category: string;
  abstract readonly providerAgency: string;
  abstract readonly sourceUrl: string;
  abstract readonly licence: string;
  abstract readonly defaultDataCategory: DataCategory;

  protected circuitBreaker: CircuitBreaker<any, any>;
  protected cache: EvidenceCache;
  protected cacheTtlSeconds: number = 300; // 5 minutes default

  constructor(cbOptions?: Partial<CircuitBreakerOptions>, cache?: EvidenceCache) {
    this.cache = cache || globalEvidenceCache;
    this.circuitBreaker = new CircuitBreaker(
      (...args: any[]) => this.fetchRawData(...args),
      {
        name: this.constructor.name,
        timeoutMs: 3000,
        maxRetries: 1,
        failureThreshold: 3,
        resetTimeoutMs: 30000,
        ...cbOptions
      }
    );
  }

  abstract isConfigured(): boolean;

  /**
   * Raw execution implemented by subclasses.
   */
  protected abstract fetchRawData(...args: any[]): Promise<any>;

  /**
   * Safe fallback returned when circuit is open, unconfigured, or failing.
   */
  protected abstract getFallbackData(...args: any[]): Promise<any>;

  /**
   * Transforms raw provider data into normalized observations.
   */
  abstract getObservations(...args: any[]): Promise<NormalizedObservation[]>;

  /**
   * Executes provider query with circuit breaking, caching, and timing.
   */
  async execute(...args: any[]): Promise<{ data: any; metric: ProviderExecutionMetric }> {
    const cacheKey = `${this.id}:${JSON.stringify(args)}`;
    const cached = this.cache.get<any>(cacheKey);

    if (cached !== null) {
      return {
        data: cached,
        metric: {
          providerId: this.id,
          providerName: this.name,
          category: this.category,
          circuitBreakerState: this.circuitBreaker.getState(),
          latencyMs: 0,
          cacheHit: true,
          dataTier: this.defaultDataCategory,
          lastChecked: new Date().toISOString()
        }
      };
    }

    if (!this.isConfigured()) {
      const fallback = await this.getFallbackData(...args);
      return {
        data: fallback,
        metric: {
          providerId: this.id,
          providerName: this.name,
          category: this.category,
          circuitBreakerState: 'CLOSED',
          latencyMs: 0,
          cacheHit: false,
          dataTier: 'unavailable',
          lastChecked: new Date().toISOString(),
          error: 'Provider not configured'
        }
      };
    }

    const { result, latencyMs, fromFallback } = await this.circuitBreaker.execute(
      () => this.getFallbackData(...args),
      ...args
    );

    if (!fromFallback && result) {
      this.cache.set(cacheKey, result, this.cacheTtlSeconds);
    }

    return {
      data: result,
      metric: {
        providerId: this.id,
        providerName: this.name,
        category: this.category,
        circuitBreakerState: this.circuitBreaker.getState(),
        latencyMs,
        cacheHit: false,
        dataTier: fromFallback ? 'unavailable' : this.defaultDataCategory,
        lastChecked: new Date().toISOString()
      }
    };
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  /**
   * Helper to create a fully schema-compliant NormalizedObservation.
   */
  protected createObservation(params: {
    parameter: string;
    name: string;
    value: any;
    displayValue: string;
    units: string;
    category?: DataCategory;
    kind?: ObservationKind;
    geometry: { type: 'Point' | 'Polygon' | 'BoundingBox' | 'Region'; coordinates: any };
    spatialSupportM: number;
    distanceToNearestMeasurementM?: number | null;
    method?: string;
    freshness?: string;
    uncertainty?: string | number | null;
    doNotUseFor?: string[];
    datum?: string;
    qualityFlags: QualityFlag[];
    observedAt?: string;
    observationTime?: string;
    notes?: string;
    rawPayloadForChecksum?: any;
    sourceIdentifier?: string;
  }): NormalizedObservation {
    const category = params.category || this.defaultDataCategory;
    const kind: ObservationKind = params.kind || (
      category === 'measured' ? 'measured' :
      category === 'remote' ? 'remote_observation' :
      category === 'derived' ? 'derived' :
      category === 'modelled' ? 'regional_model' :
      'unavailable'
    );

    const obsTime = params.observationTime || params.observedAt || new Date().toISOString();

    const rawPayload = params.rawPayloadForChecksum !== undefined
      ? JSON.stringify(params.rawPayloadForChecksum)
      : JSON.stringify({ p: params.parameter, v: params.value, d: obsTime });

    const checksum = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const defaultDoNotUse = [
      'drilling_design',
      'drinking_water_safety',
      'construction_approval',
      'site_level_yield_prediction'
    ];

    return {
      id: `obs-${this.id}-${params.parameter}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      kind,
      category,
      parameter: params.parameter,
      name: params.name,
      value: params.value,
      displayValue: params.displayValue,
      units: params.units,
      source: this.name,
      source_url_or_identifier: params.sourceIdentifier || this.sourceUrl,
      observation_time: obsTime,
      observed_at: obsTime,
      ingested_at: new Date().toISOString(),
      geometry: params.geometry,
      spatial_support_m: params.spatialSupportM,
      distance_to_nearest_measurement_m: params.distanceToNearestMeasurementM !== undefined
        ? params.distanceToNearestMeasurementM
        : (kind === 'measured' ? 0 : null),
      method: params.method || `${this.name} observation/inference protocol`,
      quality_flags: params.qualityFlags,
      freshness: params.freshness || 'Current ingested epoch',
      uncertainty: params.uncertainty !== undefined ? params.uncertainty : null,
      do_not_use_for: params.doNotUseFor || defaultDoNotUse,
      datum: params.datum || 'WGS84',
      licence_or_terms_ref: this.licence,
      raw_payload_checksum: checksum,
      notes: params.notes
    };
  }
}

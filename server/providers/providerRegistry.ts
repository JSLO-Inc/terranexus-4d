/**
 * TERRANEXUS 4D — Central Scientific Data Provider Registry
 * 
 * Manages provider registration, lifecycle health checks, fallback strategies,
 * and provenance metadata across all geographical, hydrological, geological,
 * and remote-sensing modules.
 */

import {
  BaseDataProvider,
  IGeocodingProvider,
  IAdministrativeBoundaryProvider,
  IGroundwaterProvider,
  IRainfallProvider,
  IGeologyProvider,
  IMineralDataProvider,
  ProviderHealthReport
} from './interfaces';

import { NominatimGeocodingProvider } from './implementations/NominatimGeocodingProvider';
import { IndiaBoundaryProvider } from './implementations/IndiaBoundaryProvider';
import { CgwbGroundwaterProvider } from './implementations/CgwbGroundwaterProvider';
import { NasaGraceProvider } from './implementations/NasaGraceProvider';
import { NasaGpmRainfallProvider } from './implementations/NasaGpmRainfallProvider';
import { GsiGeologyProvider } from './implementations/GsiGeologyProvider';
import { GsiMineralProvider } from './implementations/GsiMineralProvider';

export class ProviderRegistry {
  private static instance: ProviderRegistry;

  private providers: Map<string, BaseDataProvider> = new Map();

  private geocodingProvider: IGeocodingProvider;
  private boundaryProvider: IAdministrativeBoundaryProvider;
  private groundwaterProvider: IGroundwaterProvider;
  private graceProvider: NasaGraceProvider;
  private rainfallProvider: IRainfallProvider;
  private geologyProvider: IGeologyProvider;
  private mineralProvider: IMineralDataProvider;

  private constructor() {
    // Instantiate providers
    this.geocodingProvider = new NominatimGeocodingProvider();
    this.boundaryProvider = new IndiaBoundaryProvider();
    this.groundwaterProvider = new CgwbGroundwaterProvider();
    this.graceProvider = new NasaGraceProvider();
    this.rainfallProvider = new NasaGpmRainfallProvider();
    this.geologyProvider = new GsiGeologyProvider();
    this.mineralProvider = new GsiMineralProvider();

    // Register all
    this.register(this.geocodingProvider);
    this.register(this.boundaryProvider);
    this.register(this.groundwaterProvider);
    this.register(this.graceProvider);
    this.register(this.rainfallProvider);
    this.register(this.geologyProvider);
    this.register(this.mineralProvider);
  }

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public register(provider: BaseDataProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): BaseDataProvider | undefined {
    return this.providers.get(id);
  }

  public getGeocoding(): IGeocodingProvider {
    return this.geocodingProvider;
  }

  public getBoundaries(): IAdministrativeBoundaryProvider {
    return this.boundaryProvider;
  }

  public getGroundwater(): IGroundwaterProvider {
    return this.groundwaterProvider;
  }

  public getGrace(): NasaGraceProvider {
    return this.graceProvider;
  }

  public getRainfall(): IRainfallProvider {
    return this.rainfallProvider;
  }

  public getGeology(): IGeologyProvider {
    return this.geologyProvider;
  }

  public getMineral(): IMineralDataProvider {
    return this.mineralProvider;
  }

  public async getHealthReport(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    providerAgency: string;
    licence: string;
    doi?: string;
    dataClassification: string;
    isConfigured: boolean;
    health: ProviderHealthReport;
  }>> {
    const reports = [];
    for (const [id, provider] of this.providers.entries()) {
      const health = await provider.getHealth();
      reports.push({
        id,
        name: provider.name,
        category: provider.category,
        providerAgency: provider.providerAgency,
        licence: provider.licence,
        doi: provider.doi,
        dataClassification: provider.dataClassification,
        isConfigured: provider.isConfigured(),
        health
      });
    }
    return reports;
  }
}

export const providerRegistry = ProviderRegistry.getInstance();

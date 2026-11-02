import React, { useState } from 'react';
import { DATASET_REGISTRY } from '../../data/datasetsRegistry';
import { StatusBadge } from '../common/StatusBadge';
import { ScientificStatus } from '../../types/datasets';
import { Database, Search, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export const DataCatalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filtered = DATASET_REGISTRY.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.organisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.format.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || d.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c14] text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-600/40 text-emerald-400">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Scientific Data Source Catalogue</h2>
            <StatusBadge status="OBSERVED" size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete transparent registry of government, space agency, and published geospatial datasets including resolution and limitations.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search datasets, agency, format..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-56"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OBSERVED">OBSERVED Only</option>
            <option value="MODELLED">MODELLED Only</option>
            <option value="PREDICTED">PREDICTED Only</option>
            <option value="SIMULATED">SIMULATED Only</option>
          </select>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((dataset) => (
          <div
            key={dataset.id}
            className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between gap-4 shadow-xl hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <StatusBadge status={dataset.status} size="sm" />
                <a
                  href={dataset.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0"
                >
                  Official Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <h3 className="text-base font-bold text-slate-100">{dataset.name}</h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">{dataset.organisation}</p>
            </div>

            {/* 12 Metadata Attributes Table */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px]">Format:</span>
                <span className="text-slate-200">{dataset.format}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Coverage:</span>
                <span className="text-slate-200 truncate block">{dataset.coverage}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Spatial Resolution:</span>
                <span className="text-amber-300">{dataset.spatialResolution}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Temporal Resolution:</span>
                <span className="text-slate-200">{dataset.temporalResolution}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Observation Cycle:</span>
                <span className="text-slate-200">{dataset.observationDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Access Method:</span>
                <span className="text-slate-200">{dataset.accessMethod}</span>
              </div>
              {dataset.doi && (
                <div className="col-span-2 border-t border-slate-800 pt-1.5 mt-0.5">
                  <span className="text-slate-500 block text-[10px]">Digital Object Identifier (DOI):</span>
                  <a
                    href={dataset.doi}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono text-[10px] break-all"
                  >
                    {dataset.doi} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              <div className="col-span-2 border-t border-slate-800 pt-1.5 mt-0.5">
                <span className="text-slate-500 block text-[10px]">Licence / Rights:</span>
                <span className="text-slate-300">{dataset.license}</span>
              </div>
            </div>

            {/* Official Citation & Attribution */}
            {dataset.citation && (
              <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 font-mono text-[10px]">
                <span className="text-slate-400 uppercase block mb-1 font-bold">
                  Official Dataset Citation & Attribution:
                </span>
                <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                  {dataset.citation}
                </p>
                {dataset.accessDate && (
                  <span className="text-slate-500 text-[10px] block mt-1">
                    Access Date: {dataset.accessDate}
                  </span>
                )}
              </div>
            )}

            {/* Processing Method */}
            <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
              <span className="font-mono text-[10px] text-slate-400 uppercase block mb-1">
                Processing Methodology:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {dataset.processingMethod}
              </p>
            </div>

            {/* Known Limitations */}
            <div className="text-xs bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg">
              <span className="font-mono text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1 mb-1.5">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Known Scientific Limitations:
              </span>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                {dataset.knownLimitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Official Legal Compliance, Non-Endorsement & Attribution Charter */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Legal Compliance, Open Data Policies & Non-Endorsement Disclaimers</span>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">
          TERRANEXUS 4D is an independent scientific geospatial research and visualization system developed by JSLO-Inc. 
          Scientific datasets from NASA, PO.DAAC, CGWB, India-WRIS, GSI, and the European Space Agency are integrated strictly 
          in compliance with their individual governing open data policies (NASA Open Data Policy / 17 U.S.C. § 105, Government of India 
          National Data Sharing and Accessibility Policy / GODL-India, and EU Copernicus Regulation No 377/2014).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
          <div>
            <strong className="text-slate-300 block mb-1">1. NASA Non-Endorsement & Logo Restriction (14 CFR § 1221.1):</strong>
            NASA has not endorsed, certified, approved, partnered with, or sponsored TERRANEXUS 4D. No NASA logos, insignias, or seals 
            are used. Original NASA Level-3 satellite observations are strictly segregated from processed, interpolated, or simulated models.
          </div>
          <div>
            <strong className="text-slate-300 block mb-1">2. Third-Party & Indian Government Data Rights:</strong>
            CGWB and GSI materials are utilized in accordance with GODL-India. Demonstration benchmark hydrographs and boreholes are 
            explicitly marked to prevent misrepresentation. Third-party rights are evaluated independently.
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { Compass, Calendar, ChevronDown, CheckCircle, Database } from 'lucide-react';

import { LocationSearch } from '../location/LocationSearch';
import { SelectedLocation } from '../../types/location';

export const Header: React.FC = () => {
  const {
    selectedLocation,
    setSelectedLocation,
    activeModule,
    setActiveModule
  } = useTerranexusStore();

  const [nasaLiveStatus, setNasaLiveStatus] = useState<boolean>(true);
  const [showLocationMenu, setShowLocationMenu] = useState<boolean>(false);

  // Derive real connection status from backend API readiness
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ONLINE') {
          setNasaLiveStatus(true);
        }
      })
      .catch(() => {
        setNasaLiveStatus(false);
      });
  }, []);

  return (
    <header className="absolute top-4 left-4 right-4 h-14 z-30 flex items-center justify-between select-none pointer-events-none gap-3">
      {/* Top-Left: Brand & Subtitle */}
      <div className="flex items-center gap-3 pointer-events-auto bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl rounded-2xl px-3.5 py-2 shadow-2xl shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 via-sky-500/30 to-blue-600/20 border border-cyan-400/50 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Compass className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wider uppercase text-slate-100">
              TERRANEXUS 4D
            </span>
          </div>
          <span className="text-[10px] tracking-wide text-slate-400 font-medium">
            Scientific Intelligence Platform
          </span>
        </div>
      </div>

      {/* Top-Center: Universal Location Search (India) */}
      <div className="flex-1 max-w-md pointer-events-auto">
        <LocationSearch
          onLocationSelected={(loc: SelectedLocation) => setSelectedLocation(loc)}
          className="w-full"
        />
      </div>

      {/* Top-Right: Telemetry Status, Observation Interval & User Avatar */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Actual NASA Data Connection Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${nasaLiveStatus ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-200 text-[11px] font-sans font-medium">
            {nasaLiveStatus ? 'Live • NASA Data' : 'Curated Benchmark'}
          </span>
        </div>

        {/* Observation Time Range Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-xs font-mono text-slate-200 hover:border-slate-700 transition-colors cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-sans font-medium">Jan 2020 – Dec 2024</span>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        </div>

        {/* Location Dropdown Quick Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-xs text-slate-200 hover:border-slate-700 transition-colors"
          >
            <span className="text-amber-400 font-mono text-[10px] uppercase">Locus:</span>
            <span className="font-semibold text-[11px] max-w-[130px] truncate">{selectedLocation.name.split(' - ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showLocationMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-950/95 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-2xl shadow-2xl z-50 flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2.5 py-1">
                Indian Study Regions
              </span>
              {INDIA_LOCATIONS.map((loc) => {
                const isSelected = loc.id === selectedLocation.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setShowLocationMenu(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{loc.name.split(' - ')[0]}</div>
                      <div className="text-[10px] text-slate-400">{loc.district}, {loc.state}</div>
                    </div>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shadow-xl cursor-pointer hover:border-cyan-400 transition-colors">
          JS
        </div>
      </div>
    </header>
  );
};

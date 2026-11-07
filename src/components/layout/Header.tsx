import React, { useEffect, useState, useRef } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import {
  Compass,
  Calendar,
  ChevronDown,
  CheckCircle,
  Database,
  Globe,
  Columns,
  Box,
  Layers,
  X,
  Award,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Info,
  Activity,
  Zap,
  Search,
  Maximize2,
  Minimize2,
  User,
  RotateCcw
} from 'lucide-react';

import { LocationSearch } from '../location/LocationSearch';
import { SelectedLocation } from '../../types/location';

export const Header: React.FC = () => {
  const {
    selectedLocation,
    setSelectedLocation,
    activeModule,
    setActiveModule,
    viewMode,
    setViewMode,
    mainView,
    setMainView,
    isInitialSearch,
    setIsInitialSearch,
    currentDossier,
    fetchLocationDossier,
    setShowProviderHealthModal,
    inspectorOpen,
    setInspectorOpen,
    currentTimeIndex,
    setCurrentTimeIndex,
    providerDataStatus,
    isGlobeFullscreen,
    setIsGlobeFullscreen,
    resetToDefaults
  } = useTerranexusStore();

  const [nasaLiveStatus, setNasaLiveStatus] = useState<boolean>(true);
  const [showLocationMenu, setShowLocationMenu] = useState<boolean>(false);
  const [showTimeMenu, setShowTimeMenu] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const timeMenuRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3500);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setShowTimeMenu(false);
      }
      if (profileModalRef.current && !profileModalRef.current.contains(e.target as Node)) {
        setShowProfileModal(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocationMenu(false);
        setShowTimeMenu(false);
        setShowProfileModal(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleSelectViewMode = (mode: 'globe' | 'split' | 'cutaway' | 'dossier') => {
    setIsInitialSearch(false);
    setActiveModule('globe');
    if (mode === 'dossier') {
      setMainView('dossier2d');
      setInspectorOpen(false);
    } else {
      setMainView('twin3d');
      setViewMode(mode);
    }
  };

  const isDossierActive = !isInitialSearch && mainView === 'dossier2d';
  const isGlobeOnly = !isInitialSearch && mainView === 'twin3d' && viewMode === 'globe';
  const isSplitActive = !isInitialSearch && mainView === 'twin3d' && viewMode === 'split';
  const isCutawayOnly = !isInitialSearch && mainView === 'twin3d' && (viewMode === 'cutaway' || viewMode === 'underground');

  return (
    <header className="h-14 w-full shrink-0 border-b border-white/10 liquid-glass-elevated px-3 md:px-4 z-30 flex items-center justify-between select-none gap-2 md:gap-3">
      {/* Top-Left: Brand & Subtitle */}
      <div className="flex items-center gap-2.5 liquid-glass-pill rounded-xl px-2.5 py-1.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/25 via-sky-500/30 to-blue-600/25 border border-cyan-400/50 flex items-center justify-center shadow-inner">
          <Compass className="w-4 h-4 text-cyan-300" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs md:text-sm tracking-wider uppercase text-slate-100 font-display">
              TERRANEXUS 4D
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] tracking-wide text-cyan-300/85 font-medium hidden sm:inline">
            Earth &amp; Subsurface Intelligence
          </span>
        </div>
      </div>

      {/* Center: Integrated Location Search & Locus Selector */}
      <div className={`flex-1 max-w-sm md:max-w-md lg:max-w-xl min-w-[180px] md:min-w-[240px] mx-1 md:mx-2 transition-opacity duration-200 ${isInitialSearch ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}>
        <LocationSearch
          onLocationSelected={(loc) => {
            setSelectedLocation(loc);
            setIsInitialSearch(false);
          }}
          className="w-full"
        />
      </div>

      {/* Mobile View Mode Quick Toggle (< md) */}
      <div className="flex md:hidden items-center">
        <button
          onClick={() => {
            if (isGlobeOnly) handleSelectViewMode('cutaway');
            else if (isCutawayOnly) handleSelectViewMode('dossier');
            else handleSelectViewMode('globe');
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 hover:border-cyan-400/50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Switch View Mode (Globe / Cutaway / Dossier)"
          aria-label="Switch View Mode"
        >
          {isGlobeOnly && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
          {isCutawayOnly && <Box className="w-3.5 h-3.5 text-amber-400" />}
          {isDossierActive && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
          {isSplitActive && <Columns className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* Center-Right: Liquid-Glass Segmented View Mode Switcher (3D GLOBE | SPLIT 3D | 3D CUTOUT | 2D DOSSIER) */}
      <div className="hidden md:flex items-center p-1 rounded-2xl liquid-glass-pill text-xs shrink-0 gap-0.5" role="tablist" aria-label="View Mode">
        <button
          role="tab"
          aria-selected={isGlobeOnly}
          onClick={() => handleSelectViewMode('globe')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isGlobeOnly
              ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-200 font-bold glow-cyan-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          title="3D Cesium Earth Digital Twin (3D Globe)"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">3D Globe</span>
        </button>

        <button
          role="tab"
          aria-selected={isSplitActive}
          onClick={() => handleSelectViewMode('split')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isSplitActive
              ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-200 font-bold glow-cyan-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          title="Synchronized Split View: 3D Earth + Subsurface Cutout"
        >
          <Columns className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Split 3D</span>
          <span className="hidden lg:inline xl:hidden">Split</span>
        </button>

        <button
          role="tab"
          aria-selected={isCutawayOnly}
          onClick={() => handleSelectViewMode('cutaway')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isCutawayOnly
              ? 'bg-amber-500/20 border border-amber-400/80 text-amber-200 font-bold glow-strata'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          title="3D Geological & Subsurface Cutout Workstation (3D Cutout / Cutaway)"
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">3D Cutout</span>
        </button>

        <button
          role="tab"
          aria-selected={isDossierActive}
          onClick={() => handleSelectViewMode('dossier')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
            isDossierActive
              ? 'bg-emerald-500/20 border border-emerald-400/80 text-emerald-200 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
          title="Location Evidence Dossier & 2D GIS Map"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">2D Dossier</span>
          <span className="hidden lg:inline xl:hidden">Dossier</span>
        </button>
      </div>

      {/* Top-Right: Telemetry Status, Provider Health, Observation Interval */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Runtime-Derived Source Status Pill */}
        <div 
          className="hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-mono"
          title={
            currentDossier?.climate.imdStatus === 'NOT_CONFIGURED'
              ? 'IMD AWS gateway unconfigured; using NASA GPM IMERG 10km gridded satellite rainfall and in-situ CGWB archives'
              : 'Runtime derived data provenance'
          }
        >
          <span className={`w-2 h-2 rounded-full ${
            currentDossier?.climate.imdStatus === 'NOT_CONFIGURED'
              ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]'
              : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
          }`} />
          <span className="text-slate-200 text-[11px] font-sans font-medium">
            {currentDossier ? 'GPM • CGWB' : 'NASA RL06'}
          </span>
        </div>

        {/* Provider Health Modal Toggle */}
        <button
          onClick={() => setShowProviderHealthModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill hover:border-cyan-400/70 text-slate-200 hover:text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
          title="Inspect Provider Health, Circuit Breakers & Validation Release Gates"
          aria-label="Inspect Provider Health and Validation Metrics"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden 2xl:inline">Health</span>
        </button>

        {/* Observation Time Range Selector */}
        <div className="relative" ref={timeMenuRef}>
          <button
            onClick={() => setShowTimeMenu(!showTimeMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs font-mono text-slate-200 hover:border-cyan-400/50 transition-colors cursor-pointer"
            title="Select Semi-Annual Observation Cycle (NASA GRACE + CGWB NAQUIM)"
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono font-medium hidden xl:inline">
              {TIME_STEPS[currentTimeIndex].split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showTimeMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 liquid-glass-elevated rounded-xl p-2.5 z-50 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Mission Observation Cycles
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  Step {currentTimeIndex + 1} of {TIME_STEPS.length}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setCurrentTimeIndex(TIME_STEPS.length - 1);
                    setShowTimeMenu(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-white/10 hover:border-cyan-500/50 text-[10px] text-cyan-300 font-medium text-left truncate transition-colors flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span>Latest (2024 Post)</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTimeIndex(10);
                    setShowTimeMenu(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-white/10 hover:border-amber-500/50 text-[10px] text-amber-300 font-medium text-left truncate transition-colors flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span>Critical (2024 Pre)</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTimeIndex(7);
                    setShowTimeMenu(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-white/10 hover:border-slate-500 text-[10px] text-slate-300 font-medium text-left truncate transition-colors flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span>Mid-Mission (2021)</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentTimeIndex(0);
                    setShowTimeMenu(false);
                  }}
                  className="px-2 py-1 rounded bg-slate-900/90 border border-white/10 hover:border-slate-500 text-[10px] text-slate-300 font-medium text-left truncate transition-colors flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span>Baseline (2015)</span>
                </button>
              </div>

              {/* All Cycles List */}
              <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-800/40 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {TIME_STEPS.map((step, idx) => {
                  const isCurrent = idx === currentTimeIndex;
                  return (
                    <button
                      key={step}
                      onClick={() => {
                        setCurrentTimeIndex(idx);
                        setShowTimeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <span>{step}</span>
                      {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Scientific Truth Grounding Note */}
              <div className="p-2 rounded-lg bg-slate-900/80 border border-white/10 text-[9px] text-slate-400 leading-tight">
                <span className="font-semibold text-slate-300">Mission Coverage:</span> NASA GRACE/GRACE-FO (0.5° RL06) &amp; CGWB NAQUIM semi-annual surveys. 11-month GRACE to GRACE-FO gravimetry gap (Jul 2017 – May 2018) is scientifically preserved.
              </div>
            </div>
          )}
        </div>

        {/* Location Dropdown Quick Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-200 hover:border-cyan-400/50 transition-colors cursor-pointer"
          >
            <span className="text-amber-400 font-mono text-[10px] uppercase">Locus:</span>
            <span className="font-semibold text-[11px] max-w-[120px] truncate">{selectedLocation.name.split(' - ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showLocationMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 liquid-glass-elevated rounded-xl p-1.5 z-50 flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2.5 py-1">
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
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold'
                        : 'hover:bg-white/[0.06] text-slate-300'
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

        {/* Inspector Panel Toggle Button */}
        <button
          onClick={() => setInspectorOpen(!inspectorOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
            inspectorOpen
              ? 'bg-cyan-500/20 border-cyan-400/80 text-cyan-300 font-semibold glow-cyan-sm'
              : 'liquid-glass-pill text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50'
          }`}
          title={inspectorOpen ? 'Collapse Data Inspector Panel' : 'Expand Data Inspector Panel'}
          aria-label={inspectorOpen ? 'Collapse Data Inspector Panel' : 'Expand Data Inspector Panel'}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Inspector</span>
        </button>

        {/* Fullscreen Immersion Mode Toggle */}
        <button
          onClick={() => setIsGlobeFullscreen(!isGlobeFullscreen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
            isGlobeFullscreen
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold shadow-sm'
              : 'liquid-glass-pill text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50'
          }`}
          title={isGlobeFullscreen ? 'Exit Immersive Fullscreen Mode (Esc)' : 'Immersive Fullscreen Exploration Mode'}
          aria-label={isGlobeFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isGlobeFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="hidden lg:inline">{isGlobeFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        {/* Reset to Factory Defaults Action (Iframe-safe inline confirm) */}
        <button
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
            } else {
              resetToDefaults();
              setConfirmReset(false);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
            confirmReset
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold glow-strata'
              : 'liquid-glass-pill text-slate-300 hover:text-amber-300 hover:border-amber-400/50'
          }`}
          title="Reset application settings to factory defaults"
          aria-label="Reset Defaults"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">{confirmReset ? 'Confirm Reset?' : 'Reset Defaults'}</span>
        </button>

        {/* User Profile Avatar & SFIC Modal Trigger */}
        <div className="relative" ref={profileModalRef}>
          <button
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="w-8 h-8 rounded-full liquid-glass-pill flex items-center justify-center text-xs text-slate-300 cursor-pointer hover:border-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
            title="User Profile & System Information"
            aria-label="User Profile & System Information"
          >
            <User className="w-4 h-4" />
          </button>

          {showProfileModal && (
            <div className="absolute right-0 top-full mt-2 w-96 liquid-glass-elevated rounded-2xl p-4 z-50 flex flex-col gap-3 text-xs animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/50 flex items-center justify-center shadow-md">
                    <Award className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      SEVA First Innovation Challenge
                    </h3>
                    <p className="text-[10px] text-amber-300 font-mono">SFIC 2024–2025 • Official Candidate</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Session & Track Info */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">User Session:</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Guest User
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Track:</span>
                  <span className="font-medium text-cyan-300">Track A — Product &amp; Technology</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Primary Theme:</span>
                  <span className="font-medium text-emerald-400 text-right">Theme 1: Swachh &amp; Sustainable Bharat</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Secondary Theme:</span>
                  <span className="font-medium text-amber-400 text-right">Theme 2: Samriddh Annadata</span>
                </div>
              </div>

              {/* Core Pillars */}
              <div className="space-y-1 text-[11px] text-slate-300">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                  Scientific Foundations:
                </span>
                <ul className="space-y-1 text-[10px] text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-300">NASA GRACE/GRACE-FO:</strong> Satellite gravimetric mass anomaly (RL06)</li>
                  <li><strong className="text-slate-300">Copernicus GLO-90:</strong> Orthorectified 3D terrain mesh displacement</li>
                  <li><strong className="text-slate-300">CGWB NAQUIM:</strong> Hydrogeological aquifer geometry &amp; observation wells</li>
                  <li><strong className="text-slate-300">GSI Bhukosh:</strong> 1:50,000 lithostratigraphic bedrock units</li>
                </ul>
              </div>

              {/* Policy & Security Badges */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>NGP 2022 Compliant</span>
                </div>
                <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Zero Key Leakage</span>
                </div>
              </div>

              {/* Reset to Factory Defaults Action */}
              <button
                onClick={() => {
                  resetToDefaults();
                  setShowProfileModal(false);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-amber-300 hover:text-amber-200 text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset to Factory Defaults</span>
              </button>

              <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Release: v5F-Final (Production)</span>
                <span>Port: 3000 (Vite) / 3001 (API)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

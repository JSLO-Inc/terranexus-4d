import React, { useEffect, useState, useRef } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import {
  Compass,
  ChevronDown,
  CheckCircle,
  Database,
  Globe,
  Columns,
  Box,
  Layers,
  X,
  ShieldCheck,
  Shield,
  ExternalLink,
  Info,
  Activity,
  Search,
  Maximize2,
  Minimize2,
  User,
  RotateCcw,
  FileText,
  MoreHorizontal
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
    providerDataStatus,
    isGlobeFullscreen,
    setIsGlobeFullscreen,
    setShowReportModal,
    resetToDefaults
  } = useTerranexusStore();

  const [nasaLiveStatus, setNasaLiveStatus] = useState<boolean>(true);
  const [showLocationMenu, setShowLocationMenu] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showUtilityDeck, setShowUtilityDeck] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const locationMenuRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const utilityDeckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!confirmReset) return;
    const timer = setTimeout(() => setConfirmReset(false), 3500);
    return () => clearTimeout(timer);
  }, [confirmReset]);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setShowLocationMenu(false);
      }
      if (profileModalRef.current && !profileModalRef.current.contains(e.target as Node)) {
        setShowProfileModal(false);
      }
      if (utilityDeckRef.current && !utilityDeckRef.current.contains(e.target as Node)) {
        setShowUtilityDeck(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocationMenu(false);
        setShowProfileModal(false);
        setShowUtilityDeck(false);
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

  const isSearchTabActive = activeModule === 'globe' && isInitialSearch;
  const isDossierActive = activeModule === 'globe' && !isInitialSearch && mainView === 'dossier2d';
  const isGlobeOnly = activeModule === 'globe' && !isInitialSearch && mainView === 'twin3d' && viewMode === 'globe';
  const isSplitActive = activeModule === 'globe' && !isInitialSearch && mainView === 'twin3d' && viewMode === 'split';
  const isCutawayOnly = activeModule === 'globe' && !isInitialSearch && mainView === 'twin3d' && (viewMode === 'cutaway' || viewMode === 'underground');

  const handleOpenSearchTab = () => {
    setActiveModule('globe');
    setIsInitialSearch(true);
  };

  return (
    <header className="h-14 w-full max-w-full shrink-0 border-b border-white/10 liquid-glass-elevated px-2.5 md:px-3.5 z-30 flex items-center justify-between select-none gap-1.5 md:gap-2.5 overflow-x-clip">
      {/* Top-Left: Brand */}
      <div className="flex items-center gap-2 rounded-lg px-1.5 py-1 shrink-0">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
          <Compass className="w-4 h-4 text-sky-400" />
        </div>
        <div className="hidden sm:flex flex-col min-w-0">
          <span className="font-extrabold text-xs md:text-[13px] tracking-wider uppercase text-slate-100 font-display whitespace-nowrap">
            TERRANEXUS 4D
          </span>
          <span className="text-[9px] tracking-wide text-cyan-300/80 font-medium hidden 2xl:inline whitespace-nowrap">
            Earth &amp; Subsurface Intelligence
          </span>
        </div>
      </div>

      {/* Center: Integrated Location Search & Locus Selector */}
      <div className={`flex-1 max-w-xs lg:max-w-sm xl:max-w-md min-w-[125px] sm:min-w-[170px] md:min-w-[190px] transition-opacity duration-200 ${isInitialSearch ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100'}`}>
        <LocationSearch
          onLocationSelected={(loc) => {
            const wasInSearchTab = isInitialSearch;
            setSelectedLocation(loc);
            setIsInitialSearch(false);
            if (wasInSearchTab) {
              setActiveModule('globe');
              setMainView('twin3d');
              setViewMode('globe');
            }
          }}
          className="w-full"
        />
      </div>

      {/* Mobile View Mode & Search Quick Toggle (< md) */}
      <div className="flex md:hidden items-center gap-1 shrink-0">
        {!isSearchTabActive && (
          <button
            type="button"
            onClick={handleOpenSearchTab}
            className="flex items-center justify-center p-1.5 rounded-lg liquid-glass-pill text-xs font-mono text-sky-300 cursor-pointer"
            title="Open Place Search Explorer"
            aria-label="Open Place Search Tab"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (isGlobeOnly) handleSelectViewMode('cutaway');
            else if (isCutawayOnly) handleSelectViewMode('dossier');
            else handleSelectViewMode('globe');
          }}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg liquid-glass-pill text-xs font-mono text-cyan-300 cursor-pointer"
          title="Switch View Mode (Globe / Cutaway / Dossier)"
          aria-label="Switch View Mode"
        >
          {isSearchTabActive && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
          {isGlobeOnly && <Globe className="w-3.5 h-3.5 text-cyan-400" />}
          {isCutawayOnly && <Box className="w-3.5 h-3.5 text-amber-400" />}
          {isDossierActive && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
          {isSplitActive && <Columns className="w-3.5 h-3.5 text-cyan-400" />}
        </button>
      </div>

      {/* Center-Right: Segmented View Mode Switcher (md, lg, xl, 2xl screens) */}
      <div className="hidden md:flex items-center p-0.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs shrink-0" role="tablist" aria-label="View Mode">
        <button
          type="button"
          role="tab"
          aria-selected={isSearchTabActive}
          onClick={handleOpenSearchTab}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isSearchTabActive
              ? 'bg-sky-500/20 border border-sky-400/80 text-sky-300 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white border border-transparent'
          }`}
          title="Search Places, Cities & Villages Worldwide"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden lg:inline">Search</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isGlobeOnly}
          onClick={() => handleSelectViewMode('globe')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isGlobeOnly
              ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white border border-transparent'
          }`}
          title="3D Cesium Earth Digital Twin"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">3D Globe</span>
          <span className="hidden lg:inline 2xl:hidden">Globe</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isSplitActive}
          onClick={() => handleSelectViewMode('split')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isSplitActive
              ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white border border-transparent'
          }`}
          title="Synchronized Split View: 3D Earth + Subsurface Cutaway"
        >
          <Columns className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">Split 3D</span>
          <span className="hidden lg:inline 2xl:hidden">Split</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isCutawayOnly}
          onClick={() => handleSelectViewMode('cutaway')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isCutawayOnly
              ? 'bg-amber-500/20 border border-amber-400/80 text-amber-300 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white border border-transparent'
          }`}
          title="3D Cutout — Geological & Subsurface Cutaway Workstation"
        >
          <Box className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">3D Cutout</span>
          <span className="hidden lg:inline 2xl:hidden">Cutout</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={isDossierActive}
          onClick={() => handleSelectViewMode('dossier')}
          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            isDossierActive
              ? 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-300 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white border border-transparent'
          }`}
          title="Location Evidence Dossier & 2D GIS Map"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden 2xl:inline">2D Dossier</span>
          <span className="hidden lg:inline 2xl:hidden">Dossier</span>
        </button>
      </div>

      {/* Top-Right: Telemetry Status, Provider Health, Observation Interval */}
      <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
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
          type="button"
          onClick={() => setShowProviderHealthModal(true)}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-xl liquid-glass-pill hover:border-cyan-400/70 text-slate-200 hover:text-cyan-300 text-xs font-mono whitespace-nowrap transition-colors cursor-pointer"
          title="Inspect Provider Health, Circuit Breakers & Validation Release Gates"
          aria-label="Inspect Provider Health and Validation Metrics"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden 2xl:inline">Health</span>
        </button>

        {/* Location Dropdown Quick Selector */}
        <div className="relative hidden sm:block" ref={locationMenuRef}>
          <button
            type="button"
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            title="Switch Active Geographic Locus"
            aria-label={`Active locus ${selectedLocation.name.split(' - ')[0]}`}
          >
            <span className="text-amber-400 font-mono text-[10px] uppercase hidden 2xl:inline">Locus:</span>
            <span className="font-semibold text-[11px] max-w-[74px] sm:max-w-[96px] truncate">{selectedLocation.name.split(' - ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {showLocationMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 max-h-[75vh] overflow-y-auto liquid-glass-elevated rounded-xl p-1.5 z-50 flex flex-col gap-1">
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

              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 px-2.5 pt-2 pb-1 border-t border-slate-800/80">
                Global Earth Benchmarks
              </span>
              {[
                {
                  id: 'glb-grand-canyon',
                  name: 'Grand Canyon',
                  state: 'Arizona, USA',
                  district: 'Coconino County',
                  latitude: 36.1069,
                  longitude: -112.1129,
                  elevationMeters: 2070,
                  basin: 'Colorado River Basin',
                  geologicalProvince: 'Colorado Plateau Paleozoic Sequence',
                  description: 'Colorado Plateau Paleozoic sedimentary sequence over Vishnu Basement Schist',
                  isWithinIndia: false
                },
                {
                  id: 'glb-atacama-copper',
                  name: 'Atacama Copper Belt',
                  state: 'Antofagasta, Chile',
                  district: 'El Loa Province',
                  latitude: -23.8634,
                  longitude: -69.1328,
                  elevationMeters: 2450,
                  basin: 'Atacama Endorheic Basin',
                  geologicalProvince: 'Andean Porphyry Copper Belt',
                  description: 'Hyper-arid Andean porphyry copper-molybdenum belt and salar hydrological system',
                  isWithinIndia: false
                },
                {
                  id: 'glb-mount-etna',
                  name: 'Mount Etna Volcano',
                  state: 'Sicily, Italy',
                  district: 'Catania',
                  latitude: 37.7510,
                  longitude: 14.9934,
                  elevationMeters: 2850,
                  basin: 'Simeto-Alcantara Volcanic Catchment',
                  geologicalProvince: 'Etnean Stratovolcanic Construct',
                  description: 'Active stratovolcanic basaltic edifice over Apennine-Maghrebian sedimentary basement',
                  isWithinIndia: false
                },
                {
                  id: 'glb-sahara-nubian',
                  name: 'Sahara Nubian Aquifer',
                  state: 'New Valley, Egypt',
                  district: 'Kharga Oasis',
                  latitude: 25.6872,
                  longitude: 28.8500,
                  elevationMeters: 185,
                  basin: 'Nubian Sandstone Aquifer System',
                  geologicalProvince: 'Nubian Intracratonic Megabasin',
                  description: 'Transboundary fossil groundwater sandstone megabasin across Northeast Africa',
                  isWithinIndia: false
                }
              ].map((glb) => {
                const isSelected =
                  Math.abs(selectedLocation.latitude - glb.latitude) < 0.05 &&
                  Math.abs(selectedLocation.longitude - glb.longitude) < 0.05;
                return (
                  <button
                    key={glb.id}
                    onClick={() => {
                      setSelectedLocation(glb as any);
                      setShowLocationMenu(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 font-semibold'
                        : 'hover:bg-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-cyan-100">{glb.name}</div>
                      <div className="text-[10px] text-slate-400">{glb.district}, {glb.state}</div>
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
          type="button"
          onClick={() => setInspectorOpen(!inspectorOpen)}
          className={`hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
            inspectorOpen
              ? 'bg-sky-500/15 border-sky-400/70 text-sky-300 font-semibold'
              : 'liquid-glass-pill text-slate-300 hover:text-sky-300'
          }`}
          title={inspectorOpen ? 'Collapse Data Inspector Panel' : 'Expand Data Inspector Panel'}
          aria-label={inspectorOpen ? 'Collapse Data Inspector Panel' : 'Expand Data Inspector Panel'}
        >
          <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="hidden 2xl:inline">Inspector</span>
        </button>

        {/* Automated Scientific PDF Report Trigger */}
        <button
          type="button"
          onClick={() => setShowReportModal(true, 'COMPREHENSIVE')}
          className="hidden sm:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border liquid-glass-pill text-slate-200 hover:text-sky-300 text-xs font-mono whitespace-nowrap transition-all cursor-pointer"
          title="Generate Verified Scientific PDF Report"
          aria-label="Generate PDF Report"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="hidden 2xl:inline">PDF Report</span>
          <span className="hidden xl:inline 2xl:hidden">PDF</span>
        </button>

        {/* Fullscreen Immersion Mode Toggle (Desktop direct) */}
        <button
          type="button"
          onClick={() => setIsGlobeFullscreen(!isGlobeFullscreen)}
          className={`hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
            isGlobeFullscreen
              ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-semibold'
              : 'liquid-glass-pill text-slate-300 hover:text-sky-300'
          }`}
          title={isGlobeFullscreen ? 'Exit Immersive Fullscreen Mode (Esc)' : 'Immersive Fullscreen Exploration Mode'}
          aria-label={isGlobeFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isGlobeFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
          <span className="hidden 2xl:inline">{isGlobeFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        {/* Reset to Factory Defaults Action (Desktop direct, icon+tooltip under 2xl to prevent clip) */}
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
            } else {
              resetToDefaults();
              setConfirmReset(false);
            }
          }}
          className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
            confirmReset
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
              : 'liquid-glass-pill text-slate-300 hover:text-amber-300'
          }`}
          title={confirmReset ? 'Click again to confirm Reset to Factory Defaults' : 'Reset application settings to factory defaults'}
          aria-label={confirmReset ? 'Confirm Reset Defaults' : 'Reset Defaults'}
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {confirmReset ? (
            <span className="text-[11px]">Confirm?</span>
          ) : (
            <span className="hidden 2xl:inline">Reset</span>
          )}
        </button>

        {/* Compact Viewport Tools Overflow Menu (< lg, e.g., Mobile 390px & Tablet) */}
        <div className="relative lg:hidden" ref={utilityDeckRef}>
          <button
            type="button"
            onClick={() => setShowUtilityDeck(!showUtilityDeck)}
            className="w-8 h-8 rounded-xl liquid-glass-pill flex items-center justify-center text-slate-200 hover:text-cyan-300 cursor-pointer"
            title="Workspace Tools (Report, Health, Inspector, Reset)"
            aria-label="Open Workspace Tools Menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showUtilityDeck && (
            <div className="absolute right-0 top-full mt-2 w-60 liquid-glass-elevated rounded-2xl p-2 z-50 flex flex-col gap-1 text-xs font-mono animate-fadeIn">
              <button
                type="button"
                onClick={() => { setShowReportModal(true, 'COMPREHENSIVE'); setShowUtilityDeck(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 text-left cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generate PDF Report</span>
              </button>
              <button
                type="button"
                onClick={() => { setShowProviderHealthModal(true); setShowUtilityDeck(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 text-left cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Provider Health & Gates</span>
              </button>
              <button
                type="button"
                onClick={() => { setInspectorOpen(!inspectorOpen); setShowUtilityDeck(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 text-left cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>{inspectorOpen ? 'Close Inspector' : 'Open Inspector'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsGlobeFullscreen(!isGlobeFullscreen); setShowUtilityDeck(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] text-slate-200 text-left cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isGlobeFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
              </button>
              <button
                type="button"
                onClick={() => { resetToDefaults(); setShowUtilityDeck(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-amber-500/15 text-amber-300 text-left border-t border-white/10 mt-1 pt-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Defaults</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Info Modal Trigger */}
        <div className="relative" ref={profileModalRef}>
          <button
            type="button"
            onClick={() => setShowProfileModal(!showProfileModal)}
            className="w-8 h-8 rounded-lg liquid-glass-pill flex items-center justify-center text-xs text-slate-200 cursor-pointer hover:text-sky-300 transition-colors shrink-0"
            title="User Profile & System Information"
            aria-label="User Profile & System Information"
          >
            <User className="w-4 h-4" />
          </button>

          {showProfileModal && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 liquid-glass-elevated rounded-2xl p-4 z-50 flex flex-col gap-3 text-xs animate-fadeIn">
              {/* Header */}
              <div className="flex items-start justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-sky-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      TERRANEXUS 4D Observatory
                    </h3>
                    <p className="text-[10px] text-sky-300 font-mono">Geospatial Subsurface &amp; Hydrological Twin</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  aria-label="Close System Info Modal"
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Active Session & Coordinate Specs */}
              <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Active Locus:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {selectedLocation.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Elevation Datum:</span>
                  <span className="font-mono text-cyan-300">Copernicus GLO-90 (EGM2008)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">3D Rendering:</span>
                  <span className="font-mono text-emerald-300">CesiumJS + Three.js PBR</span>
                </div>
              </div>

              {/* Core Pillars */}
              <div className="space-y-1 text-[11px] text-slate-300">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                  Authoritative Data Feeds:
                </span>
                <ul className="space-y-1 text-[10px] text-slate-400 list-disc list-inside">
                  <li><strong className="text-slate-300">ISRIC SoilGrids &amp; SMAP:</strong> 250m soil pedology &amp; surface moisture</li>
                  <li><strong className="text-slate-300">Copernicus GLO-90 &amp; Esri:</strong> True relief mesh &amp; optical imagery</li>
                  <li><strong className="text-slate-300">NASA GRACE &amp; CGWB/WHYMAP:</strong> Mass anomaly &amp; aquifer profiles</li>
                  <li><strong className="text-slate-300">Macrostrat &amp; GSI Bhukosh:</strong> Regional lithostratigraphic bedrock units</li>
                </ul>
              </div>

              {/* Policy & Security Badges */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>NGP 2022 Compliant</span>
                </div>
                <div className="p-2 rounded-lg bg-sky-950/30 border border-sky-500/30 text-sky-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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

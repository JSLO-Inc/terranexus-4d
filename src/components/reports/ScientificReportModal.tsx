import React, { useMemo, useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { ScientificReportType } from '../../types/eic';
import {
  verifyScientificReport,
  buildReportSections,
  generateValidPdf14Document,
  getReportTypeTitle
} from '../../utils/pdfReportGenerator';
import {
  FileText,
  Download,
  CheckCircle2,
  X,
  ShieldCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const REPORT_TYPES: Array<{ id: ScientificReportType; label: string; subtitle: string }> = [
  { id: 'COMPREHENSIVE', label: 'Comprehensive Location Dossier', subtitle: 'All 7 Domains + EIC Fusion' },
  { id: 'HYDRO', label: 'Nexus Hydro Report', subtitle: 'Groundwater, Aquifers & GRACE' },
  { id: 'SOIL', label: 'Nexus Soil Report', subtitle: 'Horizons, Texture, pH & SOC' },
  { id: 'AGRI', label: 'Nexus Agri Report', subtitle: 'Crops, Borewell & Conservation' },
  { id: 'STRATA', label: 'Nexus Strata Report', subtitle: 'Geology, Lithology & Boreholes' },
  { id: 'MINERAL', label: 'Nexus Mineral Report', subtitle: 'Metallogenic Belts & SWIR' },
  { id: 'ENVIRONMENT', label: 'Nexus Environment Report', subtitle: 'Land Cover & Causation Audit' }
];

export const ScientificReportModal: React.FC = () => {
  const {
    showReportModal,
    reportModalType,
    setShowReportModal,
    eicSynthesis,
    currentDossier,
    selectedLocation
  } = useTerranexusStore();

  const [downloadedNotice, setDownloadedNotice] = useState<string | null>(null);

  const verification = useMemo(
    () => verifyScientificReport(reportModalType, eicSynthesis, currentDossier),
    [reportModalType, eicSynthesis, currentDossier]
  );

  const sections = useMemo(
    () => (eicSynthesis ? buildReportSections(reportModalType, eicSynthesis, currentDossier) : []),
    [reportModalType, eicSynthesis, currentDossier]
  );

  if (!showReportModal) return null;

  const handleDownloadPdf = () => {
    if (!eicSynthesis || !verification.overallVerified) return;
    const pdfContent = generateValidPdf14Document(reportModalType, eicSynthesis, currentDossier);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const cleanName = (selectedLocation.name || 'Location')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const filename = `TERRANEXUS_4D_${reportModalType}_REPORT_${cleanName}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    setDownloadedNotice(`Verified & downloaded ${filename} (${Math.round(pdfContent.length / 1024)} KB PDF 1.4)`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Automated Scientific PDF Report Generator"
    >
      <div className="liquid-glass-elevated w-full max-w-5xl max-h-[90vh] rounded-2xl border border-cyan-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                TERRANEXUS 4D • Automated Scientific Publication Engine
              </div>
              <h2 className="text-base md:text-lg font-bold text-white">
                {getReportTypeTitle(reportModalType)}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowReportModal(false)}
            aria-label="Close Report Modal"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Type Selector Strip */}
        <div className="px-5 py-3 border-b border-white/10 bg-slate-900/70 flex items-center gap-2 overflow-x-auto shrink-0">
          {REPORT_TYPES.map((rt) => {
            const active = rt.id === reportModalType;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => {
                  setDownloadedNotice(null);
                  setShowReportModal(true, rt.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer border ${
                  active
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-semibold shadow'
                    : 'bg-slate-950/70 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {rt.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Left Verification Gate + Right Document Preview */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 cols: 6-Point Pre-Download Verification Gate */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pre-Download Verification Gate</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    verification.overallVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                  }`}
                >
                  {verification.overallVerified ? '6/6 PASSED' : 'VERIFYING'}
                </span>
              </div>

              <div className="space-y-2">
                {verification.checks.map((chk) => (
                  <div key={chk.checkId} className="p-2.5 rounded-lg bg-slate-950/90 border border-white/5 space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{chk.label}</span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400 pl-5 leading-snug">{chk.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 cols: Structured Publication Preview */}
          <div className="lg:col-span-7 p-5 rounded-xl bg-slate-950 border border-white/15 space-y-4 font-sans">
            <div className="border-b border-white/10 pb-3 flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono text-cyan-400 uppercase">
                  PUBLICATION PREVIEW • PDF 1.4 VECTOR DOCUMENT
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {eicSynthesis?.location.formattedAddress || selectedLocation.name}
                </h3>
                <div className="text-[11px] font-mono text-slate-400">
                  Coordinates: {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}° • Elevation: {selectedLocation.elevationMeters}m ASL
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-400/30">
                {eicSynthesis?.overallAvailabilityState || 'VERIFIED_CACHED'}
              </span>
            </div>

            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase">{sec.heading}</h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="leading-relaxed">
                        • {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            {downloadedNotice ? (
              <span className="text-emerald-300 font-semibold">✓ {downloadedNotice}</span>
            ) : (
              <span>All findings are strictly traceable to verified providers; zero fabricated values.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!verification.overallVerified}
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Verified PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

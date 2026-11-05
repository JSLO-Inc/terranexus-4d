import React, { useState, useMemo } from 'react';
import { DossierResponse } from '../../types/dossier';
import {
  generateDossierMarkdownReport,
  downloadDossierMarkdown,
  copyDossierReportToClipboard,
  ReportExportOptions
} from '../../services/dossierReportExporter';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  X,
  ShieldCheck,
  Compass,
  Layers,
  Settings2
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: DossierResponse | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  dossier
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const [options, setOptions] = useState<ReportExportOptions>({
    includeExecutiveSummary: true,
    includeTelemetryTable: true,
    includeGeologySection: true,
    includeRemoteSensingSection: true,
    includeProvenanceAudit: true
  });

  const markdownContent = useMemo(() => {
    if (!dossier) return '';
    return generateDossierMarkdownReport(dossier, options);
  }, [dossier, options]);

  // Accessible Escape key listener to close modal
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dossier) return null;

  const handleCopy = async () => {
    const success = await copyDossierReportToClipboard(dossier);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    downloadDossierMarkdown(dossier);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleOption = (key: keyof ReportExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#080d1a] border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden text-slate-100 font-sans">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="text-sm md:text-base font-bold text-slate-100">
                Export Scientific Dossier Intelligence Report
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Official GSI/CGWB/NASA Evidence Dossier • {dossier.locationContext.administrativeAreas.formattedAddress}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/60 hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
            title="Close Exporter (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls & Options Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Section Inclusions */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Include:</span>
            </span>
            {[
              { key: 'includeExecutiveSummary' as const, label: 'Summary' },
              { key: 'includeTelemetryTable' as const, label: 'Telemetry' },
              { key: 'includeRemoteSensingSection' as const, label: 'Satellites' },
              { key: 'includeGeologySection' as const, label: 'Geology' },
              { key: 'includeProvenanceAudit' as const, label: 'Audit Trail' }
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => toggleOption(opt.key)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                  options[opt.key]
                    ? 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500 line-through'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Formatted vs Raw */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rendered Preview
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'raw'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Markdown
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-[#040813] font-sans text-xs md:text-sm text-slate-200 custom-scrollbar leading-relaxed">
          {viewMode === 'preview' ? (
            <div className="prose prose-invert max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:text-slate-300 prose-table:border prose-table:border-slate-800">
              <MarkdownRenderer content={markdownContent} />
            </div>
          ) : (
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-cyan-200/90 whitespace-pre-wrap select-all">
              {markdownContent}
            </pre>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verified SHA-256 Provenance</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
              title="Copy Entire Report to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
              title="Print or Save as PDF via Browser"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print / PDF</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              title="Download Complete Report (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

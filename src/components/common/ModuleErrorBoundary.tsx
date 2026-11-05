import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  moduleName: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Resilient Error Boundary for Scientific Modules
 * Isolates runtime exceptions in individual workstations, preventing parent application unmount.
 */
export class ModuleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ModuleErrorBoundary] Unhandled error in ${this.props.moduleName}:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#080c14] text-slate-200 min-h-[320px]">
          <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-2xl flex flex-col gap-4 text-center items-center">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 mb-1">
                {this.props.moduleName} — Computation Anomaly
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected runtime data condition was encountered in this workstation. Other digital twin views remain fully operational.
              </p>
            </div>

            {this.state.error && (
              <div className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-red-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-mono transition-all shadow-md mt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Workstation View</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

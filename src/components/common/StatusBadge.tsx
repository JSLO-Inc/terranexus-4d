import React from 'react';
import { CheckCircle2, Satellite, Calculator, BrainCircuit, AlertCircle, HelpCircle } from 'lucide-react';

export type BadgeTier =
  | 'MEASURED'
  | 'OBSERVED'
  | 'INTERPOLATED'
  | 'REMOTE'
  | 'SATELLITE'
  | 'DERIVED'
  | 'MODELLED'
  | 'ILLUSTRATIVE'
  | 'PREDICTED'
  | 'DEMONSTRATION'
  | 'UNAVAILABLE'
  | 'NOT_CONFIGURED'
  | 'UNVERIFIED'
  | 'SIMULATED';

interface StatusBadgeProps {
  status: BadgeTier | string;
  size?: 'sm' | 'md';
  showDescription?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDescription = false }) => {
  const normStatus = (status || '').toUpperCase();

  const config: Record<string, {
    label: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    icon: React.ReactNode;
    description: string;
  }> = {
    MEASURED: {
      label: 'MEASURED',
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      description: 'Direct in-situ physical measurement (e.g. CGWB piezometer or rain gauge).'
    },
    OBSERVED: {
      label: 'OBSERVED',
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
      description: 'Direct in-situ physical observation or official field measurement.'
    },
    INTERPOLATED: {
      label: 'INTERPOLATED',
      bg: 'bg-teal-950/80',
      border: 'border-teal-500/50',
      text: 'text-teal-300',
      dot: 'bg-teal-400',
      icon: <Calculator className="w-3 h-3 text-teal-400" />,
      description: 'Spatially interpolated from verified monitoring stations with known uncertainty bounds.'
    },
    REMOTE: {
      label: 'REMOTE',
      bg: 'bg-sky-950/80',
      border: 'border-sky-500/50',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      icon: <Satellite className="w-3 h-3 text-sky-400" />,
      description: 'Satellite or airborne remote sensing observation (e.g. NASA GPM, GRACE, Sentinel).'
    },
    SATELLITE: {
      label: 'SATELLITE',
      bg: 'bg-sky-950/80',
      border: 'border-sky-500/50',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      icon: <Satellite className="w-3 h-3 text-sky-400" />,
      description: 'Spaceborne satellite sensor telemetry and gridded radiometry.'
    },
    DERIVED: {
      label: 'DERIVED',
      bg: 'bg-purple-950/80',
      border: 'border-purple-500/50',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      icon: <Calculator className="w-3 h-3 text-purple-400" />,
      description: 'Mathematically derived spatial context (e.g. DEM slope, aspect, TWI, GSI geology).'
    },
    MODELLED: {
      label: 'MODELLED',
      bg: 'bg-amber-950/80',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      icon: <BrainCircuit className="w-3 h-3 text-amber-400" />,
      description: 'Statistical interpolation or inversion model passing regional validation release gates.'
    },
    ILLUSTRATIVE: {
      label: 'ILLUSTRATIVE',
      bg: 'bg-orange-950/80',
      border: 'border-orange-500/50',
      text: 'text-orange-300',
      dot: 'bg-orange-400',
      icon: <HelpCircle className="w-3 h-3 text-orange-400" />,
      description: 'Conceptual 3D geological or hydrological visualization; not a locally verified observation.'
    },
    PREDICTED: {
      label: 'PREDICTED',
      bg: 'bg-amber-950/80',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      icon: <BrainCircuit className="w-3 h-3 text-amber-400" />,
      description: 'Statistical or regional model prediction.'
    },
    DEMONSTRATION: {
      label: 'DEMONSTRATION',
      bg: 'bg-indigo-950/80',
      border: 'border-indigo-500/50',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      icon: <HelpCircle className="w-3 h-3 text-indigo-400" />,
      description: 'Curated scientific benchmark representing published literature; not live telemetry.'
    },
    UNAVAILABLE: {
      label: 'UNAVAILABLE',
      bg: 'bg-slate-900',
      border: 'border-slate-700',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      icon: <AlertCircle className="w-3 h-3 text-slate-500" />,
      description: 'Data layer unavailable or sparse monitoring coverage at this coordinate.'
    },
    NOT_CONFIGURED: {
      label: 'NOT CONFIGURED',
      bg: 'bg-slate-900',
      border: 'border-slate-700',
      text: 'text-slate-400',
      dot: 'bg-slate-500',
      icon: <AlertCircle className="w-3 h-3 text-slate-500" />,
      description: 'Official provider API gateway unconfigured in environment; fallback active.'
    },
    UNVERIFIED: {
      label: 'UNVERIFIED',
      bg: 'bg-rose-950/80',
      border: 'border-rose-500/50',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      icon: <AlertCircle className="w-3 h-3 text-rose-400" />,
      description: 'Data coverage unconfirmed or pending ground-truth verification.'
    },
    SIMULATED: {
      label: 'SIMULATED',
      bg: 'bg-fuchsia-950/80',
      border: 'border-fuchsia-500/50',
      text: 'text-fuchsia-300',
      dot: 'bg-fuchsia-400',
      icon: <Calculator className="w-3 h-3 text-fuchsia-400" />,
      description: 'Hypothetical or illustrative geological scenario.'
    }
  };

  const item = config[normStatus] || {
    label: normStatus,
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    icon: <HelpCircle className="w-3 h-3 text-slate-400" />,
    description: 'Scientific Data Classification'
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        title={item.description}
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${item.bg} ${item.border} ${item.text} ${sizeClass} transition-colors`}
      >
        {item.icon}
        <span>{item.label}</span>
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-400 italic">
          {item.description}
        </span>
      )}
    </div>
  );
};

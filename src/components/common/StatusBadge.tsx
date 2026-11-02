import React from 'react';
import { ScientificStatus } from '../../types/datasets';

interface StatusBadgeProps {
  status: ScientificStatus;
  size?: 'sm' | 'md';
  showDescription?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDescription = false }) => {
  const config = {
    OBSERVED: {
      label: 'OBSERVED',
      bg: 'bg-emerald-950/80',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      description: 'Direct physical measurement or official published field record.'
    },
    MODELLED: {
      label: 'MODELLED',
      bg: 'bg-sky-950/80',
      border: 'border-sky-500/50',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      description: 'Calculated or inverted from physical observations (e.g. satellite gravimetry).'
    },
    PREDICTED: {
      label: 'PREDICTED',
      bg: 'bg-amber-950/80',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      description: 'Derived from calibrated statistical or machine-learning models.'
    },
    SIMULATED: {
      label: 'SIMULATED',
      bg: 'bg-fuchsia-950/80',
      border: 'border-fuchsia-500/50',
      text: 'text-fuchsia-300',
      dot: 'bg-fuchsia-400',
      description: 'Hypothetical or illustrative geological scenario.'
    }
  }[status];

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span
        title={config.description}
        className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
        {config.label}
      </span>
      {showDescription && (
        <span className="text-[11px] text-slate-400 italic">
          {config.description}
        </span>
      )}
    </div>
  );
};

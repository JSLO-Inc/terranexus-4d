import React, { useState, useEffect } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { Play, Pause, RotateCcw, Clock, Calendar } from 'lucide-react';

export const TimeControl: React.FC = () => {
  const { currentTimeIndex, setCurrentTimeIndex } = useTerranexusStore();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTimeIndex((currentTimeIndex + 1) % TIME_STEPS.length);
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTimeIndex, setCurrentTimeIndex]);

  const currentLabel = TIME_STEPS[currentTimeIndex];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur select-none flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-purple-300">
          <Clock className="w-3.5 h-3.5" />
          <span>4D TEMPORAL CONTROL (T-AXIS)</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
          <Calendar className="w-3 h-3 text-purple-400" />
          <span>{currentLabel}</span>
        </div>
      </div>

      {/* Scrub bar & playback */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 transition-colors shrink-0"
          title={isPlaying ? 'Pause Temporal Playback' : 'Play Multi-Year Observation Sequence'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setCurrentTimeIndex(0)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors shrink-0"
          title="Reset to 2015 Baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <input
          type="range"
          min="0"
          max={TIME_STEPS.length - 1}
          step="1"
          value={currentTimeIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentTimeIndex(Number(e.target.value));
          }}
          className="w-full accent-purple-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* Timeline markers */}
      <div className="flex justify-between text-[9px] font-mono text-slate-500 px-0.5">
        <span>2015 (Pre)</span>
        <span>2017</span>
        <span>2019</span>
        <span>2021</span>
        <span>2023</span>
        <span>2024 (Post)</span>
      </div>
    </div>
  );
};

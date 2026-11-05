import React, { useState, useEffect } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { Play, Pause, ChevronDown, RotateCcw } from 'lucide-react';

export const TimeControl: React.FC = () => {
  const { currentTimeIndex, setCurrentTimeIndex } = useTerranexusStore();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTimeIndex((currentTimeIndex + 1) % TIME_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTimeIndex, setCurrentTimeIndex]);

  const currentLabel = TIME_STEPS[currentTimeIndex] || '2024-05';

  return (
    <div className="glass-panel flex items-center gap-2.5 px-3 py-1.5 rounded-xl select-none text-xs shadow-lg">
      {/* Play/Pause Button */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 text-cyan-300 transition-all shadow-md shrink-0 cursor-pointer"
        title={isPlaying ? 'Pause Playback' : 'Play Observation Timeline'}
        aria-label={isPlaying ? 'Pause Playback' : 'Play Observation Timeline'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      {/* Interactive Time Range Slider */}
      <div className="flex items-center gap-2 w-36 md:w-48">
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
          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Temporal Timeline Observation Step"
          aria-valuemin={0}
          aria-valuemax={TIME_STEPS.length - 1}
          aria-valuenow={currentTimeIndex}
          aria-valuetext={`Observation date ${currentLabel}`}
          title={`Observation: ${currentLabel}`}
        />
      </div>

      {/* Date Window Dropdown Label */}
      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300 border-l border-slate-800 pl-2.5 shrink-0">
        <span className="font-semibold text-cyan-300">{currentLabel.slice(0, 7)}</span>
        <span className="text-slate-500 hidden sm:inline">(2020–2024)</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          setIsPlaying(false);
          setCurrentTimeIndex(0);
        }}
        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        title="Reset to initial observation date"
        aria-label="Reset to initial observation date"
      >
        <RotateCcw className="w-3 h-3" />
      </button>
    </div>
  );
};

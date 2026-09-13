/**
 * BloxVerse 3D - LoadingScreen
 * Authentic stylized loading screen with live resource loading percentage.
 */

import React from 'react';
import { Box } from 'lucide-react';

interface LoadingScreenProps {
  progress: number; // 0.0 to 1.0
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  message = 'Optimizando chunks y texturas para Android...',
}) => {
  const percent = Math.min(100, Math.round(progress * 100));

  // Build block progress bar representation: e.g. ████████░░
  const totalBlocks = 16;
  const filledBlocks = Math.round((progress * totalBlocks));
  const blockBar = '█'.repeat(filledBlocks) + '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  return (
    <div id="loading-screen-root" className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 select-none p-6">
      {/* Animated 3D Block Logo Icon */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500 to-cyan-300 flex items-center justify-center shadow-2xl shadow-sky-500/40 border-2 border-white/60 animate-bounce">
          <Box className="w-11 h-11 text-white" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 mb-2">
        BLOXVERSE 3D
      </h1>
      <p className="text-xs sm:text-sm font-semibold tracking-widest text-slate-400 uppercase mb-8">
        Cargando Mundo 3D
      </p>

      {/* Progress Container */}
      <div className="w-full max-w-md flex flex-col items-center gap-3">
        {/* Progress Bar */}
        <div className="w-full h-4 rounded-full bg-slate-900 border border-white/15 p-0.5 shadow-inner overflow-hidden">
          <div
            id="loading-progress-bar"
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Textual Blocks & Percentage */}
        <div className="flex items-center justify-between w-full text-xs font-mono font-bold text-slate-300 px-1">
          <span className="text-sky-400 tracking-widest">{blockBar}</span>
          <span className="text-amber-400 text-sm">{percent}%</span>
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-2 animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * BloxVerse 3D - PauseMenu
 * In-game pause screen with quick resume, respawn, quality tier settings, and exit.
 */

import React from 'react';
import { Play, RotateCcw, Settings, Home, X } from 'lucide-react';
import { GraphicQuality } from '../types';

interface PauseMenuProps {
  onResume: () => void;
  onRespawn: () => void;
  onOpenSettings: () => void;
  onExitToMenu: () => void;
  quality: GraphicQuality;
  onQualityChange: (q: GraphicQuality) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRespawn,
  onOpenSettings,
  onExitToMenu,
  quality,
  onQualityChange,
}) => {
  return (
    <div id="pause-menu-root" className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border-2 border-white/20 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="flex items-center justify-between w-full pb-3 border-b border-white/10 mb-6">
          <h2 className="text-xl font-black text-white tracking-wide">JUEGO EN PAUSA</h2>
          <button
            id="btn-pause-close"
            onClick={onResume}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Resume */}
          <button
            id="btn-pause-resume"
            onClick={onResume}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-white font-black text-sm tracking-wider shadow-lg shadow-sky-500/30 border-2 border-white/60 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>CONTINUAR</span>
          </button>

          {/* Respawn at Checkpoint */}
          <button
            id="btn-pause-respawn"
            onClick={() => {
              onRespawn();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs sm:text-sm tracking-wide border border-amber-400/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>REAPARECER EN CHECKPOINT</span>
          </button>

          {/* Quick Graphics Quality Toggle */}
          <div className="mt-2 p-3 rounded-2xl bg-slate-950/60 border border-white/10 w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Calidad Gráfica (Android / PC)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicQuality[]).map((tier) => (
                <button
                  key={tier}
                  id={`btn-quality-${tier}`}
                  onClick={() => onQualityChange(tier)}
                  className={`py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                    quality === tier
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 border border-white/60'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <button
            id="btn-pause-settings"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
          >
            <Settings className="w-4 h-4" />
            <span>AJUSTES COMPLETOS</span>
          </button>

          {/* Exit to Main Menu */}
          <button
            id="btn-pause-exit"
            onClick={onExitToMenu}
            className="w-full py-2.5 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs sm:text-sm border border-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>VOLVER AL MENÚ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

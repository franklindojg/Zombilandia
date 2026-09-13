/**
 * BloxVerse 3D - MainMenu
 * Youthful, colorful, modern main menu with responsive big buttons for mobile and PC.
 */

import React from 'react';
import { Play, User, Settings, Trophy, HelpCircle, Sparkles, Coins } from 'lucide-react';
import { GameModeType } from '../types';

interface MainMenuProps {
  onPlay: (mode: GameModeType) => void;
  onOpenAvatar: () => void;
  onOpenSettings: () => void;
  onOpenControlsGuide: () => void;
  coins: number;
  bestObbyTime: number | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenAvatar,
  onOpenSettings,
  onOpenControlsGuide,
  coins,
  bestObbyTime,
}) => {
  return (
    <div id="main-menu-root" className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-y-auto">
      {/* Background Dim / Ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/40 to-slate-950/80 backdrop-blur-xs pointer-events-none" />

      {/* Top Bar with Coins & Stats */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-amber-400/40 backdrop-blur-md shadow-lg">
          <Coins className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="font-black text-amber-300 text-base">{coins}</span>
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Monedas</span>
        </div>

        {bestObbyTime !== null && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-purple-400/40 backdrop-blur-md shadow-lg">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-bold text-slate-300">Récord Obby:</span>
            <span className="font-black text-purple-300 text-sm">{bestObbyTime}s</span>
          </div>
        )}
      </div>

      {/* Hero Title */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-xs tracking-widest uppercase mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Videojuego 3D Sandbox & Plataformas</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300 drop-shadow-lg">
          BLOXVERSE 3D
        </h1>
        <p className="max-w-md text-slate-200 font-medium text-sm sm:text-base mt-2 drop-shadow">
          Explora un mundo vivo de bloques, supera el gran Obby y personaliza a tu héroe.
        </p>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3.5 mt-8 sm:mt-10">
          {/* Main Play Button */}
          <button
            id="btn-menu-play-sandbox"
            onClick={() => onPlay('SANDBOX')}
            className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-lg tracking-wider shadow-2xl shadow-emerald-500/40 border-3 border-white/80 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>JUGAR AHORA</span>
          </button>

          {/* Obby Challenge Mode */}
          <button
            id="btn-menu-play-obby"
            onClick={() => onPlay('OBBY')}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm tracking-wider shadow-xl shadow-purple-600/30 border-2 border-white/60 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5 text-amber-300" />
            <span>DESAFÍO OBBY PARKOUR</span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              id="btn-menu-avatar"
              onClick={onOpenAvatar}
              className="py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sky-300 font-black text-xs sm:text-sm tracking-wide border-2 border-sky-400/40 backdrop-blur-md shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>AVATAR</span>
            </button>

            <button
              id="btn-menu-settings"
              onClick={onOpenSettings}
              className="py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-black text-xs sm:text-sm tracking-wide border-2 border-white/20 backdrop-blur-md shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>AJUSTES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom info & Controls guide trigger */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-slate-400">
        <span>Optimizado para Android & PC</span>
        <button
          id="btn-menu-controls-guide"
          onClick={onOpenControlsGuide}
          className="flex items-center gap-1.5 hover:text-sky-300 transition text-slate-300 font-semibold underline"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Ver Controles</span>
        </button>
      </div>
    </div>
  );
};

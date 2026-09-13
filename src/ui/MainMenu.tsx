/**
 * Mansión del Terror 3D - MainMenu
 * Dark gothic horror title screen with quick start, survival guide,
 * avatar customizer, and audio toggle.
 */

import React from 'react';
import { Play, User, Settings, HelpCircle, Skull, Flashlight, Key } from 'lucide-react';
import { GameModeType } from '../types';

interface MainMenuProps {
  onPlay: (mode: GameModeType) => void;
  onOpenAvatar: () => void;
  onOpenSettings: () => void;
  onOpenControlsGuide: () => void;
  coins?: number;
  bestObbyTime?: number | null;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay,
  onOpenAvatar,
  onOpenSettings,
  onOpenControlsGuide,
}) => {
  return (
    <div
      id="main-menu-root"
      className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-y-auto"
    >
      {/* Dark mist vignette background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 backdrop-blur-xs pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/80 border border-red-900/60 backdrop-blur-md shadow-lg">
          <Skull className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-300 uppercase tracking-widest">
            Pesadilla Activa
          </span>
        </div>

        <button
          id="btn-menu-help"
          onClick={onOpenControlsGuide}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/80 hover:bg-slate-900 text-slate-300 border border-white/15 backdrop-blur-md shadow-lg active:scale-95 transition-all text-xs font-bold"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Cómo Jugar</span>
        </button>
      </div>

      {/* Hero Title */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 font-bold text-xs tracking-widest uppercase mb-4 shadow-lg shadow-red-950/50">
          <Skull className="w-4 h-4" />
          <span>Juego de Terror y Supervivencia 3D</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-red-200 via-red-500 to-rose-950 drop-shadow-[0_8px_25px_rgba(220,38,38,0.7)]">
          MANSIÓN DEL TERROR
        </h1>

        <p className="max-w-md text-slate-300 font-medium text-sm sm:text-base mt-3 drop-shadow leading-relaxed">
          Estás atrapado en una inmensa casa abandonada. Explora sus habitaciones oscuras,
          abre puertas, encuentra las <strong className="text-amber-400">3 llaves</strong> y
          huye del <strong className="text-red-400">fantasma errante</strong> antes de que te atrape.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2.5 mt-5">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Flashlight className="w-3.5 h-3.5" /> Linterna interactiva
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-red-500/30 text-red-300 text-xs font-semibold">
            <Skull className="w-3.5 h-3.5" /> Fantasma con IA y oído
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Key className="w-3.5 h-3.5" /> Puertas y 3 Llaves
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-3 mt-8">
          {/* Main Play Button */}
          <button
            id="btn-menu-play-horror"
            onClick={() => onPlay('SANDBOX')}
            className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-600 hover:to-rose-600 text-white font-black text-lg tracking-widest shadow-2xl shadow-red-900/60 border-2 border-red-400/80 active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse"
          >
            <Play className="w-6 h-6 fill-white" />
            <span>ENTRAR A LA MANSIÓN</span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              id="btn-menu-avatar"
              onClick={onOpenAvatar}
              className="py-3 px-4 rounded-2xl bg-black/80 hover:bg-slate-900 text-slate-300 font-black text-xs sm:text-sm tracking-wide border-2 border-slate-800 backdrop-blur-md shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>PERSONAJE</span>
            </button>

            <button
              id="btn-menu-settings"
              onClick={onOpenSettings}
              className="py-3 px-4 rounded-2xl bg-black/80 hover:bg-slate-900 text-slate-300 font-black text-xs sm:text-sm tracking-wide border-2 border-slate-800 backdrop-blur-md shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>AJUSTES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center text-[11px] text-slate-500">
        Three.js WebGL &bull; Iluminación dinámica &bull; Optimizado para Android y PC
      </div>
    </div>
  );
};

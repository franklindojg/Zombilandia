/**
 * Mansión del Terror 3D - HorrorResultModal
 * Modal displayed on Player Escape (Victory) or Ghost Catch (Game Over).
 */

import React from 'react';
import { Skull, Key, RefreshCw, Trophy, ShieldCheck, Footprints } from 'lucide-react';

interface HorrorResultModalProps {
  type: 'victory' | 'gameover';
  keysCollected: number;
  totalKeys: number;
  onRestart: () => void;
}

export const HorrorResultModal: React.FC<HorrorResultModalProps> = ({
  type,
  keysCollected,
  totalKeys,
  onRestart,
}) => {
  const isVictory = type === 'victory';

  return (
    <div
      id="horror-result-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none"
    >
      <div
        className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border-2 shadow-2xl flex flex-col items-center text-center ${
          isVictory
            ? 'bg-slate-950/95 border-emerald-500/80 shadow-emerald-500/20'
            : 'bg-red-950/90 border-red-600/80 shadow-red-900/40'
        }`}
      >
        {/* Top Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 border-2 shadow-xl ${
            isVictory
              ? 'bg-emerald-950 border-emerald-400 text-emerald-400 shadow-emerald-500/30 animate-bounce'
              : 'bg-red-900/60 border-red-500 text-red-400 shadow-red-600/40 animate-pulse'
          }`}
        >
          {isVictory ? <Trophy className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl font-black tracking-wider uppercase mb-2 ${
            isVictory ? 'text-emerald-300' : 'text-red-300'
          }`}
        >
          {isVictory ? '¡HAS ESCAPADO CON VIDA!' : '¡EL FANTASMA TE HA ATRAPADO!'}
        </h2>

        {/* Subtitle / Story description */}
        <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed max-w-md">
          {isVictory
            ? 'Lograste reunir las 3 llaves antiguas, abrir la gran puerta principal de la mansión y escapar en medio de la niebla nocturna.'
            : 'El espectro errante de la mansión te alcanzó en los oscuros pasillos. Tu alma ahora pertenece a esta casa maldita.'}
        </p>

        {/* Stats card */}
        <div className="w-full bg-black/60 rounded-2xl p-4 border border-white/10 mb-6 flex justify-around items-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Llaves
            </span>
            <span className="text-xl font-black text-amber-300">
              {keysCollected} / {totalKeys}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              {isVictory ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Footprints className="w-3.5 h-3.5 text-rose-400" />
              )}
              Destino
            </span>
            <span
              className={`text-base font-black ${
                isVictory ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isVictory ? 'Sobreviviente' : 'Condenado'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-horror-restart"
          onClick={onRestart}
          className={`w-full py-3.5 px-6 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all text-white border-2 ${
            isVictory
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-300 shadow-emerald-600/40'
              : 'bg-gradient-to-r from-red-700 to-rose-800 hover:from-red-600 hover:to-rose-700 border-red-400 shadow-red-700/50'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span>{isVictory ? 'JUGAR DE NUEVO' : 'INTENTAR DE NUEVO'}</span>
        </button>
      </div>
    </div>
  );
};

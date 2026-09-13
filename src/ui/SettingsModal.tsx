/**
 * BloxVerse 3D - SettingsModal
 * Controls for Android optimization levels (LOW/MED/HIGH), volumes, sensitivity, and FPS toggle.
 */

import React from 'react';
import { X, Volume2, Monitor, Compass } from 'lucide-react';
import { GameSettings, GraphicQuality } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (s: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdate,
  onClose,
}) => {
  return (
    <div id="settings-modal-root" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-white/20 shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-black text-white tracking-wide">AJUSTES</h2>
          </div>
          <button
            id="btn-close-settings-modal"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Graphics Quality */}
          <div>
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-2">
              Rendimiento Gráfico
            </span>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(['low', 'medium', 'high'] as GraphicQuality[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => onUpdate({ quality: tier })}
                  className={`py-2 rounded-xl font-black text-xs uppercase tracking-wider transition ${
                    settings.quality === tier
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 border-2 border-white/60'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              {settings.quality === 'low' && '📱 LOW: Ideal para Android básico. Pixel ratio 1.0, sin sombras dinámicas.'}
              {settings.quality === 'medium' && '⚡ MEDIUM: Recomendado para la mayoría de móviles y tablets. Buen equilibrio.'}
              {settings.quality === 'high' && '✨ HIGH: Máxima fidelidad para PC y móviles potentes con sombras suaves.'}
            </div>
          </div>

          {/* Sound & Music Volumes */}
          <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                Volumen y Efectos
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Efectos de Sonido (SFX)</span>
                <span>{Math.round(settings.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.soundVolume}
                onChange={(e) => onUpdate({ soundVolume: parseFloat(e.target.value) })}
                className="w-full accent-sky-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Música de Fondo</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdate({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-sky-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Camera Sensitivity & FPS */}
          <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
                Cámara & Opciones
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Sensibilidad de Cámara</span>
                <span>{settings.cameraSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={settings.cameraSensitivity}
                onChange={(e) => onUpdate({ cameraSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Mostrar Contador de FPS</span>
              <button
                onClick={() => onUpdate({ showFps: !settings.showFps })}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  settings.showFps ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {settings.showFps ? 'ACTIVADO' : 'DESACTIVADO'}
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-settings-close-bottom"
          onClick={onClose}
          className="mt-6 w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs sm:text-sm tracking-wider border border-white/10 active:scale-95 transition-all"
        >
          GUARDAR Y SALIR
        </button>
      </div>
    </div>
  );
};

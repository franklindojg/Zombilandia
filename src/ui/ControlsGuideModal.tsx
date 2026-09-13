/**
 * BloxVerse 3D - ControlsGuideModal
 * Detailed controls cheat sheet for PC keyboard/mouse and Android touch/joystick.
 */

import React from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';

interface ControlsGuideModalProps {
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ onClose }) => {
  return (
    <div id="controls-guide-modal-root" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border-2 border-sky-400/40 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h2 className="text-xl font-black text-white tracking-wide">GUÍA DE CONTROLES</h2>
          <button
            id="btn-close-controls-guide"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* PC Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10">
            <div className="flex items-center gap-2 text-sky-400 font-black text-sm mb-3">
              <Monitor className="w-4 h-4" />
              <span>PC / ESCRITORIO</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">W A S D</kbd>
                <span className="text-slate-300">Moverse</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">ESPACIO</kbd>
                <span className="text-slate-300">Saltar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">SHIFT</kbd>
                <span className="text-slate-300">Correr</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">RATÓN</kbd>
                <span className="text-slate-300">Girar Cámara</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">RUEDA</kbd>
                <span className="text-slate-300">Zoom Cámara</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">E</kbd>
                <span className="text-slate-300">Interactuar</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-white/20 font-mono font-bold text-amber-300">ESC</kbd>
                <span className="text-slate-300">Menú de Pausa</span>
              </div>
            </div>
          </div>

          {/* Android Controls */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-3">
              <Smartphone className="w-4 h-4" />
              <span>MÓVIL / ANDROID</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Joystick Izq:</span>
                <span>Arrastra el círculo analógico para caminar o correr.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Zona Derecha:</span>
                <span>Desliza el dedo por la pantalla para orbitar la cámara 360°.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón SALTO:</span>
                <span>Toca para saltar plataformas o rebotar en trampolines.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón CORRER:</span>
                <span>Alterna el modo correr para ganar velocidad.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón ACCIÓN:</span>
                <span>Se ilumina al acercarte a NPCs o cofres para hablar o abrir.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-controls-guide-close"
          onClick={onClose}
          className="mt-6 w-full py-3 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs sm:text-sm tracking-wider shadow-lg shadow-sky-500/30 border border-white/40 active:scale-95 transition-all"
        >
          ¡ENTENDIDO!
        </button>
      </div>
    </div>
  );
};

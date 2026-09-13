/**
 * Mansión del Terror 3D - ControlsGuideModal
 * Detailed controls and survival instructions for PC and Mobile/Android.
 */

import React from 'react';
import { X, Smartphone, Monitor, Skull, Flashlight, Key, DoorOpen } from 'lucide-react';

interface ControlsGuideModalProps {
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ onClose }) => {
  return (
    <div
      id="controls-guide-modal-root"
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
    >
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-950 border-2 border-red-500/50 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-900/40 mb-4">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-500" />
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
              GUÍA DE SUPERVIVENCIA
            </h2>
          </div>
          <button
            id="btn-close-controls-guide"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-900 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Objective */}
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 mb-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
          <strong className="text-red-400 block mb-1">🎯 OBJETIVO:</strong>
          Debes recorrer la inmensa mansión, abrir puertas y encontrar las{' '}
          <span className="text-amber-300 font-bold">3 llaves antiguas</span> (Biblioteca,
          Dormitorio y Sótano). Luego regresa a la gran puerta principal del vestíbulo para escapar.
          <strong className="text-rose-400 block mt-2">⚠️ ¡CUIDADO CON EL FANTASMA!</strong>
          El fantasma patrulla la mansión y reacciona al ruido de tus pasos cuando corres. Si te ve,
          te perseguirá a gran velocidad. Usa tu linterna para alumbrar, pero recuerda que cuando se
          acerque, tu luz comenzará a fallar.
        </div>

        <div className="flex flex-col gap-4">
          {/* PC Controls */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm mb-3">
              <Monitor className="w-4 h-4" />
              <span>PC / ESCRITORIO</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  W A S D
                </kbd>
                <span className="text-slate-300">Caminar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  SHIFT
                </kbd>
                <span className="text-slate-300">¡Correr! (Gasta energía)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  F
                </kbd>
                <span className="text-slate-300">Linterna On/Off</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  E
                </kbd>
                <span className="text-slate-300">Abrir Puertas / Llaves</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  ESPACIO
                </kbd>
                <span className="text-slate-300">Saltar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 rounded bg-slate-900 border border-white/20 font-mono font-bold text-amber-300">
                  RATÓN
                </kbd>
                <span className="text-slate-300">Mirar y apuntar linterna</span>
              </div>
            </div>
          </div>

          {/* Android Controls */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm mb-3">
              <Smartphone className="w-4 h-4" />
              <span>MÓVIL / ANDROID</span>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Joystick Izq:</span>
                <span>Mover a tu personaje por las habitaciones.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Zona Pantalla:</span>
                <span>Desliza el dedo por el lado derecho para girar la cámara.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón LUZ:</span>
                <span>Enciende o apaga tu linterna táctica.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón CORRER:</span>
                <span>Aumenta velocidad para escapar del fantasma.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white min-w-28">Botón ACCIÓN:</span>
                <span>Toca para abrir/cerrar puertas y recoger llaves.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-understand-guide"
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-black text-sm tracking-wider shadow-lg active:scale-95 transition-all"
        >
          ¡ENTENDIDO, A SOBREVIVIR!
        </button>
      </div>
    </div>
  );
};

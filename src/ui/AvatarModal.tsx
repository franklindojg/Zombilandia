/**
 * BloxVerse 3D - AvatarModal
 * Customizer modal for skin, shirt, pants, hair colors, and block accessories.
 */

import React from 'react';
import { X, Check } from 'lucide-react';
import { PlayerAppearance } from '../types';

interface AvatarModalProps {
  appearance: PlayerAppearance;
  onChange: (app: Partial<PlayerAppearance>) => void;
  onClose: () => void;
}

const SKIN_PALETTE = ['#fed7aa', '#fde047', '#fb923c', '#d97706', '#854d0e', '#38bdf8'];
const SHIRT_PALETTE = ['#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0f172a', '#ffffff'];
const PANTS_PALETTE = ['#1e293b', '#1e3a8a', '#065f46', '#7f1d1d', '#581c87', '#334155'];
const HAIR_PALETTE = ['#451a03', '#171717', '#eab308', '#ea580c', '#0284c7', '#ffffff'];

export const AvatarModal: React.FC<AvatarModalProps> = ({
  appearance,
  onChange,
  onClose,
}) => {
  return (
    <div id="avatar-modal-root" className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border-2 border-sky-400/40 shadow-2xl flex flex-col my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">PERSONALIZAR AVATAR</h2>
            <p className="text-xs text-slate-400">Elige los colores y accesorios de tu personaje de bloques</p>
          </div>
          <button
            id="btn-close-avatar-modal"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Color Camisa */}
          <div>
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-2">
              Color de Camisa / Torso
            </span>
            <div className="flex flex-wrap gap-2.5">
              {SHIRT_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ shirtColor: c })}
                  className="w-8 h-8 rounded-xl border-2 transition-transform active:scale-90 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: c,
                    borderColor: appearance.shirtColor === c ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    transform: appearance.shirtColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {appearance.shirtColor === c && <Check className="w-4 h-4 text-slate-900 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Pantalón */}
          <div>
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-2">
              Color de Pantalón / Piernas
            </span>
            <div className="flex flex-wrap gap-2.5">
              {PANTS_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ pantsColor: c })}
                  className="w-8 h-8 rounded-xl border-2 transition-transform active:scale-90 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: c,
                    borderColor: appearance.pantsColor === c ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    transform: appearance.pantsColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {appearance.pantsColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Piel / Cabeza */}
          <div>
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-2">
              Tono de Piel
            </span>
            <div className="flex flex-wrap gap-2.5">
              {SKIN_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ skinColor: c })}
                  className="w-8 h-8 rounded-xl border-2 transition-transform active:scale-90 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: c,
                    borderColor: appearance.skinColor === c ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    transform: appearance.skinColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {appearance.skinColor === c && <Check className="w-4 h-4 text-slate-900 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Color Cabello */}
          <div>
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-2">
              Color de Cabello
            </span>
            <div className="flex flex-wrap gap-2.5">
              {HAIR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ hairColor: c })}
                  className="w-8 h-8 rounded-xl border-2 transition-transform active:scale-90 flex items-center justify-center shadow-md"
                  style={{
                    backgroundColor: c,
                    borderColor: appearance.hairColor === c ? '#ffffff' : 'rgba(255,255,255,0.2)',
                    transform: appearance.hairColor === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {appearance.hairColor === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Accesorios Toggle */}
          <div className="pt-2 border-t border-white/10">
            <span className="text-xs font-black text-sky-300 uppercase tracking-wider block mb-3">
              Accesorios
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onChange({ hasHat: !appearance.hasHat })}
                className={`p-3 rounded-2xl border-2 text-xs font-bold tracking-wide transition flex items-center justify-between ${
                  appearance.hasHat
                    ? 'bg-sky-500/30 border-sky-400 text-white'
                    : 'bg-slate-800/60 border-white/10 text-slate-400'
                }`}
              >
                <span>Gorra Deportiva</span>
                <span className="text-[11px] uppercase font-black">{appearance.hasHat ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => onChange({ hasBackpack: !appearance.hasBackpack })}
                className={`p-3 rounded-2xl border-2 text-xs font-bold tracking-wide transition flex items-center justify-between ${
                  appearance.hasBackpack
                    ? 'bg-sky-500/30 border-sky-400 text-white'
                    : 'bg-slate-800/60 border-white/10 text-slate-400'
                }`}
              >
                <span>Mochila Explorador</span>
                <span className="text-[11px] uppercase font-black">{appearance.hasBackpack ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          id="btn-avatar-done"
          onClick={onClose}
          className="mt-6 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-black text-sm tracking-wider shadow-lg shadow-emerald-500/30 border-2 border-white/60 active:scale-95 transition-all"
        >
          GUARDAR Y CONTINUAR
        </button>
      </div>
    </div>
  );
};

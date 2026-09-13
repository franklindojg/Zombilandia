/**
 * BloxVerse 3D - HUD
 * Modern, clean, responsive heads-up display displaying Health, Coins, Checkpoints,
 * Game Mode status, Dialogue box, and action controls.
 */

import React from 'react';
import { Heart, Coins, Pause, User, Sparkles, X, ChevronRight } from 'lucide-react';
import { DialogueNode, GameModeType } from '../types';

interface HUDProps {
  health: number;
  maxHealth: number;
  coins: number;
  fps: number;
  showFps: boolean;
  gameMode: GameModeType;
  modeTimer: number;
  modeScore: number;
  modeStage: number;
  toastMessage: string | null;
  interactPrompt: string | null;
  activeDialogue: DialogueNode | null;
  onCloseDialogue: () => void;
  onPauseClick: () => void;
  onAvatarClick: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  coins,
  fps,
  showFps,
  gameMode,
  modeTimer,
  modeScore,
  modeStage,
  toastMessage,
  interactPrompt,
  activeDialogue,
  onCloseDialogue,
  onPauseClick,
  onAvatarClick,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div id="game-hud-root" className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Health & Coins */}
        <div className="flex flex-col gap-2.5">
          {/* Health Bar */}
          <div
            id="hud-health-container"
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/15 shadow-lg w-44 sm:w-56"
          >
            <div className="relative flex items-center justify-center text-rose-500 animate-pulse">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-black text-rose-300 mb-1 tracking-wider">
                <span>VIDA</span>
                <span>{Math.round(health)}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 transition-all duration-200"
                  style={{ width: `${healthPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coins Badge */}
          <div
            id="hud-coins-container"
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-amber-400/30 shadow-lg w-fit"
          >
            <Coins className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="font-black text-amber-300 text-sm tracking-wide">{coins}</span>
            <span className="text-[10px] uppercase font-bold text-amber-500/90 tracking-wider">Monedas</span>
          </div>
        </div>

        {/* Top Center: Game Mode / Challenge Status */}
        {gameMode !== 'SANDBOX' && (
          <div
            id="hud-mode-banner"
            className="hidden sm:flex flex-col items-center px-4 py-2 rounded-2xl bg-slate-900/90 border border-sky-400/40 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center gap-2 text-xs font-black tracking-widest text-sky-400 uppercase">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{gameMode === 'OBBY' ? `OBBY: ETAPA ${modeStage}` : 'FIEBRE DE MONEDAS'}</span>
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {gameMode === 'OBBY' ? `${modeTimer.toFixed(1)}s` : `${Math.ceil(modeTimer)}s restante`}
            </div>
          </div>
        )}

        {/* Top Right: Actions & Performance */}
        <div className="pointer-events-auto flex items-center gap-2">
          {showFps && (
            <div
              id="hud-fps-badge"
              className="px-2.5 py-1 rounded-xl bg-slate-900/70 border border-white/10 text-[11px] font-mono font-bold text-emerald-400 shadow"
            >
              {fps} FPS
            </div>
          )}

          {/* Avatar Customizer Button */}
          <button
            id="btn-hud-avatar"
            onClick={onAvatarClick}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-sky-400 border border-white/15 backdrop-blur-md shadow-lg active:scale-90 transition-all"
            title="Personalizar Avatar"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Pause Menu Button */}
          <button
            id="btn-hud-pause"
            onClick={onPauseClick}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 backdrop-blur-md shadow-lg active:scale-90 transition-all"
            title="Pausar Juego"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Toast Banner (Checkpoints, Stage Complete, etc.) */}
      {toastMessage && (
        <div
          id="hud-toast-banner"
          className="self-center px-6 py-2.5 rounded-full bg-emerald-500/90 text-white font-black text-sm tracking-wide shadow-2xl border-2 border-white/80 animate-bounce"
        >
          {toastMessage}
        </div>
      )}

      {/* Interaction Prompt (for PC and clarity) */}
      {interactPrompt && !activeDialogue && (
        <div
          id="hud-interact-prompt"
          className="self-center mb-8 px-5 py-2 rounded-2xl bg-slate-900/90 text-sky-300 font-bold text-sm tracking-wide border border-sky-400/50 shadow-xl backdrop-blur-md flex items-center gap-2 animate-pulse"
        >
          <span className="w-6 h-6 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-xs">E</span>
          <span>{interactPrompt.replace(/^E\s*-\s*/, '')}</span>
        </div>
      )}

      {/* NPC Dialogue Box Modal */}
      {activeDialogue && (
        <div
          id="hud-dialogue-modal"
          className="pointer-events-auto self-center w-full max-w-xl p-5 rounded-3xl bg-slate-900/95 border-2 border-sky-400/60 shadow-2xl backdrop-blur-xl mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping" />
              <h3 className="font-black text-sky-300 tracking-wide text-base">{activeDialogue.speaker}</h3>
            </div>
            <button
              id="btn-close-dialogue"
              onClick={onCloseDialogue}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-slate-100 text-sm sm:text-base leading-relaxed mb-4">
            "{activeDialogue.text}"
          </p>

          {activeDialogue.options && activeDialogue.options.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeDialogue.options.map((opt, i) => (
                <button
                  key={i}
                  id={`dialogue-option-${i}`}
                  onClick={() => {
                    if (opt.action) opt.action();
                    onCloseDialogue();
                  }}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-sky-600 text-left text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition flex items-center justify-between group border border-white/5 hover:border-sky-300"
                >
                  <span>{opt.text}</span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom spacer (keeps HUD above mobile buttons) */}
      <div className="h-2" />
    </div>
  );
};

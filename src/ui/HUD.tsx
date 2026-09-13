/**
 * Mansión del Terror 3D - Horror HUD
 * Atmospheric horror heads-up display featuring Health / Sanity, Stamina for running,
 * Ghost Radar & Proximity Heartbeat alert, 3 Ancient Keys escape tracker,
 * Flashlight indicator, and interactive door prompts.
 */

import React from 'react';
import {
  Heart,
  Zap,
  Key,
  Pause,
  User,
  Flashlight,
  Skull,
  Eye,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { GhostState, HorrorGameState } from '../types';

interface HUDProps {
  health: number;
  maxHealth: number;
  fps: number;
  showFps: boolean;
  horrorState: HorrorGameState;
  toastMessage: string | null;
  interactPrompt: string | null;
  onPauseClick: () => void;
  onAvatarClick: () => void;
  onFlashlightClick?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  fps,
  showFps,
  horrorState,
  toastMessage,
  interactPrompt,
  onPauseClick,
  onAvatarClick,
  onFlashlightClick,
}) => {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const staminaPercent = Math.max(
    0,
    Math.min(100, (horrorState.stamina / horrorState.maxStamina) * 100)
  );

  // Proximity to ghost (0 = right on top of player, 1 = far away)
  const isGhostNear = horrorState.ghostDistance < 20;
  const isGhostChasing = horrorState.ghostState === GhostState.CHASE || horrorState.ghostState === GhostState.ATTACK;
  const dangerLevel = Math.max(0, Math.min(1, (24 - horrorState.ghostDistance) / 24));

  // Blood vignette intensity when damaged or ghost is near
  const vignetteAlpha = isGhostChasing
    ? Math.min(0.75, dangerLevel * 0.8)
    : health < 40
    ? (40 - health) / 60
    : 0;

  return (
    <>
      {/* Dynamic Red Horror Vignette on edge of screen */}
      {vignetteAlpha > 0.05 && (
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(136,19,19,${vignetteAlpha}) 95%, rgba(68,0,0,${vignetteAlpha * 1.2}) 100%)`,
          }}
        />
      )}

      <div
        id="horror-hud-root"
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 select-none"
      >
        {/* Top Header Bar */}
        <div className="flex items-start justify-between w-full">
          {/* Top Left: Health & Stamina Bars */}
          <div className="flex flex-col gap-2">
            {/* Health / Sanity */}
            <div
              id="hud-health-container"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-red-950/80 shadow-2xl w-48 sm:w-60"
            >
              <div
                className={`relative flex items-center justify-center text-rose-500 ${
                  isGhostNear || health < 40 ? 'animate-ping' : ''
                }`}
              >
                <Heart className="w-6 h-6 fill-rose-600 text-rose-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-[11px] font-black text-rose-300 mb-1 tracking-wider">
                  <span>VIDA / CORDURA</span>
                  <span>{Math.round(health)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-red-900/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-800 via-rose-600 to-amber-500 transition-all duration-200"
                    style={{ width: `${healthPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stamina for Sprinting away from the Ghost */}
            <div
              id="hud-stamina-container"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-cyan-950/80 shadow-xl w-48 sm:w-60"
            >
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-bold text-cyan-300 mb-0.5 tracking-wider">
                  <span>ENERGÍA (SHIFT)</span>
                  <span>{Math.round(horrorState.stamina)}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-cyan-900/40">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      horrorState.stamina < 25
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                    }`}
                    style={{ width: `${staminaPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Center: Ghost Alert & Keys Status */}
          <div className="flex flex-col items-center gap-2">
            {/* Ghost Threat Status Pill */}
            <div
              id="hud-ghost-threat-badge"
              className={`px-4 py-1.5 rounded-full border backdrop-blur-md shadow-2xl flex items-center gap-2 transition-all duration-300 ${
                horrorState.ghostState === GhostState.ATTACK
                  ? 'bg-red-700/90 border-red-400 text-white animate-bounce'
                  : horrorState.ghostState === GhostState.CHASE
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 animate-pulse'
                  : horrorState.ghostState === GhostState.ALERT
                  ? 'bg-amber-950/80 border-amber-500/70 text-amber-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}
            >
              {isGhostChasing ? (
                <Skull className="w-4 h-4 text-red-400 animate-spin" />
              ) : horrorState.ghostState === GhostState.ALERT ? (
                <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : (
                <Flame className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-xs font-black tracking-widest uppercase">
                {horrorState.ghostState === GhostState.ATTACK
                  ? '¡EL FANTASMA TE ATACA!'
                  : horrorState.ghostState === GhostState.CHASE
                  ? '¡CORRE! EL FANTASMA TE SIGUE'
                  : horrorState.ghostState === GhostState.ALERT
                  ? 'EL FANTASMA ESCUCHÓ ALGO...'
                  : 'MANSIÓN EN SILENCIO'}
              </span>
            </div>

            {/* Keys Collected Progress */}
            <div
              id="hud-keys-badge"
              className="px-3.5 py-1.5 rounded-2xl bg-black/85 border border-amber-500/40 backdrop-blur-md shadow-xl flex items-center gap-2.5"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black text-amber-300 tracking-wider">
                LLAVES DE ESCAPE: {horrorState.keysCollected} / {horrorState.totalKeys}
              </span>
              <div className="flex gap-1">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      idx < horrorState.keysCollected
                        ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top Right: Actions & Flashlight State */}
          <div className="pointer-events-auto flex items-center gap-2">
            {showFps && (
              <div
                id="hud-fps-badge"
                className="px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 text-[11px] font-mono font-bold text-emerald-400 shadow"
              >
                {fps} FPS
              </div>
            )}

            {/* Flashlight Indicator / Toggle */}
            <button
              id="btn-hud-flashlight"
              onClick={onFlashlightClick}
              className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-lg active:scale-90 transition-all ${
                horrorState.isFlashlightOn
                  ? 'bg-amber-500/30 border-amber-400/80 text-amber-300 shadow-amber-500/20'
                  : 'bg-black/80 border-white/10 text-slate-500'
              }`}
              title="Linterna (F)"
            >
              <Flashlight className="w-5 h-5" />
            </button>

            {/* Avatar Customizer Button */}
            <button
              id="btn-hud-avatar"
              onClick={onAvatarClick}
              className="p-2.5 rounded-2xl bg-black/80 hover:bg-slate-900 text-slate-300 border border-white/15 backdrop-blur-md shadow-lg active:scale-90 transition-all"
              title="Personalizar Personaje"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Pause Menu Button */}
            <button
              id="btn-hud-pause"
              onClick={onPauseClick}
              className="p-2.5 rounded-2xl bg-black/80 hover:bg-slate-900 text-white border border-white/15 backdrop-blur-md shadow-lg active:scale-90 transition-all"
              title="Pausar Juego (Esc)"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Toast Banner (Door messages, keys picked up) */}
        {toastMessage && (
          <div
            id="hud-toast-banner"
            className="self-center px-6 py-3 rounded-2xl bg-slate-950/95 text-amber-300 font-black text-sm tracking-wide shadow-2xl border-2 border-amber-500/70 animate-bounce backdrop-blur-md flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Interaction Prompt (Door, Key, Escape) */}
        {interactPrompt && (
          <div
            id="hud-interact-prompt"
            className="self-center mb-10 px-6 py-2.5 rounded-2xl bg-black/90 text-yellow-300 font-bold text-sm sm:text-base tracking-wide border-2 border-yellow-400/70 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-pulse"
          >
            <span className="w-7 h-7 rounded-lg bg-yellow-500 text-black flex items-center justify-center font-black text-xs shadow">
              E
            </span>
            <span>{interactPrompt.replace(/^E\s*-\s*/, '')}</span>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-2" />
      </div>
    </>
  );
};

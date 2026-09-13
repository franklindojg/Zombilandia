/**
 * BloxVerse 3D - GameModeManager
 * Modular game mode controller (Sandbox, Obby Speedrun, Coin Rush).
 */

import { GameModeType } from '../types';
import { SaveManager } from '../core/SaveManager';

export interface GameModeState {
  currentMode: GameModeType;
  isActive: boolean;
  timer: number;
  score: number;
  stage: number;
  message: string;
}

export class GameModeManager {
  private state: GameModeState = {
    currentMode: 'SANDBOX',
    isActive: false,
    timer: 0,
    score: 0,
    stage: 1,
    message: '¡Explora el mundo libremente!',
  };

  private onStateChangeCallback: ((state: GameModeState) => void) | null = null;

  constructor() {}

  public setOnStateChange(cb: (state: GameModeState) => void): void {
    this.onStateChangeCallback = cb;
  }

  public getState(): GameModeState {
    return { ...this.state };
  }

  public startMode(mode: GameModeType): void {
    this.state.currentMode = mode;
    this.state.isActive = true;
    this.state.timer = 0;
    this.state.score = 0;
    this.state.stage = 1;

    switch (mode) {
      case 'SANDBOX':
        this.state.message = 'Modo Libre: Explora la plaza, el lago y las colinas.';
        break;
      case 'OBBY':
        this.state.message = '¡Desafío Obby! Llega a la cima sin caer al vacío.';
        break;
      case 'COIN_RUSH':
        this.state.message = '¡Fiebre de Monedas! Recoge todas las que puedas en 60s.';
        this.state.timer = 60.0;
        break;
    }

    this.notify();
  }

  public stopMode(): void {
    this.state.isActive = false;
    this.state.currentMode = 'SANDBOX';
    this.state.message = 'Regresando a exploración libre.';
    this.notify();
  }

  public update(delta: number): void {
    if (!this.state.isActive) return;

    if (this.state.currentMode === 'OBBY') {
      this.state.timer += delta;
      this.notify();
    } else if (this.state.currentMode === 'COIN_RUSH') {
      this.state.timer = Math.max(0, this.state.timer - delta);
      if (this.state.timer <= 0) {
        this.state.isActive = false;
        this.state.message = `¡Tiempo agotado! Monedas conseguidas: ${this.state.score}`;
      }
      this.notify();
    }
  }

  public addScore(points: number): void {
    this.state.score += points;
    this.notify();
  }

  public advanceObbyStage(newStage: number): void {
    this.state.stage = newStage;
    if (newStage >= 5) {
      // Completed Obby!
      this.state.message = `¡Obby completado en ${this.state.timer.toFixed(1)}s!`;
      const save = SaveManager.getInstance();
      const best = save.getData().bestObbyTime;
      if (best === null || this.state.timer < best) {
        save.save({ bestObbyTime: Number(this.state.timer.toFixed(1)) });
      }
    }
    this.notify();
  }

  private notify(): void {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }
}

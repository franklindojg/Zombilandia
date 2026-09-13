/**
 * BloxVerse 3D - InteractionSystem
 * Proximity-based interaction detection for NPCs, chests, signs, and world triggers.
 */

import * as THREE from 'three';
import { InteractionTarget } from '../types';
import { AudioManager } from '../core/AudioManager';

export class InteractionSystem {
  private targets: InteractionTarget[] = [];
  public currentTarget: InteractionTarget | null = null;
  public interactionDistance: number = 3.2;

  constructor() {}

  public clear(): void {
    this.targets = [];
    this.currentTarget = null;
  }

  public registerTarget(target: InteractionTarget): void {
    this.targets.push(target);
  }

  public unregisterTarget(id: string): void {
    this.targets = this.targets.filter((t) => t.id !== id);
    if (this.currentTarget?.id === id) {
      this.currentTarget = null;
    }
  }

  public update(playerPos: THREE.Vector3): void {
    let closest: InteractionTarget | null = null;
    let minDistSq = this.interactionDistance * this.interactionDistance;

    for (let i = 0; i < this.targets.length; i++) {
      const t = this.targets[i];
      const dx = playerPos.x - t.position[0];
      const dy = playerPos.y - t.position[1];
      const dz = playerPos.z - t.position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = t;
      }
    }

    this.currentTarget = closest;
  }

  public triggerCurrentInteraction(): boolean {
    if (this.currentTarget) {
      AudioManager.getInstance().playInteract();
      this.currentTarget.onInteract();
      return true;
    }
    return false;
  }
}

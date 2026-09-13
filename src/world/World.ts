/**
 * Mansión del Terror 3D - World
 * Master horror world coordinator containing the Haunted Mansion,
 * the Chasing Ghost entity, interactive doors, ancient keys, and escape trigger.
 */

import * as THREE from 'three';
import { HauntedMansionWorld } from './HauntedMansionWorld';
import { Ghost } from '../entities/Ghost';
import { CollisionManager } from './CollisionManager';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { CollectibleManager } from '../entities/Collectible';
import { InteractionSystem } from '../systems/InteractionSystem';
import { NPC } from '../entities/NPC';
import { GhostState, MansionDoor, MansionKey } from '../types';

export class World {
  public scene: THREE.Scene;
  public mansion: HauntedMansionWorld;
  public ghost: Ghost;

  // Systems for game compatibility
  public checkpointSystem: CheckpointSystem;
  public collectibleManager: CollectibleManager;
  public interactionSystem: InteractionSystem;
  public npcs: NPC[] = [];

  // Horror game status
  public currentNearDoor: MansionDoor | null = null;
  public currentNearKey: MansionKey | null = null;
  public keysCollected: number = 0;
  public totalKeys: number = 3;
  public hasEscaped: boolean = false;

  // Callbacks
  public onKeyCollected?: (key: MansionKey) => void;
  public onDoorToggled?: (door: MansionDoor) => void;
  public onPlayerEscaped?: () => void;
  public onGhostCatch?: (damage: number) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Reset collisions
    CollisionManager.getInstance().clear();

    // 1. Build Haunted Mansion (Paredes inmensas, habitaciones oscuras, puertas y candelabros)
    this.mansion = new HauntedMansionWorld(this.scene);

    // 2. Spawn Chasing Ghost in the back corridors
    this.ghost = new Ghost(new THREE.Vector3(0, 1.8, -36));
    this.scene.add(this.ghost.group);

    // 3. Subsidiary systems
    this.checkpointSystem = new CheckpointSystem();
    this.collectibleManager = new CollectibleManager(this.scene);
    this.interactionSystem = this.mansion.interactionSystem;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    cameraDir: THREE.Vector3,
    isPlayerRunning: boolean = false,
    isFlashlightOn: boolean = true
  ): void {
    const dt = Math.min(delta, 0.05);

    // 1. Update Haunted Mansion environment (candelabras, clock, doors)
    const { nearDoor, nearKey } = this.mansion.update(dt, playerPos);
    this.currentNearDoor = nearDoor;
    this.currentNearKey = nearKey;

    // 2. Update Ghost AI & chasing mechanics
    this.ghost.update(dt, playerPos, isPlayerRunning, isFlashlightOn, (damage) => {
      if (this.onGhostCatch) {
        this.onGhostCatch(damage);
      }
    });

    // 3. Proximity check for Escape Front Door
    if (this.keysCollected >= this.totalKeys && !this.hasEscaped) {
      // Near front exit door (x: -2 to 2, z: 8 to 11)
      if (Math.abs(playerPos.x) < 3.5 && playerPos.z > 7.5 && playerPos.z < 11.5) {
        this.hasEscaped = true;
        if (this.onPlayerEscaped) {
          this.onPlayerEscaped();
        }
      }
    }
  }

  public getInteractionPrompt(hasKeyCheck: (id?: string) => boolean): string | null {
    if (this.currentNearKey) {
      return `E - Recoger ${this.currentNearKey.name} (${this.currentNearKey.locationName})`;
    }

    if (this.currentNearDoor) {
      const d = this.currentNearDoor;
      if (d.id === 'main_exit_door') {
        if (this.keysCollected < this.totalKeys) {
          return `🔒 Salida Cerrada (Llaves: ${this.keysCollected}/${this.totalKeys})`;
        }
        return 'E - ¡ESCAPAR POR LA PUERTA PRINCIPAL!';
      }

      if (d.isLocked) {
        const canUnlock = hasKeyCheck(d.requiredKeyId);
        return canUnlock ? `E - Desbloquear ${d.name}` : `🔒 Cerrada: ${d.name}`;
      }

      return d.isOpen ? `E - Cerrar ${d.name}` : `E - Abrir ${d.name}`;
    }

    return null;
  }

  public handleInteract(
    hasKeyCheck: (id?: string) => boolean,
    onPickupKey: (keyId: string) => void
  ): { success: boolean; message: string } {
    // 1. Check Key pickup
    if (this.currentNearKey) {
      const collected = this.mansion.doorSystem.collectKey(this.currentNearKey.id);
      if (collected) {
        this.keysCollected++;
        onPickupKey(collected.id);
        if (this.onKeyCollected) {
          this.onKeyCollected(collected);
        }
        return {
          success: true,
          message: `🔑 ¡Obtuviste la ${collected.name}! (${this.keysCollected}/${this.totalKeys} llaves)`,
        };
      }
    }

    // 2. Check Door interaction
    if (this.currentNearDoor) {
      const d = this.currentNearDoor;

      if (d.id === 'main_exit_door') {
        if (this.keysCollected < this.totalKeys) {
          return {
            success: false,
            message: `⚠️ Necesitas las 3 llaves para abrir la salida (${this.keysCollected}/${this.totalKeys})`,
          };
        } else {
          // Open main exit
          this.mansion.doorSystem.toggleDoor('main_exit_door', () => true);
          this.hasEscaped = true;
          if (this.onPlayerEscaped) {
            this.onPlayerEscaped();
          }
          return {
            success: true,
            message: '🎉 ¡ABRISTE LA PUERTA PRINCIPAL! ¡HAS ESCAPADO!',
          };
        }
      }

      const res = this.mansion.doorSystem.toggleDoor(d.id, hasKeyCheck);
      if (this.onDoorToggled) {
        this.onDoorToggled(d);
      }
      return res;
    }

    return { success: false, message: '' };
  }

  public getGhostDistance(): number {
    return this.ghost.distanceToPlayer;
  }

  public getGhostState(): GhostState {
    return this.ghost.state;
  }

  public respawnGhost(): void {
    this.ghost.teleport(new THREE.Vector3(0, 1.8, -36));
  }
}

/**
 * BloxVerse 3D - CollisionManager
 * Lightweight custom physics & trigger system utilizing simple primitives (AABB / Cylinders).
 * Decoupled from visual meshes for high mobile performance and future Rapier.js compatibility.
 */

import * as THREE from 'three';
import { Collider } from '../types';

export class CollisionManager {
  private static instance: CollisionManager | null = null;
  private colliders: Collider[] = [];
  private dynamicColliders: Collider[] = [];

  private constructor() {}

  public static getInstance(): CollisionManager {
    if (!CollisionManager.instance) {
      CollisionManager.instance = new CollisionManager();
    }
    return CollisionManager.instance;
  }

  public clear(): void {
    this.colliders = [];
    this.dynamicColliders = [];
  }

  public addCollider(collider: Collider): void {
    this.colliders.push(collider);
  }

  public removeCollider(id: string): void {
    this.colliders = this.colliders.filter((c) => c.id !== id);
    this.dynamicColliders = this.dynamicColliders.filter((c) => c.id !== id);
  }

  public addDynamicCollider(collider: Collider): void {
    this.dynamicColliders.push(collider);
  }

  public updateDynamicCollider(id: string, bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }): void {
    const col = this.dynamicColliders.find((c) => c.id === id);
    if (col) {
      Object.assign(col, bounds);
    }
  }

  /**
   * Check if player's base touches a solid surface.
   */
  public checkGround(
    posX: number,
    posY: number,
    posZ: number,
    skinWidth: number = 0.45,
    maxStepDown: number = 0.35
  ): { isGrounded: boolean; groundY: number; collider: Collider | null } {
    let highestGround = -Infinity;
    let foundCollider: Collider | null = null;

    const all = [...this.colliders, ...this.dynamicColliders];

    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      if (c.type === 'hazard') continue; // Hazards don't provide solid ground

      // Check XZ overlap with margin
      if (
        posX + skinWidth > c.minX &&
        posX - skinWidth < c.maxX &&
        posZ + skinWidth > c.minZ &&
        posZ - skinWidth < c.maxZ
      ) {
        // Check if player's feet are within landing range of the top of this box
        const topY = c.maxY;
        if (posY >= topY - 0.2 && posY <= topY + maxStepDown) {
          if (topY > highestGround) {
            highestGround = topY;
            foundCollider = c;
          }
        }
      }
    }

    if (highestGround !== -Infinity) {
      return { isGrounded: true, groundY: highestGround, collider: foundCollider };
    }

    return { isGrounded: false, groundY: 0, collider: null };
  }

  /**
   * Resolve horizontal movement against solid walls with sliding.
   */
  public resolveHorizontal(
    oldX: number,
    oldZ: number,
    newX: number,
    newZ: number,
    posY: number,
    height: number = 1.6,
    radius: number = 0.4
  ): { resolvedX: number; resolvedZ: number; hitWall: boolean } {
    let currentX = newX;
    let currentZ = newZ;
    let hitWall = false;

    const all = [...this.colliders, ...this.dynamicColliders];

    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      if (c.type === 'hazard' || c.type === 'checkpoint' || c.type === 'trampoline') continue;

      // Vertical overlap check
      if (posY + height < c.minY || posY > c.maxY) continue;

      // Test X axis collision
      if (
        currentX + radius > c.minX &&
        currentX - radius < c.maxX &&
        oldZ + radius > c.minZ &&
        oldZ - radius < c.maxZ
      ) {
        // Clamp X back to edge
        if (oldX < c.minX) {
          currentX = c.minX - radius;
        } else if (oldX > c.maxX) {
          currentX = c.maxX + radius;
        }
        hitWall = true;
      }

      // Test Z axis collision
      if (
        currentX + radius > c.minX &&
        currentX - radius < c.maxX &&
        currentZ + radius > c.minZ &&
        currentZ - radius < c.maxZ
      ) {
        // Clamp Z back to edge
        if (oldZ < c.minZ) {
          currentZ = c.minZ - radius;
        } else if (oldZ > c.maxZ) {
          currentZ = c.maxZ + radius;
        }
        hitWall = true;
      }
    }

    return { resolvedX: currentX, resolvedZ: currentZ, hitWall };
  }

  /**
   * Check triggers (hazards, checkpoints, trampolines)
   */
  public checkTriggers(posX: number, posY: number, posZ: number, radius: number = 0.4, height: number = 1.5): Collider[] {
    const hits: Collider[] = [];
    const all = [...this.colliders, ...this.dynamicColliders];

    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      if (
        posX + radius > c.minX &&
        posX - radius < c.maxX &&
        posY + height > c.minY &&
        posY < c.maxY &&
        posZ + radius > c.minZ &&
        posZ - radius < c.maxZ
      ) {
        hits.push(c);
      }
    }

    return hits;
  }
}

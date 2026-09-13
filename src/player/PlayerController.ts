/**
 * BloxVerse 3D - PlayerController
 * Unifies inputs, camera-relative movement orientation, state detection, and animations.
 */

import * as THREE from 'three';
import { Player } from './Player';
import { InputState } from '../types';
import { AudioManager } from '../core/AudioManager';
import { CollisionManager } from '../world/CollisionManager';

export class PlayerController {
  private player: Player;
  private wasGrounded: boolean = true;
  private wasJumping: boolean = false;
  private targetRotationY: number = 0;

  constructor(player: Player) {
    this.player = player;
  }

  public update(delta: number, input: InputState, cameraYaw: number): void {
    // 1. Calculate camera-relative movement direction
    const moveDir = new THREE.Vector2(0, 0);

    if (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveY) > 0.05) {
      // Camera forward vector in XZ plane
      const fwdX = -Math.sin(cameraYaw);
      const fwdZ = -Math.cos(cameraYaw);

      // Camera right vector in XZ plane
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      // Desired world direction
      const worldDirX = fwdX * input.moveY + rightX * input.moveX;
      const worldDirZ = fwdZ * input.moveY + rightZ * input.moveX;

      const len = Math.hypot(worldDirX, worldDirZ);
      if (len > 0.001) {
        moveDir.set(worldDirX / len, worldDirZ / len);

        // Smoothly rotate character to face travel direction
        this.targetRotationY = Math.atan2(worldDirX, worldDirZ);
      }
    }

    // Smooth visual mesh rotation
    if (moveDir.lengthSq() > 0.01) {
      let diff = this.targetRotationY - this.player.visualMesh.rotation.y;
      // Wrap angle between -PI and PI
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.player.visualMesh.rotation.y += diff * Math.min(1, delta * 16);
    }

    // 2. Update Physics
    this.player.physics.update(delta, moveDir, input.run, input.jump);

    // 3. Audio & State events
    const isGrounded = this.player.physics.isGrounded;
    const isJumping = this.player.physics.isJumping;

    // Detect jump trigger
    if (!this.wasJumping && isJumping) {
      AudioManager.getInstance().playJump();
    }

    // Detect landing impact
    if (!this.wasGrounded && isGrounded && this.player.physics.velocity.y <= 0) {
      AudioManager.getInstance().playLand();
      this.player.animation.setState('LAND');
    }

    this.wasGrounded = isGrounded;
    this.wasJumping = isJumping;

    // 4. Update Animations
    const horizSpeed = Math.hypot(this.player.physics.velocity.x, this.player.physics.velocity.z);
    this.player.animation.update(delta, horizSpeed, isGrounded, this.player.physics.velocity.y);

    // 5. Update Player Root Transform
    this.player.update(delta);

    // 6. Check interactive triggers (Hazards, Trampolines, Checkpoints)
    this.checkTriggers();
  }

  private checkTriggers(): void {
    const pos = this.player.physics.position;
    const triggers = CollisionManager.getInstance().checkTriggers(pos.x, pos.y, pos.z, 0.45, 1.6);

    for (let i = 0; i < triggers.length; i++) {
      const t = triggers[i];
      if (t.type === 'hazard') {
        this.player.takeDamage(35);
      } else if (t.type === 'trampoline') {
        const bounceForce = t.userData?.bounceForce || 22;
        this.player.physics.launchVertical(bounceForce);
        AudioManager.getInstance().playTrampoline();
      } else if (t.type === 'checkpoint') {
        // Trigger checkpoint
        if (t.userData?.activate) {
          t.userData.activate(this.player);
        }
      }
    }
  }
}

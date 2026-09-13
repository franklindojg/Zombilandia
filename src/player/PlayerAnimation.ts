/**
 * BloxVerse 3D - PlayerAnimation
 * Procedural forward-kinematics for block humanoid avatar.
 * Animates Head, Body, Arms, and Legs for: IDLE, WALK, RUN, JUMP, FALL, LAND.
 */

import * as THREE from 'three';
import { PlayerState } from '../types';

export interface AvatarBones {
  root: THREE.Group;
  headGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
}

export class PlayerAnimation {
  private bones: AvatarBones;
  public currentState: PlayerState = 'IDLE';
  private animTime: number = 0;
  private landTimer: number = 0;

  constructor(bones: AvatarBones) {
    this.bones = bones;
  }

  public setState(state: PlayerState): void {
    if (this.currentState === state) return;

    if (state === 'LAND') {
      this.landTimer = 0.18; // Brief landing crouch
    }

    this.currentState = state;
  }

  public update(delta: number, horizontalSpeed: number, isGrounded: boolean, verticalVelocity: number): void {
    this.animTime += delta;

    // Determine target animation state if not manually locked
    if (!isGrounded) {
      if (verticalVelocity > 1.5) {
        this.currentState = 'JUMP';
      } else {
        this.currentState = 'FALL';
      }
    } else {
      if (this.landTimer > 0) {
        this.landTimer -= delta;
        this.currentState = 'LAND';
      } else if (horizontalSpeed > 5.5) {
        this.currentState = 'RUN';
      } else if (horizontalSpeed > 0.3) {
        this.currentState = 'WALK';
      } else {
        this.currentState = 'IDLE';
      }
    }

    const { headGroup, bodyMesh, leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup } = this.bones;
    const lerpSpeed = Math.min(1, delta * 15);

    switch (this.currentState) {
      case 'IDLE': {
        const breath = Math.sin(this.animTime * 2.5) * 0.03;
        headGroup.position.y = 1.35 + breath;
        bodyMesh.scale.set(1, 1 + breath * 0.5, 1);

        // Arms relax slightly to sides
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.08, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.08, lerpSpeed);

        // Legs straight
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0, lerpSpeed);
        bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, 0, lerpSpeed);
        break;
      }

      case 'WALK': {
        const walkFreq = 8;
        const swing = Math.sin(this.animTime * walkFreq) * 0.65;
        const bounce = Math.abs(Math.cos(this.animTime * walkFreq)) * 0.06;

        bodyMesh.position.y = 0.75 + bounce;
        headGroup.position.y = 1.35 + bounce;
        bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, 0.05, lerpSpeed);

        // Counter-swing arms & legs
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, swing, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -swing, lerpSpeed);

        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -swing * 0.8, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, swing * 0.8, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.1, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.1, lerpSpeed);
        break;
      }

      case 'RUN': {
        const runFreq = 12.5;
        const swing = Math.sin(this.animTime * runFreq) * 0.95;
        const bounce = Math.abs(Math.cos(this.animTime * runFreq)) * 0.1;

        bodyMesh.position.y = 0.75 + bounce;
        headGroup.position.y = 1.35 + bounce;
        // Forward lean
        bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, 0.22, lerpSpeed);

        // High leg swings
        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, swing, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -swing, lerpSpeed);

        // Vigorous arm swings
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -swing * 1.1, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, swing * 1.1, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.15, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.15, lerpSpeed);
        break;
      }

      case 'JUMP': {
        // Arms reach up, legs tuck slightly
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -2.4, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -2.4, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.35, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.35, lerpSpeed);

        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, -0.3, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0.2, lerpSpeed);
        bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, -0.1, lerpSpeed);
        break;
      }

      case 'FALL': {
        // Arms flail outward, legs trail
        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, -0.8, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, -0.8, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.75, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.75, lerpSpeed);

        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0.2, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, -0.2, lerpSpeed);
        bodyMesh.rotation.x = THREE.MathUtils.lerp(bodyMesh.rotation.x, 0.15, lerpSpeed);
        break;
      }

      case 'LAND': {
        // Squash
        bodyMesh.position.y = THREE.MathUtils.lerp(bodyMesh.position.y, 0.62, lerpSpeed * 2);
        headGroup.position.y = THREE.MathUtils.lerp(headGroup.position.y, 1.22, lerpSpeed * 2);

        leftLegGroup.rotation.x = THREE.MathUtils.lerp(leftLegGroup.rotation.x, 0.4, lerpSpeed);
        rightLegGroup.rotation.x = THREE.MathUtils.lerp(rightLegGroup.rotation.x, 0.4, lerpSpeed);

        leftArmGroup.rotation.x = THREE.MathUtils.lerp(leftArmGroup.rotation.x, 0.5, lerpSpeed);
        rightArmGroup.rotation.x = THREE.MathUtils.lerp(rightArmGroup.rotation.x, 0.5, lerpSpeed);
        leftArmGroup.rotation.z = THREE.MathUtils.lerp(leftArmGroup.rotation.z, 0.4, lerpSpeed);
        rightArmGroup.rotation.z = THREE.MathUtils.lerp(rightArmGroup.rotation.z, -0.4, lerpSpeed);
        break;
      }
    }
  }
}

/**
 * BloxVerse 3D - NPC (Non-Playable Character)
 * Block characters with Distance Update System (NEAR, MID, FAR, SLEEP) for mobile optimization.
 */

import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';
import { DialogueNode } from '../types';

export type NPCDistanceTier = 'NEAR' | 'MID' | 'FAR' | 'SLEEP';

export class NPC {
  public id: string;
  public name: string;
  public group: THREE.Group;
  public position: THREE.Vector3;
  public dialogues: DialogueNode[];
  public currentTier: NPCDistanceTier = 'SLEEP';

  // Meshes
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private leftArmMesh: THREE.Mesh;
  private rightArmMesh: THREE.Mesh;

  private time: number = 0;
  private updateCooldown: number = 0;

  constructor(
    id: string,
    name: string,
    pos: THREE.Vector3,
    shirtColor: string = '#10b981',
    dialogues: DialogueNode[] = []
  ) {
    this.id = id;
    this.name = name;
    this.position = pos.clone();
    this.dialogues = dialogues;

    this.group = new THREE.Group();
    this.group.position.copy(pos);

    const assets = AssetManager.getInstance();

    // Body
    const bodyMat = assets.getLambertMaterial(shirtColor);
    this.bodyMesh = new THREE.Mesh(assets.getBoxGeometry(0.85, 0.85, 0.45), bodyMat);
    this.bodyMesh.position.y = 0.75;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Head
    const skinMat = assets.getLambertMaterial('#fed7aa');
    const faceMat = new THREE.MeshLambertMaterial({ map: assets.getFaceTexture() });
    const headMats = [skinMat, skinMat, skinMat, skinMat, faceMat, skinMat];
    this.headMesh = new THREE.Mesh(assets.getBoxGeometry(0.6, 0.6, 0.6), headMats);
    this.headMesh.position.y = 1.35;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Arms
    this.leftArmMesh = new THREE.Mesh(assets.getBoxGeometry(0.3, 0.75, 0.3), bodyMat);
    this.leftArmMesh.position.set(-0.6, 0.75, 0);
    this.leftArmMesh.castShadow = true;
    this.group.add(this.leftArmMesh);

    this.rightArmMesh = new THREE.Mesh(assets.getBoxGeometry(0.3, 0.75, 0.3), bodyMat);
    this.rightArmMesh.position.set(0.6, 0.75, 0);
    this.rightArmMesh.castShadow = true;
    this.group.add(this.rightArmMesh);

    // Legs
    const legMat = assets.getLambertMaterial('#334155');
    const leftLeg = new THREE.Mesh(assets.getBoxGeometry(0.34, 0.8, 0.36), legMat);
    leftLeg.position.set(-0.22, 0.05, 0);
    const rightLeg = new THREE.Mesh(assets.getBoxGeometry(0.34, 0.8, 0.36), legMat);
    rightLeg.position.set(0.22, 0.05, 0);
    this.group.add(leftLeg, rightLeg);
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    const distSq = this.position.distanceToSquared(playerPos);

    // Evaluate distance tier
    if (distSq < 15 * 15) {
      this.currentTier = 'NEAR';
    } else if (distSq < 35 * 35) {
      this.currentTier = 'MID';
    } else if (distSq < 60 * 60) {
      this.currentTier = 'FAR';
    } else {
      this.currentTier = 'SLEEP';
    }

    if (this.currentTier === 'SLEEP') {
      return; // Zero CPU cost when far away
    }

    // Mid distance throttle
    if (this.currentTier === 'MID') {
      this.updateCooldown += delta;
      if (this.updateCooldown < 0.06) return;
      this.updateCooldown = 0;
    }

    this.time += delta;

    // Idle breathing & looking towards player if NEAR
    if (this.currentTier === 'NEAR') {
      const breath = Math.sin(this.time * 2.2) * 0.025;
      this.headMesh.position.y = 1.35 + breath;

      // Turn head slightly towards player
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const angle = Math.atan2(dx, dz);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, angle, delta * 3.5);
    } else {
      // FAR: minimal bounce
      this.headMesh.position.y = 1.35 + Math.sin(this.time * 1.5) * 0.015;
    }
  }
}

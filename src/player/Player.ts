/**
 * BloxVerse 3D - Player
 * Block humanoid character composed of Head, Body, Arms, and Legs.
 * Manages HP, Respawn, Checkpoints, Appearance, and Multiplayer-ready serialization.
 */

import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';
import { AudioManager } from '../core/AudioManager';
import { PlayerAnimation, AvatarBones } from './PlayerAnimation';
import { PlayerPhysics } from './PlayerPhysics';
import { AvatarCustomizer } from './AvatarCustomizer';
import { PlayerAppearance, PlayerNetworkData } from '../types';

export class Player {
  public id: string = 'local_player';
  public group: THREE.Group;
  public physics: PlayerPhysics;
  public animation: PlayerAnimation;
  public customizer: AvatarCustomizer;

  // Character parts
  public headMesh!: THREE.Mesh;
  public bodyMesh!: THREE.Mesh;
  public leftArmMesh!: THREE.Mesh;
  public rightArmMesh!: THREE.Mesh;
  public leftLegMesh!: THREE.Mesh;
  public rightLegMesh!: THREE.Mesh;
  public hairGroup!: THREE.Group;
  public hatGroup!: THREE.Group;
  public backpackMesh!: THREE.Mesh;

  // Gameplay state
  public maxHealth: number = 100;
  public health: number = 100;
  public coins: number = 0;
  public lastCheckpoint: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);
  public lastCheckpointRotation: number = 0;
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;

  // Visual mesh container (handles horizontal rotation)
  public visualMesh: THREE.Group;

  constructor(initialAppearance: PlayerAppearance, startPos: THREE.Vector3 = new THREE.Vector3(0, 2, 0)) {
    this.group = new THREE.Group();
    this.visualMesh = new THREE.Group();
    this.group.add(this.visualMesh);

    this.physics = new PlayerPhysics(startPos);
    this.lastCheckpoint.copy(startPos);

    // Build block humanoid model
    const bones = this.buildHumanoidModel(initialAppearance);
    this.animation = new PlayerAnimation(bones);
    this.customizer = new AvatarCustomizer(initialAppearance);

    // Sync appearance
    this.applyAppearance(initialAppearance);
  }

  private buildHumanoidModel(appearance: PlayerAppearance): AvatarBones {
    const assets = AssetManager.getInstance();

    // 1. Root group inside visual mesh
    const root = new THREE.Group();
    this.visualMesh.add(root);

    // 2. Torso / Body (0.85 wide, 0.85 high, 0.45 deep)
    const bodyGeo = assets.getBoxGeometry(0.85, 0.85, 0.45);
    const bodyMat = assets.getLambertMaterial(appearance.shirtColor);
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.75;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    root.add(this.bodyMesh);

    // 3. Head (0.6 x 0.6 x 0.6)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0);

    const headGeo = assets.getBoxGeometry(0.6, 0.6, 0.6);
    const skinMat = assets.getLambertMaterial(appearance.skinColor);
    const faceTex = assets.getFaceTexture();
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTex });

    // Multi-material for head: +Z (face) has face texture, others skin tone
    const headMaterials = [
      skinMat, // +X right
      skinMat, // -X left
      skinMat, // +Y top
      skinMat, // -Y bottom
      faceMat, // +Z front
      skinMat, // -Z back
    ];
    this.headMesh = new THREE.Mesh(headGeo, headMaterials);
    this.headMesh.castShadow = true;
    headGroup.add(this.headMesh);

    // Hair
    this.hairGroup = new THREE.Group();
    const hairMat = assets.getLambertMaterial(appearance.hairColor);
    // Hair top
    const hairTop = new THREE.Mesh(assets.getBoxGeometry(0.64, 0.18, 0.64), hairMat);
    hairTop.position.y = 0.28;
    this.hairGroup.add(hairTop);
    // Hair back
    const hairBack = new THREE.Mesh(assets.getBoxGeometry(0.64, 0.35, 0.18), hairMat);
    hairBack.position.set(0, 0.12, -0.26);
    this.hairGroup.add(hairBack);
    // Hair sides
    const hairSideL = new THREE.Mesh(assets.getBoxGeometry(0.12, 0.32, 0.5), hairMat);
    hairSideL.position.set(-0.29, 0.14, 0);
    this.hairGroup.add(hairSideL);
    const hairSideR = new THREE.Mesh(assets.getBoxGeometry(0.12, 0.32, 0.5), hairMat);
    hairSideR.position.set(0.29, 0.14, 0);
    this.hairGroup.add(hairSideR);
    headGroup.add(this.hairGroup);

    // Hat / Cap (Stylish red/blue gamer snapback cap)
    this.hatGroup = new THREE.Group();
    const capMat = assets.getLambertMaterial('#e11d48'); // Bold crimson cap
    const capCrown = new THREE.Mesh(assets.getBoxGeometry(0.66, 0.2, 0.66), capMat);
    capCrown.position.y = 0.33;
    const capBrim = new THREE.Mesh(assets.getBoxGeometry(0.64, 0.06, 0.35), capMat);
    capBrim.position.set(0, 0.26, 0.42);
    this.hatGroup.add(capCrown, capBrim);
    headGroup.add(this.hatGroup);

    root.add(headGroup);

    // 4. Arms (Pivots at shoulder: y = 1.1)
    const armGeo = assets.getBoxGeometry(0.32, 0.8, 0.32);
    const armMat = assets.getLambertMaterial(appearance.shirtColor);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.62, 1.1, 0);
    this.leftArmMesh = new THREE.Mesh(armGeo, armMat);
    this.leftArmMesh.position.set(0, -0.38, 0);
    this.leftArmMesh.castShadow = true;
    leftArmGroup.add(this.leftArmMesh);
    root.add(leftArmGroup);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.62, 1.1, 0);
    this.rightArmMesh = new THREE.Mesh(armGeo, armMat);
    this.rightArmMesh.position.set(0, -0.38, 0);
    this.rightArmMesh.castShadow = true;
    rightArmGroup.add(this.rightArmMesh);
    root.add(rightArmGroup);

    // 5. Legs (Pivots at hips: y = 0.45)
    const legGeo = assets.getBoxGeometry(0.36, 0.8, 0.38);
    const legMat = assets.getLambertMaterial(appearance.pantsColor);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.22, 0.45, 0);
    this.leftLegMesh = new THREE.Mesh(legGeo, legMat);
    this.leftLegMesh.position.set(0, -0.4, 0);
    this.leftLegMesh.castShadow = true;
    leftLegGroup.add(this.leftLegMesh);
    root.add(leftLegGroup);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.22, 0.45, 0);
    this.rightLegMesh = new THREE.Mesh(legGeo, legMat);
    this.rightLegMesh.position.set(0, -0.4, 0);
    this.rightLegMesh.castShadow = true;
    rightLegGroup.add(this.rightLegMesh);
    root.add(rightLegGroup);

    // 6. Backpack Accessory
    const packMat = assets.getLambertMaterial('#0284c7');
    this.backpackMesh = new THREE.Mesh(assets.getBoxGeometry(0.55, 0.6, 0.28), packMat);
    this.backpackMesh.position.set(0, 0.75, -0.32);
    this.backpackMesh.castShadow = true;
    root.add(this.backpackMesh);

    return {
      root,
      headGroup,
      bodyMesh: this.bodyMesh,
      leftArmGroup,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup,
    };
  }

  public applyAppearance(app: Partial<PlayerAppearance>): void {
    this.customizer.setAppearance(app, {
      head: this.headMesh,
      body: this.bodyMesh,
      leftArm: this.leftArmMesh,
      rightArm: this.rightArmMesh,
      leftLeg: this.leftLegMesh,
      rightLeg: this.rightLegMesh,
      hair: this.hairGroup,
      hat: this.hatGroup,
      backpack: this.backpackMesh,
    });
  }

  public update(delta: number): void {
    // Sync transform with physics simulation
    this.group.position.copy(this.physics.position);

    // Invulnerability flashing
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.isInvulnerable = true;
      this.visualMesh.visible = Math.floor(performance.now() / 80) % 2 === 0;
    } else {
      this.isInvulnerable = false;
      this.visualMesh.visible = true;
    }

    // Check fall off world (configured to y < -25)
    if (this.physics.position.y < -25) {
      AudioManager.getInstance().playDamage();
      this.takeDamage(25);
      this.respawn();
    }
  }

  public takeDamage(amount: number): void {
    if (this.isInvulnerable) return;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.8;
    AudioManager.getInstance().playDamage();

    if (this.health <= 0) {
      this.respawn();
    }
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public setCheckpoint(pos: THREE.Vector3, rotY: number = 0): void {
    this.lastCheckpoint.copy(pos);
    this.lastCheckpointRotation = rotY;
    AudioManager.getInstance().playCheckpoint();
  }

  public respawn(): void {
    this.health = this.maxHealth;
    this.physics.teleport(this.lastCheckpoint);
    this.visualMesh.rotation.y = this.lastCheckpointRotation;
  }

  /**
   * Multiplayer network state packet
   */
  public getNetworkData(): PlayerNetworkData {
    return {
      id: this.id,
      position: [this.physics.position.x, this.physics.position.y, this.physics.position.z],
      rotationY: this.visualMesh.rotation.y,
      animation: this.animation.currentState,
      health: this.health,
      appearance: this.customizer.getAppearance(),
    };
  }
}

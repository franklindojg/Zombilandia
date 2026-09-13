/**
 * Mansión del Terror 3D - MansionDoorSystem
 * Handles realistic interactive hinged doors, door locks requiring keys,
 * smooth opening/closing animations, and dynamic collision updates.
 */

import * as THREE from 'three';
import { CollisionManager } from '../world/CollisionManager';
import { AudioManager } from '../core/AudioManager';
import { MansionDoor, MansionKey } from '../types';

export class MansionDoorSystem {
  public doors: {
    data: MansionDoor;
    pivot: THREE.Group;
    doorMesh: THREE.Mesh;
    targetAngle: number;
    currentAngle: number;
  }[] = [];

  public keys: {
    data: MansionKey;
    meshGroup: THREE.Group;
    light: THREE.PointLight;
  }[] = [];

  private scene: THREE.Scene;
  private collisionManager: CollisionManager;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.collisionManager = CollisionManager.getInstance();
  }

  public addDoor(
    id: string,
    name: string,
    x: number,
    y: number,
    z: number,
    rotationY: number = 0,
    isLocked: boolean = false,
    requiredKeyId?: string,
    width: number = 2.4,
    height: number = 3.4
  ): void {
    // A hinged door pivots around its left edge (hinge at x = -width/2 or local x = 0)
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    pivot.rotation.y = rotationY;

    // Door frame / posts (dark oak wood)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.85,
    });
    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.25), frameMat);
    frameL.position.set(0, height / 2, 0);
    this.scene.add(frameL);

    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.25), frameMat);
    // Position at opposite side of doorway
    const rPos = new THREE.Vector3(width, height / 2, 0);
    rPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
    frameR.position.set(x + rPos.x, y + rPos.y, z + rPos.z);
    frameR.rotation.y = rotationY;
    this.scene.add(frameR);

    // Door leaf panel
    const doorGeo = new THREE.BoxGeometry(width, height - 0.1, 0.14);
    const doorMat = new THREE.MeshStandardMaterial({
      color: isLocked ? 0x4a1515 : 0x3d271d, // Reddish tint for locked grand exit
      roughness: 0.7,
      metalness: 0.1,
    });

    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    // Shift door geometry so hinge is at pivot origin (0, 0, 0)
    doorMesh.position.set(width / 2, height / 2, 0);
    doorMesh.castShadow = true;
    doorMesh.receiveShadow = true;
    pivot.add(doorMesh);

    // Door knob / handle (antique bronze)
    const handleMat = new THREE.MeshStandardMaterial({
      color: isLocked ? 0xf59e0b : 0xd4af37,
      metalness: 0.8,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.28), handleMat);
    handle.position.set(width * 0.88, height / 2, 0);
    pivot.add(handle);

    this.scene.add(pivot);

    const doorData: MansionDoor = {
      id,
      name,
      position: [x, y, z],
      rotationY,
      isOpen: false,
      isLocked,
      requiredKeyId,
    };

    // Register initial solid collider for closed door
    this.updateDoorCollider(doorData, false, width, height);

    this.doors.push({
      data: doorData,
      pivot,
      doorMesh,
      targetAngle: 0,
      currentAngle: 0,
    });
  }

  public addKey(
    id: string,
    name: string,
    locationName: string,
    x: number,
    y: number,
    z: number,
    colorHex: string = '#f59e0b'
  ): void {
    const keyGroup = new THREE.Group();
    keyGroup.position.set(x, y, z);

    // Ancient key shape
    const keyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      metalness: 0.9,
      roughness: 0.2,
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: 0.6,
    });

    // Key ring
    const ringGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 16);
    const ring = new THREE.Mesh(ringGeo, keyMat);
    keyGroup.add(ring);

    // Key stem
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8);
    const stem = new THREE.Mesh(stemGeo, keyMat);
    stem.position.y = -0.32;
    keyGroup.add(stem);

    // Key teeth
    const teethGeo = new THREE.BoxGeometry(0.1, 0.06, 0.04);
    const teeth1 = new THREE.Mesh(teethGeo, keyMat);
    teeth1.position.set(0.06, -0.44, 0);
    keyGroup.add(teeth1);

    const teeth2 = new THREE.Mesh(teethGeo, keyMat);
    teeth2.position.set(0.05, -0.51, 0);
    keyGroup.add(teeth2);

    // Subtle localized glow light
    const light = new THREE.PointLight(new THREE.Color(colorHex), 1.5, 5);
    light.position.set(0, 0, 0);
    keyGroup.add(light);

    this.scene.add(keyGroup);

    this.keys.push({
      data: {
        id,
        name,
        color: colorHex,
        locationName,
        position: [x, y, z],
        collected: false,
      },
      meshGroup: keyGroup,
      light,
    });
  }

  public toggleDoor(
    doorId: string,
    hasKeyCheck: (keyId?: string) => boolean
  ): { success: boolean; message: string } {
    const door = this.doors.find((d) => d.data.id === doorId);
    if (!door) return { success: false, message: 'Puerta no encontrada' };

    // Check if locked
    if (door.data.isLocked) {
      if (door.data.requiredKeyId && !hasKeyCheck(door.data.requiredKeyId)) {
        AudioManager.getInstance().playDamage(); // Rattle error
        return {
          success: false,
          message: `🔒 Bloqueada. Necesitas: ${door.data.name}`,
        };
      } else {
        // Unlock door!
        door.data.isLocked = false;
        AudioManager.getInstance().playDoorUnlocked();
      }
    }

    // Toggle state
    door.data.isOpen = !door.data.isOpen;
    door.targetAngle = door.data.isOpen ? Math.PI * 0.55 : 0;
    AudioManager.getInstance().playDoorCreak(door.data.isOpen);

    // Update collision
    this.updateDoorCollider(door.data, door.data.isOpen);

    return {
      success: true,
      message: door.data.isOpen ? `Abres ${door.data.name}` : `Cierras ${door.data.name}`,
    };
  }

  private updateDoorCollider(
    doorData: MansionDoor,
    isOpen: boolean,
    width: number = 2.4,
    height: number = 3.4
  ): void {
    const colliderId = `door_col_${doorData.id}`;
    if (isOpen) {
      // Remove or minimize collider when door is swung open
      this.collisionManager.removeCollider(colliderId);
    } else {
      // Solid wall across doorway
      const [x, y, z] = doorData.position;
      const rot = doorData.rotationY;
      const isZAxis = Math.abs(Math.sin(rot)) > 0.5;

      this.collisionManager.removeCollider(colliderId);
      this.collisionManager.addCollider({
        id: colliderId,
        type: 'box',
        minX: isZAxis ? x - 0.2 : x - 0.1,
        maxX: isZAxis ? x + 0.2 : x + width + 0.1,
        minY: y,
        maxY: y + height,
        minZ: isZAxis ? z - 0.1 : z - 0.2,
        maxZ: isZAxis ? z + width + 0.1 : z + 0.2,
      });
    }
  }

  public update(delta: number, playerPos: THREE.Vector3): {
    nearDoor: MansionDoor | null;
    nearKey: MansionKey | null;
  } {
    const dt = Math.min(delta, 0.05);

    // 1. Animate door opening/closing rotation smoothly
    for (let i = 0; i < this.doors.length; i++) {
      const door = this.doors[i];
      door.currentAngle = THREE.MathUtils.lerp(door.currentAngle, door.targetAngle, dt * 6.5);
      door.pivot.rotation.y = door.data.rotationY + door.currentAngle;
    }

    // 2. Animate keys spinning & floating
    const time = performance.now() * 0.002;
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (!k.data.collected) {
        k.meshGroup.rotation.y += dt * 2.2;
        k.meshGroup.position.y = k.data.position[1] + Math.sin(time * 3 + i) * 0.12;
      }
    }

    // 3. Proximity detection for interaction
    let nearDoor: MansionDoor | null = null;
    let minDoorDistSq = 3.6 * 3.6;

    for (let i = 0; i < this.doors.length; i++) {
      const d = this.doors[i].data;
      const dx = playerPos.x - (d.position[0] + 1.2);
      const dy = playerPos.y - d.position[1];
      const dz = playerPos.z - d.position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minDoorDistSq) {
        minDoorDistSq = distSq;
        nearDoor = d;
      }
    }

    let nearKey: MansionKey | null = null;
    let minKeyDistSq = 2.8 * 2.8;

    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i];
      if (k.data.collected) continue;

      const dx = playerPos.x - k.data.position[0];
      const dy = playerPos.y - k.data.position[1];
      const dz = playerPos.z - k.data.position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < minKeyDistSq) {
        minKeyDistSq = distSq;
        nearKey = k.data;
      }
    }

    return { nearDoor, nearKey };
  }

  public collectKey(keyId: string): MansionKey | null {
    const key = this.keys.find((k) => k.data.id === keyId && !k.data.collected);
    if (key) {
      key.data.collected = true;
      key.meshGroup.visible = false;
      this.scene.remove(key.meshGroup);
      AudioManager.getInstance().playKeyPickup();
      return key.data;
    }
    return null;
  }
}

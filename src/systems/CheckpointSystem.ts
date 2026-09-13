/**
 * BloxVerse 3D - CheckpointSystem
 * Interactive physical checkpoint stations with audio fanfare and dynamic glowing rings.
 */

import * as THREE from 'three';
import { CollisionManager } from '../world/CollisionManager';
import { AssetManager } from '../core/AssetManager';
import { SaveManager } from '../core/SaveManager';
import { Player } from '../player/Player';

export interface CheckpointStation {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotationY: number;
  ringMesh: THREE.Mesh;
  flagMesh: THREE.Mesh;
  isActive: boolean;
  stageNumber: number;
}

export class CheckpointSystem {
  private stations: CheckpointStation[] = [];
  public currentActiveId: string | null = null;
  private onCheckpointActivatedCallback: ((name: string, stage: number) => void) | null = null;

  constructor() {}

  public setOnCheckpointActivated(cb: (name: string, stage: number) => void): void {
    this.onCheckpointActivatedCallback = cb;
  }

  public addCheckpoint(
    scene: THREE.Scene,
    id: string,
    name: string,
    pos: THREE.Vector3,
    stageNumber: number = 1,
    rotationY: number = 0
  ): CheckpointStation {
    const assets = AssetManager.getInstance();

    const group = new THREE.Group();
    group.position.copy(pos);
    group.rotation.y = rotationY;

    // Pedestal base
    const baseGeo = assets.getCylinderGeometry(1.2, 1.4, 0.35, 12);
    const baseMat = assets.getLambertMaterial('#334155'); // Slate stone
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.17;
    base.receiveShadow = true;
    group.add(base);

    // Glowing energy ring on the ground
    const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Amber inactive
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.36;
    group.add(ringMesh);

    // Flag pole
    const poleGeo = assets.getCylinderGeometry(0.06, 0.06, 2.8, 8);
    const poleMat = assets.getLambertMaterial('#94a3b8');
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(-0.8, 1.4, 0);
    pole.castShadow = true;
    group.add(pole);

    // Flag banner
    const flagGeo = assets.getBoxGeometry(0.8, 0.5, 0.04);
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const flagMesh = new THREE.Mesh(flagGeo, flagMat);
    flagMesh.position.set(-0.38, 2.4, 0);
    group.add(flagMesh);

    scene.add(group);

    const station: CheckpointStation = {
      id,
      name,
      position: pos.clone().add(new THREE.Vector3(0, 0.5, 0)),
      rotationY,
      ringMesh,
      flagMesh,
      isActive: false,
      stageNumber,
    };

    // Register trigger collider
    CollisionManager.getInstance().addCollider({
      id: `chk_${id}`,
      type: 'checkpoint',
      minX: pos.x - 1.2,
      maxX: pos.x + 1.2,
      minY: pos.y,
      maxY: pos.y + 2.5,
      minZ: pos.z - 1.2,
      maxZ: pos.z + 1.2,
      userData: {
        activate: (player: Player) => {
          this.activateCheckpoint(station, player);
        },
      },
    });

    this.stations.push(station);
    return station;
  }

  public activateCheckpoint(station: CheckpointStation, player: Player): void {
    if (this.currentActiveId === station.id) return;

    this.currentActiveId = station.id;

    // Reset others
    this.stations.forEach((s) => {
      s.isActive = s.id === station.id;
      if (s.isActive) {
        (s.ringMesh.material as THREE.MeshBasicMaterial).color.set('#10b981'); // Emerald green active!
        (s.flagMesh.material as THREE.MeshLambertMaterial).color.set('#10b981');
      } else {
        (s.ringMesh.material as THREE.MeshBasicMaterial).color.set('#f59e0b');
        (s.flagMesh.material as THREE.MeshLambertMaterial).color.set('#f59e0b');
      }
    });

    // Notify player and save
    player.setCheckpoint(station.position, station.rotationY);
    SaveManager.getInstance().save({
      lastCheckpoint: [station.position.x, station.position.y, station.position.z],
    });

    if (this.onCheckpointActivatedCallback) {
      this.onCheckpointActivatedCallback(station.name, station.stageNumber);
    }
  }

  public update(delta: number): void {
    // Pulse active ring
    const now = performance.now() * 0.004;
    for (let i = 0; i < this.stations.length; i++) {
      const s = this.stations[i];
      if (s.isActive) {
        const scale = 1.0 + Math.sin(now) * 0.08;
        s.ringMesh.scale.set(scale, scale, 1);
      }
    }
  }
}

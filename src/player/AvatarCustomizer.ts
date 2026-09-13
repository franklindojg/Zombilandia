/**
 * BloxVerse 3D - AvatarCustomizer
 * Handles dynamic swapping and recoloring of block avatar meshes and accessories.
 */

import * as THREE from 'three';
import { PlayerAppearance } from '../types';

export class AvatarCustomizer {
  private appearance: PlayerAppearance;

  constructor(initial: PlayerAppearance) {
    this.appearance = { ...initial };
  }

  public getAppearance(): PlayerAppearance {
    return this.appearance;
  }

  public setAppearance(newAppearance: Partial<PlayerAppearance>, meshes: {
    head: THREE.Mesh;
    body: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    hair?: THREE.Group;
    hat?: THREE.Group;
    backpack?: THREE.Mesh;
  }): void {
    this.appearance = { ...this.appearance, ...newAppearance };

    // Update Head
    if (newAppearance.skinColor && meshes.head.material) {
      // Mesh has multi-material: face is index 4 (+Z front)
      if (Array.isArray(meshes.head.material)) {
        meshes.head.material.forEach((mat, idx) => {
          if (idx !== 4 && (mat as THREE.MeshLambertMaterial).color) {
            (mat as THREE.MeshLambertMaterial).color.set(this.appearance.skinColor);
          }
        });
      }
    }

    // Update Torso / Shirt
    if (newAppearance.shirtColor && meshes.body.material) {
      const mat = meshes.body.material as THREE.MeshLambertMaterial;
      if (mat.color) mat.color.set(this.appearance.shirtColor);
    }

    // Update Arms
    if (newAppearance.skinColor || newAppearance.shirtColor) {
      // Upper arm takes shirt color, hand takes skin color
      [meshes.leftArm, meshes.rightArm].forEach((armMesh) => {
        if (armMesh && armMesh.material) {
          const mat = armMesh.material as THREE.MeshLambertMaterial;
          if (mat.color) mat.color.set(this.appearance.shirtColor);
        }
      });
    }

    // Update Legs / Pants
    if (newAppearance.pantsColor) {
      [meshes.leftLeg, meshes.rightLeg].forEach((legMesh) => {
        if (legMesh && legMesh.material) {
          const mat = legMesh.material as THREE.MeshLambertMaterial;
          if (mat.color) mat.color.set(this.appearance.pantsColor);
        }
      });
    }

    // Update Hair & Hat visibility and color
    if (meshes.hair) {
      meshes.hair.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshLambertMaterial;
          if (mat && mat.color) mat.color.set(this.appearance.hairColor);
        }
      });
      meshes.hair.visible = !this.appearance.hasHat || this.appearance.hatType === 'none';
    }

    if (meshes.hat) {
      meshes.hat.visible = this.appearance.hasHat && this.appearance.hatType !== 'none';
    }

    if (meshes.backpack) {
      meshes.backpack.visible = this.appearance.hasBackpack;
    }
  }
}

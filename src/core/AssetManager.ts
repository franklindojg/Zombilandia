/**
 * BloxVerse 3D - AssetManager
 * Central asset & material caching system to prevent redundant GPU memory allocation.
 */

import * as THREE from 'three';

export class AssetManager {
  private static instance: AssetManager | null = null;

  // Geometry cache
  private geometryCache: Map<string, THREE.BufferGeometry> = new Map();

  // Material cache
  private materialCache: Map<string, THREE.Material> = new Map();

  // Texture cache
  private textureCache: Map<string, THREE.Texture> = new Map();

  // Loading progress
  public loadProgress: number = 0;

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // --- Geometry Sharing ---
  public getBoxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geometryCache.get(key) as THREE.BoxGeometry;
  }

  public getCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, radialSegments: number = 10): THREE.CylinderGeometry {
    const key = `cyl_${radiusTop}_${radiusBottom}_${height}_${radialSegments}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments));
    }
    return this.geometryCache.get(key) as THREE.CylinderGeometry;
  }

  public getSphereGeometry(radius: number, widthSegments: number = 12, heightSegments: number = 8): THREE.SphereGeometry {
    const key = `sphere_${radius}_${widthSegments}_${heightSegments}`;
    if (!this.geometryCache.has(key)) {
      this.geometryCache.set(key, new THREE.SphereGeometry(radius, widthSegments, heightSegments));
    }
    return this.geometryCache.get(key) as THREE.SphereGeometry;
  }

  // --- Material Sharing ---
  public getLambertMaterial(color: string | number, roughness: number = 0.5): THREE.MeshLambertMaterial {
    const hex = typeof color === 'string' ? color : '#' + color.toString(16);
    const key = `lambert_${hex}`;
    if (!this.materialCache.has(key)) {
      const mat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(hex),
      });
      this.materialCache.set(key, mat);
    }
    return this.materialCache.get(key) as THREE.MeshLambertMaterial;
  }

  public getStandardMaterial(color: string | number, roughness: number = 0.4, metalness: number = 0.1): THREE.MeshStandardMaterial {
    const hex = typeof color === 'string' ? color : '#' + color.toString(16);
    const key = `standard_${hex}_${roughness}_${metalness}`;
    if (!this.materialCache.has(key)) {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(hex),
        roughness,
        metalness,
      });
      this.materialCache.set(key, mat);
    }
    return this.materialCache.get(key) as THREE.MeshStandardMaterial;
  }

  // --- Procedural Textures (Block toy studs, brick patterns, grass grid) ---
  public getBlockStudTexture(): THREE.CanvasTexture {
    const key = 'tex_block_stud';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key) as THREE.CanvasTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Clean block texture with subtle circular studs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 128);

    // 2x2 studs
    const studRadius = 18;
    const centers = [
      [32, 32],
      [96, 32],
      [32, 96],
      [96, 96],
    ];

    centers.forEach(([cx, cy]) => {
      // Outer shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 2, studRadius, 0, Math.PI * 2);
      ctx.fill();

      // Stud circle
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, studRadius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, studRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.textureCache.set(key, texture);
    return texture;
  }

  public getFaceTexture(): THREE.CanvasTexture {
    const key = 'tex_block_face';
    if (this.textureCache.has(key)) {
      return this.textureCache.get(key) as THREE.CanvasTexture;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base face color
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(0, 0, 256, 256);

    // Expressive block eyes (stylish cute cartoon eyes)
    ctx.fillStyle = '#0f172a';
    // Left eye
    ctx.beginPath();
    ctx.ellipse(75, 110, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.ellipse(181, 110, 16, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights (sparkles)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(70, 102, 6, 0, Math.PI * 2);
    ctx.arc(176, 102, 6, 0, Math.PI * 2);
    ctx.fill();

    // Friendly smile
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(128, 140, 42, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Rosy cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.beginPath();
    ctx.ellipse(55, 138, 14, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(201, 138, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, texture);
    return texture;
  }

  public preloadEssentialAssets(onProgress: (p: number) => void): Promise<void> {
    return new Promise((resolve) => {
      let current = 0;
      const totalSteps = 6;

      const step = () => {
        current++;
        this.loadProgress = current / totalSteps;
        onProgress(this.loadProgress);
        if (current >= totalSteps) {
          setTimeout(resolve, 150);
        } else {
          setTimeout(step, 40);
        }
      };

      // Generate procedural textures and cache shared primitives
      this.getBlockStudTexture();
      this.getFaceTexture();
      this.getBoxGeometry(1, 1, 1);
      step();
    });
  }
}

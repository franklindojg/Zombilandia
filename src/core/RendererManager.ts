/**
 * BloxVerse 3D - RendererManager
 * Manages Three.js WebGLRenderer with responsive handling and Android optimizations (LOW/MED/HIGH).
 */

import * as THREE from 'three';
import { GraphicQuality } from '../types';

export class RendererManager {
  private renderer: THREE.WebGLRenderer;
  private quality: GraphicQuality = 'medium';
  private canvasContainer: HTMLElement;
  private width: number = 0;
  private height: number = 0;

  // FPS tracking
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  public currentFps: number = 60;

  constructor(container: HTMLElement, initialQuality: GraphicQuality = 'medium') {
    this.canvasContainer = container;
    this.quality = initialQuality;

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: initialQuality !== 'low',
      stencil: false,
      depth: true,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.applyQuality(initialQuality);
    this.updateSize();

    this.canvasContainer.appendChild(this.renderer.domElement);
    this.renderer.domElement.id = 'game-canvas';
    this.renderer.domElement.className = 'w-full h-full block touch-none';

    window.addEventListener('resize', this.onResize);
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public applyQuality(quality: GraphicQuality): void {
    this.quality = quality;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    switch (quality) {
      case 'low':
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = false;
        break;

      case 'medium':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        break;

      case 'high':
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2.0));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        break;
    }
  }

  public getQuality(): GraphicQuality {
    return this.quality;
  }

  private onResize = (): void => {
    this.updateSize();
  };

  public updateSize(): void {
    const rect = this.canvasContainer.getBoundingClientRect();
    this.width = Math.max(10, rect.width || window.innerWidth);
    this.height = Math.max(10, rect.height || window.innerHeight);

    this.renderer.setSize(this.width, this.height, false);
  }

  public getAspect(): number {
    return (this.width || 1) / (this.height || 1);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);

    // Track FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

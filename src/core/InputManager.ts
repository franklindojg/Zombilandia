/**
 * BloxVerse 3D - InputManager
 * Unified input pipeline for both PC (Keyboard/Mouse) and Mobile/Android (Touch/Virtual Joystick).
 */

import { InputState } from '../types';

export class InputManager {
  private static instance: InputManager | null = null;

  // Keyboard state
  private keys: Record<string, boolean> = {};

  // Mouse / Pointer state
  private isPointerLocked: boolean = false;
  private isMouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private wheelDelta: number = 0;

  // Mobile / Touch state
  private mobileMoveX: number = 0;
  private mobileMoveY: number = 0;
  private mobileJump: boolean = false;
  private mobileRun: boolean = false;
  private mobileInteractPressed: boolean = false;
  private mobileCameraDeltaX: number = 0;
  private mobileCameraDeltaY: number = 0;

  // Sensitivity
  public sensitivity: number = 1.0;
  public invertedY: boolean = false;

  private onInteractCallback: (() => void) | null = null;
  private onPauseCallback: (() => void) | null = null;

  private constructor() {
    this.initListeners();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private initListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE') {
        if (this.onInteractCallback) this.onInteractCallback();
      }
      if (e.code === 'Escape') {
        if (this.onPauseCallback) this.onPauseCallback();
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.code] = false;
    });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = !!document.pointerLockElement;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      } else if (this.isMouseDown) {
        this.mouseDeltaX += e.clientX - this.lastMouseX;
        this.mouseDeltaY += e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });

    // Mouse down / up for drag camera when pointer lock is not active
    window.addEventListener('mousedown', (e: MouseEvent) => {
      // Only drag if clicking on the 3D canvas or background (not UI buttons)
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button') || target.closest('.ui-interactive')) {
        return;
      }
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Mouse wheel for zoom
    window.addEventListener('wheel', (e: WheelEvent) => {
      this.wheelDelta += e.deltaY * 0.002;
    }, { passive: true });
  }

  public requestPointerLock(element: HTMLElement): void {
    try {
      element.requestPointerLock?.();
    } catch {
      // Ignored if not permitted
    }
  }

  public exitPointerLock(): void {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } catch {
      // Safe
    }
  }

  public setOnInteract(cb: () => void): void {
    this.onInteractCallback = cb;
  }

  public setOnPause(cb: () => void): void {
    this.onPauseCallback = cb;
  }

  // --- Mobile Controls API ---
  public setMobileMove(x: number, y: number): void {
    this.mobileMoveX = Math.max(-1, Math.min(1, x));
    this.mobileMoveY = Math.max(-1, Math.min(1, y));
  }

  public setMobileJump(pressed: boolean): void {
    this.mobileJump = pressed;
  }

  public setMobileRun(active: boolean): void {
    this.mobileRun = active;
  }

  public triggerMobileInteract(): void {
    this.mobileInteractPressed = true;
    if (this.onInteractCallback) {
      this.onInteractCallback();
    }
  }

  public addMobileCameraDelta(dx: number, dy: number): void {
    this.mobileCameraDeltaX += dx;
    this.mobileCameraDeltaY += dy;
  }

  // --- Unified Query ---
  public getInput(): InputState {
    // Keyboard movement
    let keyX = 0;
    let keyY = 0;

    if (this.keys['KeyA'] || this.keys['ArrowLeft']) keyX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) keyX += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) keyY += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) keyY -= 1;

    // Normalize keyboard vector
    if (keyX !== 0 && keyY !== 0) {
      const len = Math.hypot(keyX, keyY);
      keyX /= len;
      keyY /= len;
    }

    // Blend keyboard and mobile joystick smoothly
    const moveX = Math.abs(this.mobileMoveX) > 0.05 ? this.mobileMoveX : keyX;
    const moveY = Math.abs(this.mobileMoveY) > 0.05 ? this.mobileMoveY : keyY;

    // Jump & Run
    const jump = !!this.keys['Space'] || this.mobileJump;
    const run = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'] || this.mobileRun;

    // Interact
    const interact = !!this.keys['KeyE'] || this.mobileInteractPressed;
    this.mobileInteractPressed = false;

    // Camera delta
    const camX = (this.mouseDeltaX * 0.003 + this.mobileCameraDeltaX * 0.005) * this.sensitivity;
    const yDir = this.invertedY ? -1 : 1;
    const camY = (this.mouseDeltaY * 0.003 + this.mobileCameraDeltaY * 0.005) * this.sensitivity * yDir;

    // Zoom delta
    const zoom = this.wheelDelta;

    // Reset frame deltas
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.mobileCameraDeltaX = 0;
    this.mobileCameraDeltaY = 0;
    this.wheelDelta = 0;

    return {
      moveX,
      moveY,
      jump,
      run,
      interact,
      cameraDeltaX: camX,
      cameraDeltaY: camY,
      zoomDelta: zoom,
    };
  }
}

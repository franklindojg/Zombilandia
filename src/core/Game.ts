/**
 * BloxVerse 3D - Game Orchestrator
 * Connects Renderer, World, Player, Camera, Input, Audio, and UI systems into the main loop.
 */

import * as THREE from 'three';
import { RendererManager } from './RendererManager';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { SaveManager } from './SaveManager';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera';
import { GameModeManager } from '../systems/GameModeManager';
import { DialogueNode, GraphicQuality, HorrorGameState, PlayerAppearance } from '../types';

export interface GameEvents {
  onHealthChange?: (hp: number, maxHp: number) => void;
  onCoinsChange?: (coins: number) => void;
  onFpsUpdate?: (fps: number) => void;
  onCheckpointToast?: (name: string, stage: number) => void;
  onToast?: (msg: string) => void;
  onDialogueOpen?: (node: DialogueNode) => void;
  onModeStateChange?: (state: any) => void;
  onHorrorStateUpdate?: (state: HorrorGameState) => void;
  onVictory?: () => void;
  onGameOver?: () => void;
}

export class Game {
  private static instance: Game | null = null;

  public scene: THREE.Scene;
  public rendererManager: RendererManager;
  public assetManager: AssetManager;
  public audioManager: AudioManager;
  public inputManager: InputManager;
  public saveManager: SaveManager;
  public thirdPersonCamera: ThirdPersonCamera;
  public gameModeManager: GameModeManager;

  public world!: World;
  public player!: Player;
  public playerController!: PlayerController;

  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private lastTime: number = 0;
  private animFrameId: number = 0;

  public events: GameEvents = {};

  constructor(container: HTMLElement) {
    Game.instance = this;

    this.scene = new THREE.Scene();
    this.assetManager = AssetManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.gameModeManager = new GameModeManager();

    const savedSettings = this.saveManager.getData().settings;
    this.rendererManager = new RendererManager(container, savedSettings.quality);
    this.thirdPersonCamera = new ThirdPersonCamera(65, this.rendererManager.getAspect());

    this.inputManager.sensitivity = savedSettings.cameraSensitivity;
    this.inputManager.invertedY = savedSettings.invertedY;
  }

  public static getInstance(): Game | null {
    return Game.instance;
  }

  public async init(onProgress: (p: number) => void): Promise<void> {
    await this.saveManager.init();
    await this.assetManager.preloadEssentialAssets(onProgress);

    const savedData = this.saveManager.getData();

    // 1. Build Haunted Mansion World
    this.world = new World(this.scene);

    // 2. Spawn Player in Grand Foyer
    const spawnPos = new THREE.Vector3(0, 1.2, 5);
    this.player = new Player(savedData.appearance, spawnPos);
    this.player.coins = savedData.coins;
    this.scene.add(this.player.group);

    // 3. Controller
    this.playerController = new PlayerController(this.player);

    // 4. Hook Flashlight Key & Button
    this.inputManager.setOnFlashlight(() => {
      const isOn = this.player.toggleFlashlight();
      if (this.events.onToast) {
        this.events.onToast(isOn ? '🔦 Linterna Encendida' : '🔦 Linterna Apagada');
      }
    });

    // 5. Hook Interactions (Doors & Keys)
    this.inputManager.setOnInteract(() => {
      const res = this.world.handleInteract(
        (keyId) => this.player.hasInventoryKey(keyId),
        (keyId) => this.player.addInventoryKey(keyId)
      );
      if (res.message && this.events.onToast) {
        this.events.onToast(res.message);
      }
    });

    this.inputManager.setOnPause(() => {
      this.togglePause();
    });

    // 6. Hook Ghost Attacks & Escape Trigger
    this.world.onGhostCatch = (damage) => {
      this.player.takeDamage(damage);
      if (this.events.onHealthChange) {
        this.events.onHealthChange(this.player.health, this.player.maxHealth);
      }
      if (this.player.health <= 0) {
        if (this.events.onGameOver) {
          this.events.onGameOver();
        }
      }
    };

    this.world.onPlayerEscaped = () => {
      if (this.events.onVictory) {
        this.events.onVictory();
      }
    };

    onProgress(1.0);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.audioManager.startBackgroundMusic();
    this.loop(this.lastTime);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public togglePause(): boolean {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  public setQuality(quality: GraphicQuality): void {
    this.rendererManager.applyQuality(quality);
    this.saveManager.save({
      settings: { ...this.saveManager.getData().settings, quality },
    });
  }

  public updateAppearance(app: Partial<PlayerAppearance>): void {
    if (!this.player) return;
    this.player.applyAppearance(app);
    this.saveManager.save({
      appearance: this.player.customizer.getAppearance(),
    });
  }

  public respawnPlayer(): void {
    if (this.player) {
      this.player.respawn();
      if (this.events.onHealthChange) {
        this.events.onHealthChange(this.player.health, this.player.maxHealth);
      }
    }
  }

  private loop = (currentTime: number): void => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    if (!this.isPaused && this.player && this.playerController) {
      // 1. Unified Input
      const input = this.inputManager.getInput();

      // 2. Camera Update
      this.thirdPersonCamera.setAspect(this.rendererManager.getAspect());
      this.thirdPersonCamera.update(
        delta,
        this.player.physics.position,
        input.cameraDeltaX,
        input.cameraDeltaY,
        input.zoomDelta
      );

      // 3. Player Controller Update
      this.playerController.update(delta, input, this.thirdPersonCamera.yaw);

      // 4. World & Ghost Update
      const cameraDir = new THREE.Vector3();
      this.thirdPersonCamera.camera.getWorldDirection(cameraDir);

      const isRunning = input.run && !this.player.isExhausted && this.player.stamina > 0;
      this.world.update(delta, this.player.physics.position, cameraDir, isRunning, this.player.isFlashlightOn);

      // 5. Flashlight interference when ghost is near (< 14m)
      const ghostDist = this.world.getGhostDistance();
      if (ghostDist < 14) {
        this.player.setFlashlightFlicker(true);
      } else {
        this.player.setFlashlightFlicker(false);
      }

      // 6. HUD Event callbacks
      if (this.events.onHealthChange) {
        this.events.onHealthChange(this.player.health, this.player.maxHealth);
      }
      if (this.events.onFpsUpdate) {
        this.events.onFpsUpdate(this.rendererManager.currentFps);
      }
      if (this.events.onHorrorStateUpdate) {
        this.events.onHorrorStateUpdate({
          ghostDistance: ghostDist,
          ghostState: this.world.getGhostState(),
          keysCollected: this.world.keysCollected,
          totalKeys: this.world.totalKeys,
          hasEscaped: this.world.hasEscaped,
          isCaught: this.player.health <= 0,
          stamina: this.player.stamina,
          maxStamina: this.player.maxStamina,
          isFlashlightOn: this.player.isFlashlightOn,
          sanity: Math.round(this.player.health),
        });
      }
    }

    // Render Scene
    this.rendererManager.render(this.scene, this.thirdPersonCamera.camera);
  };

  public restartHorrorGame(): void {
    if (this.player && this.world) {
      this.player.respawn();
      this.player.collectedKeys = [];
      this.player.stamina = 100;
      this.world.keysCollected = 0;
      this.world.hasEscaped = false;
      this.world.respawnGhost();
    }
  }

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.isRunning = false;
    this.audioManager.stopBackgroundMusic();
    this.rendererManager.dispose();
  }
}

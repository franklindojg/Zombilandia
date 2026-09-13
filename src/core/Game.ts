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
import { DialogueNode, GraphicQuality, PlayerAppearance } from '../types';

export interface GameEvents {
  onHealthChange?: (hp: number, maxHp: number) => void;
  onCoinsChange?: (coins: number) => void;
  onFpsUpdate?: (fps: number) => void;
  onCheckpointToast?: (name: string, stage: number) => void;
  onDialogueOpen?: (node: DialogueNode) => void;
  onModeStateChange?: (state: any) => void;
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

    // 1. Build World
    this.world = new World(this.scene);

    // 2. Spawn Player
    const spawnPos = new THREE.Vector3(0, 1.5, 0);
    this.player = new Player(savedData.appearance, spawnPos);
    this.player.coins = savedData.coins;
    this.scene.add(this.player.group);

    // 3. Controller
    this.playerController = new PlayerController(this.player);

    // 4. Hook Checkpoints
    this.world.checkpointSystem.setOnCheckpointActivated((name, stage) => {
      if (this.events.onCheckpointToast) {
        this.events.onCheckpointToast(name, stage);
      }
      this.gameModeManager.advanceObbyStage(stage);
    });

    // 5. Hook Coins
    this.world.collectibleManager.update = ((orig) => {
      return (delta: number, playerPos: THREE.Vector3, onCollect: any) => {
        orig.call(this.world.collectibleManager, delta, playerPos, (coin: any) => {
          this.player.coins += coin.value;
          this.saveManager.save({ coins: this.player.coins });
          if (this.events.onCoinsChange) {
            this.events.onCoinsChange(this.player.coins);
          }
          this.gameModeManager.addScore(1);
        });
      };
    })(this.world.collectibleManager.update);

    // 6. Hook Interactions
    this.inputManager.setOnInteract(() => {
      const target = this.world.interactionSystem.currentTarget;
      if (target) {
        if (target.type === 'npc') {
          const npc = this.world.npcs.find((n) => n.id === target.id);
          if (npc && npc.dialogues.length > 0 && this.events.onDialogueOpen) {
            this.events.onDialogueOpen(npc.dialogues[0]);
          }
        }
        this.world.interactionSystem.triggerCurrentInteraction();
      }
    });

    this.inputManager.setOnPause(() => {
      this.togglePause();
    });

    // 7. Hook Mode state
    this.gameModeManager.setOnStateChange((state) => {
      if (this.events.onModeStateChange) {
        this.events.onModeStateChange(state);
      }
    });

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

      // 4. World Update (Sectors, moving obstacles, NPCs, triggers)
      const cameraDir = new THREE.Vector3();
      this.thirdPersonCamera.camera.getWorldDirection(cameraDir);
      this.world.update(delta, this.player.physics.position, cameraDir);

      // 5. Game Mode Update
      this.gameModeManager.update(delta);

      // 6. HUD Event callbacks
      if (this.events.onHealthChange) {
        this.events.onHealthChange(this.player.health, this.player.maxHealth);
      }
      if (this.events.onFpsUpdate) {
        this.events.onFpsUpdate(this.rendererManager.currentFps);
      }
    }

    // Render Scene
    this.rendererManager.render(this.scene, this.thirdPersonCamera.camera);
  };

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.isRunning = false;
    this.audioManager.stopBackgroundMusic();
    this.rendererManager.dispose();
  }
}

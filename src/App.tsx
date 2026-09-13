/**
 * Mansión del Terror 3D - Main React Application Entry Point
 * Orchestrates 3D WebGL Canvas, Horror Game Systems, Flashlight, Menus, Modals, and Touch Controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Game } from './core/Game';
import { SaveManager } from './core/SaveManager';
import { AudioManager } from './core/AudioManager';
import { LoadingScreen } from './ui/LoadingScreen';
import { MainMenu } from './ui/MainMenu';
import { HUD } from './ui/HUD';
import { MobileControls } from './ui/MobileControls';
import { PauseMenu } from './ui/PauseMenu';
import { AvatarModal } from './ui/AvatarModal';
import { SettingsModal } from './ui/SettingsModal';
import { ControlsGuideModal } from './ui/ControlsGuideModal';
import { HorrorResultModal } from './ui/HorrorResultModal';
import {
  GameModeType,
  GameSettings,
  GraphicQuality,
  HorrorGameState,
  GhostState,
  PlayerAppearance,
} from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);

  // Core App Flow State
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isInMenu, setIsInMenu] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Modals
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showControlsGuide, setShowControlsGuide] = useState(false);
  const [resultModal, setResultModal] = useState<'victory' | 'gameover' | null>(null);

  // In-Game Stats
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [fps, setFps] = useState(60);

  // Horror Game State
  const [horrorState, setHorrorState] = useState<HorrorGameState>({
    ghostDistance: 35,
    ghostState: GhostState.PATROL,
    keysCollected: 0,
    totalKeys: 3,
    hasEscaped: false,
    isCaught: false,
    stamina: 100,
    maxStamina: 100,
    isFlashlightOn: true,
    sanity: 100,
  });

  // Checkpoint & Interaction toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);

  // Appearance & Settings
  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinColor: '#fed7aa',
    shirtColor: '#334155',
    pantsColor: '#0f172a',
    hairColor: '#451a03',
    hasHat: true,
    hatType: 'cap',
    hasBackpack: true,
  });

  const [settings, setSettings] = useState<GameSettings>({
    quality: 'medium',
    soundVolume: 0.8,
    musicVolume: 0.5,
    cameraSensitivity: 1.0,
    invertedY: false,
    showFps: true,
  });

  // Check if device is mobile touch
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Detect touch support
    const hasTouch =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
    setIsTouchDevice(hasTouch);

    if (!containerRef.current) return;

    // Instantiate master Game engine
    const game = new Game(containerRef.current);
    gameRef.current = game;

    // Setup event callbacks
    game.events = {
      onHealthChange: (hp, max) => {
        setHealth(hp);
        setMaxHealth(max);
      },
      onFpsUpdate: (f) => {
        setFps(f);
      },
      onToast: (msg) => {
        showToast(msg);
      },
      onHorrorStateUpdate: (state) => {
        setHorrorState(state);
      },
      onVictory: () => {
        setResultModal('victory');
        AudioManager.getInstance().stopHeartbeat();
      },
      onGameOver: () => {
        setResultModal('gameover');
        AudioManager.getInstance().stopHeartbeat();
      },
    };

    // Initialize world and assets
    game
      .init((progress) => {
        setLoadProgress(progress);
      })
      .then(() => {
        const saved = SaveManager.getInstance().getData();
        setAppearance(saved.appearance);
        setSettings(saved.settings);
        setIsLoading(false);
        game.start();
        // Initially paused in main menu
        game.pause();
      });

    // Check interact prompt polling
    const promptInterval = setInterval(() => {
      if (gameRef.current && !gameRef.current.isPaused && gameRef.current.world) {
        const prompt = gameRef.current.world.getInteractionPrompt((keyId) =>
          gameRef.current!.player.hasInventoryKey(keyId)
        );
        setInteractPrompt(prompt);
      }
    }, 120);

    return () => {
      clearInterval(promptInterval);
      game.dispose();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3200);
  };

  const handleStartPlay = (_mode: GameModeType) => {
    if (!gameRef.current) return;
    const audio = AudioManager.getInstance();
    audio.init();
    audio.startHorrorDrone();

    setIsInMenu(false);
    setIsPaused(false);
    setResultModal(null);
    gameRef.current.resume();
    showToast('🕯️ Encuentra las 3 llaves y escapa del fantasma');
  };

  const handlePauseToggle = () => {
    if (!gameRef.current) return;
    const next = gameRef.current.togglePause();
    setIsPaused(next);
  };

  const handleRestartHorror = () => {
    if (!gameRef.current) return;
    gameRef.current.restartHorrorGame();
    setResultModal(null);
    setHealth(100);
    setIsPaused(false);
    gameRef.current.resume();
    AudioManager.getInstance().startHorrorDrone();
    showToast('Respawn en el vestíbulo principal. ¡Busca las 3 llaves!');
  };

  const handleExitToMenu = () => {
    if (!gameRef.current) return;
    gameRef.current.pause();
    setIsPaused(false);
    setResultModal(null);
    setIsInMenu(true);
    AudioManager.getInstance().stopBackgroundMusic();
    AudioManager.getInstance().stopHeartbeat();
  };

  const handleQualityChange = (q: GraphicQuality) => {
    if (!gameRef.current) return;
    gameRef.current.setQuality(q);
    setSettings((prev) => ({ ...prev, quality: q }));
  };

  const handleUpdateAppearance = (newApp: Partial<PlayerAppearance>) => {
    if (!gameRef.current) return;
    const merged = { ...appearance, ...newApp };
    setAppearance(merged);
    gameRef.current.updateAppearance(newApp);
  };

  const handleFlashlightToggle = () => {
    if (gameRef.current) {
      gameRef.current.player.toggleFlashlight();
    }
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);

    if (newSettings.quality) {
      handleQualityChange(newSettings.quality);
    }
    if (newSettings.soundVolume !== undefined) {
      AudioManager.getInstance().setSfxVolume(newSettings.soundVolume);
    }
    if (newSettings.musicVolume !== undefined) {
      AudioManager.getInstance().setMusicVolume(newSettings.musicVolume);
    }
    if (newSettings.cameraSensitivity !== undefined && gameRef.current) {
      gameRef.current.inputManager.sensitivity = newSettings.cameraSensitivity;
    }

    SaveManager.getInstance().save({ settings: merged });
  };

  return (
    <div
      id="game-app-root"
      className="relative w-full h-full overflow-hidden select-none bg-black font-sans touch-none"
    >
      {/* 3D WebGL Canvas Container */}
      <div
        id="game-canvas-container"
        ref={containerRef}
        className="absolute inset-0 w-full h-full block touch-none"
      />

      {/* Loading Screen */}
      {isLoading && <LoadingScreen progress={loadProgress} />}

      {/* Main Menu Overlay */}
      {!isLoading && isInMenu && (
        <MainMenu
          onPlay={handleStartPlay}
          onOpenAvatar={() => setShowAvatarModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenControlsGuide={() => setShowControlsGuide(true)}
        />
      )}

      {/* In-Game Active Horror HUD */}
      {!isLoading && !isInMenu && (
        <>
          <HUD
            health={health}
            maxHealth={maxHealth}
            fps={fps}
            showFps={settings.showFps}
            horrorState={horrorState}
            toastMessage={toastMessage}
            interactPrompt={interactPrompt}
            onPauseClick={handlePauseToggle}
            onAvatarClick={() => setShowAvatarModal(true)}
            onFlashlightClick={handleFlashlightToggle}
          />

          {/* On-screen Mobile Controls (Virtual Joystick, Run, Flashlight & Interact Buttons) */}
          {isTouchDevice && (
            <MobileControls
              showInteractPrompt={!!interactPrompt}
              interactPromptText={interactPrompt || 'INTERACTUAR'}
              isFlashlightOn={horrorState.isFlashlightOn}
            />
          )}
        </>
      )}

      {/* Victory or Game Over Result Modal */}
      {resultModal && (
        <HorrorResultModal
          type={resultModal}
          keysCollected={horrorState.keysCollected}
          totalKeys={horrorState.totalKeys}
          onRestart={handleRestartHorror}
        />
      )}

      {/* Pause Menu */}
      {!isLoading && !isInMenu && isPaused && !resultModal && (
        <PauseMenu
          onResume={handlePauseToggle}
          onRespawn={handleRestartHorror}
          onOpenSettings={() => setShowSettingsModal(true)}
          onExitToMenu={handleExitToMenu}
          quality={settings.quality}
          onQualityChange={handleQualityChange}
        />
      )}

      {/* Avatar Customizer Modal */}
      {showAvatarModal && (
        <AvatarModal
          appearance={appearance}
          onChange={handleUpdateAppearance}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Controls Guide Modal */}
      {showControlsGuide && (
        <ControlsGuideModal onClose={() => setShowControlsGuide(false)} />
      )}
    </div>
  );
}

/**
 * BloxVerse 3D - Main React Application Entry Point
 * Orchestrates 3D WebGL Canvas, Game Systems, Menus, Modals, and Touch Controls.
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
import { DialogueNode, GameModeType, GameSettings, GraphicQuality, PlayerAppearance } from './types';

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

  // In-Game Stats
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [coins, setCoins] = useState(0);
  const [fps, setFps] = useState(60);

  // Checkpoint & Interaction toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<DialogueNode | null>(null);

  // Game Mode
  const [gameMode, setGameMode] = useState<GameModeType>('SANDBOX');
  const [modeTimer, setModeTimer] = useState(0);
  const [modeScore, setModeScore] = useState(0);
  const [modeStage, setModeStage] = useState(1);
  const [bestObbyTime, setBestObbyTime] = useState<number | null>(null);

  // Appearance & Settings
  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinColor: '#fed7aa',
    shirtColor: '#38bdf8',
    pantsColor: '#1e293b',
    hairColor: '#451a03',
    hasHat: true,
    hatType: 'cap',
    hasBackpack: true,
  });

  const [settings, setSettings] = useState<GameSettings>({
    quality: 'medium',
    soundVolume: 0.8,
    musicVolume: 0.4,
    cameraSensitivity: 1.0,
    invertedY: false,
    showFps: true,
  });

  // Check if device is mobile touch
  const [isTouchDevice, setIsTouchDevice] = useState(true);

  useEffect(() => {
    // Detect touch support (also default true on smaller viewports so previewers can test mobile controls)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
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
      onCoinsChange: (c) => {
        setCoins(c);
      },
      onFpsUpdate: (f) => {
        setFps(f);
      },
      onCheckpointToast: (name, stage) => {
        showToast(`🚩 ¡Checkpoint Activado! (${name})`);
      },
      onDialogueOpen: (node) => {
        setActiveDialogue(node);
      },
      onModeStateChange: (state) => {
        setGameMode(state.currentMode);
        setModeTimer(state.timer);
        setModeScore(state.score);
        setModeStage(state.stage);
      },
    };

    // Initialize world and assets
    game
      .init((progress) => {
        setLoadProgress(progress);
      })
      .then(() => {
        const saved = SaveManager.getInstance().getData();
        setCoins(saved.coins);
        setAppearance(saved.appearance);
        setSettings(saved.settings);
        setBestObbyTime(saved.bestObbyTime);
        setIsLoading(false);
        game.start();
        // Initially paused in main menu
        game.pause();
      });

    // Check interact prompt polling
    const promptInterval = setInterval(() => {
      if (gameRef.current && !gameRef.current.isPaused) {
        const target = gameRef.current.world?.interactionSystem?.currentTarget;
        setInteractPrompt(target ? target.promptText : null);
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

  const handleStartPlay = (mode: GameModeType) => {
    if (!gameRef.current) return;
    AudioManager.getInstance().init();
    setIsInMenu(false);
    setIsPaused(false);
    gameRef.current.resume();
    gameRef.current.gameModeManager.startMode(mode);

    if (mode === 'OBBY') {
      // Teleport player near Obby start
      gameRef.current.player.physics.teleport(new THREE_Vector3(-28, 1.5, 26));
      showToast('¡Iniciando Desafío Obby! Supera los obstáculos.');
    } else {
      showToast('¡Modo Libre! Explora la plaza, el parque y los tejados.');
    }
  };

  const handlePauseToggle = () => {
    if (!gameRef.current) return;
    const next = gameRef.current.togglePause();
    setIsPaused(next);
  };

  const handleRespawn = () => {
    if (!gameRef.current) return;
    gameRef.current.respawnPlayer();
    showToast('Reapareciendo en el último checkpoint...');
  };

  const handleExitToMenu = () => {
    if (!gameRef.current) return;
    gameRef.current.pause();
    setIsPaused(false);
    setIsInMenu(true);
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
    <div id="game-app-root" className="relative w-full h-full overflow-hidden select-none bg-slate-950 font-sans touch-none">
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
          coins={coins}
          bestObbyTime={bestObbyTime}
        />
      )}

      {/* In-Game Active HUD */}
      {!isLoading && !isInMenu && (
        <>
          <HUD
            health={health}
            maxHealth={maxHealth}
            coins={coins}
            fps={fps}
            showFps={settings.showFps}
            gameMode={gameMode}
            modeTimer={modeTimer}
            modeScore={modeScore}
            modeStage={modeStage}
            toastMessage={toastMessage}
            interactPrompt={interactPrompt}
            activeDialogue={activeDialogue}
            onCloseDialogue={() => setActiveDialogue(null)}
            onPauseClick={handlePauseToggle}
            onAvatarClick={() => setShowAvatarModal(true)}
          />

          {/* On-screen Mobile Controls (Virtual Joystick & Buttons) */}
          {isTouchDevice && (
            <MobileControls
              showInteractPrompt={!!interactPrompt}
              interactPromptText={interactPrompt || 'ACCIÓN'}
            />
          )}
        </>
      )}

      {/* Pause Menu */}
      {!isLoading && !isInMenu && isPaused && (
        <PauseMenu
          onResume={handlePauseToggle}
          onRespawn={handleRespawn}
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

// Vector helper
class THREE_Vector3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

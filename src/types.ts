/**
 * BloxVerse 3D - Types & Interfaces
 */

export type GraphicQuality = 'low' | 'medium' | 'high';

export type PlayerState = 'IDLE' | 'WALK' | 'RUN' | 'JUMP' | 'FALL' | 'LAND';

export interface PlayerAppearance {
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  hasHat: boolean;
  hatType: 'cap' | 'crown' | 'headphones' | 'none';
  hasBackpack: boolean;
}

export interface PlayerNetworkData {
  id: string;
  position: [number, number, number];
  rotationY: number;
  animation: PlayerState;
  health: number;
  appearance: PlayerAppearance;
}

export interface InputState {
  moveX: number; // -1 to 1 (left/right strafe)
  moveY: number; // -1 to 1 (forward/backward)
  jump: boolean;
  run: boolean;
  interact: boolean;
  cameraDeltaX: number;
  cameraDeltaY: number;
  zoomDelta: number;
}

export interface GameSettings {
  quality: GraphicQuality;
  soundVolume: number;
  musicVolume: number;
  cameraSensitivity: number;
  invertedY: boolean;
  showFps: boolean;
}

export interface SavedGameData {
  coins: number;
  collectedCoinIds: string[];
  lastCheckpoint: [number, number, number] | null;
  appearance: PlayerAppearance;
  settings: GameSettings;
  unlockedBadges: string[];
  bestObbyTime: number | null;
}

export interface Collider {
  id: string;
  type: 'box' | 'cylinder' | 'trampoline' | 'hazard' | 'checkpoint' | 'disappearing';
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  userData?: any;
}

export interface InteractionTarget {
  id: string;
  type: 'npc' | 'chest' | 'sign' | 'door' | 'switch';
  name: string;
  position: [number, number, number];
  promptText: string;
  onInteract: () => void;
}

export interface DialogueNode {
  speaker: string;
  text: string;
  options?: {
    text: string;
    action?: () => void;
  }[];
}

export type GameModeType = 'SANDBOX' | 'OBBY' | 'COIN_RUSH';

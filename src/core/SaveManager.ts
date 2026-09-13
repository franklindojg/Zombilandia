/**
 * BloxVerse 3D - SaveManager
 * Supports IndexedDB with robust LocalStorage fallback.
 */

import { GameSettings, PlayerAppearance, SavedGameData } from '../types';

const DB_NAME = 'BloxVerseDB';
const STORE_NAME = 'saveState';
const STORAGE_KEY = 'bloxverse_save_data';

const DEFAULT_APPEARANCE: PlayerAppearance = {
  skinColor: '#fed7aa', // Peachy block tone
  shirtColor: '#38bdf8', // Vibrant sky blue
  pantsColor: '#1e293b', // Slate dark pants
  hairColor: '#451a03', // Brown hair
  hasHat: true,
  hatType: 'cap',
  hasBackpack: true,
};

const DEFAULT_SETTINGS: GameSettings = {
  quality: 'medium',
  soundVolume: 0.8,
  musicVolume: 0.4,
  cameraSensitivity: 1.0,
  invertedY: false,
  showFps: true,
};

export class SaveManager {
  private static instance: SaveManager | null = null;
  private db: IDBDatabase | null = null;
  private cachedData: SavedGameData;

  private constructor() {
    this.cachedData = {
      coins: 0,
      collectedCoinIds: [],
      lastCheckpoint: null,
      appearance: { ...DEFAULT_APPEARANCE },
      settings: { ...DEFAULT_SETTINGS },
      unlockedBadges: [],
      bestObbyTime: null,
    };
    this.loadFallback();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public async init(): Promise<void> {
    return new Promise((resolve) => {
      if (!('indexedDB' in window)) {
        this.loadFallback();
        resolve();
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          this.loadFromIndexedDB().then(resolve);
        };

        request.onerror = () => {
          this.loadFallback();
          resolve();
        };
      } catch {
        this.loadFallback();
        resolve();
      }
    });
  }

  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('player_save');

        req.onsuccess = () => {
          if (req.result) {
            this.cachedData = { ...this.cachedData, ...req.result };
          } else {
            this.loadFallback();
          }
          resolve();
        };

        req.onerror = () => {
          this.loadFallback();
          resolve();
        };
      } catch {
        this.loadFallback();
        resolve();
      }
    });
  }

  private loadFallback(): void {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        const parsed = JSON.parse(dataStr);
        this.cachedData = { ...this.cachedData, ...parsed };
      }
    } catch {
      // Ignored
    }
  }

  public getData(): SavedGameData {
    return this.cachedData;
  }

  public async save(partial: Partial<SavedGameData>): Promise<void> {
    this.cachedData = { ...this.cachedData, ...partial };

    // Fallback sync
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedData));
    } catch {
      // Safe
    }

    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(this.cachedData, 'player_save');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

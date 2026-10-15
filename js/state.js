// Estado compartido explícito: todas las escenas y sistemas observan el mismo objeto.
export const state = {
  // Versión de prueba: las veinte arenas están disponibles desde el inicio.
  unlockedMaxLevel: 20,
  selectedCupIndex: 0,
  selectedLevelNumber: 1,
  gameState: 'MENU',
  activeArena: null,
  combatants: [],
  weaponCrates: [],
  repairWrenches: [],
  jumpRamps: [],
  arenaObstacles: [],
  projectiles: [],
  explosions: [],
  battleTimer: 0,
  garageKartMesh: null,
};

export const playerCustom = {
      bodyStyle: "standard",
      primary: "#e64242",
      secondary: "#3155bd",
      rims: "#f6c65b",
      emblem: "F",
      tuning: "balanced",
      textureId: "scarlet"
    };

export const keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false,
      fireMG: false
    };

export function resetInputs() {
  for (const key of Object.keys(keys)) keys[key] = false;
}

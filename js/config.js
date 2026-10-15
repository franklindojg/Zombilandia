// Datos del juego: biomas, niveles, armas y cinco vehículos.
export const CUPS_DATA = [
      {
        id: 0,
        name: "Sector Pradera",
        icon: "🍄",
        biomeKey: "meadow",
        groundSprite: "meadow_grass_v2.png",
        roadSprite: "meadow_grass_v2.png",
        barrierSprite: "wooden_fence_v2.png",
        biomeLabel: "Pradera Verde & Cerca de Madera",
        roadColor: "#487b35",
        arenaFloorColor: "#57962e",
        zoneRingColor: "#dc2626",
        skyTop: "#1e3a8a",
        fogColor: "#475569",
        ambientColor: 0xdbeafe,
        sunColor: 0xfffbeb,
        surfaceGrip: 1.0,
        surfaceDrag: 0.55,
        roughness: 0.78,
        metalness: 0.08,
        description: "Prado verde con circuito de pasto y cerca de madera. Tracción 100% ideal para maniobras evasivas."
      },
      {
        id: 1,
        name: "Desierto Oscuro",
        icon: "🏜️",
        biomeKey: "desert",
        groundSprite: "desert_dirt_v2.png",
        roadSprite: "desert_dirt_v2.png",
        biomeLabel: "Desierto de Tierra & Barrera de Cemento",
        // COLORES OSCUROS FIELES A LA ESPECIFICACIÓN DEL DESIERTO
        roadColor: "#65492c",
        arenaFloorColor: "#95713f",
        zoneRingColor: "#d97706",
        skyTop: "#1c0d04",
        fogColor: "#361505",
        ambientColor: 0xfed7aa,
        sunColor: 0xf97316,
        surfaceGrip: 0.84,
        surfaceDrag: 0.68,
        roughness: 0.92,
        metalness: 0.05,
        description: "Suelo de tierra compactada y circuito marrón con barrera de cemento. Tracción del 84% con derrapes amplios."
      },
      {
        id: 2,
        name: "Sector Glaciar",
        icon: "❄️",
        biomeKey: "snow",
        biomeLabel: "Estación Polar & Hielo Azul Profundo",
        roadColor: "#162a3d",
        arenaFloorColor: "#0f1e30",
        zoneRingColor: "#38bdf8",
        skyTop: "#091526",
        fogColor: "#1e293b",
        ambientColor: 0xe0f2fe,
        sunColor: 0xbae6fd,
        surfaceGrip: 0.62,
        surfaceDrag: 0.38,
        roughness: 0.25,
        metalness: 0.35,
        description: "Placa de hielo sub-ártico oscuro con solo 62% de agarre. El retroceso de los cañones te deslizará."
      },
      {
        id: 3,
        name: "Sector Volcán",
        icon: "🌋",
        biomeKey: "volcano",
        biomeLabel: "Cráter de Obsidiana & Fundición de Magma",
        roadColor: "#110909",
        arenaFloorColor: "#1a0808",
        zoneRingColor: "#ef4444",
        skyTop: "#090202",
        fogColor: "#2a0808",
        ambientColor: 0xfecaca,
        sunColor: 0xef4444,
        surfaceGrip: 1.12,
        surfaceDrag: 0.62,
        roughness: 0.88,
        metalness: 0.18,
        description: "Roca basáltica negra e incandescente con 112% de agarre. Cuidado con los géiseres de lava."
      },
      {
        id: 4,
        name: "Sector Sidereo",
        icon: "🌈",
        biomeKey: "rainbow",
        biomeLabel: "Plataforma Orbital Ciber-Arcoíris",
        roadColor: "#130924",
        arenaFloorColor: "#0b0418",
        zoneRingColor: "#e879f9",
        skyTop: "#030108",
        fogColor: "#0f0720",
        ambientColor: 0xf5d0fe,
        sunColor: 0xc084fc,
        surfaceGrip: 1.05,
        surfaceDrag: 0.48,
        roughness: 0.30,
        metalness: 0.55,
        description: "Coliseo espacial de cristal magnético con rampas de salto de baja gravedad y bordes neón."
      }
    ];


    export const LEVELS_20 = [
      // Sector 1: Pradera (Niveles 1-4)
      { level: 1, cup: 0, name: "Arena Champiñón V8", radius5x: 560, enemyCount: 4, enemyHp: 90, aiAggro: 0.65, heightAmp: 10 },
      { level: 2, cup: 0, name: "Búnker de las Colinas", radius5x: 620, enemyCount: 4, enemyHp: 100, aiAggro: 0.70, heightAmp: 16 },
      { level: 3, cup: 0, name: "Granja de Demolición", radius5x: 680, enemyCount: 4, enemyHp: 105, aiAggro: 0.74, heightAmp: 20 },
      { level: 4, cup: 0, name: "Autódromo en Ruinas", radius5x: 740, enemyCount: 4, enemyHp: 110, aiAggro: 0.78, heightAmp: 24 },

      // Sector 2: Desierto Oscuro (Niveles 5-8)
      { level: 5, cup: 1, name: "Pozo Petrolífero Kalimari", radius5x: 640, enemyCount: 4, enemyHp: 110, aiAggro: 0.78, heightAmp: 18 },
      { level: 6, cup: 1, name: "Cañón de Brea Negra", radius5x: 700, enemyCount: 4, enemyHp: 115, aiAggro: 0.82, heightAmp: 28 },
      { level: 7, cup: 1, name: "Cementerio de Aviones", radius5x: 760, enemyCount: 4, enemyHp: 120, aiAggro: 0.85, heightAmp: 24 },
      { level: 8, cup: 1, name: "Refinería Sombra Nocturna", radius5x: 820, enemyCount: 4, enemyHp: 125, aiAggro: 0.88, heightAmp: 32 },

      // Sector 3: Glaciar (Niveles 9-12)
      { level: 9, cup: 2, name: "Base Ártica Sherbet", radius5x: 660, enemyCount: 4, enemyHp: 120, aiAggro: 0.86, heightAmp: 16 },
      { level: 10, cup: 2, name: "Rompehielos Nuclear", radius5x: 720, enemyCount: 4, enemyHp: 130, aiAggro: 0.90, heightAmp: 26 },
      { level: 11, cup: 2, name: "Domo Radar Congelado", radius5x: 780, enemyCount: 4, enemyHp: 135, aiAggro: 0.92, heightAmp: 30 },
      { level: 12, cup: 2, name: "Ventisca Cero Absoluto", radius5x: 840, enemyCount: 4, enemyHp: 140, aiAggro: 0.95, heightAmp: 34 },

      // Sector 4: Volcán (Niveles 13-16)
      { level: 13, cup: 3, name: "Caldera de Obsidiana V8", radius5x: 700, enemyCount: 4, enemyHp: 140, aiAggro: 0.95, heightAmp: 24 },
      { level: 14, cup: 3, name: "Fundición de Bowser", radius5x: 760, enemyCount: 4, enemyHp: 150, aiAggro: 0.98, heightAmp: 30 },
      { level: 15, cup: 3, name: "Cráter de Escoria Negra", radius5x: 840, enemyCount: 4, enemyHp: 160, aiAggro: 1.00, heightAmp: 36 },
      { level: 16, cup: 3, name: "Fortaleza Magma Total", radius5x: 900, enemyCount: 4, enemyHp: 170, aiAggro: 1.05, heightAmp: 40 },

      // Sector 5: Estelar (Niveles 17-20)
      { level: 17, cup: 4, name: "Hangar Lunar Neón", radius5x: 780, enemyCount: 4, enemyHp: 165, aiAggro: 1.05, heightAmp: 28 },
      { level: 18, cup: 4, name: "Reactor de Orión", radius5x: 860, enemyCount: 4, enemyHp: 175, aiAggro: 1.08, heightAmp: 34 },
      { level: 19, cup: 4, name: "Coliseo Ciber-Estelar", radius5x: 940, enemyCount: 4, enemyHp: 185, aiAggro: 1.12, heightAmp: 38 },
      { level: 20, cup: 4, name: "Gran Arena Arcoíris V8", radius5x: 1020, enemyCount: 4, enemyHp: 200, aiAggro: 1.15, heightAmp: 44 }
    ];

    // Armamento clásico inspirado en Vigilante 8 de PS1
    export const V8_WEAPONS = [
      { id: "interceptor", name: "Misil Halo", icon: "🚀", ammo: 3, damage: 28, speed: 175, color: 0xf43f5e, desc: "Misil teledirigido al blanco fijado" },
      { id: "bulls_eye", name: "Cohetes Stampede", icon: "🧨", ammo: 2, damage: 42, speed: 210, color: 0xf97316, desc: "Salva explosiva de alto impacto" },
      { id: "sky_hammer", name: "Mortero Cráter", icon: "💣", ammo: 3, damage: 38, speed: 130, color: 0xa855f7, desc: "Proyectil parabólico de demolición" },
      { id: "bruiser", name: "Cañón Bruiser", icon: "💥", ammo: 3, damage: 36, speed: 230, color: 0xfacc15, desc: "Proyectil pesado con fuerte retroceso" },
      { id: "land_mine", name: "Mina Cactus", icon: "⚙️", ammo: 4, damage: 45, speed: 0, color: 0x22c55e, desc: "Mina de proximidad magnética" },
      { id: "shield_star", name: "Escudo Invencible", icon: "🛡️", ammo: 1, damage: 0, speed: 0, color: 0x38bdf8, desc: "Blindaje de energía + Turbo ariete" }
    ];

export const KART_PRESETS = {
      scarlet: { name: 'Furia Roja', textureId: 'scarlet', bodyStyle: 'standard', primary: '#e64242', secondary: '#3155bd', rims: '#f6c65b', emblem: 'F' },
      jade: { name: 'Cobra Verde', textureId: 'jade', bodyStyle: 'pipeframe', primary: '#3db86e', secondary: '#23507c', rims: '#d7c565', emblem: 'C' },
      gold: { name: 'Trueno Dorado', textureId: 'gold', bodyStyle: 'bdasher', primary: '#e3b63c', secondary: '#6e498d', rims: '#f0d178', emblem: 'T' },
      magenta: { name: 'Rayo Rosa', textureId: 'magenta', bodyStyle: 'standard', primary: '#d95a99', secondary: '#367a9b', rims: '#f5d3a0', emblem: 'R' },
      cobalt: { name: 'Neón Azul', textureId: 'cobalt', bodyStyle: 'pipeframe', primary: '#468fe0', secondary: '#495a70', rims: '#bad5d6', emblem: 'N' }
    };

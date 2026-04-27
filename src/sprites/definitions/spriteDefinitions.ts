export interface AnimationDefinition {
  name: string;
  frames: number;
  speed: number;
  loop: boolean;
}

export interface LODLevel {
  size: number;
  distance: number;
}

export interface SpriteDefinition {
  id: string;
  name: string;
  roles: string[];
  baseSize: { width: number; height: number };
  animations: AnimationDefinition[];
  lod: {
    high: LODLevel;
    medium: LODLevel;
    low: LODLevel;
  };
}

export type ViewMode = 'topdown' | 'side';
export type SpritePhase = 'core' | 'extended';

export interface SpriteSheetAnimationMeta {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface SpriteSheetMetadata {
  frameWidth: number;
  frameHeight: number;
  view: ViewMode;
  role: string;
  animations: Record<string, SpriteSheetAnimationMeta>;
}

export interface SpriteSheetAssetRef {
  imagePath: string;
  metadataPath: string;
}

export const ANT_SPRITES: Record<string, SpriteDefinition> = {
  worker: {
    id: 'worker',
    name: 'Worker Ant',
    roles: ['worker', 'media', 'minor'],
    baseSize: { width: 16, height: 16 },
    animations: [
      { name: 'idle', frames: 4, speed: 4, loop: true },
      { name: 'walk', frames: 6, speed: 8, loop: true },
      { name: 'dig', frames: 4, speed: 6, loop: true },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 64, distance: 100 },
      medium: { size: 32, distance: 300 },
      low: { size: 16, distance: Infinity },
    },
  },

  soldier: {
    id: 'soldier',
    name: 'Soldier Ant',
    roles: ['soldier', 'major'],
    baseSize: { width: 20, height: 20 },
    animations: [
      { name: 'idle', frames: 4, speed: 4, loop: true },
      { name: 'walk', frames: 6, speed: 8, loop: true },
      { name: 'attack', frames: 4, speed: 10, loop: false },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 80, distance: 100 },
      medium: { size: 40, distance: 300 },
      low: { size: 20, distance: Infinity },
    },
  },

  scout: {
    id: 'scout',
    name: 'Scout Ant',
    roles: ['scout'],
    baseSize: { width: 16, height: 16 },
    animations: [
      { name: 'idle', frames: 3, speed: 4, loop: true },
      { name: 'walk', frames: 6, speed: 10, loop: true },
      { name: 'search', frames: 4, speed: 6, loop: true },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 64, distance: 100 },
      medium: { size: 32, distance: 300 },
      low: { size: 16, distance: Infinity },
    },
  },

  nurse: {
    id: 'nurse',
    name: 'Nurse Ant',
    roles: ['nurse'],
    baseSize: { width: 16, height: 16 },
    animations: [
      { name: 'idle', frames: 4, speed: 3, loop: true },
      { name: 'walk', frames: 6, speed: 6, loop: true },
      { name: 'feed', frames: 4, speed: 6, loop: true },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 64, distance: 100 },
      medium: { size: 32, distance: 300 },
      low: { size: 16, distance: Infinity },
    },
  },

  builder: {
    id: 'builder',
    name: 'Builder Ant',
    roles: ['builder'],
    baseSize: { width: 16, height: 16 },
    animations: [
      { name: 'idle', frames: 3, speed: 4, loop: true },
      { name: 'walk', frames: 6, speed: 6, loop: true },
      { name: 'dig', frames: 6, speed: 8, loop: true },
      { name: 'carry', frames: 4, speed: 6, loop: true },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 64, distance: 100 },
      medium: { size: 32, distance: 300 },
      low: { size: 16, distance: Infinity },
    },
  },

  queen: {
    id: 'queen',
    name: 'Queen Ant',
    roles: ['queen'],
    baseSize: { width: 24, height: 32 },
    animations: [
      { name: 'idle', frames: 4, speed: 3, loop: true },
      { name: 'walk', frames: 6, speed: 4, loop: true },
      { name: 'layEgg', frames: 8, speed: 6, loop: false },
      { name: 'die', frames: 8, speed: 6, loop: false },
    ],
    lod: {
      high: { size: 96, distance: 100 },
      medium: { size: 48, distance: 300 },
      low: { size: 24, distance: Infinity },
    },
  },

  guard: {
    id: 'guard',
    name: 'Guard Ant',
    roles: ['guard'],
    baseSize: { width: 20, height: 20 },
    animations: [
      { name: 'idle', frames: 4, speed: 4, loop: true },
      { name: 'attack', frames: 4, speed: 12, loop: false },
      { name: 'die', frames: 6, speed: 8, loop: false },
    ],
    lod: {
      high: { size: 80, distance: 100 },
      medium: { size: 40, distance: 300 },
      low: { size: 20, distance: Infinity },
    },
  },

  drone: {
    id: 'drone',
    name: 'Drone Ant',
    roles: ['drone'],
    baseSize: { width: 16, height: 16 },
    animations: [
      { name: 'idle', frames: 3, speed: 4, loop: true },
      { name: 'fly', frames: 4, speed: 8, loop: true },
      { name: 'die', frames: 4, speed: 6, loop: false },
    ],
    lod: {
      high: { size: 64, distance: 100 },
      medium: { size: 32, distance: 300 },
      low: { size: 16, distance: Infinity },
    },
  },

  alate: {
    id: 'alate',
    name: 'Alate Ant',
    roles: ['alate'],
    baseSize: { width: 20, height: 20 },
    animations: [
      { name: 'idle', frames: 3, speed: 4, loop: true },
      { name: 'walk', frames: 4, speed: 6, loop: true },
      { name: 'fly', frames: 4, speed: 8, loop: true },
      { name: 'die', frames: 4, speed: 6, loop: false },
    ],
    lod: {
      high: { size: 80, distance: 100 },
      medium: { size: 40, distance: 300 },
      low: { size: 20, distance: Infinity },
    },
  },
};

export type SpriteRole = keyof typeof ANT_SPRITES;

const VIEW_MODES: ViewMode[] = ['topdown', 'side'];
const SPRITE_PHASES: SpritePhase[] = ['core', 'extended'];

export const SPRITE_SHEET_ASSETS: Record<SpriteRole, Record<ViewMode, Record<SpritePhase, SpriteSheetAssetRef>>> =
  (Object.keys(ANT_SPRITES) as SpriteRole[]).reduce((roleAcc, role) => {
    roleAcc[role] = VIEW_MODES.reduce((viewAcc, view) => {
      viewAcc[view] = SPRITE_PHASES.reduce((phaseAcc, phase) => {
        const basePath = `/src/assets/sprites/ants/${view}/${role}-${phase}`;
        phaseAcc[phase] = {
          imagePath: `${basePath}.png`,
          metadataPath: `${basePath}.json`,
        };
        return phaseAcc;
      }, {} as Record<SpritePhase, SpriteSheetAssetRef>);
      return viewAcc;
    }, {} as Record<ViewMode, Record<SpritePhase, SpriteSheetAssetRef>>);
    return roleAcc;
  }, {} as Record<SpriteRole, Record<ViewMode, Record<SpritePhase, SpriteSheetAssetRef>>>);

export const FOOD_SPRITES = {
  sugar: {
    id: 'sugar',
    name: 'Sugar',
    baseSize: { width: 8, height: 8 },
    lod: {
      high: { size: 32, distance: 100 },
      medium: { size: 16, distance: 300 },
      low: { size: 8, distance: Infinity },
    },
  },
  protein: {
    id: 'protein',
    name: 'Protein',
    baseSize: { width: 8, height: 8 },
    lod: {
      high: { size: 32, distance: 100 },
      medium: { size: 16, distance: 300 },
      low: { size: 8, distance: Infinity },
    },
  },
  water: {
    id: 'water',
    name: 'Water',
    baseSize: { width: 8, height: 8 },
    lod: {
      high: { size: 32, distance: 100 },
      medium: { size: 16, distance: 300 },
      low: { size: 8, distance: Infinity },
    },
  },
  seeds: {
    id: 'seeds',
    name: 'Seeds',
    baseSize: { width: 8, height: 8 },
    lod: {
      high: { size: 32, distance: 100 },
      medium: { size: 16, distance: 300 },
      low: { size: 8, distance: Infinity },
    },
  },
};

export const BROOD_SPRITES = {
  egg: {
    id: 'egg',
    name: 'Egg',
    baseSize: { width: 4, height: 6 },
    lod: {
      high: { size: 24, distance: 50 },
      medium: { size: 12, distance: 150 },
      low: { size: 6, distance: Infinity },
    },
  },
  larva: {
    id: 'larva',
    name: 'Larva',
    baseSize: { width: 6, height: 8 },
    lod: {
      high: { size: 32, distance: 50 },
      medium: { size: 16, distance: 150 },
      low: { size: 8, distance: Infinity },
    },
  },
  pupa: {
    id: 'pupa',
    name: 'Pupa',
    baseSize: { width: 6, height: 8 },
    lod: {
      high: { size: 32, distance: 50 },
      medium: { size: 16, distance: 150 },
      low: { size: 8, distance: Infinity },
    },
  },
};

export const PREDATOR_SPRITES = {
  spider: {
    id: 'spider',
    name: 'Spider',
    baseSize: { width: 24, height: 20 },
    animations: [
      { name: 'idle', frames: 2, speed: 4, loop: true },
      { name: 'walk', frames: 4, speed: 6, loop: true },
      { name: 'attack', frames: 3, speed: 10, loop: false },
    ],
    lod: {
      high: { size: 96, distance: 150 },
      medium: { size: 48, distance: 400 },
      low: { size: 24, distance: Infinity },
    },
  },
  mantis: {
    id: 'mantis',
    name: 'Praying Mantis',
    baseSize: { width: 28, height: 32 },
    animations: [
      { name: 'idle', frames: 2, speed: 3, loop: true },
      { name: 'attack', frames: 4, speed: 12, loop: false },
    ],
    lod: {
      high: { size: 128, distance: 150 },
      medium: { size: 64, distance: 400 },
      low: { size: 32, distance: Infinity },
    },
  },
  lizard: {
    id: 'lizard',
    name: 'Lizard',
    baseSize: { width: 32, height: 16 },
    animations: [
      { name: 'idle', frames: 2, speed: 4, loop: true },
      { name: 'walk', frames: 4, speed: 8, loop: true },
      { name: 'attack', frames: 3, speed: 10, loop: false },
    ],
    lod: {
      high: { size: 128, distance: 150 },
      medium: { size: 64, distance: 400 },
      low: { size: 32, distance: Infinity },
    },
  },
};

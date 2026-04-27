export const GAME_CONFIG = {
  TILE_SIZE: 32,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  FPS: 60,
};

export const DIFFICULTY = {
  BEGINNER: 'beginner',
  NORMAL: 'normal',
  HARD: 'hard',
  REALISTIC: 'realistic',
} as const;

export type Difficulty = typeof DIFFICULTY[keyof typeof DIFFICULTY];

export const MAP_SIZES = {
  TINY: { width: 500, height: 500, label: 'Tiny' },
  SMALL: { width: 1000, height: 1000, label: 'Small' },
  MEDIUM: { width: 2000, height: 2000, label: 'Medium' },
  LARGE: { width: 4000, height: 4000, label: 'Large' },
  MASSIVE: { width: 8000, height: 8000, label: 'Massive' },
} as const;

export type MapSize = keyof typeof MAP_SIZES;

export const ANT_SPECIES = {
  COMMON_BLACK: { id: 'common_black', name: 'Common Black Ant' },
} as const;

export const STARTING_ANTS = {
  [DIFFICULTY.BEGINNER]: { workers: 25, scouts: 3, soldiers: 5, nurses: 5, builders: 5, guards: 3 },
  [DIFFICULTY.NORMAL]: { workers: 15, scouts: 2, soldiers: 3, nurses: 3, builders: 2, guards: 2 },
  [DIFFICULTY.HARD]: { workers: 10, scouts: 1, soldiers: 2, nurses: 1, builders: 1, guards: 1 },
  [DIFFICULTY.REALISTIC]: { workers: 5, scouts: 0, soldiers: 1, nurses: 1, builders: 0, guards: 0 },
};

export const COLORS = {
  PLAYER_ANT: '#4a3728',
  SOLDIER_ANT: '#2d1f14',
  SCOUT_ANT: '#6b4c38',
  QUEEN_ANT: '#1a0f0a',
  ENEMY_ANT: '#c94c4c',
  WORKERANT: '#5c4033',
  
  UI_BACKGROUND: '#1a1410',
  UI_BORDER: '#6b4423',
  UI_BUTTON: '#3d2817',
  UI_BUTTON_HOVER: '#5c4033',
  UI_BUTTON_TEXT: '#d4a574',
  UI_TITLE: '#d4a574',
  
  FOOD_SUGAR: '#7cfc00',
  FOOD_PROTEIN: '#dc143c',
  FOOD_WATER: '#00bfff',
  
  TERRAIN_GRASS: '#228b22',
  TERRAIN_DIRT: '#8b4513',
  TERRAIN_ROCK: '#696969',
} as const;

export const FONT = {
  PRIMARY: '"Press Start 2P", cursive',
  SECONDARY: '"VT323", monospace',
  BODY: '"Silkscreen", cursive',
};
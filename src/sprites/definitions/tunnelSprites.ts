export const TUNNEL_TILE_SIZE = 16;
export const TUNNEL_SPRITE_COLS = 7;
export const TUNNEL_SPRITE_ROWS = 4;

export enum TunnelSpriteIndex {
  DIRT = 0,
  TUNNEL_H = 1,
  TUNNEL_V = 2,
  CORNER_TR = 3,
  CORNER_TL = 4,
  CORNER_BR = 5,
  CORNER_BL = 6,
  TUNNEL_H_BG = 7,
  TUNNEL_H_BG2 = 8,
  TUNNEL_V_BG = 9,
  TUNNEL_V_BG2 = 10,
  ENTRANCE_1 = 11,
  ENTRANCE_2 = 12,
  ENTRANCE_3 = 13,
  ENTRANCE_4 = 14,
  ENTRANCE_5 = 15,
  ENTRANCE_6 = 16,
  JUNCTION_ALL = 17,
  JUNCTION_BOTTOM = 18,
  JUNCTION_RIGHT = 19,
  JUNCTION_TOP = 20,
  JUNCTION_TOP_BOTTOM = 21,
  JUNCTION_LEFT_RIGHT = 22,
  JUNCTION_LEFT_BOTTOM = 23,
}

export interface TunnelSpriteConfig {
  imagePath: string;
  tileSize: number;
  cols: number;
  rows: number;
}

export const TUNNEL_SPRITE_CONFIG: TunnelSpriteConfig = {
  imagePath: '../assets/tunnels.png',
  tileSize: TUNNEL_TILE_SIZE,
  cols: TUNNEL_SPRITE_COLS,
  rows: TUNNEL_SPRITE_ROWS,
};
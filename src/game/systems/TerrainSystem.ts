import * as PIXI from 'pixi.js';

export type TileType = 'grass' | 'dirt' | 'stone' | 'water' | 'sand' | 'path';

export interface TileConfig {
  type: TileType;
  walkable: boolean;
  color: number;
  variation: number;
}

export interface TerrainChunk {
  x: number;
  y: number;
  tiles: PIXI.Graphics;
  size: number;
}

export class TerrainSystem {
  private chunks: Map<string, PIXI.Container> = new Map();
  private container: PIXI.Container;
  private chunkSize: number = 256;
  private tileSize: number = 16;
  private seed: number;
  
  private tileConfigs: Record<TileType, TileConfig> = {
    grass: { type: 'grass', walkable: true, color: 0x4a8c4a, variation: 0x3d7a3d },
    dirt: { type: 'dirt', walkable: true, color: 0x8b7355, variation: 0x7a6348 },
    stone: { type: 'stone', walkable: false, color: 0x808080, variation: 0x696969 },
    water: { type: 'water', walkable: false, color: 0x4169e1, variation: 0x6495ed },
    sand: { type: 'sand', walkable: true, color: 0xc2b280, variation: 0xb5a66e },
    path: { type: 'path', walkable: true, color: 0xa08060, variation: 0x8b7355 },
  };
  
  private generatedTiles: Set<string> = new Set();

  constructor(container: PIXI.Container, seed: number = Date.now()) {
    this.container = container;
    this.seed = seed;
  }

  setChunkSize(size: number): void {
    this.chunkSize = size;
  }

  setTileSize(size: number): void {
    this.tileSize = size;
  }

  getTileConfig(type: TileType): TileConfig {
    return this.tileConfigs[type];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    if (!tile) return true;
    return this.tileConfigs[tile].walkable;
  }

  getTileAt(x: number, y: number): TileType | null {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const key = `${chunkX},${chunkY}`;
    
    if (!this.generatedTiles.has(key)) {
      return null;
    }
    
    const tileX = Math.floor((x % this.chunkSize) / this.tileSize);
    const tileY = Math.floor((y % this.chunkSize) / this.tileSize);
    const tileHash = this.hashTile(chunkX, chunkY, tileX, tileY);
    
    return this.getTileTypeFromHash(tileHash, x, y);
  }

  private getTileTypeFromHash(hash: number, x: number, y: number): TileType {
    const normalizedHash = (hash + x * 0.1 + y * 0.2) % 100;
    
    if (normalizedHash < 60) return 'grass';
    if (normalizedHash < 75) return 'dirt';
    if (normalizedHash < 80) return 'path';
    if (normalizedHash < 85) return 'sand';
    if (normalizedHash < 95) return 'stone';
    return 'water';
  }

  private hashTile(chunkX: number, chunkY: number, tileX: number, tileY: number): number {
    const n1 = this.seededRandom(chunkX * 1000 + tileX);
    const n2 = this.seededRandom(chunkY * 1000 + tileY);
    const n3 = this.seededRandom((chunkX + chunkY) * 500 + tileX + tileY);
    return Math.floor((n1 + n2 + n3) * 1000000);
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed * this.seed) * 10000;
    return x - Math.floor(x);
  }

  generateChunk(chunkX: number, chunkY: number): PIXI.Container {
    const key = `${chunkX},${chunkY}`;
    
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }

    const chunkContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    
    const startX = chunkX * this.chunkSize;
    const startY = chunkY * this.chunkSize;
    
    const tilesX = Math.ceil(this.chunkSize / this.tileSize);
    const tilesY = Math.ceil(this.chunkSize / this.tileSize);

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const worldX = startX + tx * this.tileSize;
        const worldY = startY + ty * this.tileSize;
        const hash = this.hashTile(chunkX, chunkY, tx, ty);
        const tileType = this.getTileTypeFromHash(hash, worldX, worldY);
        const config = this.tileConfigs[tileType];
        
        const screenX = tx * this.tileSize;
        const screenY = ty * this.tileSize;
        
        const colorHash = this.seededRandom(hash + 1);
        const color = colorHash > 0.5 ? config.color : config.variation;
        
        graphics.rect(screenX, screenY, this.tileSize, this.tileSize);
        graphics.fill({ color, alpha: 1 });
        
        if (colorHash > 0.7 && tileType === 'grass') {
          graphics.circle(
            screenX + this.tileSize / 2,
            screenY + this.tileSize / 2,
            2
          );
          graphics.fill({ color: 0x5a9c5a });
        }
      }
    }

    chunkContainer.addChild(graphics);
    chunkContainer.position.set(startX, startY);
    
    this.chunks.set(key, chunkContainer);
    this.generatedTiles.add(key);
    this.container.addChild(chunkContainer);
    
    return chunkContainer;
  }

  updateChunks(cameraX: number, cameraY: number, viewWidth: number, viewHeight: number, zoom: number): void {
    const visibleRadius = Math.max(viewWidth, viewHeight) / 2 / zoom + this.chunkSize;
    
    const centerChunkX = Math.floor(cameraX / this.chunkSize);
    const centerChunkY = Math.floor(cameraY / this.chunkSize);
    
    const chunksToShow = Math.ceil(visibleRadius / this.chunkSize) + 1;

    const neededChunks: Set<string> = new Set();
    
    for (let dy = -chunksToShow; dy <= chunksToShow; dy++) {
      for (let dx = -chunksToShow; dx <= chunksToShow; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkY = centerChunkY + dy;
        const key = `${chunkX},${chunkY}`;
        neededChunks.add(key);
        
        if (!this.chunks.has(key)) {
          this.generateChunk(chunkX, chunkY);
        }
      }
    }

    for (const [key, chunk] of this.chunks) {
      chunk.visible = neededChunks.has(key);
    }
  }

  getChunks(): Map<string, PIXI.Container> {
    return this.chunks;
  }

  clearChunks(): void {
    for (const chunk of this.chunks.values()) {
      this.container.removeChild(chunk);
      chunk.destroy({ children: true });
    }
    this.chunks.clear();
    this.generatedTiles.clear();
  }

  setSeed(seed: number): void {
    this.seed = seed;
  }

  getSeed(): number {
    return this.seed;
  }

  addDecoration(x: number, y: number, type: 'rock' | 'flower' | 'log' | 'mushroom'): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    
    switch (type) {
      case 'rock':
        graphics.circle(x, y, 8);
        graphics.fill({ color: 0x696969 });
        graphics.circle(x - 2, y - 2, 3);
        graphics.fill({ color: 0x808080, alpha: 0.5 });
        break;
        
      case 'flower':
        graphics.circle(x, y, 3);
        graphics.fill({ color: 0xff69b4 });
        graphics.circle(x, y, 2);
        graphics.fill({ color: 0xffff00 });
        graphics.rect(x - 1, y, 2, 6);
        graphics.fill({ color: 0x228b22 });
        break;
        
      case 'log':
        graphics.rect(x - 12, y - 4, 24, 8);
        graphics.fill({ color: 0x8b4513 });
        graphics.rect(x - 10, y - 2, 20, 4);
        graphics.fill({ color: 0xa0522d });
        break;
        
      case 'mushroom':
        graphics.rect(x - 2, y, 4, 6);
        graphics.fill({ color: 0xf5f5dc });
        graphics.circle(x, y - 2, 6);
        graphics.fill({ color: 0xff6347 });
        graphics.circle(x - 2, y - 3, 1);
        graphics.fill({ color: 0xffffff });
        graphics.circle(x + 2, y - 2, 1);
        graphics.fill({ color: 0xffffff });
        break;
    }
    
    this.container.addChild(graphics);
    return graphics;
  }
}
import * as PIXI from 'pixi.js';
import { TUNNEL_TILE_SIZE, TUNNEL_SPRITE_COLS, TunnelSpriteIndex } from '../sprites/definitions/tunnelSprites';

const tunnelAsset = import.meta.glob('../assets/tunnels.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export class TunnelRenderer {
  private baseTexture: PIXI.Texture | null = null;
  private tileTextures: PIXI.Texture[] = [];
  private loaded = false;

  async loadTextures(): Promise<void> {
    if (this.loaded) return;

    const tunnelUrl = tunnelAsset['../assets/tunnels.png'];
    if (!tunnelUrl) {
      console.error('Tunnel sprite not found');
      return;
    }
    this.baseTexture = await PIXI.Assets.load<PIXI.Texture>(tunnelUrl);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < TUNNEL_SPRITE_COLS; col++) {
        const frame = new PIXI.Rectangle(
          col * TUNNEL_TILE_SIZE,
          row * TUNNEL_TILE_SIZE,
          TUNNEL_TILE_SIZE,
          TUNNEL_TILE_SIZE
        );
        const texture = new PIXI.Texture({
          source: this.baseTexture.source,
          frame,
        });
        this.tileTextures.push(texture);
      }
    }

    this.loaded = true;
  }

  getTileTexture(index: TunnelSpriteIndex): PIXI.Texture {
    if (!this.loaded) {
      throw new Error('TunnelRenderer not loaded. Call loadTextures() first.');
    }
    return this.tileTextures[index] ?? this.tileTextures[0];
  }

  createSprite(index: TunnelSpriteIndex): PIXI.Sprite {
    return new PIXI.Sprite(this.getTileTexture(index));
  }

  drawHorizontalTunnel(
    container: PIXI.Container,
    x: number,
    y: number,
    width: number
  ): void {
    const sprite = this.createSprite(TunnelSpriteIndex.TUNNEL_H);
    sprite.x = x;
    sprite.y = y;
    sprite.width = width;
    sprite.height = TUNNEL_TILE_SIZE;
    container.addChild(sprite);
  }

  drawVerticalTunnel(
    container: PIXI.Container,
    x: number,
    y: number,
    height: number
  ): void {
    const sprite = this.createSprite(TunnelSpriteIndex.TUNNEL_V);
    sprite.x = x;
    sprite.y = y;
    sprite.width = TUNNEL_TILE_SIZE;
    sprite.height = height;
    container.addChild(sprite);
  }

  drawTunnelSegment(
    container: PIXI.Container,
    x: number,
    y: number,
    horizontal: boolean,
    length: number
  ): void {
    if (horizontal) {
      this.drawHorizontalTunnel(container, x, y, length);
    } else {
      this.drawVerticalTunnel(container, x, y, length);
    }
  }

  drawEntrance(
    container: PIXI.Container,
    x: number,
    y: number,
    radius: number
  ): void {
    const entranceSprite = this.createSprite(TunnelSpriteIndex.ENTRANCE_1);
    entranceSprite.anchor.set(0.5);
    entranceSprite.x = x;
    entranceSprite.y = y;
    entranceSprite.width = radius * 2;
    entranceSprite.height = radius * 2;
    container.addChild(entranceSprite);
  }

  clear(container: PIXI.Container): void {
    container.removeChildren();
  }
}
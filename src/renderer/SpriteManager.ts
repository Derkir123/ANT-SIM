import * as PIXI from 'pixi.js';
import {
  ANT_SPRITES,
  SpriteDefinition,
  SpritePhase,
  SpriteRole,
  SpriteSheetMetadata,
  SPRITE_SHEET_ASSETS,
  ViewMode,
} from '../sprites/definitions/spriteDefinitions';

export type LODLevelName = 'high' | 'medium' | 'low';

interface LoadedAnimation {
  textures: PIXI.Texture[];
  fps: number;
  loop: boolean;
  phase: SpritePhase;
}

interface RoleAnimationMap {
  [animationName: string]: LoadedAnimation;
}

const PHASE_ORDER: SpritePhase[] = ['core', 'extended'];

export class SpriteManager {
  private app: PIXI.Application;
  private spriteTextures: Map<string, Map<LODLevelName, PIXI.Texture>> = new Map();
  private sheetAnimations: Map<string, Map<ViewMode, RoleAnimationMap>> = new Map();
  private currentLOD: LODLevelName = 'high';
  private loaded = false;

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  async loadSprites(): Promise<void> {
    if (this.loaded) return;

    this.loadPlaceholderSprites();
    await this.loadSpriteSheets();
    this.loaded = true;
  }

  loadPlaceholderSprites(): void {
    Object.values(ANT_SPRITES).forEach((def) => {
      this.createPlaceholderForAnt(def);
    });
  }

  private async loadSpriteSheets(): Promise<void> {
    const imageModules = import.meta.glob('../assets/sprites/ants/**/*.png', {
      eager: true,
      import: 'default',
    }) as Record<string, string>;

    const metadataModules = import.meta.glob('../assets/sprites/ants/**/*.json', {
      eager: true,
      import: 'default',
    }) as Record<string, SpriteSheetMetadata>;

    for (const [role, views] of Object.entries(SPRITE_SHEET_ASSETS) as [SpriteRole, typeof SPRITE_SHEET_ASSETS[SpriteRole]][]) {
      for (const [view, phases] of Object.entries(views) as [ViewMode, typeof views[ViewMode]][]) {
        for (const phase of PHASE_ORDER) {
          const assetRef = phases[phase];
          const imageKey = this.toModuleKey(assetRef.imagePath);
          const metadataKey = this.toModuleKey(assetRef.metadataPath);

          const imageUrl = imageModules[imageKey];
          const metadata = metadataModules[metadataKey];

          if (!imageUrl || !metadata) {
            continue;
          }

          try {
            const sheetTexture = await PIXI.Assets.load<PIXI.Texture>(imageUrl);
            this.registerSheetAnimations(role, view, phase, sheetTexture, metadata);
          } catch (error) {
            console.warn(`Failed to load sprite sheet for ${role}/${view}/${phase}`);
          }
        }
      }
    }
  }

  private toModuleKey(assetPath: string): string {
    return assetPath.replace('/src/', '../');
  }

  private registerSheetAnimations(
    role: SpriteRole,
    view: ViewMode,
    phase: SpritePhase,
    sheetTexture: PIXI.Texture,
    metadata: SpriteSheetMetadata,
  ): void {
    const roleViews = this.sheetAnimations.get(role) ?? new Map<ViewMode, RoleAnimationMap>();
    const viewAnimations = roleViews.get(view) ?? {};

    for (const [animationName, animMeta] of Object.entries(metadata.animations)) {
      if (viewAnimations[animationName]) {
        continue;
      }

      const frames = this.extractFrames(sheetTexture, metadata, animMeta.row, animMeta.frames);
      if (frames.length === 0) {
        continue;
      }

      viewAnimations[animationName] = {
        textures: frames,
        fps: animMeta.fps,
        loop: animMeta.loop,
        phase,
      };
    }

    roleViews.set(view, viewAnimations);
    this.sheetAnimations.set(role, roleViews);
  }

  private extractFrames(
    sheetTexture: PIXI.Texture,
    metadata: SpriteSheetMetadata,
    row: number,
    frameCount: number,
  ): PIXI.Texture[] {
    const frames: PIXI.Texture[] = [];

    for (let i = 0; i < frameCount; i += 1) {
      const x = i * metadata.frameWidth;
      const y = row * metadata.frameHeight;

      if (x + metadata.frameWidth > sheetTexture.width || y + metadata.frameHeight > sheetTexture.height) {
        continue;
      }

      const frameRect = new PIXI.Rectangle(x, y, metadata.frameWidth, metadata.frameHeight);
      frames.push(new PIXI.Texture({ source: sheetTexture.source, frame: frameRect }));
    }

    return frames;
  }

  private createPlaceholderForAnt(def: SpriteDefinition): void {
    const textures = new Map<LODLevelName, PIXI.Texture>();
    const levels: LODLevelName[] = ['high', 'medium', 'low'];

    levels.forEach((level) => {
      const lodConfig = def.lod[level];
      const size = lodConfig.size;

      const graphics = new PIXI.Graphics();
      const color = this.getAntColor(def.id);
      graphics.fill({ color });

      if (def.id === 'queen') {
        graphics.circle(size / 2, size / 2, size * 0.4);
        graphics.fill();
        graphics.circle(size * 0.3, size * 0.6, size * 0.25);
        graphics.fill();
      } else if (def.id === 'soldier' || def.id === 'guard') {
        graphics.circle(size / 2, size * 0.5, size * 0.35);
        graphics.fill();
        graphics.circle(size * 0.7, size * 0.4, size * 0.2);
        graphics.fill();
        graphics.rect(size * 0.8, size * 0.3, size * 0.15, size * 0.1);
        graphics.fill();
      } else {
        graphics.circle(size / 2, size * 0.5, size * 0.3);
        graphics.fill();
        graphics.circle(size * 0.7, size * 0.4, size * 0.18);
        graphics.fill();
        graphics.circle(size * 0.3, size * 0.55, size * 0.22);
        graphics.fill();
      }

      const texture = this.app.renderer.generateTexture(graphics);
      textures.set(level, texture);
    });

    this.spriteTextures.set(def.id, textures);
  }

  private getAntColor(spriteId: string): number {
    const colors: Record<string, number> = {
      worker: 0x4a3520,
      soldier: 0x2d1f14,
      scout: 0x6b4a2a,
      nurse: 0x5c4033,
      builder: 0x4a3520,
      queen: 0x1a0f0a,
      guard: 0x2d1f14,
      drone: 0x3d2817,
      alate: 0x4a3520,
    };
    return colors[spriteId] ?? 0x4a3520;
  }

  setLODLevel(distance: number): void {
    if (distance < 100) {
      this.currentLOD = 'high';
    } else if (distance < 300) {
      this.currentLOD = 'medium';
    } else {
      this.currentLOD = 'low';
    }
  }

  setSpecificLOD(level: LODLevelName): void {
    this.currentLOD = level;
  }

  getCurrentLOD(): LODLevelName {
    return this.currentLOD;
  }

  getTexture(spriteId: string): PIXI.Texture | undefined {
    const textures = this.spriteTextures.get(spriteId);
    if (!textures) return undefined;
    return textures.get(this.currentLOD);
  }

  getTextureForLevel(spriteId: string, level: LODLevelName): PIXI.Texture | undefined {
    const textures = this.spriteTextures.get(spriteId);
    if (!textures) return undefined;
    return textures.get(level);
  }

  getAnimationFrames(spriteId: string, animation: string, viewMode: ViewMode = 'topdown'): PIXI.Texture[] {
    const entry = this.getSheetAnimation(spriteId, animation, viewMode);
    return entry?.textures ?? [];
  }

  createAnimatedSprite(
    spriteId: string,
    viewMode: ViewMode = 'topdown',
    animation: string = 'idle',
  ): PIXI.Sprite | undefined {
    const sheetAnimation = this.getSheetAnimation(spriteId, animation, viewMode);
    if (sheetAnimation && sheetAnimation.textures.length > 0) {
      const animated = new PIXI.AnimatedSprite(sheetAnimation.textures);
      animated.anchor.set(0.5);
      this.configureAnimatedSprite(animated, sheetAnimation, animation !== 'idle');
      return animated;
    }

    const textures = this.spriteTextures.get(spriteId);
    if (!textures) return undefined;

    const texture = textures.get(this.currentLOD);
    if (!texture) return undefined;

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }

  setSpriteAnimation(
    sprite: PIXI.Sprite,
    spriteId: string,
    animation: string,
    viewMode: ViewMode = 'topdown',
    shouldPlay: boolean = animation !== 'idle',
  ): void {
    const sheetAnimation = this.getSheetAnimation(spriteId, animation, viewMode);
    if (!sheetAnimation || !(sprite instanceof PIXI.AnimatedSprite)) {
      return;
    }

    sprite.textures = sheetAnimation.textures;
    this.configureAnimatedSprite(sprite, sheetAnimation, shouldPlay);
  }

  getPreferredMovementAnimation(spriteId: string): string {
    const role = ANT_SPRITES[spriteId as SpriteRole];
    if (!role) return 'walk';

    if (role.animations.some((anim) => anim.name === 'walk')) return 'walk';
    if (role.animations.some((anim) => anim.name === 'fly')) return 'fly';
    if (role.animations.some((anim) => anim.name === 'attack')) return 'attack';

    return 'idle';
  }

  private getSheetAnimation(
    spriteId: string,
    animation: string,
    viewMode: ViewMode,
  ): LoadedAnimation | undefined {
    const roleViews = this.sheetAnimations.get(spriteId);
    if (!roleViews) return undefined;

    const animations = roleViews.get(viewMode);
    if (!animations) return undefined;

    return animations[animation];
  }

  private configureAnimatedSprite(
    sprite: PIXI.AnimatedSprite,
    animation: LoadedAnimation,
    shouldPlay: boolean,
  ): void {
    sprite.animationSpeed = animation.fps / 60;
    sprite.loop = animation.loop;

    if (shouldPlay) {
      sprite.play();
    } else {
      sprite.gotoAndStop(0);
    }
  }

  dispose(): void {
    this.spriteTextures.forEach((textures) => {
      textures.forEach((texture) => {
        texture.destroy();
      });
    });
    this.spriteTextures.clear();

    this.sheetAnimations.forEach((views) => {
      views.forEach((animations) => {
        Object.values(animations).forEach((entry) => {
          entry.textures.forEach((texture) => texture.destroy());
        });
      });
    });
    this.sheetAnimations.clear();
  }
}

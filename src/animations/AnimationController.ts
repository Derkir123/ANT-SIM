import * as PIXI from 'pixi.js';

export interface AnimationConfig {
  name: string;
  frames: number;
  speed: number;
  loop: boolean;
}

export class AnimationController {
  private sprite: PIXI.Sprite;
  private animations: Map<string, AnimationConfig>;
  private currentAnimation: string = '';
  private isPlaying: boolean = false;
  private onComplete?: () => void;

  private loop: boolean = true;
  private animationTime: number = 0;
  private frameIndex: number = 0;
  private currentAnim: AnimationConfig | null = null;

  constructor(sprite: PIXI.Sprite, animations: AnimationConfig[]) {
    this.sprite = sprite;
    this.animations = new Map();
    
    animations.forEach(anim => {
      this.animations.set(anim.name, anim);
    });
  }

  play(animationName: string, loop: boolean = true, onComplete?: () => void): void {
    const anim = this.animations.get(animationName);
    if (!anim) {
      console.warn(`Animation "${animationName}" not found`);
      return;
    }

    this.currentAnimation = animationName;
    this.loop = loop;
    this.onComplete = onComplete;
    this.isPlaying = true;

    this.startPlaceholderAnimation(anim);
  }

  private startPlaceholderAnimation(anim: AnimationConfig): void {
    this.currentAnim = anim;
    this.animationTime = 0;
    this.frameIndex = 0;
  }

  update(delta: number): void {
    if (!this.isPlaying || !this.currentAnim) return;

    this.animationTime += delta;

    const frameTime = 60 / this.currentAnim.speed;
    const newFrameIndex = Math.floor(this.animationTime / frameTime);

    if (newFrameIndex !== this.frameIndex) {
      this.frameIndex = newFrameIndex;

      if (this.frameIndex >= this.currentAnim.frames) {
        if (this.loop) {
          this.frameIndex = 0;
          this.animationTime = 0;
        } else {
          this.frameIndex = this.currentAnim.frames - 1;
          this.isPlaying = false;
          if (this.onComplete) {
            this.onComplete();
          }
        }
      }

      this.updateFrame();
    }
  }

  private updateFrame(): void {
    const pulse = 1 + Math.sin(this.frameIndex * Math.PI * 2 / (this.currentAnim?.frames || 1)) * 0.1;
    this.sprite.scale.set(pulse);
  }

  stop(): void {
    this.isPlaying = false;
  }

  pause(): void {
    this.isPlaying = false;
  }

  resume(): void {
    if (this.currentAnimation && this.isPlaying === false) {
      this.isPlaying = true;
    }
  }

  getCurrentAnimation(): string {
    return this.currentAnimation;
  }

  isAnimating(): boolean {
    return this.isPlaying;
  }

  destroy(): void {
    this.animations.clear();
    this.onComplete = undefined;
  }
}

export class AnimationManager {
  private controllers: Map<PIXI.Sprite, AnimationController> = new Map();

  add(sprite: PIXI.Sprite, animations: AnimationConfig[]): AnimationController {
    const controller = new AnimationController(sprite, animations);
    this.controllers.set(sprite, controller);
    return controller;
  }

  remove(sprite: PIXI.Sprite): void {
    const controller = this.controllers.get(sprite);
    if (controller) {
      controller.destroy();
      this.controllers.delete(sprite);
    }
  }

  updateAll(delta: number): void {
    this.controllers.forEach(controller => {
      if (controller.isAnimating()) {
        controller.update(delta);
      }
    });
  }

  destroy(): void {
    this.controllers.forEach(controller => controller.destroy());
    this.controllers.clear();
  }
}

export const animationManager = new AnimationManager();

import * as PIXI from 'pixi.js';

export interface CameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class Camera {
  private container: PIXI.Container;
  private x: number = 0;
  private y: number = 0;
  private zoom: number = 1;
  private targetZoom: number = 1;
  private bounds: CameraBounds | null = null;
  
  private smoothing: number = 0.1;
  private minZoom: number = 0.1;
  private maxZoom: number = 5;

  constructor(container: PIXI.Container) {
    this.container = container;
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.applyPosition();
  }

  move(deltaX: number, deltaY: number): void {
    this.x += deltaX;
    this.y += deltaY;
    this.applyPosition();
  }

  private applyPosition(): void {
    this.container.x = -this.x * this.zoom;
    this.container.y = -this.y * this.zoom;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getPanX(): number {
    return this.x * this.zoom;
  }

  getPanY(): number {
    return this.y * this.zoom;
  }

  setZoom(zoom: number): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
  }

  zoomIn(amount: number = 0.1): void {
    this.setZoom(this.targetZoom + amount);
  }

  zoomOut(amount: number = 0.1): void {
    this.setZoom(this.targetZoom - amount);
  }

  getZoom(): number {
    return this.zoom;
  }

  setZoomLimits(min: number, max: number): void {
    this.minZoom = min;
    this.maxZoom = max;
  }

  setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
  }

  clearBounds(): void {
    this.bounds = null;
  }

  centerOn(x: number, y: number, viewportWidth: number, viewportHeight: number): void {
    this.x = x - viewportWidth / (2 * this.zoom);
    this.y = y - viewportHeight / (2 * this.zoom);
    this.applyPosition();
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX / this.zoom) + this.x,
      y: (screenY / this.zoom) + this.y,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom,
      y: (worldY - this.y) * this.zoom,
    };
  }

  update(): void {
    if (Math.abs(this.zoom - this.targetZoom) > 0.001) {
      this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
      this.container.scale.set(this.zoom);
    }
  }

  followTarget(targetX: number, targetY: number, viewportWidth: number, viewportHeight: number, deadzone: number = 50): void {
    const screenPos = this.worldToScreen(targetX, targetY);
    
    if (screenPos.x < deadzone || screenPos.x > viewportWidth - deadzone ||
        screenPos.y < deadzone || screenPos.y > viewportHeight - deadzone) {
      const destX = targetX - viewportWidth / (2 * this.zoom);
      const destY = targetY - viewportHeight / (2 * this.zoom);
      
      this.x += (destX - this.x) * this.smoothing;
      this.y += (destY - this.y) * this.smoothing;
      
      this.applyPosition();
    }
  }

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.applyPosition();
    this.container.scale.set(1);
  }
}

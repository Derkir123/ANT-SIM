import * as PIXI from 'pixi.js';

export interface RenderOptions {
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
}

export class GameRenderer {
  public app!: PIXI.Application;
  public stage!: PIXI.Container;
  public camera!: PIXI.Container;
  
  private width: number;
  private height: number;
  private zoom: number = 1;
  private panX: number = 0;
  private panY: number = 0;

  constructor(options: RenderOptions) {
    this.width = options.width;
    this.height = options.height;
  }

  async init(): Promise<void> {
    this.app = new PIXI.Application();
    
    await this.app.init({
      width: this.width,
      height: this.height,
      backgroundColor: 0x87ceeb,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      powerPreference: 'high-performance',
    });

    this.stage = this.app.stage;
    
    this.camera = new PIXI.Container();
    this.stage.addChild(this.camera);
    
    window.addEventListener('resize', () => this.onResize());
  }

  private onResize(): void {
    const container = document.getElementById('app');
    if (container && this.app.renderer) {
      this.app.renderer.resize(container.clientWidth, container.clientHeight);
      this.width = container.clientWidth;
      this.height = container.clientHeight;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement;
  }

  setBackgroundColor(color: number): void {
    this.app.renderer.background.color = color;
  }

  setZoom(zoom: number): void {
    this.zoom = Math.max(0.1, Math.min(5, zoom));
    this.camera.scale.set(this.zoom);
  }

  getZoom(): number {
    return this.zoom;
  }

  zoomIn(amount: number = 0.1): void {
    this.setZoom(this.zoom + amount);
  }

  zoomOut(amount: number = 0.1): void {
    this.setZoom(this.zoom - amount);
  }

  pan(deltaX: number, deltaY: number): void {
    this.panX += deltaX;
    this.panY += deltaY;
    this.camera.position.set(this.panX, this.panY);
  }

  setPan(x: number, y: number): void {
    this.panX = x;
    this.panY = y;
    this.camera.position.set(this.panX, this.panY);
  }

  centerOn(x: number, y: number): void {
    this.panX = this.width / 2 - x * this.zoom;
    this.panY = this.height / 2 - y * this.zoom;
    this.camera.position.set(this.panX, this.panY);
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.panX) / this.zoom,
      y: (screenY - this.panY) / this.zoom,
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom + this.panX,
      y: worldY * this.zoom + this.panY,
    };
  }

  startGameLoop(callback: (ticker: PIXI.Ticker) => void): void {
    this.app.ticker.add(callback);
  }

  stopGameLoop(callback: (ticker: PIXI.Ticker) => void): void {
    this.app.ticker.remove(callback);
  }

  addToCamera(displayObject: PIXI.ContainerChild): void {
    this.camera.addChild(displayObject);
  }

  removeFromCamera(displayObject: PIXI.ContainerChild): void {
    this.camera.removeChild(displayObject);
  }

  clearCamera(): void {
    this.camera.removeChildren();
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
import { GameRenderer } from '../renderer/GameRenderer';
import { SpriteManager } from '../renderer/SpriteManager';
import { Camera } from '../renderer/Camera';
import { TunnelRenderer } from '../renderer/TunnelRenderer';
import { GameCore, GameSettings } from '../game/GameCore';
import { AntEntity as GameAnt } from '../game/AntEntity';
import { AntRole } from '../game/ColonyState';
import { TerrainSystem } from '../game/systems/TerrainSystem';
import type { Tunnel, Chamber, WorldLayer } from '../game/ai/types';
import * as PIXI from 'pixi.js';

interface VisualAnt {
  sprite: PIXI.Sprite;
  ant: GameAnt;
  currentAnimation: string;
  animationPlaying: boolean;
  prevX: number;
  prevY: number;
  nameLabel: PIXI.Text;
  controlledByPlayer: boolean;
}

interface SideViewChamber {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SIDE_VIEW_CHAMBERS: SideViewChamber[] = [
  { id: 'guard_left', label: 'GUARD POST', x: 120, y: 120, width: 100, height: 60 },
  { id: 'guard_right', label: 'GUARD POST', x: 680, y: 120, width: 100, height: 60 },
  { id: 'soldier', label: 'SOLDIER POST', x: 200, y: 200, width: 120, height: 70 },
  { id: 'nursery', label: 'NURSERY', x: 350, y: 280, width: 130, height: 80 },
  { id: 'larvae', label: 'LARVAE', x: 520, y: 280, width: 130, height: 80 },
  { id: 'food', label: 'FOOD STORAGE', x: 350, y: 400, width: 140, height: 80 },
  { id: 'queen', label: "QUEEN'S CHAMBER", x: 350, y: 520, width: 160, height: 100 },
];

const SURFACE_HEIGHT = 60;

export class GameCanvas {
  private renderer: GameRenderer;
  private spriteManager: SpriteManager;
  private camera: Camera;
  private gameCore: GameCore;
  private terrainSystem: TerrainSystem;
  private terrainContainer: PIXI.Container;
  private undergroundContainer: PIXI.Container;

  private visualAnts: VisualAnt[] = [];
  private foodSprites: PIXI.Graphics[] = [];
  private tunnelSprites: PIXI.Graphics[] = [];
  private chamberSprites: PIXI.Graphics[] = [];
  private keys: Set<string> = new Set();
  private controlledAnt: VisualAnt | null = null;
  private gameSpeed: number = 1;
  private gameCanvas: HTMLDivElement;
  private initialized: boolean = false;
  private settings: GameSettings;
  private currentView: 'surface' | 'underground' = 'surface';
  private tunnelRenderer: TunnelRenderer;

  private hudContainer: HTMLElement | null = null;
  private nestEntranceX: number = 400;
  private nestEntranceY: number = 350;

  private isDigMode: boolean = false;
  private showStatsPanel: boolean = false;
  private statsPanelContainer: HTMLElement | null = null;
  private surfaceStripContainer: PIXI.Container;

  constructor(canvasContainer: HTMLElement, settings: GameSettings) {
    this.settings = settings;
    this.gameCanvas = canvasContainer as HTMLDivElement;

    this.renderer = new GameRenderer({
      width: canvasContainer.clientWidth || 800,
      height: canvasContainer.clientHeight || 600,
      backgroundColor: 0x87ceeb,
    });

    this.gameCore = new GameCore(400, 300, settings);
    this.terrainContainer = new PIXI.Container();
    this.terrainSystem = new TerrainSystem(this.terrainContainer, 12345);
    this.undergroundContainer = new PIXI.Container();
    this.undergroundContainer.visible = false;
    this.surfaceStripContainer = new PIXI.Container();
    this.tunnelRenderer = new TunnelRenderer();
  }

  getCurrentView(): 'surface' | 'underground' {
    return this.currentView;
  }

  toggleView(): void {
    if (this.currentView === 'surface') {
      this.currentView = 'underground';
      this.terrainContainer.visible = false;
      this.surfaceStripContainer.visible = false;
      this.undergroundContainer.visible = true;
      this.renderer.setBackgroundColor(0x3d2817);
      this.camera.setZoomLimits(0.5, 2.5);
    } else {
      this.currentView = 'surface';
      this.terrainContainer.visible = true;
      this.surfaceStripContainer.visible = true;
      this.undergroundContainer.visible = false;
      this.renderer.setBackgroundColor(0x87ceeb);
      this.camera.setZoomLimits(0.3, 2.0);
    }
  }

  async init(): Promise<void> {
    await this.renderer.init();

    this.gameCanvas.appendChild(this.renderer.getCanvas());
    this.spriteManager = new SpriteManager(this.renderer.app);
    await this.spriteManager.loadSprites();
    await this.tunnelRenderer.loadTextures();
    this.camera = new Camera(this.renderer.camera);
    this.camera.setZoomLimits(0.3, 2.0);

    this.renderer.addToCamera(this.terrainContainer);
    this.renderer.addToCamera(this.undergroundContainer);
    this.renderer.addToCamera(this.surfaceStripContainer);

    this.terrainContainer.visible = true;
    this.surfaceStripContainer.visible = true;
    this.undergroundContainer.visible = false;

    this.setupControls();
    this.createVisuals();
    this.createHUD();
    this.spawnInitialFood();
    this.spawnDecorations();
    this.createTunnels();
    this.createUndergroundView();
    this.createSurfaceStrip();

    this.startGameLoop();
    this.initialized = true;

    this.camera.centerOn(400, 30, this.renderer.app.screen.width, this.renderer.app.screen.height);
  }

  private createTunnels(): void {
    for (const tunnel of this.gameCore.getTunnels()) {
      this.drawTunnelEntrance(tunnel);
    }
  }

  private drawTunnelEntrance(tunnel: Tunnel): void {
    const entrance = this.tunnelRenderer.createSprite(11);
    entrance.anchor.set(0.5);
    entrance.x = tunnel.surfaceX;
    entrance.y = tunnel.surfaceY;
    entrance.width = tunnel.width * 2;
    entrance.height = tunnel.width * 2;

    if (!tunnel.isOpen && tunnel.digProgress < 100) {
      const progress = tunnel.digProgress / 100;
      entrance.alpha = 1 - progress * 0.5;
    }

    this.tunnelSprites.push(entrance as unknown as PIXI.Graphics);
    this.renderer.addToCamera(entrance);
  }

  private createUndergroundView(): void {
    this.undergroundContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 900, 700);
    bg.fill({ color: 0x3d2817 });
    this.undergroundContainer.addChild(bg);

    this.drawSideViewTunnels();

    for (const chamber of SIDE_VIEW_CHAMBERS) {
      this.drawSideViewChamber(chamber);
    }
  }

  private drawSideViewTunnels(): void {
    const tunnelContainer = new PIXI.Container();

    interface TunnelPath {
      x1: number; y1: number;
      x2: number; y2: number;
      orientation: 'horizontal' | 'vertical' | 'diagonal';
    }

    const tunnelPaths: TunnelPath[] = [
      { x1: 400, y1: SURFACE_HEIGHT, x2: 400, y2: 120, orientation: 'vertical' },
      { x1: 120, y1: 120, x2: 400, y2: 120, orientation: 'horizontal' },
      { x1: 400, y1: 120, x2: 680, y2: 120, orientation: 'horizontal' },
      { x1: 400, y1: 120, x2: 400, y2: 200, orientation: 'vertical' },
      { x1: 200, y1: 200, x2: 400, y2: 200, orientation: 'horizontal' },
      { x1: 400, y1: 200, x2: 350, y2: 280, orientation: 'diagonal' },
      { x1: 400, y1: 200, x2: 520, y2: 280, orientation: 'diagonal' },
      { x1: 350, y1: 320, x2: 350, y2: 400, orientation: 'vertical' },
      { x1: 520, y1: 320, x2: 520, y2: 400, orientation: 'vertical' },
      { x1: 350, y1: 440, x2: 350, y2: 520, orientation: 'vertical' },
    ];

    for (const path of tunnelPaths) {
      if (path.orientation === 'horizontal') {
        const length = Math.abs(path.x2 - path.x1);
        const sprite = this.tunnelRenderer.createSprite(1);
        sprite.x = Math.min(path.x1, path.x2);
        sprite.y = path.y1 - 8;
        sprite.width = length + 16;
        sprite.height = 16;
        tunnelContainer.addChild(sprite);
      } else if (path.orientation === 'vertical') {
        const length = Math.abs(path.y2 - path.y1);
        const sprite = this.tunnelRenderer.createSprite(2);
        sprite.x = path.x1 - 8;
        sprite.y = Math.min(path.y1, path.y2);
        sprite.width = 16;
        sprite.height = length + 16;
        tunnelContainer.addChild(sprite);
      } else {
        const length = Math.sqrt(Math.pow(path.x2 - path.x1, 2) + Math.pow(path.y2 - path.y1, 2));
        const angle = Math.atan2(path.y2 - path.y1, path.x2 - path.x1);
        const sprite = this.tunnelRenderer.createSprite(2);
        sprite.anchor.set(0.5, 0.5);
        sprite.x = (path.x1 + path.x2) / 2;
        sprite.y = (path.y1 + path.y2) / 2;
        sprite.width = 16;
        sprite.height = length;
        sprite.rotation = angle;
        tunnelContainer.addChild(sprite);
      }
    }

    this.undergroundContainer.addChild(tunnelContainer);
  }

  private drawSideViewChamber(chamber: SideViewChamber): void {
    const graphics = new PIXI.Graphics();

    graphics.rect(chamber.x - chamber.width / 2, chamber.y - chamber.height / 2, chamber.width, chamber.height);
    graphics.fill({ color: 0x2a1a0a });

    graphics.rect(chamber.x - chamber.width / 2 + 4, chamber.y - chamber.height / 2 + 4, chamber.width - 8, chamber.height - 8);
    graphics.fill({ color: 0x1a0f0a });

    const label = new PIXI.Text({
      text: chamber.label,
      style: {
        fontFamily: 'Courier New',
        fontSize: 11,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    label.anchor.set(0.5);
    label.x = chamber.x;
    label.y = chamber.y;

    this.chamberSprites.push(graphics);
    this.undergroundContainer.addChild(graphics);
    this.undergroundContainer.addChild(label);
  }

  private transformToSideView(undergroundX: number, undergroundY: number): { x: number; y: number } {
    let targetChamber: SideViewChamber | null = null;
    let minDist = Infinity;

    for (const chamber of SIDE_VIEW_CHAMBERS) {
      const dist = Math.sqrt(Math.pow(chamber.x - undergroundX, 2) + Math.pow(chamber.y - undergroundY, 2));
      if (dist < minDist) {
        minDist = dist;
        targetChamber = chamber;
      }
    }

    if (targetChamber && minDist < 100) {
      return {
        x: targetChamber.x + (Math.random() - 0.5) * (targetChamber.width - 30),
        y: targetChamber.y + (Math.random() - 0.5) * (targetChamber.height - 20),
      };
    }

    if (undergroundX > 0 && undergroundY > 0) {
      return { x: undergroundX, y: undergroundY };
    }

    return { x: 350 + (Math.random() - 0.5) * 80, y: 400 + (Math.random() - 0.5) * 60 };
  }

  private drawTunnelUnderground(tunnel: Tunnel): void {
    const graphics = new PIXI.Graphics();

    graphics.circle(tunnel.undergroundX, tunnel.undergroundY, tunnel.width);
    graphics.fill({ color: 0x2a1a0a });

    graphics.circle(tunnel.undergroundX, tunnel.undergroundY, tunnel.width - 5);
    graphics.fill({ color: 0x1a0f0a });

    graphics.circle(tunnel.undergroundX, tunnel.undergroundY, tunnel.width - 10);
    graphics.fill({ color: 0x0d0806 });

    this.tunnelSprites.push(graphics);
    this.undergroundContainer.addChild(graphics);
  }

  private createSurfaceStrip(): void {
    this.surfaceStripContainer.removeChildren();

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 900, SURFACE_HEIGHT);
    bg.fill({ color: 0x4a8c4a });
    this.surfaceStripContainer.addChild(bg);

    const decorations = [
      { x: 80, y: 35, type: 'tree' as const },
      { x: 200, y: 40, type: 'tree' as const },
      { x: 350, y: 38, type: 'flower' as const },
      { x: 400, y: 35, type: 'web' as const },
      { x: 500, y: 42, type: 'tree' as const },
      { x: 650, y: 36, type: 'flower' as const },
      { x: 750, y: 40, type: 'tree' as const },
    ];

    for (const dec of decorations) {
      const graphics = new PIXI.Graphics();
      if (dec.type === 'tree') {
        graphics.rect(dec.x - 3, dec.y - 25, 6, 25);
        graphics.fill({ color: 0x4a3520 });
        graphics.circle(dec.x, dec.y - 30, 12);
        graphics.fill({ color: 0x228b22 });
      } else if (dec.type === 'flower') {
        graphics.circle(dec.x, dec.y, 4);
        graphics.fill({ color: 0xff69b4 });
        graphics.circle(dec.x, dec.y, 2);
        graphics.fill({ color: 0xffff00 });
        graphics.rect(dec.x - 1, dec.y, 2, 8);
        graphics.fill({ color: 0x228b22 });
      } else if (dec.type === 'web') {
        graphics.moveTo(dec.x - 15, dec.y - 15);
        graphics.lineTo(dec.x + 15, dec.y + 15);
        graphics.moveTo(dec.x + 15, dec.y - 15);
        graphics.lineTo(dec.x - 15, dec.y + 15);
        graphics.moveTo(dec.x, dec.y - 20);
        graphics.lineTo(dec.x, dec.y + 20);
        graphics.moveTo(dec.x - 20, dec.y);
        graphics.lineTo(dec.x + 20, dec.y);
        graphics.stroke({ width: 1, color: 0xffffff, alpha: 0.6 });
      }
      this.surfaceStripContainer.addChild(graphics);
    }

    const entrance = new PIXI.Graphics();
    entrance.circle(400, SURFACE_HEIGHT, 18);
    entrance.fill({ color: 0x1a0f0a });
    entrance.circle(400, SURFACE_HEIGHT, 12);
    entrance.fill({ color: 0x0d0806 });
    this.surfaceStripContainer.addChild(entrance);
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());

      if (e.key === ' ') {
        this.togglePause();
        e.preventDefault();
      }
      if (e.key === '1') this.setSpeed(1);
      if (e.key === '2') this.setSpeed(2);
      if (e.key === '3') this.setSpeed(3);
      if (e.key.toLowerCase() === 'v') {
        this.toggleView();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'q') {
        this.isDigMode = true;
        e.preventDefault();
      }
      if (e.key.toLowerCase() === 'i') {
        this.toggleStatsPanel();
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        if (this.showStatsPanel) {
          this.showStatsPanel = false;
          this.updateHUD();
        } else if (this.controlledAnt) {
          const antId = this.controlledAnt.ant.id;
          const currentX = this.controlledAnt.ant.x;
          const currentY = this.controlledAnt.ant.y;

          this.controlledAnt.controlledByPlayer = false;
          this.controlledAnt.nameLabel.style.fill = 0xffffff;
          this.controlledAnt = null;

          this.gameCore.releaseAnt(antId, currentX, currentY);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.delete(key);

      if (key === 'q') {
        this.isDigMode = false;
      }

      if ((key === 'w' || key === 'a' || key === 's' || key === 'd') && this.controlledAnt) {
        this.gameCore.clearWasdState(this.controlledAnt.ant.id);
      }
    });

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.renderer.getCanvas().addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        this.camera.move(-dx / this.camera.getZoom(), -dy / this.camera.getZoom());
        lastX = e.clientX;
        lastY = e.clientY;
      }
    });

    this.renderer.getCanvas().addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.camera.zoomIn(0.1);
      } else {
        this.camera.zoomOut(0.1);
      }
    });

    this.renderer.getCanvas().addEventListener('click', (e) => {
      const rect = this.renderer.getCanvas().getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const worldPos = this.camera.screenToWorld(x, y);

      if (this.controlledAnt) {
        if (this.isDigMode && this.controlledAnt.ant.role === 'queen') {
          const tunnel = this.gameCore.queenDig(
            this.controlledAnt.ant,
            worldPos.x,
            worldPos.y,
            30
          );
          if (tunnel) {
            this.drawTunnelEntrance(tunnel);
          }
          return;
        }

        const speed = 3;
        let dx = 0;
        let dy = 0;

        if (this.keys.has('w')) dy -= speed;
        if (this.keys.has('s')) dy += speed;
        if (this.keys.has('a')) dx -= speed;
        if (this.keys.has('d')) dx += speed;

        if (dx !== 0 || dy !== 0) {
          const newX = this.controlledAnt.ant.x + dx;
          const newY = this.controlledAnt.ant.y + dy;
          this.gameCore.commandAnt(
            this.controlledAnt.ant,
            this.currentView,
            newX,
            newY,
            'wasd'
          );
        }
        return;
      }

      let closest: VisualAnt | null = null;
      let closestDist = 50;

      for (const vAnt of this.visualAnts) {
        const dist = Math.sqrt(
          Math.pow(vAnt.ant.x - worldPos.x, 2) + Math.pow(vAnt.ant.y - worldPos.y, 2)
        );
        if (dist < closestDist) {
          closestDist = dist;
          closest = vAnt;
        }
      }

      if (closest) {
        if (this.controlledAnt !== null) {
          (this.controlledAnt as VisualAnt).controlledByPlayer = false;
          (this.controlledAnt as VisualAnt).nameLabel.style.fill = 0xffffff;
        }
        this.controlledAnt = closest;
        (this.controlledAnt as VisualAnt).controlledByPlayer = true;
        (this.controlledAnt as VisualAnt).nameLabel.style.fill = 0x00ff00;
      }
    });
  }

  private createVisuals(): void {
    for (const ant of this.gameCore.ants) {
      this.createVisualAnt(ant);
    }

    this.gameCore.events.onAntBorn = (role) => {
      const newAnt = this.gameCore.ants.find(a => a.role === role && !this.visualAnts.some(v => v.ant.id === a.id));
      if (newAnt) {
        this.createVisualAnt(newAnt);
      }
    };

    this.gameCore.events.onAntDied = (ant) => {
      this.visualAnts = this.visualAnts.filter(v => {
        if (v.ant.id === ant.id) {
          this.renderer.removeFromCamera(v.sprite);
          this.renderer.removeFromCamera(v.nameLabel);
          v.sprite.destroy();
          v.nameLabel.destroy();
          return false;
        }
        return true;
      });
    };
  }

  private createVisualAnt(ant: GameAnt): void {
    const sprite = this.spriteManager.createAnimatedSprite(ant.role, 'topdown', 'idle');
    if (!sprite) return;

    sprite.x = ant.x;
    sprite.y = ant.y;
    sprite.anchor.set(0.5);
    sprite.scale.set(2);

    const nameLabel = new PIXI.Text({
      text: ant.role.toUpperCase(),
      style: {
        fontFamily: 'VT323',
        fontSize: 10,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    nameLabel.anchor.set(0.5);
    nameLabel.x = ant.x;
    nameLabel.y = ant.y - 30;
    nameLabel.visible = true;

    const visualAnt: VisualAnt = {
      sprite,
      ant,
      currentAnimation: 'idle',
      animationPlaying: false,
      prevX: ant.x,
      prevY: ant.y,
      nameLabel,
      controlledByPlayer: false,
    };

    this.visualAnts.push(visualAnt);
    this.renderer.addToCamera(sprite);
    this.renderer.addToCamera(nameLabel);
  }

  private spawnInitialFood(): void {
    const colors: Record<string, number> = {
      sugar: 0xf5f5dc,
      protein: 0x8b4513,
      water: 0x4169e1,
      seeds: 0x654321,
    };

    for (const source of this.gameCore.getFoodSources()) {
      const graphics = new PIXI.Graphics();
      graphics.circle(source.x, source.y, 10);
      graphics.fill(colors[source.type] || 0x888888);
      graphics.stroke({ width: 2, color: 0x000000, alpha: 0.3 });

      this.foodSprites.push(graphics);
      this.renderer.addToCamera(graphics);
    }
  }

  private spawnDecorations(): void {
    const decorations = [
      { x: 250, y: 250, type: 'rock' as const },
      { x: 550, y: 350, type: 'flower' as const },
      { x: 300, y: 450, type: 'log' as const },
      { x: 650, y: 250, type: 'mushroom' as const },
      { x: 450, y: 500, type: 'rock' as const },
    ];

    for (const dec of decorations) {
      this.terrainSystem.addDecoration(dec.x, dec.y, dec.type);
    }
  }

  private createHUD(): void {
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'game-hud';
    this.hudContainer.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 15px;
      align-items: center;
      background: rgba(45, 31, 20, 0.95);
      padding: 10px 20px;
      border-radius: 8px;
      font-family: 'VT323', monospace;
      font-size: 16px;
      color: #fffaf0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(this.hudContainer);

    this.statsPanelContainer = document.createElement('div');
    this.statsPanelContainer.id = 'stats-panel';
    this.statsPanelContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 20, 12, 0.97);
      padding: 25px;
      border-radius: 12px;
      font-family: 'VT323', monospace;
      font-size: 18px;
      color: #fffaf0;
      z-index: 1001;
      min-width: 320px;
      display: none;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      border: 2px solid #4a3520;
    `;
    document.body.appendChild(this.statsPanelContainer);

    this.updateHUD();
  }

  private updateHUD(): void {
    if (!this.hudContainer || !this.statsPanelContainer) return;

    const stats = this.gameCore.getColonyStats();
    const nest = this.gameCore.getNest();
    
    const sugarColor = stats.resources.sugar < 25 ? '#ef4444' : '#f5f5dc';
    const proteinColor = stats.resources.protein < 20 ? '#ef4444' : '#cd853f';
    const waterColor = stats.resources.water < 25 ? '#ef4444' : '#6495ed';
    const moraleColor = this.gameCore.colony.getMoraleColor();

    const digModeText = this.isDigMode ? ' [DIG]' : '';

    this.hudContainer.innerHTML = `
      <div style="color: #c9a227; font-size: 20px; font-weight: bold; margin-right: 10px;">${this.gameCore.colony.name}${digModeText}</div>
      <div style="display: flex; gap: 15px; align-items: center;">
        <div style="color: ${sugarColor};">🍬 ${stats.resources.sugar}</div>
        <div style="color: ${proteinColor};">🍖 ${stats.resources.protein}</div>
        <div style="color: ${waterColor};">💧 ${stats.resources.water}</div>
        <div style="color: ${moraleColor};">😊 ${stats.morale}%</div>
        <div style="color: #c9a227;">🐜 ${stats.total}</div>
        <div>${this.gameCore.colony.time.isDaytime ? '☀️' : '🌙'} ${this.gameCore.colony.time.hour.toString().padStart(2, '0')}:${this.gameCore.colony.time.minute.toString().padStart(2, '0')}</div>
        <div style="text-transform: capitalize;">❄️ ${this.gameCore.colony.time.season}</div>
        <div>${this.gameCore.isPaused() ? '⏸️ PAUSED' : '▶️ ' + this.gameSpeed + 'x'}</div>
        <div style="color: #8b7355;">|</div>
        <div style="color: #8b7355;">${this.currentView === 'surface' ? '🌍 SURFACE' : '🕳️ UNDERGROUND'}</div>
        <div style="color: #c9a227; cursor: pointer; padding: 2px 8px; border: 1px solid #4a3520; border-radius: 4px;">[I]</div>
      </div>
    `;

    const statsPanel = this.statsPanelContainer;
    statsPanel.style.display = this.showStatsPanel ? 'block' : 'none';
    
    if (this.showStatsPanel) {
      statsPanel.innerHTML = `
        <div style="text-align: center; font-size: 24px; color: #c9a227; margin-bottom: 20px; border-bottom: 2px solid #4a3520; padding-bottom: 10px;">
          COLONY STATISTICS
        </div>
        <div style="margin-bottom: 15px;">
          <div style="color: #c9a227; font-size: 20px; margin-bottom: 8px;">POPULATION: ${stats.total}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 16px;">
            <div>Workers: ${stats.byRole.worker}</div>
            <div>Soldiers: ${stats.byRole.soldier}</div>
            <div>Scouts: ${stats.byRole.scout}</div>
            <div>Nurses: ${stats.byRole.nurse}</div>
            <div>Guards: ${stats.byRole.guard}</div>
            <div>Queens: ${stats.byRole.queen}</div>
          </div>
        </div>
        <div style="margin-bottom: 15px; border-top: 1px solid #4a3520; padding-top: 10px;">
          <div style="color: #c9a227; font-size: 20px; margin-bottom: 8px;">BROOD</div>
          <div style="font-size: 16px;">
            Eggs: ${stats.brood.eggs} | Larvae: ${stats.brood.larvae} | Pupae: ${stats.brood.pupae}
          </div>
        </div>
        <div style="margin-bottom: 15px; border-top: 1px solid #4a3520; padding-top: 10px;">
          <div style="color: #c9a227; font-size: 20px; margin-bottom: 8px;">RESOURCES</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 16px;">
            <div style="color: ${sugarColor};">Sugar: ${stats.resources.sugar}</div>
            <div style="color: ${proteinColor};">Protein: ${stats.resources.protein}</div>
            <div style="color: ${waterColor};">Water: ${stats.resources.water}</div>
            <div>Seeds: ${stats.resources.seeds}</div>
          </div>
        </div>
        <div style="border-top: 1px solid #4a3520; padding-top: 10px;">
          <div style="color: #c9a227; font-size: 20px; margin-bottom: 8px;">NEST</div>
          <div style="font-size: 16px;">
            Status: <span style="color: ${this.gameCore.colony.getNestStatus() === 'healthy' ? '#4ade80' : '#ef4444'};">${this.gameCore.colony.getNestStatus().toUpperCase()}</span>
          </div>
          <div style="font-size: 14px; color: #8b7355; margin-top: 5px;">
            Tunnels: 3 | Chambers: 4 | Entrances: 1
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #8b7355; font-size: 14px;">
          Press [I] to close
        </div>
      `;
    }
  }

  private toggleStatsPanel(): void {
    this.showStatsPanel = !this.showStatsPanel;
    this.updateHUD();
  }

  private startGameLoop(): void {
    let lastTime = performance.now();

    this.renderer.startGameLoop(() => {
      const now = performance.now();
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      const adjustedDelta = deltaSeconds * this.gameSpeed;

      this.terrainSystem.updateChunks(
        -this.camera.getPanX() / this.camera.getZoom(),
        -this.camera.getPanY() / this.camera.getZoom(),
        this.renderer.app.screen.width,
        this.renderer.app.screen.height,
        this.camera.getZoom()
      );

      const playerControlledIds = this.visualAnts
        .filter(v => v.controlledByPlayer)
        .map(v => v.ant.id);

      this.gameCore.update(adjustedDelta, playerControlledIds);
      this.updateVisuals();
      this.updateHUD();
      this.camera.update();
    });
  }

  private updateVisuals(): void {
    for (const vAnt of this.visualAnts) {
      const ant = vAnt.ant;

      let renderX: number, renderY: number;

      if (this.currentView === 'surface') {
        renderX = ant.x;
        renderY = ant.y;
        vAnt.sprite.visible = ant.currentLayer === 'surface';
        vAnt.nameLabel.visible = ant.currentLayer === 'surface';
      } else {
        const sideViewPos = this.transformToSideView(ant.undergroundX, ant.undergroundY);
        renderX = sideViewPos.x;
        renderY = sideViewPos.y;
        vAnt.sprite.visible = true;
        vAnt.nameLabel.visible = true;
      }

      vAnt.sprite.x = renderX;
      vAnt.sprite.y = renderY;
      vAnt.nameLabel.x = renderX;
      vAnt.nameLabel.y = renderY - 20;
      vAnt.prevX = ant.x;
      vAnt.prevY = ant.y;

      const dx = ant.x - vAnt.prevX;
      const dy = ant.y - vAnt.prevY;
      const movement = Math.sqrt(dx * dx + dy * dy);

      if (movement > 0.5) {
        const angle = Math.atan2(dy, dx) + (Math.PI / 2);
        vAnt.sprite.rotation = angle;
      }

      if (vAnt.controlledByPlayer) {
        vAnt.sprite.tint = 0x00ff00;
        vAnt.nameLabel.text = `${ant.role.toUpperCase()} [P]`;
      } else if (ant.hunger < 25) {
        vAnt.sprite.tint = 0xff6666;
        vAnt.nameLabel.text = `${ant.role.toUpperCase()} (${Math.floor(ant.hunger)}%)`;
      } else if (ant.hunger < 50) {
        vAnt.sprite.tint = 0xffaa66;
        vAnt.nameLabel.text = `${ant.role.toUpperCase()}`;
      } else {
        vAnt.sprite.tint = 0xffffff;
        vAnt.nameLabel.text = `${ant.role.toUpperCase()}`;
      }

      if (movement > 1) {
        if (vAnt.currentAnimation !== 'walk') {
          this.spriteManager.setSpriteAnimation(vAnt.sprite, ant.role, 'walk', 'topdown', true);
          vAnt.currentAnimation = 'walk';
        }
      } else {
        if (vAnt.currentAnimation !== 'idle') {
          this.spriteManager.setSpriteAnimation(vAnt.sprite, ant.role, 'idle', 'topdown', true);
          vAnt.currentAnimation = 'idle';
        }
      }

      if (this.controlledAnt === vAnt) {
        const speed = 3;
        let dx = 0;
        let dy = 0;

        if (this.keys.has('w')) dy -= speed;
        if (this.keys.has('s')) dy += speed;
        if (this.keys.has('a')) dx -= speed;
        if (this.keys.has('d')) dx += speed;

        if (dx !== 0 || dy !== 0) {
          const newX = vAnt.ant.x + dx;
          const newY = vAnt.ant.y + dy;
          this.gameCore.commandAnt(vAnt.ant, this.currentView, newX, newY, 'wasd');
          vAnt.sprite.rotation = Math.atan2(dy, dx) + (Math.PI / 2);

          this.camera.followTarget(
            newX,
            newY,
            this.renderer.app.screen.width,
            this.renderer.app.screen.height,
            100
          );
        }
      }
    }
  }

  togglePause(): void {
    this.gameCore.togglePause();
  }

  setSpeed(speed: number): void {
    this.gameSpeed = speed;
  }

  getSpeed(): number {
    return this.gameSpeed;
  }

  isPausedGame(): boolean {
    return this.gameCore.isPaused();
  }

  getAntCount(): number {
    return this.gameCore.getAntCount();
  }

  destroy(): void {
    if (this.hudContainer) {
      this.hudContainer.remove();
    }
    if (this.statsPanelContainer) {
      this.statsPanelContainer.remove();
    }
    this.renderer.destroy();
    this.spriteManager.dispose();
  }
}
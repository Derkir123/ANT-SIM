import { screenManager, Screen, ScreenName } from './ScreenManager';
import { GameCanvas } from '../../world/GameCanvas';
import { getPendingGameSettings } from './NewGame';

type GameTab = 'colony' | 'ants' | 'build' | 'research' | 'map' | 'settings';

const TAB_CONTENT: Record<GameTab, { title: string; rows: string[] }> = {
  colony: {
    title: 'COLONY OVERVIEW',
    rows: [
      'Population: 15 (Workers 10, Soldiers 3, Queen 1, Scout 1)',
      'Morale: 75% (Stable)',
      'Brood: Eggs 4 | Larvae 2 | Pupae 1',
      'Threat Level: LOW',
    ],
  },
  ants: {
    title: 'ANT ROLES',
    rows: [
      'Workers: Foraging and hauling',
      'Soldiers: Perimeter defense',
      'Scout: Food route discovery',
      'Queen: Brood production core',
    ],
  },
  build: {
    title: 'NEST CONSTRUCTION',
    rows: [
      'Queued: Brood Chamber (+20 capacity)',
      'Available: Granary, Waste Chamber, Entrance Tunnel',
      'Requirement: 20 Sugar, 10 Protein, 12 Soil',
      'Tip: Build Waste Chamber early to reduce disease risk',
    ],
  },
  research: {
    title: 'RESEARCH',
    rows: [
      'Current: Pheromone Trails I (40%)',
      'Next: Fast Digging',
      'Queue Slots: 1 / 2',
      'Research Chamber required for advanced upgrades',
    ],
  },
  map: {
    title: 'MAP & TERRITORY',
    rows: [
      'Explored: 18%',
      'Food Sources: 6 known',
      'Predator Presence: Medium (Surface)',
      'Fog of War: ON',
    ],
  },
  settings: {
    title: 'IN-GAME SETTINGS',
    rows: [
      'Game Speed: 1x/2x/3x (keys 1,2,3)',
      'Pause: SPACE',
      'Camera: Scroll zoom, drag pan',
      'Open full settings from Main Menu',
    ],
  },
};

const TAB_LABELS: Record<GameTab, string> = {
  colony: 'COLONY',
  ants: 'ANTS',
  build: 'BUILD',
  research: 'RESEARCH',
  map: 'MAP',
  settings: 'SETTINGS',
};

export class GamePlaceholder implements Screen {
  name: ScreenName = 'game';
  private container: HTMLElement;
  private canvas: HTMLDivElement;
  private gameCanvas: GameCanvas | null = null;
  private activeTab: GameTab = 'colony';
  private tabButtons: Map<GameTab, HTMLButtonElement> = new Map();
  private tabTitleEl: HTMLElement;
  private tabRowsEl: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'game-screen';
    this.container.style.display = 'none';

    this.canvas = document.createElement('div');
    this.canvas.className = 'game-canvas';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';

    this.tabTitleEl = document.createElement('h3');
    this.tabRowsEl = document.createElement('ul');

    this.build();
    screenManager.register(this);
  }

  private build(): void {
    this.container.innerHTML = '';

    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.backgroundColor = '#000';

    const uiLayer = document.createElement('div');
    uiLayer.className = 'game-ui-layer';

    const topStats = document.createElement('div');
    topStats.className = 'game-top-stats';
    topStats.innerHTML = `
      <span>Sugar: 50</span>
      <span>Protein: 30</span>
      <span>Water: 40</span>
      <span>Morale: 75%</span>
      <span>Ants: 15</span>
      <span>Speed: 1x</span>
    `;

    const menuBtn = document.createElement('button');
    menuBtn.className = 'game-menu-btn';
    menuBtn.textContent = 'MENU';
    menuBtn.addEventListener('click', () => screenManager.show('main'));

    const tabBar = document.createElement('div');
    tabBar.className = 'game-tab-bar';

    (Object.keys(TAB_LABELS) as GameTab[]).forEach((tab) => {
      const btn = document.createElement('button');
      btn.className = 'game-tab-btn';
      btn.textContent = TAB_LABELS[tab];
      btn.addEventListener('click', () => this.setActiveTab(tab));
      this.tabButtons.set(tab, btn);
      tabBar.appendChild(btn);
    });

    const panel = document.createElement('aside');
    panel.className = 'game-tab-panel';

    this.tabTitleEl.className = 'game-tab-title';
    this.tabRowsEl.className = 'game-tab-list';

    panel.appendChild(this.tabTitleEl);
    panel.appendChild(this.tabRowsEl);

    const controls = document.createElement('div');
    controls.className = 'game-controls-hud';
    controls.innerHTML = `
      <div>CONTROLS</div>
      <div>WASD Move | Click select ant | SPACE Pause</div>
      <div>1/2/3 Speed | Scroll zoom | Drag pan | ESC release ant</div>
    `;

    uiLayer.appendChild(topStats);
    uiLayer.appendChild(menuBtn);
    uiLayer.appendChild(tabBar);
    uiLayer.appendChild(panel);
    uiLayer.appendChild(controls);

    this.container.appendChild(this.canvas);
    this.container.appendChild(uiLayer);

    this.setActiveTab(this.activeTab);
  }

  private setActiveTab(tab: GameTab): void {
    this.activeTab = tab;

    this.tabButtons.forEach((btn, key) => {
      btn.classList.toggle('active', key === tab);
    });

    const content = TAB_CONTENT[tab];
    this.tabTitleEl.textContent = content.title;
    this.tabRowsEl.innerHTML = '';

    content.rows.forEach((row) => {
      const li = document.createElement('li');
      li.textContent = row;
      this.tabRowsEl.appendChild(li);
    });
  }

show(): void {
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';

    document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
    document.querySelector<HTMLDivElement>('#app')!.appendChild(this.container);

    const settings = getPendingGameSettings();
    console.log('Game starting with settings:', settings);
    this.gameCanvas = new GameCanvas(this.canvas, settings!);
    void this.gameCanvas.init();
  }

  hide(): void {
    this.container.style.display = 'none';
    if (this.gameCanvas) {
      this.gameCanvas.destroy();
      this.gameCanvas = null;
    }
  }
}

import { ColonyState, AntRole, ResourceType } from './ColonyState';
import { AntEntity } from './AntEntity';
import { HungerSystem } from './systems/HungerSystem';
import { BroodSystem } from './systems/BroodSystem';
import { AntAIManager } from './ai/AntAIManager';
import { FoodSpawner } from './systems/FoodSpawner';
import type { WorldLayer, Tunnel, Chamber, NestStructure } from './ai/types';

export interface GameSettings {
  colonyName: string;
  colonyColor: string;
  antSpecies: string;
  mapSize: string;
  enableSeasons: boolean;
  difficulty: 'beginner' | 'normal' | 'hard' | 'realistic';
  preExistingColony: boolean;
}

export interface GameCoreEvents {
  onAntBorn: (role: AntRole) => void;
  onAntDied: (ant: AntEntity, reason: string) => void;
  onEggLaid: () => void;
  onBroodHatched: (role: AntRole) => void;
  onResourceLow: (resource: ResourceType) => void;
  onColonyDeath: () => void;
  onFoodCollected: (ant: AntEntity, type: ResourceType) => void;
  onFoodSpawned: (source: FoodSource) => void;
  onEntranceDug: (x: number, y: number) => void;
}

export interface FoodSource {
  x: number;
  y: number;
  type: ResourceType;
  amount: number;
  maxAmount: number;
}

export class GameCore {
  public colony: ColonyState;
  public ants: AntEntity[];

  private hungerSystem: HungerSystem;
  private broodSystem: BroodSystem;
  private antAI: AntAIManager;
  private foodSpawner: FoodSpawner;

  private foodSources: FoodSource[];
  private homeX: number;
  private homeY: number;
  private settings: GameSettings;

  public events: Partial<GameCoreEvents>;

  constructor(homeX: number = 400, homeY: number = 300, settings: GameSettings | null = null) {
    this.settings = settings || {
      colonyName: 'My Colony',
      colonyColor: '#4a3728',
      antSpecies: 'common_black',
      mapSize: 'MEDIUM',
      enableSeasons: true,
      difficulty: 'normal',
      preExistingColony: true,
    };

    this.colony = new ColonyState(this.settings.colonyName, this.parseColor(this.settings.colonyColor));
    this.ants = [];
    this.foodSources = [];
    this.homeX = homeX;
    this.homeY = homeY;
    this.events = {};

    this.colony.difficulty = this.settings.difficulty;

    this.hungerSystem = new HungerSystem(this.colony, this.ants);
    this.broodSystem = new BroodSystem(this.colony);
    this.antAI = new AntAIManager(homeX, homeY);
    this.foodSpawner = new FoodSpawner(homeX, homeY, this.foodSources);

    this.initializeStartingAnts();
    this.spawnInitialFood();
  }

  private parseColor(colorStr: string): number {
    const hex = colorStr.replace('#', '');
    return parseInt(hex, 16);
  }

  private initializeStartingAnts(): void {
    if (this.settings.preExistingColony) {
      for (let i = 0; i < this.colony.population.workers; i++) {
        this.spawnAnt('worker', 'surface');
      }
      for (let i = 0; i < this.colony.population.soldiers; i++) {
        this.spawnAnt('soldier', 'surface');
      }
      for (let i = 0; i < this.colony.population.scouts; i++) {
        this.spawnAnt('scout', 'surface');
      }
      for (let i = 0; i < this.colony.population.nurses; i++) {
        this.spawnAnt('nurse', 'underground');
      }
      for (let i = 0; i < this.colony.population.guards; i++) {
        this.spawnAnt('guard', 'surface');
      }
      if (this.colony.population.queens > 0) {
        this.spawnAnt('queen', 'underground');
      }
    } else {
      this.spawnAnt('queen', 'underground');
      this.colony.population.workers = 0;
      this.colony.population.soldiers = 0;
      this.colony.population.scouts = 0;
      this.colony.population.nurses = 0;
      this.colony.population.guards = 0;
      this.colony.resources.sugar = 10;
      this.colony.resources.protein = 5;
      this.colony.resources.water = 10;
      this.colony.resources.seeds = 0;
      this.colony.brood.eggs = 0;
      this.colony.brood.larvae = 0;
      this.colony.brood.pupae = 0;
    }

    this.hungerSystem.setAnts(this.ants);
  }

  spawnAnt(role: AntRole, layer?: WorldLayer, x?: number, y?: number): AntEntity {
    const id = `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let spawnX: number;
    let spawnY: number;
    let undergroundX: number;
    let undergroundY: number;
    let antLayer: WorldLayer;

    const nest = this.antAI.getNest();

    if (layer === 'underground') {
      antLayer = 'underground';
      if (role === 'queen') {
        spawnX = x ?? nest.queenChamberX;
        spawnY = y ?? nest.queenChamberY;
        undergroundX = spawnX;
        undergroundY = spawnY;
      } else if (role === 'nurse') {
        spawnX = x ?? nest.broodChamberX + (Math.random() - 0.5) * 30;
        spawnY = y ?? nest.broodChamberY + (Math.random() - 0.5) * 30;
        undergroundX = spawnX;
        undergroundY = spawnY;
      } else {
        spawnX = x ?? nest.entranceX;
        spawnY = y ?? 100;
        undergroundX = spawnX;
        undergroundY = spawnY;
      }
    } else {
      antLayer = 'surface';
      spawnX = x ?? this.homeX + (Math.random() - 0.5) * 80;
      spawnY = y ?? this.homeY + (Math.random() - 0.5) * 80;
      undergroundX = nest.queenChamberX;
      undergroundY = nest.queenChamberY;
    }

    const ant = new AntEntity(id, role, spawnX, spawnY, this.homeX, this.homeY, antLayer);
    ant.undergroundX = undergroundX;
    ant.undergroundY = undergroundY;
    this.ants.push(ant);
    this.hungerSystem.setAnts(this.ants);

    return ant;
  }

  commandAnt(
    ant: AntEntity,
    targetLayer: WorldLayer,
    targetX: number,
    targetY: number,
    source: 'click' | 'wasd'
  ): void {
    this.antAI.commandAnt(ant, targetLayer, targetX, targetY, source);
  }

  releaseAnt(id: string, currentX: number, currentY: number): void {
    this.antAI.releaseAnt(id, currentX, currentY);
  }

  clearWasdState(antId: string): void {
    this.antAI.clearWasdState(antId);
  }

  queenDig(ant: AntEntity, x: number, y: number, radius: number = 30): Tunnel | null {
    if (ant.role !== 'queen') return null;
    const tunnel = this.antAI.digAt(ant, x, y, radius);
    if (tunnel && tunnel.digProgress >= 100) {
      this.events.onEntranceDug?.(x, y);
    }
    return tunnel;
  }

  private spawnInitialFood(): void {
    const foodSpots = [
      { x: 600, y: 200, type: 'sugar' as ResourceType, amount: 30 },
      { x: 300, y: 500, type: 'protein' as ResourceType, amount: 20 },
      { x: 700, y: 450, type: 'water' as ResourceType, amount: 25 },
      { x: 200, y: 300, type: 'seeds' as ResourceType, amount: 15 },
    ];

    for (const spot of foodSpots) {
      this.addFoodSource(spot.x, spot.y, spot.type, spot.amount);
    }
  }

  addFoodSource(x: number, y: number, type: ResourceType, amount: number): FoodSource {
    const source: FoodSource = {
      x,
      y,
      type,
      amount,
      maxAmount: amount,
    };
    this.foodSources.push(source);
    return source;
  }

  getFoodSources(): FoodSource[] {
    return [...this.foodSources];
  }

  getTunnels(): Tunnel[] {
    return this.antAI.getTunnels();
  }

  getChambers(): Chamber[] {
    return this.antAI.getChambers();
  }

  getNest(): NestStructure {
    return this.antAI.getNest();
  }

  update(deltaSeconds: number, playerControlledAntIds: string[] = []): void {
    if (this.colony.isPaused) return;

    this.colony.updateTime(deltaSeconds);

    const difficultyMultiplier = this.getDifficultyMultiplier();

    const newFoodSources = this.foodSpawner.update(deltaSeconds, difficultyMultiplier);
    for (const source of newFoodSources) {
      this.events.onFoodSpawned?.(source);
    }

    const antsToUpdate = this.ants.filter(a => !playerControlledAntIds.includes(a.id));

    this.antAI.setEnvironment(this.colony, this.ants, this.foodSources, []);
    this.antAI.update(antsToUpdate, deltaSeconds, playerControlledAntIds);

    this.processFoodCollection();

    const result = this.hungerSystem.update(deltaSeconds);

    for (const ant of result.starved) {
      this.ants = this.ants.filter(a => a.id !== ant.id);
      this.antAI.removeAnt(ant.id);
      this.events.onAntDied?.(ant, 'starvation');
    }

    this.hungerSystem.distributeFood();

    const hatched = this.broodSystem.update(deltaSeconds);
    for (const role of hatched) {
      const layer: WorldLayer = role === 'nurse' || role === 'queen' ? 'underground' : 'surface';
      this.spawnAnt(role, layer);
      this.events.onBroodHatched?.(role);
    }

    this.updateQueen();

    this.checkResources();

    if (this.colony.population.queens <= 0) {
      this.events.onColonyDeath?.();
    }
  }

  private getDifficultyMultiplier(): number {
    switch (this.colony.difficulty) {
      case 'beginner': return 2.0;
      case 'normal': return 1.0;
      case 'hard': return 0.6;
      case 'realistic': return 0.4;
      default: return 1.0;
    }
  }

  private processFoodCollection(): void {
    for (const ant of this.ants) {
      if (!ant.isAlive) continue;

      if (ant.isCarrying && ant.state === 'returning') {
        const distToHome = Math.sqrt(
          Math.pow(ant.x - this.homeX, 2) + Math.pow(ant.y - this.homeY, 2)
        );

        if (distToHome < 30) {
          const resource = ant.dropOff();
          if (resource) {
            this.colony.addResources(resource, 5);
            this.events.onFoodCollected?.(ant, resource);
            ant.state = 'idle';
          }
        }
      }
    }
  }

  private updateQueen(): void {
    if (this.colony.population.queens <= 0) return;

    if (this.colony.resources.sugar >= 5) {
      const eggsToLay = Math.min(3, Math.floor(this.colony.resources.sugar / 5));
      for (let i = 0; i < eggsToLay; i++) {
        if (this.broodSystem.layEgg()) {
          this.events.onEggLaid?.();
        }
      }
    }
  }

  private checkResources(): void {
    const thresholds = { sugar: 20, protein: 15, water: 15, seeds: 10 };

    for (const [type, threshold] of Object.entries(thresholds)) {
      if (this.colony.resources[type as ResourceType] < threshold) {
        this.events.onResourceLow?.(type as ResourceType);
        break;
      }
    }
  }

  antCollectsFood(ant: AntEntity): boolean {
    if (!ant.isCarrying) {
      for (const source of this.foodSources) {
        if (source.amount <= 0) continue;

        const dist = Math.sqrt(
          Math.pow(ant.x - source.x, 2) + Math.pow(ant.y - source.y, 2)
        );

        if (dist < 20) {
          const collected = Math.min(5, source.amount);
          source.amount -= collected;
          ant.pickUp(source.type);
          ant.moveTowardHome();
          return true;
        }
      }
    }
    return false;
  }

  antDepositsFood(ant: AntEntity): boolean {
    if (ant.isCarrying) {
      const distToHome = Math.sqrt(
        Math.pow(ant.x - this.homeX, 2) + Math.pow(ant.y - this.homeY, 2)
      );

      if (distToHome < 30) {
        const resource = ant.dropOff();
        if (resource) {
          this.colony.addResources(resource, 5);
          return true;
        }
      }
    }
    return false;
  }

  getAntCount(): number {
    return this.ants.length;
  }

  getAntsByRole(role: AntRole): AntEntity[] {
    return this.ants.filter(a => a.role === role);
  }

  getHungryAnts(): AntEntity[] {
    return this.hungerSystem.getStarvingAnts();
  }

  getColonyStats(): {
    total: number;
    byRole: Record<AntRole, number>;
    hungry: number;
    starving: number;
    resources: Record<ResourceType, number>;
    brood: { eggs: number; larvae: number; pupae: number };
    morale: number;
  } {
    const byRole: Record<AntRole, number> = {
      worker: 0, soldier: 0, scout: 0, nurse: 0,
      guard: 0, queen: 0, drone: 0, alate: 0,
    };

    for (const ant of this.ants) {
      byRole[ant.role]++;
    }

    return {
      total: this.ants.length,
      byRole,
      hungry: this.hungerSystem.getStarvingAnts().length,
      starving: this.hungerSystem.getCriticalAnts().length,
      resources: { ...this.colony.resources },
      brood: { ...this.colony.brood },
      morale: this.colony.morale,
    };
  }

  setDifficulty(difficulty: 'beginner' | 'normal' | 'hard' | 'realistic'): void {
    this.colony.difficulty = difficulty;
  }

  setSpeed(speed: number): void {
    this.colony.isPaused = false;
  }

  pause(): void {
    this.colony.isPaused = true;
  }

  resume(): void {
    this.colony.isPaused = false;
  }

  togglePause(): void {
    this.colony.isPaused = !this.colony.isPaused;
  }

  isPaused(): boolean {
    return this.colony.isPaused;
  }
}
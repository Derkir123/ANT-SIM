import { AntRole, AntState, ResourceType, ColonyState } from '../ColonyState';
import { AntEntity } from '../AntEntity';
import { FoodSource } from '../GameCore';
import { WorldState, Predator, Pheromone, NestStructure, Season, TimeOfDay } from './types';

export interface AIContextData {
  colony: ColonyState;
  ants: AntEntity[];
  foodSources: FoodSource[];
  predators: Predator[];
  pheromones: Pheromone[];
  nest: NestStructure;
  difficulty: 'beginner' | 'normal' | 'hard' | 'realistic';
  tickCount: number;
}

export class AIContext {
  private data: AIContextData;

  constructor() {
    this.data = {
      colony: new ColonyState(),
      ants: [],
      foodSources: [],
      predators: [],
      pheromones: [],
      nest: {
        entranceX: 400,
        entranceY: 350,
        queenChamberX: 400,
        queenChamberY: 600,
        broodChamberX: 600,
        broodChamberY: 500,
        granaryX: 250,
        granaryY: 450,
        proteinLarderX: 300,
        proteinLarderY: 550,
        sideTunnel1X: 450,
        sideTunnel1Y: 330,
        sideTunnel2X: 350,
        sideTunnel2Y: 330,
        hasEntrance: false,
      },
      difficulty: 'normal',
      tickCount: 0,
    };
  }

  update(data: Partial<AIContextData>): void {
    this.data = { ...this.data, ...data };
    this.data.colony = data.colony ?? this.data.colony;
    this.data.ants = data.ants ?? this.data.ants;
    this.data.foodSources = data.foodSources ?? this.data.foodSources;
    this.data.predators = data.predators ?? this.data.predators;
    this.data.pheromones = data.pheromones ?? this.data.pheromones;
    this.data.nest = data.nest ?? this.data.nest;
    this.data.difficulty = data.difficulty ?? this.data.difficulty;
    this.data.tickCount++;
  }

  getColony(): ColonyState {
    return this.data.colony;
  }

  getColonyPosition(): { x: number; y: number } {
    return { x: this.data.nest.entranceX, y: this.data.nest.entranceY };
  }

  getNest(): NestStructure {
    return this.data.nest;
  }

  getAllAnts(): AntEntity[] {
    return this.data.ants;
  }

  getAntsByRole(role: AntRole): AntEntity[] {
    return this.data.ants.filter(a => a.role === role && a.isAlive);
  }

  getAntCount(role?: AntRole): number {
    if (role) {
      return this.data.ants.filter(a => a.role === role && a.isAlive).length;
    }
    return this.data.ants.filter(a => a.isAlive).length;
  }

  getResources(): { sugar: number; protein: number; water: number; seeds: number } {
    return { ...this.data.colony.resources };
  }

  getResourceShortage(type: ResourceType): number {
    const amount = this.data.colony.resources[type];
    const thresholds = { sugar: 30, protein: 20, water: 25, seeds: 10 };
    const threshold = thresholds[type] ?? 20;
    if (amount >= threshold) return 0;
    return 1 - (amount / threshold);
  }

  getFoodUrgency(): number {
    const sugarUrgency = this.getResourceShortage('sugar');
    const proteinUrgency = this.getResourceShortage('protein');
    return Math.max(sugarUrgency, proteinUrgency);
  }

  getWaterUrgency(): number {
    return this.getResourceShortage('water');
  }

  getBroodCount(): { eggs: number; larvae: number; pupae: number } {
    return { ...this.data.colony.brood };
  }

  getBroodHunger(): number {
    const brood = this.data.colony.brood;
    const totalBrood = brood.eggs + brood.larvae + brood.pupae;
    if (totalBrood === 0) return 0;
    const nursesOnDuty = this.getAntCount('nurse');
    if (nursesOnDuty >= totalBrood / 2) return 0;
    return Math.min(1, (totalBrood - nursesOnDuty * 2) / totalBrood);
  }

  getFoodSources(): FoodSource[] {
    return this.data.foodSources.filter(f => f.amount > 0);
  }

  getNearestFood(x: number, y: number, type?: ResourceType): FoodSource | null {
    let nearest: FoodSource | null = null;
    let nearestDist = Infinity;

    for (const source of this.data.foodSources) {
      if (source.amount <= 0) continue;
      if (type && source.type !== type) continue;

      const dist = this.distance(x, y, source.x, source.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = source;
      }
    }

    return nearest;
  }

  getFoodsInRadius(x: number, y: number, radius: number): FoodSource[] {
    return this.data.foodSources.filter(f => {
      if (f.amount <= 0) return false;
      return this.distance(x, y, f.x, f.y) <= radius;
    });
  }

  getPredators(): Predator[] {
    return this.data.predators;
  }

  getNearestPredator(x: number, y: number, radius: number = Infinity): Predator | null {
    let nearest: Predator | null = null;
    let nearestDist = Infinity;

    for (const pred of this.data.predators) {
      const dist = this.distance(x, y, pred.x, pred.y);
      if (dist < nearestDist && dist <= radius) {
        nearestDist = dist;
        nearest = pred;
      }
    }

    return nearest;
  }

  getPredatorsInRadius(x: number, y: number, radius: number): Predator[] {
    return this.data.predators.filter(p => this.distance(x, y, p.x, p.y) <= radius);
  }

  getPheromones(type?: Pheromone['type']): Pheromone[] {
    if (type) {
      return this.data.pheromones.filter(p => p.type === type);
    }
    return [...this.data.pheromones];
  }

  addPheromone(x: number, y: number, type: Pheromone['type'], strength: number = 1): void {
    this.data.pheromones.push({
      x, y, type, strength,
      createdAt: this.data.tickCount,
    });
    if (this.data.pheromones.length > 200) {
      this.data.pheromones = this.data.pheromones.slice(-200);
    }
  }

  decayPheromones(decayRate: number = 0.01): void {
    this.data.pheromones = this.data.pheromones
      .map(p => ({ ...p, strength: p.strength - decayRate }))
      .filter(p => p.strength > 0);
  }

  getDifficulty(): 'beginner' | 'normal' | 'hard' | 'realistic' {
    return this.data.difficulty;
  }

  getDifficultyMultiplier(): number {
    const multipliers = {
      beginner: 2.0,
      normal: 1.0,
      hard: 0.6,
      realistic: 0.4,
    };
    return multipliers[this.data.difficulty];
  }

  getSeason(): Season {
    return this.data.colony.time.season;
  }

  getTimeOfDay(): TimeOfDay {
    const hour = this.data.colony.time.hour;
    if (hour >= 6 && hour < 10) return 'morning';
    if (hour >= 10 && hour < 18) return 'day';
    if (hour >= 18 && hour < 20) return 'evening';
    return 'night';
  }

  isDaytime(): boolean {
    return this.data.colony.time.isDaytime;
  }

  getTickCount(): number {
    return this.data.tickCount;
  }

  getMorale(): number {
    return this.data.colony.morale;
  }

  getWorkersAvailable(): number {
    return this.getAntsByRole('worker').length;
  }

  getGuardsOnDuty(): number {
    return this.getAntsByRole('guard').length;
  }

  buildWorldState(ant: AntEntity, state: { x: number; y: number; angle: number; isControlledByPlayer: boolean }): WorldState {
    const ctx = this;
    const distToFood = (() => {
      const nearest = ctx.getNearestFood(state.x, state.y);
      return nearest ? ctx.distance(state.x, state.y, nearest.x, nearest.y) : -1;
    })();
    const nearestFood = ctx.getNearestFood(state.x, state.y);

    const distToThreat = (() => {
      const nearest = ctx.getNearestPredator(state.x, state.y, 300);
      return nearest ? ctx.distance(state.x, state.y, nearest.x, nearest.y) : -1;
    })();
    const nearestThreat = ctx.getNearestPredator(state.x, state.y, 300);

    const currentLayer = (ant as any).currentLayer || 'surface';
    const isUnderground = currentLayer === 'underground';

    return {
      hunger: ant.hunger,
      health: ant.health,
      isCarrying: ant.isCarrying,
      carryingType: ant.carryingType,
      distToFood,
      foodTypeAtFood: nearestFood?.type,
      distToHome: this.distance(state.x, state.y, this.data.nest.entranceX, this.data.nest.entranceY),
      distToBrood: this.distance(state.x, state.y, this.data.nest.broodChamberX, this.data.nest.broodChamberY),
      distToEntrance: this.distance(state.x, state.y, this.data.nest.entranceX, this.data.nest.entranceY),
      distToThreat,
      threatType: nearestThreat?.type,
      broodHunger: this.getBroodHunger(),
      foodUrgency: this.getFoodUrgency(),
      waterUrgency: this.getWaterUrgency(),
      isDaytime: this.isDaytime(),
      season: this.getSeason(),
      timeOfDay: this.getTimeOfDay(),
      colonySize: this.getAntCount(),
      workersAvailable: this.getWorkersAvailable(),
      guardsOnDuty: this.getGuardsOnDuty(),
      isControlledByPlayer: state.isControlledByPlayer,
      currentLayer,
      isUnderground,
    };
  }

  distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
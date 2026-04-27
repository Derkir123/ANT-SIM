import { ColonyState, ResourceType } from '../ColonyState';
import { AntEntity } from '../AntEntity';

export interface HungerSystemConfig {
  workerHungerRate: number;
  soldierHungerRate: number;
  scoutHungerRate: number;
  nurseHungerRate: number;
  queenHungerRate: number;
  starvationThreshold: number;
  criticalHungerThreshold: number;
}

export class HungerSystem {
  private colony: ColonyState;
  private ants: AntEntity[];
  private config: HungerSystemConfig;
  private deadAnts: AntEntity[];

  constructor(colony: ColonyState, ants: AntEntity[]) {
    this.colony = colony;
    this.ants = ants;
    this.deadAnts = [];
    
    this.config = {
      workerHungerRate: 0.1,
      soldierHungerRate: 0.15,
      scoutHungerRate: 0.12,
      nurseHungerRate: 0.1,
      queenHungerRate: 0.2,
      starvationThreshold: 25,
      criticalHungerThreshold: 10,
    };
  }

  setAnts(ants: AntEntity[]): void {
    this.ants = ants;
  }

  update(deltaSeconds: number): { starved: AntEntity[]; critical: AntEntity[] } {
    this.deadAnts = [];
    const critical: AntEntity[] = [];
    const difficultyMultiplier = this.getDifficultyMultiplier();
    const seasonMultiplier = this.getSeasonMultiplier();

    for (const ant of this.ants) {
      if (!ant.isAlive) continue;

      ant.updateHunger(deltaSeconds, difficultyMultiplier * seasonMultiplier);

      if (ant.hunger <= 0 || ant.health <= 0) {
        this.deadAnts.push(ant);
        this.colony.removePopulation(ant.role, 1);
        this.colony.totalAntsDied++;
      } else if (ant.hunger < this.config.criticalHungerThreshold) {
        critical.push(ant);
      }
    }

    return { starved: this.deadAnts, critical };
  }

  feedAnt(ant: AntEntity, amount: number): void {
    ant.feed(amount);
  }

  feedColony(amount: number): void {
    const workersToFeed = Math.min(this.colony.population.workers, Math.floor(amount));
    const perWorker = amount / workersToFeed;
    
    for (const ant of this.ants) {
      if (ant.role === 'worker' && workersToFeed > 0) {
        ant.feed(perWorker);
      }
    }
  }

  feedQueen(): boolean {
    const queenFoodCost = 2;
    
    if (this.colony.population.queens > 0 && this.colony.resources.sugar >= queenFoodCost) {
      this.colony.consumeResources('sugar', queenFoodCost);
      return true;
    }
    return false;
  }

  calculateFoodNeeded(): number {
    let total = 0;
    
    for (const ant of this.ants) {
      const baseRate = this.getRoleHungerRate(ant.role);
      let hunger = ant.hunger;
      
      if (hunger < 50) {
        hunger = (50 - hunger) / 50;
        total += hunger * baseRate * 10;
      }
    }
    
    return Math.ceil(total);
  }

  distributeFood(): void {
    const sugar = this.colony.resources.sugar;
    const protein = this.colony.resources.protein;
    
    if (sugar <= 0 && protein <= 0) return;

    const hungryAnts = this.ants
      .filter(a => a.isHungry && a.isAlive)
      .sort((a, b) => a.hunger - b.hunger);

    for (const ant of hungryAnts) {
      if (ant.hunger >= 80) break;
      
      const need = 100 - ant.hunger;
      const resource = Math.random() > 0.3 ? 'sugar' : 'protein';
      
      if (this.colony.resources[resource] >= 1) {
        ant.feed(1);
        this.colony.consumeResources(resource, 1);
        this.colony.foodPerDay++;
      }
    }
  }

  private getRoleHungerRate(role: string): number {
    switch (role) {
      case 'worker': return this.config.workerHungerRate;
      case 'soldier': return this.config.soldierHungerRate;
      case 'scout': return this.config.scoutHungerRate;
      case 'nurse': return this.config.nurseHungerRate;
      case 'queen': return this.config.queenHungerRate;
      default: return this.config.workerHungerRate;
    }
  }

  private getDifficultyMultiplier(): number {
    switch (this.colony.difficulty) {
      case 'beginner': return 0.5;
      case 'normal': return 1.0;
      case 'hard': return 1.5;
      case 'realistic': return 2.0;
      default: return 1.0;
    }
  }

  private getSeasonMultiplier(): number {
    switch (this.colony.time.season) {
      case 'spring': return 1.0;
      case 'summer': return 1.2;
      case 'autumn': return 0.9;
      case 'winter': return 0.6;
      default: return 1.0;
    }
  }

  getStarvingAnts(): AntEntity[] {
    return this.ants.filter(a => a.hunger < this.config.starvationThreshold && a.isAlive);
  }

  getCriticalAnts(): AntEntity[] {
    return this.ants.filter(a => a.hunger < this.config.criticalHungerThreshold && a.isAlive);
  }

  getFoodUrgency(): 'low' | 'medium' | 'high' | 'critical' {
    const starving = this.getStarvingAnts().length;
    const total = this.ants.length;
    
    if (total === 0) return 'low';
    
    const ratio = starving / total;
    
    if (ratio > 0.5) return 'critical';
    if (ratio > 0.3) return 'high';
    if (ratio > 0.1) return 'medium';
    return 'low';
  }
}
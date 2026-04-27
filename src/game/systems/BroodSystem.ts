import { ColonyState, AntRole } from '../ColonyState';

export interface BroodDevelopment {
  eggCount: number;
  eggTimer: number;
  larvaCount: number;
  larvaTimer: number;
  pupaCount: number;
  pupaTimer: number;
}

export class BroodSystem {
  private colony: ColonyState;
  private development: BroodDevelopment;

  public static EGG_DURATION = 30;
  public static LARVA_DURATION = 45;
  public static PUPA_DURATION = 30;

  constructor(colony: ColonyState) {
    this.colony = colony;
    this.development = {
      eggCount: 0,
      eggTimer: 0,
      larvaCount: 0,
      larvaTimer: 0,
      pupaCount: 0,
      pupaTimer: 0,
    };
  }

  update(deltaSeconds: number): AntRole[] {
    const hatched: AntRole[] = [];
    const growthMultiplier = this.getGrowthMultiplier();

    if (this.colony.brood.eggs > 0) {
      this.development.eggTimer += deltaSeconds * growthMultiplier;
      
      while (this.development.eggTimer >= BroodSystem.EGG_DURATION && this.colony.brood.eggs > 0) {
        this.development.eggTimer -= BroodSystem.EGG_DURATION;
        this.colony.brood.eggs--;
        this.colony.brood.larvae++;
      }
    }

    if (this.colony.brood.larvae > 0) {
      this.development.larvaTimer += deltaSeconds * growthMultiplier;
      
      while (this.development.larvaTimer >= BroodSystem.LARVA_DURATION && this.colony.brood.larvae > 0) {
        this.development.larvaTimer -= BroodSystem.LARVA_DURATION;
        this.colony.brood.larvae--;
        this.colony.brood.pupae++;
      }
    }

    if (this.colony.brood.pupae > 0) {
      this.development.pupaTimer += deltaSeconds * growthMultiplier;
      
      while (this.development.pupaTimer >= BroodSystem.PUPA_DURATION && this.colony.brood.pupae > 0) {
        this.development.pupaTimer -= BroodSystem.PUPA_DURATION;
        this.colony.brood.pupae--;
        const role = this.determineRole();
        this.colony.addPopulation(role, 1);
        hatched.push(role);
      }
    }

    return hatched;
  }

  layEgg(): boolean {
    if (this.colony.population.queens <= 0) return false;
    
    const foodNeeded = 3;
    
    if (this.colony.resources.sugar >= foodNeeded) {
      this.colony.consumeResources('sugar', foodNeeded);
      this.colony.addEggs(1);
      return true;
    }
    return false;
  }

  getEggProgress(): number {
    return this.development.eggTimer / BroodSystem.EGG_DURATION;
  }

  getLarvaProgress(): number {
    return this.development.larvaTimer / BroodSystem.LARVA_DURATION;
  }

  getPupaProgress(): number {
    return this.development.pupaTimer / BroodSystem.PUPA_DURATION;
  }

  getNextHatchTime(): number {
    if (this.colony.brood.pupae > 0) {
      return (BroodSystem.PUPA_DURATION - this.development.pupaTimer) / this.getGrowthMultiplier();
    }
    if (this.colony.brood.larvae > 0) {
      return (BroodSystem.LARVA_DURATION - this.development.larvaTimer) / this.getGrowthMultiplier();
    }
    if (this.colony.brood.eggs > 0) {
      return (BroodSystem.EGG_DURATION - this.development.eggTimer) / this.getGrowthMultiplier();
    }
    return Infinity;
  }

  private determineRole(): AntRole {
    const total = this.colony.totalAnts;
    const rand = Math.random();

    if (total < 25) {
      if (rand < 0.60) return 'worker';
      if (rand < 0.85) return 'worker';
      if (rand < 0.92) return 'soldier';
      return 'scout';
    }
    
    const workerRatio = this.colony.population.workers / total;
    const soldierRatio = this.colony.population.soldiers / total;
    const nurseRatio = this.colony.population.nurses / total;
    const scoutRatio = this.colony.population.scouts / total;

    if (workerRatio < 0.6 && rand < 0.5) return 'worker';
    if (soldierRatio < 0.15 && rand < 0.2) return 'soldier';
    if (nurseRatio < 0.15 && rand < 0.15) return 'nurse';
    if (scoutRatio < 0.1 && rand < 0.1) return 'scout';
    
    return 'worker';
  }

  private getGrowthMultiplier(): number {
    let multiplier = 1.0;

    if (this.colony.difficulty === 'beginner') multiplier *= 2.0;
    if (this.colony.difficulty === 'realistic') multiplier *= 0.5;

    switch (this.colony.time.season) {
      case 'spring': multiplier *= 1.2; break;
      case 'winter': multiplier *= 0.5; break;
      case 'summer': multiplier *= 1.0; break;
      case 'autumn': multiplier *= 0.8; break;
    }

    if (this.colony.population.nurses > 0) {
      multiplier *= 1.0 + (this.colony.population.nurses * 0.05);
    }

    return multiplier;
  }

  getDevelopmentSummary(): { eggs: number; larvae: number; pupae: number; total: number } {
    return {
      eggs: this.colony.brood.eggs,
      larvae: this.colony.brood.larvae,
      pupae: this.colony.brood.pupae,
      total: this.colony.brood.eggs + this.colony.brood.larvae + this.colony.brood.pupae,
    };
  }
}
export type AntRole = 'worker' | 'soldier' | 'scout' | 'nurse' | 'guard' | 'queen' | 'drone' | 'alate';
export type AntState = 'idle' | 'wandering' | 'seeking' | 'returning' | 'carrying' | 'working' | 'attacking';
export type ResourceType = 'sugar' | 'protein' | 'water' | 'seeds';

export interface ResourceStorage {
  sugar: number;
  protein: number;
  water: number;
  seeds: number;
}

export interface PopulationCount {
  workers: number;
  soldiers: number;
  scouts: number;
  nurses: number;
  guards: number;
  queens: number;
  drones: number;
  alates: number;
}

export interface BroodCount {
  eggs: number;
  larvae: number;
  pupae: number;
}

export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  second: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  isDaytime: boolean;
}

export interface ColonyStateData {
  name: string;
  color: number;
  species: string;
  resources: ResourceStorage;
  population: PopulationCount;
  brood: BroodCount;
  time: GameTime;
  morale: number;
  foodPerDay: number;
  totalAntsBorn: number;
  totalAntsDied: number;
}

export class ColonyState {
  public name: string;
  public color: number;
  public species: string;
  
  public resources: ResourceStorage;
  public population: PopulationCount;
  public brood: BroodCount;
  public time: GameTime;
  
  public morale: number;
  public foodPerDay: number;
  public totalAntsBorn: number;
  public totalAntsDied: number;
  
  public difficulty: 'beginner' | 'normal' | 'hard' | 'realistic';
  public isPaused: boolean;

  constructor(name: string = 'My Colony', color: number = 0x2d1f14) {
    this.name = name;
    this.color = color;
    this.species = 'Common Black Ant';
    
    this.resources = {
      sugar: 50,
      protein: 30,
      water: 40,
      seeds: 15,
    };
    
    this.population = {
      workers: 15,
      soldiers: 3,
      scouts: 2,
      nurses: 3,
      guards: 2,
      queens: 1,
      drones: 0,
      alates: 0,
    };
    
    this.brood = {
      eggs: 12,
      larvae: 8,
      pupae: 5,
    };
    
    this.time = {
      day: 1,
      hour: 8,
      minute: 0,
      second: 0,
      season: 'spring',
      isDaytime: true,
    };
    
    this.morale = 75;
    this.foodPerDay = 0;
    this.totalAntsBorn = 0;
    this.totalAntsDied = 0;
    
    this.difficulty = 'normal';
    this.isPaused = false;
  }

  get totalAnts(): number {
    return Object.values(this.population).reduce((a, b) => a + b, 0);
  }

  get totalBrood(): number {
    return Object.values(this.brood).reduce((a, b) => a + b, 0);
  }

  get idleAnts(): number {
    return Math.floor(this.totalAnts * 0.2);
  }

  addResources(type: ResourceType, amount: number): void {
    this.resources[type] += amount;
  }

  consumeResources(type: ResourceType, amount: number): boolean {
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount;
      return true;
    }
    return false;
  }

  addEggs(count: number): void {
    this.brood.eggs += count;
  }

  addPopulation(role: AntRole, count: number = 1): void {
    switch (role) {
      case 'worker': this.population.workers += count; break;
      case 'soldier': this.population.soldiers += count; break;
      case 'scout': this.population.scouts += count; break;
      case 'nurse': this.population.nurses += count; break;
      case 'guard': this.population.guards += count; break;
      case 'queen': this.population.queens += count; break;
      case 'drone': this.population.drones += count; break;
      case 'alate': this.population.alates += count; break;
    }
    this.totalAntsBorn += count;
  }

  removePopulation(role: AntRole, count: number = 1): void {
    switch (role) {
      case 'worker': this.population.workers = Math.max(0, this.population.workers - count); break;
      case 'soldier': this.population.soldiers = Math.max(0, this.population.soldiers - count); break;
      case 'scout': this.population.scouts = Math.max(0, this.population.scouts - count); break;
      case 'nurse': this.population.nurses = Math.max(0, this.population.nurses - count); break;
      case 'guard': this.population.guards = Math.max(0, this.population.guards - count); break;
      case 'queen': this.population.queens = Math.max(0, this.population.queens - count); break;
      case 'drone': this.population.drones = Math.max(0, this.population.drones - count); break;
      case 'alate': this.population.alates = Math.max(0, this.population.alates - count); break;
    }
    this.totalAntsDied += count;
  }

  updateTime(deltaSeconds: number): void {
    if (this.isPaused) return;
    
    this.time.second += deltaSeconds;
    
    while (this.time.second >= 60) {
      this.time.second -= 60;
      this.time.minute++;
      this.foodPerDay = 0;
    }
    
    while (this.time.minute >= 60) {
      this.time.minute -= 60;
      this.time.hour++;
    }
    
    while (this.time.hour >= 24) {
      this.time.hour -= 24;
      this.time.day++;
      this.updateSeason();
    }
    
    this.time.isDaytime = this.time.hour >= 6 && this.time.hour < 20;
  }

  private updateSeason(): void {
    const dayInYear = this.time.day % 240;
    if (dayInYear < 60) this.time.season = 'spring';
    else if (dayInYear < 120) this.time.season = 'summer';
    else if (dayInYear < 180) this.time.season = 'autumn';
    else this.time.season = 'winter';
  }

  getHungerRate(): number {
    const baseRate = 0.5;
    const difficultyMultipliers = {
      beginner: 0.3,
      normal: 0.5,
      hard: 0.75,
      realistic: 1.0,
    };
    const seasonMultipliers = {
      spring: 1.0,
      summer: 1.2,
      autumn: 0.9,
      winter: 0.6,
    };
    
    return baseRate * difficultyMultipliers[this.difficulty] * seasonMultipliers[this.time.season];
  }

  getMoraleColor(): string {
    if (this.morale >= 70) return '#4ade80';
    if (this.morale >= 40) return '#fbbf24';
    return '#ef4444';
  }

  getNestStatus(): 'healthy' | 'warning' | 'danger' {
    if (this.resources.sugar < 10 || this.resources.water < 10) return 'danger';
    if (this.resources.sugar < 25 || this.resources.water < 25) return 'warning';
    return 'healthy';
  }

  toJSON(): ColonyStateData {
    return {
      name: this.name,
      color: this.color,
      species: this.species,
      resources: { ...this.resources },
      population: { ...this.population },
      brood: { ...this.brood },
      time: { ...this.time },
      morale: this.morale,
      foodPerDay: this.foodPerDay,
      totalAntsBorn: this.totalAntsBorn,
      totalAntsDied: this.totalAntsDied,
    };
  }
}
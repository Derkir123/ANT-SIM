import { ResourceType } from '../ColonyState';
import { FoodSource } from '../GameCore';

export interface FoodSpawnConfig {
  spawnInterval: number;
  maxSources: number;
  minAmount: number;
  maxAmount: number;
  spawnRadius: number;
  despawnThreshold: number;
}

export class FoodSpawner {
  private config: FoodSpawnConfig;
  private foodSources: FoodSource[];
  private centerX: number;
  private centerY: number;
  private spawnTimer: number = 0;
  private resourceTypes: ResourceType[] = ['sugar', 'protein', 'water', 'seeds'];
  private lastSpawnTime: number = 0;

  constructor(centerX: number, centerY: number, foodSources: FoodSource[]) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.foodSources = foodSources;
    
    this.config = {
      spawnInterval: 10,
      maxSources: 20,
      minAmount: 5,
      maxAmount: 25,
      spawnRadius: 400,
      despawnThreshold: 0,
    };
  }

  update(deltaSeconds: number, difficultyMultiplier: number = 1): FoodSource[] {
    const newSources: FoodSource[] = [];
    
    this.spawnTimer += deltaSeconds;
    const adjustedInterval = this.config.spawnInterval / difficultyMultiplier;
    
    if (this.spawnTimer >= adjustedInterval) {
      this.spawnTimer = 0;
      
      const activeSources = this.foodSources.filter(s => s.amount > this.config.despawnThreshold);
      if (activeSources.length < this.config.maxSources) {
        const newSource = this.spawnFoodSource();
        if (newSource) {
          newSources.push(newSource);
          this.foodSources.push(newSource);
        }
      }
    }
    
    for (const source of this.foodSources) {
      if (source.amount <= 0) {
        source.amount = 0;
      }
    }
    
    return newSources;
  }

  private spawnFoodSource(): FoodSource | null {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * this.config.spawnRadius;
    
    const x = this.centerX + Math.cos(angle) * distance;
    const y = this.centerY + Math.sin(angle) * distance;
    
    const type = this.resourceTypes[Math.floor(Math.random() * this.resourceTypes.length)];
    const amount = this.config.minAmount + Math.floor(Math.random() * (this.config.maxAmount - this.config.minAmount));
    
    return {
      x,
      y,
      type,
      amount,
      maxAmount: amount,
    };
  }

  addFoodSource(source: FoodSource): void {
    this.foodSources.push(source);
  }

  removeEmptySources(): void {
    this.foodSources = this.foodSources.filter(s => s.amount > this.config.despawnThreshold);
  }

  getActiveSources(): FoodSource[] {
    return this.foodSources.filter(s => s.amount > 0);
  }

  getSourcesByType(type: ResourceType): FoodSource[] {
    return this.foodSources.filter(s => s.type === type && s.amount > 0);
  }

  setConfig(config: Partial<FoodSpawnConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FoodSpawnConfig {
    return { ...this.config };
  }

  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  spawnBulk(type: ResourceType, count: number, radius: number): FoodSource[] {
    const sources: FoodSource[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = radius * (0.5 + Math.random() * 0.5);
      
      const x = this.centerX + Math.cos(angle) * distance;
      const y = this.centerY + Math.sin(angle) * distance;
      const amount = this.config.minAmount + Math.floor(Math.random() * 10);
      
      const source = { x, y, type, amount, maxAmount: amount };
      sources.push(source);
      this.foodSources.push(source);
    }
    
    return sources;
  }
}
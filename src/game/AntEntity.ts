import { AntRole, AntState, ResourceType } from './ColonyState';
import type { WorldLayer, AntCommand } from './ai/types';

export interface AntEntityData {
  id: string;
  x: number;
  y: number;
  role: AntRole;
  hunger: number;
  health: number;
  age: number;
  state: AntState;
  targetX?: number;
  targetY?: number;
  isCarrying: boolean;
  carryingType?: ResourceType;
  homeX: number;
  homeY: number;
  undergroundX?: number;
  undergroundY?: number;
  currentLayer?: WorldLayer;
}

export class AntEntity {
  public id: string;
  public x: number;
  public y: number;
  public role: AntRole;
  
  public hunger: number;
  public health: number;
  public age: number;
  
  public state: AntState;
  public targetX?: number;
  public targetY?: number;
  
  public isCarrying: boolean;
  public carryingType?: ResourceType;
  
  public homeX: number;
  public homeY: number;
  
  public undergroundX: number;
  public undergroundY: number;
  public currentLayer: WorldLayer;
  public command: AntCommand | null;
  
  private speed: number;
  private maxHunger: number;
  private maxHealth: number;
  private hungerRate: number;

  constructor(
    id: string,
    role: AntRole,
    x: number,
    y: number,
    homeX: number,
    homeY: number,
    currentLayer: WorldLayer = 'surface'
  ) {
    this.id = id;
    this.role = role;
    this.x = x;
    this.y = y;
    this.homeX = homeX;
    this.homeY = homeY;
    this.currentLayer = currentLayer;
    this.undergroundX = homeX;
    this.undergroundY = homeY + 200;
    this.command = null;
    
    this.hunger = 100;
    this.health = 100;
    this.age = 0;
    this.state = 'idle';
    this.isCarrying = false;
    this.carryingType = undefined;
    
    this.speed = this.getRoleSpeed();
    this.maxHunger = 100;
    this.maxHealth = 100;
    this.hungerRate = this.getRoleHungerRate();
  }

  private getRoleSpeed(): number {
    switch (this.role) {
      case 'worker': return 2;
      case 'soldier': return 1.5;
      case 'scout': return 3;
      case 'nurse': return 1.8;
      case 'guard': return 1;
      case 'queen': return 0.5;
      case 'drone': return 2.5;
      case 'alate': return 3;
      default: return 2;
    }
  }

  private getRoleHungerRate(): number {
    switch (this.role) {
      case 'worker': return 0.1;
      case 'soldier': return 0.15;
      case 'scout': return 0.12;
      case 'nurse': return 0.1;
      case 'guard': return 0.08;
      case 'queen': return 0.2;
      case 'drone': return 0.15;
      case 'alate': return 0.12;
      default: return 0.1;
    }
  }

  get isAlive(): boolean {
    return this.hunger > 0 && this.health > 0;
  }

  get isHungry(): boolean {
    return this.hunger < 50;
  }

  get isStarving(): boolean {
    return this.hunger < 25;
  }

  get isNearDeath(): boolean {
    return this.hunger < 10 || this.health < 10;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    this.state = 'seeking';
  }

  clearTarget(): void {
    this.targetX = undefined;
    this.targetY = undefined;
  }

  moveToTarget(): void {
    if (this.targetX === undefined || this.targetY === undefined) {
      this.state = 'idle';
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.clearTarget();
      this.state = this.isCarrying ? 'returning' : 'idle';
      return;
    }

    const vx = (dx / dist) * this.speed;
    const vy = (dy / dist) * this.speed;
    this.x += vx;
    this.y += vy;
    this.state = this.isCarrying ? 'carrying' : 'seeking';
  }

  moveTowardHome(): void {
    this.setTarget(this.homeX, this.homeY);
    this.state = 'returning';
  }

  wander(maxDistance: number = 50): void {
    if (this.state !== 'wandering' && this.state !== 'idle') return;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * maxDistance;
    this.targetX = this.homeX + Math.cos(angle) * distance;
    this.targetY = this.homeY + Math.sin(angle) * distance;
    this.state = 'wandering';
  }

  pickUp(resource: ResourceType): void {
    this.isCarrying = true;
    this.carryingType = resource;
  }

  dropOff(): ResourceType | undefined {
    const carried = this.carryingType;
    this.isCarrying = false;
    this.carryingType = undefined;
    return carried;
  }

  feed(amount: number): void {
    this.hunger = Math.min(this.maxHunger, this.hunger + amount);
  }

  updateHunger(deltaSeconds: number, difficultyMultiplier: number = 1): void {
    this.hunger = Math.max(0, this.hunger - this.hungerRate * difficultyMultiplier * deltaSeconds);
    
    if (this.hunger < 25) {
      this.health -= 0.05 * deltaSeconds;
    }
    
    this.age += deltaSeconds;
  }

  update(delta: number): void {
    if (this.targetX !== undefined && this.targetY !== undefined) {
      this.moveToTarget();
    } else if (Math.random() < 0.01) {
      this.wander();
    }
  }

  toData(): AntEntityData {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      role: this.role,
      hunger: this.hunger,
      health: this.health,
      age: this.age,
      state: this.state,
      targetX: this.targetX,
      targetY: this.targetY,
      isCarrying: this.isCarrying,
      carryingType: this.carryingType,
      homeX: this.homeX,
      homeY: this.homeY,
      undergroundX: this.undergroundX,
      undergroundY: this.undergroundY,
      currentLayer: this.currentLayer,
    };
  }

  static fromData(data: AntEntityData): AntEntity {
    const ant = new AntEntity(data.id, data.role, data.x, data.y, data.homeX, data.homeY, data.currentLayer);
    ant.hunger = data.hunger;
    ant.health = data.health;
    ant.age = data.age;
    ant.state = data.state;
    ant.targetX = data.targetX;
    ant.targetY = data.targetY;
    ant.isCarrying = data.isCarrying;
    ant.carryingType = data.carryingType;
    if (data.undergroundX !== undefined) ant.undergroundX = data.undergroundX;
    if (data.undergroundY !== undefined) ant.undergroundY = data.undergroundY;
    return ant;
  }
}
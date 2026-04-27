import type { AntRole, AntState, ResourceType } from '../ColonyState';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';
export type WorldLayer = 'surface' | 'underground';

export interface WorldState {
  hunger: number;
  health: number;
  isCarrying: boolean;
  carryingType?: ResourceType;
  distToFood: number;
  foodTypeAtFood?: ResourceType;
  distToHome: number;
  distToBrood: number;
  distToEntrance: number;
  distToThreat: number;
  threatType?: string;
  broodHunger: number;
  foodUrgency: number;
  waterUrgency: number;
  isDaytime: boolean;
  season: Season;
  timeOfDay: TimeOfDay;
  colonySize: number;
  workersAvailable: number;
  guardsOnDuty: number;
  isControlledByPlayer: boolean;
  currentLayer: WorldLayer;
  isUnderground: boolean;
}

export interface GOAPEffect {
  set: Partial<WorldState>;
  unset?: Partial<WorldState>;
}

export interface GOAPAction {
  name: string;
  cost: number;
  preconditions: Partial<WorldState>;
  effects: GOAPEffect;
  execute: (ctx: import('./AIContext').AIContext, state: AntStateData) => ActionResult;
  inRange: (ctx: import('./AIContext').AIContext, state: AntStateData) => boolean;
  targetX?: number;
  targetY?: number;
}

export interface Goal {
  name: string;
  priority: (ctx: import('./AIContext').AIContext) => number;
  isValid: (ctx: import('./AIContext').AIContext) => boolean;
}

export interface ActionResult {
  done: boolean;
  success: boolean;
  nextAction?: GOAPAction;
}

export type CommandType = 'goto' | 'dig';

export interface AntCommand {
  type: CommandType;
  targetLayer: WorldLayer;
  targetX: number;
  targetY: number;
  timestamp: number;
  digProgress?: number;
  source: 'click' | 'wasd';
  priority: number;
}

export interface AntStateData {
  x: number;
  y: number;
  undergroundX: number;
  undergroundY: number;
  hunger: number;
  health: number;
  isCarrying: boolean;
  carryingType?: ResourceType;
  state: AntState;
  homeX: number;
  homeY: number;
  angle: number;
  decisionTimer: number;
  targetX?: number | null;
  targetY?: number | null;
  targetAngle: number;
  patrolTarget?: { x: number; y: number };
  wanderTimer: number;
  lastReplanTime: number;
  currentGoal?: string;
  actionHistory: string[];
  currentLayer: WorldLayer;
  command: AntCommand | null;
  wasdActive: boolean;
  justReleasedFromControl: boolean;
}

export function createInitialAntState(
  x: number,
  y: number,
  homeX: number,
  homeY: number,
  layer: WorldLayer = 'surface'
): AntStateData {
  const angle = Math.random() * Math.PI * 2;
  return {
    x,
    y,
    undergroundX: homeX,
    undergroundY: homeY + 200,
    hunger: 100,
    health: 100,
    isCarrying: false,
    state: 'idle',
    homeX,
    homeY,
    angle,
    decisionTimer: 0,
    targetX: null,
    targetY: null,
    targetAngle: angle,
    wanderTimer: Math.random() * 2,
    lastReplanTime: 0,
    actionHistory: [],
    currentLayer: layer,
    command: null,
    wasdActive: false,
    justReleasedFromControl: false,
  };
}

export function satisfiesState(current: Partial<WorldState>, required: Partial<WorldState>): boolean {
  for (const [key, value] of Object.entries(required)) {
    const currentVal = current[key as keyof WorldState];
    if (currentVal === undefined) continue;
    if (typeof value === 'number' && typeof currentVal === 'number') {
      if (value < 0 && currentVal >= 0) continue;
      if (value > 0 && currentVal <= 0) continue;
      if (value > 0 && currentVal < value) return false;
    } else if (typeof value === 'boolean') {
      if (value !== currentVal) return false;
    }
  }
  return true;
}

export interface Predator {
  id: string;
  x: number;
  y: number;
  type: string;
  threatLevel: number;
}

export interface Pheromone {
  x: number;
  y: number;
  type: 'food' | 'alarm' | 'recruitment' | 'trail';
  strength: number;
  createdAt: number;
}

export interface Tunnel {
  id: string;
  name: 'main' | 'side1' | 'side2';
  surfaceX: number;
  surfaceY: number;
  undergroundX: number;
  undergroundY: number;
  width: number;
  isOpen: boolean;
  digProgress: number;
}

export interface Chamber {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isRevealed: boolean;
}

export interface NestStructure {
  entranceX: number;
  entranceY: number;
  queenChamberX: number;
  queenChamberY: number;
  broodChamberX: number;
  broodChamberY: number;
  granaryX: number;
  granaryY: number;
  proteinLarderX: number;
  proteinLarderY: number;
  sideTunnel1X: number;
  sideTunnel1Y: number;
  sideTunnel2X: number;
  sideTunnel2Y: number;
  hasEntrance: boolean;
}

export { AntRole, AntState, ResourceType };
export type { ReactiveResult } from './ReactiveLayer';
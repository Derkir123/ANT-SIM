import { AntRole } from '../ColonyState';
import { AntEntity } from '../AntEntity';
import { AIContext } from './AIContext';
import { GOAPPlanner } from './GOAPPlanner';
import { ReactiveLayer } from './ReactiveLayer';
import { BaseAntAI } from './behaviors/BaseAntAI';
import { WorkerAI } from './behaviors/WorkerAI';
import { ScoutAI } from './behaviors/ScoutAI';
import { SoldierAI } from './behaviors/SoldierAI';
import { NurseAI } from './behaviors/NurseAI';
import { GuardAI } from './behaviors/GuardAI';
import { QueenAI } from './behaviors/QueenAI';
import { DroneAI } from './behaviors/DroneAI';
import { AlateAI } from './behaviors/AlateAI';
import { AntStateData, createInitialAntState, GOAPAction, WorldLayer, AntCommand, Tunnel, Chamber, NestStructure } from './types';
import { FoodSource } from '../GameCore';
import { ColonyState } from '../ColonyState';
import { Predator, Pheromone } from './types';

interface AntAIState {
  behavior: BaseAntAI;
  state: AntStateData;
  currentPlan: GOAPAction[];
  currentPlanIndex: number;
  currentGoal?: string;
}

export class AntAIManager {
  private ctx: AIContext;
  private planner: GOAPPlanner;
  private reactiveLayer: ReactiveLayer;

  private antAIStates: Map<string, AntAIState> = new Map();
  private antBehaviors: Map<AntRole, BaseAntAI> = new Map();

  private tunnels: Tunnel[] = [];
  private chambers: Chamber[] = [];
  private nest: NestStructure;
  private foodSources: FoodSource[] = [];
  private predators: Predator[] = [];
  private pheromones: Pheromone[] = [];

  constructor(homeX: number, homeY: number) {
    this.ctx = new AIContext();
    this.planner = new GOAPPlanner();
    this.reactiveLayer = new ReactiveLayer();

    this.nest = {
      entranceX: homeX,
      entranceY: homeY + 50,
      queenChamberX: homeX,
      queenChamberY: homeY + 200,
      broodChamberX: homeX + 150,
      broodChamberY: homeY + 150,
      granaryX: homeX - 100,
      granaryY: homeY + 120,
      proteinLarderX: homeX + 80,
      proteinLarderY: homeY + 280,
      sideTunnel1X: homeX + 80,
      sideTunnel1Y: homeY + 20,
      sideTunnel2X: homeX - 70,
      sideTunnel2Y: homeY + 30,
      hasEntrance: false,
    };

    this.initializeBehaviors();
    this.createInitialNest(homeX, homeY);
  }

  private initializeBehaviors(): void {
    this.antBehaviors.set('worker', new WorkerAI(this.ctx));
    this.antBehaviors.set('scout', new ScoutAI(this.ctx));
    this.antBehaviors.set('soldier', new SoldierAI(this.ctx));
    this.antBehaviors.set('nurse', new NurseAI(this.ctx));
    this.antBehaviors.set('guard', new GuardAI(this.ctx));
    this.antBehaviors.set('queen', new QueenAI(this.ctx));
    this.antBehaviors.set('drone', new DroneAI(this.ctx));
    this.antBehaviors.set('alate', new AlateAI(this.ctx));
  }

  createInitialNest(surfaceX: number, surfaceY: number): void {
    this.nest = {
      entranceX: 400,
      entranceY: 60,
      queenChamberX: 350,
      queenChamberY: 520,
      broodChamberX: 350,
      broodChamberY: 280,
      granaryX: 350,
      granaryY: 400,
      proteinLarderX: 520,
      proteinLarderY: 280,
      sideTunnel1X: 120,
      sideTunnel1Y: 120,
      sideTunnel2X: 680,
      sideTunnel2Y: 120,
      hasEntrance: true,
    };

    this.tunnels = [
      {
        id: 'main_entrance',
        name: 'main',
        surfaceX: 400,
        surfaceY: 60,
        undergroundX: 350,
        undergroundY: 440,
        width: 25,
        isOpen: true,
        digProgress: 100,
      },
      {
        id: 'side_tunnel_1',
        name: 'side1',
        surfaceX: 120,
        surfaceY: 60,
        undergroundX: 120,
        undergroundY: 120,
        width: 15,
        isOpen: true,
        digProgress: 100,
      },
      {
        id: 'side_tunnel_2',
        name: 'side2',
        surfaceX: 680,
        surfaceY: 60,
        undergroundX: 680,
        undergroundY: 120,
        width: 15,
        isOpen: true,
        digProgress: 100,
      },
    ];

    this.chambers = [
      {
        id: 'queen_chamber',
        name: 'queen',
        x: this.nest.queenChamberX,
        y: this.nest.queenChamberY,
        width: 160,
        height: 100,
        isRevealed: true,
      },
      {
        id: 'nursery',
        name: 'nursery',
        x: 350,
        y: 280,
        width: 130,
        height: 80,
        isRevealed: true,
      },
      {
        id: 'larvae',
        name: 'larvae',
        x: 520,
        y: 280,
        width: 130,
        height: 80,
        isRevealed: true,
      },
      {
        id: 'food_storage',
        name: 'food',
        x: this.nest.granaryX,
        y: this.nest.granaryY,
        width: 140,
        height: 80,
        isRevealed: true,
      },
      {
        id: 'soldier_post',
        name: 'soldier',
        x: 200,
        y: 200,
        width: 120,
        height: 70,
        isRevealed: true,
      },
      {
        id: 'guard_left',
        name: 'guard_left',
        x: 120,
        y: 120,
        width: 100,
        height: 60,
        isRevealed: true,
      },
      {
        id: 'guard_right',
        name: 'guard_right',
        x: 680,
        y: 120,
        width: 100,
        height: 60,
        isRevealed: true,
      },
    ];

    this.nest.hasEntrance = true;
  }

  setEnvironment(
    colony: ColonyState,
    ants: AntEntity[],
    foodSources: FoodSource[],
    predators: Predator[] = [],
    nest?: Partial<NestStructure>
  ): void {
    if (nest) {
      this.nest = { ...this.nest, ...nest };
    }

    this.ctx.update({
      colony,
      ants,
      foodSources,
      predators,
      nest: this.nest,
    });
  }

  update(
    ants: AntEntity[],
    deltaSeconds: number,
    playerControlledIds: string[] = []
  ): void {
    const controlledSet = new Set(playerControlledIds);

    for (const ant of ants) {
      if (!ant.isAlive) continue;
      if (controlledSet.has(ant.id)) continue;

      this.updateAnt(ant, deltaSeconds);
    }

    this.ctx.decayPheromones(deltaSeconds * 0.02);
  }

  releaseAnt(id: string, currentX: number, currentY: number): void {
    const aiState = this.antAIStates.get(id);
    if (aiState) {
      aiState.state.justReleasedFromControl = true;
      aiState.state.x = currentX;
      aiState.state.y = currentY;
      aiState.state.targetX = null;
      aiState.state.targetY = null;
      aiState.state.wanderTimer = 0;
      aiState.state.command = null;
      aiState.state.wasdActive = false;
    }
  }

  commandAnt(
    ant: AntEntity,
    targetLayer: WorldLayer,
    targetX: number,
    targetY: number,
    source: 'click' | 'wasd'
  ): void {
    let aiState = this.antAIStates.get(ant.id);
    if (!aiState) {
      const behavior = this.antBehaviors.get(ant.role);
      if (!behavior) return;
      aiState = {
        behavior,
        state: createInitialAntState(ant.x, ant.y, ant.homeX, ant.homeY, ant.currentLayer),
        currentPlan: [],
        currentPlanIndex: 0,
      };
      this.antAIStates.set(ant.id, aiState);
    }

    const command: AntCommand = {
      type: 'goto',
      targetLayer,
      targetX,
      targetY,
      timestamp: Date.now(),
      source,
      priority: source === 'wasd' ? 2 : 1,
    };

    if (source === 'wasd') {
      aiState.state.wasdActive = true;
      aiState.state.command = command;
      aiState.state.targetX = targetX;
      aiState.state.targetY = targetY;
      aiState.currentPlan = [];
      aiState.currentPlanIndex = 0;
      aiState.state.justReleasedFromControl = false;
    } else if (aiState.state.wasdActive) {
    } else {
      if (!aiState.state.command || command.priority >= aiState.state.command.priority) {
        aiState.state.command = command;
        aiState.state.targetX = targetX;
        aiState.state.targetY = targetY;
        aiState.state.justReleasedFromControl = false;
      }
    }
  }

  clearWasdState(antId: string): void {
    const aiState = this.antAIStates.get(antId);
    if (aiState) {
      aiState.state.wasdActive = false;
      if (aiState.state.command?.source === 'wasd') {
        aiState.state.command = null;
      }
    }
  }

  digAt(ant: AntEntity, x: number, y: number, radius: number = 30): Tunnel | null {
    for (const tunnel of this.tunnels) {
      const dist = this.ctx.distance(x, y, tunnel.surfaceX, tunnel.surfaceY);
      if (dist < radius + tunnel.width) {
        tunnel.digProgress = Math.min(100, tunnel.digProgress + 2);
        if (tunnel.digProgress >= 100) {
          tunnel.isOpen = true;
          this.nest.hasEntrance = true;
        }
        return tunnel;
      }
    }
    return null;
  }

  getTunnels(): Tunnel[] {
    return [...this.tunnels];
  }

  getChambers(): Chamber[] {
    return [...this.chambers];
  }

  getNest(): NestStructure {
    return { ...this.nest };
  }

  private findNearestOpenTunnel(x: number, y: number, currentLayer: WorldLayer): Tunnel | null {
    let nearest: Tunnel | null = null;
    let nearestDist = Infinity;

    for (const tunnel of this.tunnels) {
      if (!tunnel.isOpen) continue;

      const tunnelX = currentLayer === 'surface' ? tunnel.surfaceX : tunnel.undergroundX;
      const tunnelY = currentLayer === 'surface' ? tunnel.surfaceY : tunnel.undergroundY;
      const dist = this.ctx.distance(x, y, tunnelX, tunnelY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = tunnel;
      }
    }

    return nearest;
  }

  private updateAnt(ant: AntEntity, deltaSeconds: number): void {
    let aiState = this.antAIStates.get(ant.id);

    if (!aiState) {
      const behavior = this.antBehaviors.get(ant.role);
      if (!behavior) return;

      aiState = {
        behavior,
        state: createInitialAntState(ant.x, ant.y, ant.homeX, ant.homeY, ant.currentLayer),
        currentPlan: [],
        currentPlanIndex: 0,
      };

      this.antAIStates.set(ant.id, aiState);
    }

    aiState.state.hunger = ant.hunger;
    aiState.state.health = ant.health;
    aiState.state.isCarrying = ant.isCarrying;
    aiState.state.carryingType = ant.carryingType;
    aiState.state.x = ant.x;
    aiState.state.y = ant.y;
    aiState.state.undergroundX = ant.undergroundX;
    aiState.state.undergroundY = ant.undergroundY;
    aiState.state.currentLayer = ant.currentLayer;

    if (aiState.state.wasdActive) {
      this.handleWasdMovement(ant, aiState, deltaSeconds);
      return;
    }

    const reactive = aiState.behavior.evaluateReactive(
      { x: ant.x, y: ant.y, role: ant.role, health: ant.health, hunger: ant.hunger },
      aiState.state
    );

    if (reactive.priority > 0 && reactive.action !== 'none') {
      this.handleReactiveAction(ant, aiState, reactive, deltaSeconds);
      return;
    }

    if (aiState.state.command && aiState.state.command.type === 'goto') {
      this.handleCommandedMovement(ant, aiState, deltaSeconds);
      return;
    }

    this.handleGOAPAction(ant, aiState, deltaSeconds);
  }

  private handleWasdMovement(
    ant: AntEntity,
    aiState: AntAIState,
    deltaSeconds: number
  ): void {
    if (aiState.state.targetX !== null && aiState.state.targetY !== null) {
      aiState.behavior.updateMovement(ant as any, aiState.state, deltaSeconds);
    }

    ant.x = aiState.state.x;
    ant.y = aiState.state.y;
  }

  private handleCommandedMovement(
    ant: AntEntity,
    aiState: AntAIState,
    deltaSeconds: number
  ): void {
    const cmd = aiState.state.command!;
    const targetX = cmd.targetX;
    const targetY = cmd.targetY;
    const targetLayer = cmd.targetLayer;

    if (ant.currentLayer !== targetLayer) {
      const tunnel = this.findNearestOpenTunnel(
        targetLayer === 'surface' ? ant.x : ant.undergroundX,
        targetLayer === 'surface' ? ant.y : ant.undergroundY,
        ant.currentLayer
      );
      if (tunnel) {
        const tunnelX = ant.currentLayer === 'surface' ? tunnel.surfaceX : tunnel.undergroundX;
        const tunnelY = ant.currentLayer === 'surface' ? tunnel.surfaceY : tunnel.undergroundY;

        if (ant.currentLayer === 'surface') {
          aiState.state.targetX = tunnelX;
          aiState.state.targetY = tunnelY;
        } else {
          aiState.state.targetX = tunnelX;
          aiState.state.targetY = tunnelY;
        }

        aiState.behavior.updateMovement(ant as any, aiState.state, deltaSeconds);
        ant.x = aiState.state.x;
        ant.y = aiState.state.y;

        const distToTunnel = this.ctx.distance(ant.x, ant.y, tunnelX, tunnelY);
        if (distToTunnel < 10) {
          this.transitionLayer(ant, tunnel, aiState);
        }
        return;
      }
    }

    if (ant.currentLayer === 'surface') {
      aiState.state.targetX = targetX;
      aiState.state.targetY = targetY;
    } else {
      aiState.state.targetX = targetX;
      aiState.state.targetY = targetY;
    }

    aiState.behavior.updateMovement(ant as any, aiState.state, deltaSeconds);
    ant.x = aiState.state.x;
    ant.y = aiState.state.y;

    const distToTarget = this.ctx.distance(ant.x, ant.y, targetX, targetY);
    if (distToTarget < 10) {
      aiState.state.command = null;
      aiState.state.targetX = null;
      aiState.state.targetY = null;
    }
  }

  private transitionLayer(ant: AntEntity, tunnel: Tunnel, aiState: AntAIState): void {
    if (ant.currentLayer === 'surface') {
      ant.currentLayer = 'underground';
      ant.undergroundX = tunnel.undergroundX;
      ant.undergroundY = tunnel.undergroundY;
      ant.x = ant.undergroundX;
      ant.y = ant.undergroundY;
      aiState.state.x = ant.undergroundX;
      aiState.state.y = ant.undergroundY;
      aiState.state.undergroundX = ant.undergroundX;
      aiState.state.undergroundY = ant.undergroundY;
      aiState.state.currentLayer = 'underground';
    } else {
      ant.currentLayer = 'surface';
      ant.x = tunnel.surfaceX;
      ant.y = tunnel.surfaceY;
      aiState.state.x = ant.x;
      aiState.state.y = ant.y;
      aiState.state.currentLayer = 'surface';
    }
  }

  private handleReactiveAction(
    ant: AntEntity,
    aiState: AntAIState,
    reactive: { action: string; targetX?: number; targetY?: number; priority: number; message?: string },
    deltaSeconds: number
  ): void {
    switch (reactive.action) {
      case 'flee':
        if (reactive.targetX !== undefined && reactive.targetY !== undefined) {
          aiState.state.targetX = reactive.targetX;
          aiState.state.targetY = reactive.targetY;
          ant.state = 'seeking';
        }
        break;

      case 'attack':
        if (reactive.targetX !== undefined && reactive.targetY !== undefined) {
          aiState.state.targetX = reactive.targetX;
          aiState.state.targetY = reactive.targetY;
          ant.state = 'attacking';
        }
        break;

      case 'swarm':
        if (reactive.targetX !== undefined && reactive.targetY !== undefined) {
          aiState.state.targetX = reactive.targetX;
          aiState.state.targetY = reactive.targetY;
          ant.state = 'attacking';
        }
        break;

      case 'alarm':
        this.ctx.addPheromone(ant.x, ant.y, 'alarm', 1);
        break;
    }

    aiState.state.wanderTimer += deltaSeconds;
    aiState.behavior.updateMovement(ant as any, aiState.state, deltaSeconds);

    ant.x = aiState.state.x;
    ant.y = aiState.state.y;
  }

  private handleGOAPAction(
    ant: AntEntity,
    aiState: AntAIState,
    deltaSeconds: number
  ): void {
    aiState.state.decisionTimer += deltaSeconds;

    const tx = aiState.state.targetX;
    const ty = aiState.state.targetY;
    if (tx != null && ty != null) {
      const dist = Math.sqrt(
        Math.pow((tx as number) - ant.x, 2) +
        Math.pow((ty as number) - ant.y, 2)
      );
      if (dist < 5) {
        aiState.state.targetX = null;
        aiState.state.targetY = null;
      }
    }

    if (this.shouldReplan(aiState, deltaSeconds)) {
      this.replan(ant, aiState);
    }

    if (aiState.currentPlan.length > 0) {
      this.executePlanStep(ant, aiState, deltaSeconds);
    } else {
      aiState.state.wanderTimer += deltaSeconds;
      if (aiState.state.wanderTimer > 2) {
        aiState.state.wanderTimer = 0;
        aiState.state.targetX = ant.x + (Math.random() - 0.5) * 60;
        aiState.state.targetY = ant.y + (Math.random() - 0.5) * 60;
        ant.state = 'wandering';
      }
    }

    aiState.behavior.updateMovement(ant as any, aiState.state, deltaSeconds);

    ant.x = aiState.state.x;
    ant.y = aiState.state.y;
    ant.state = aiState.state.isCarrying ? 'returning' : ant.state;
  }

  private shouldReplan(aiState: AntAIState, deltaSeconds: number): boolean {
    if (aiState.state.justReleasedFromControl) {
      aiState.state.justReleasedFromControl = false;
      return false;
    }

    if (aiState.currentPlan.length === 0) return true;
    if (aiState.state.hunger < 25) return true;
    if (aiState.state.isCarrying) return true;
    if (aiState.state.wanderTimer > 5) return true;

    return false;
  }

  private replan(ant: AntEntity, aiState: AntAIState): void {
    const worldState = this.ctx.buildWorldState(
      ant as any,
      {
        x: ant.x,
        y: ant.y,
        angle: aiState.state.angle,
        isControlledByPlayer: false
      }
    );

    const goals = aiState.behavior.getGoals();
    const actions = aiState.behavior.getActions();

    const result = this.planner.plan(goals, actions, worldState, this.ctx);

    if (result) {
      aiState.currentPlan = result.plan;
      aiState.currentPlanIndex = 0;
      aiState.currentGoal = result.goal.name;
    } else {
      aiState.currentPlan = [];
      aiState.currentPlanIndex = 0;
    }
  }

  private executePlanStep(
    ant: AntEntity,
    aiState: AntAIState,
    deltaSeconds: number
  ): void {
    if (aiState.currentPlanIndex >= aiState.currentPlan.length) {
      aiState.currentPlan = [];
      aiState.currentPlanIndex = 0;
      return;
    }

    const currentAction = aiState.currentPlan[aiState.currentPlanIndex];
    const result = aiState.behavior.executeAction(
      currentAction,
      ant as any,
      aiState.state,
      deltaSeconds
    );

    if (result.done) {
      if (result.nextAction) {
        const nextIndex = aiState.currentPlan.findIndex(a => a.name === result.nextAction?.name);
        if (nextIndex >= 0) {
          aiState.currentPlanIndex = nextIndex;
        } else {
          aiState.currentPlanIndex++;
        }
      } else {
        aiState.currentPlanIndex++;
      }

      if (currentAction.name === 'forage' || currentAction.name === 'collect') {
        if (this.checkFoodCollection(ant, aiState)) {
          ant.isCarrying = true;
          aiState.state.isCarrying = true;
        }
      }

      if (currentAction.name === 'deposit' || currentAction.name === 'returnHome') {
        if (this.checkFoodDeposit(ant, aiState)) {
          ant.isCarrying = false;
          aiState.state.isCarrying = false;
        }
      }
    }
  }

  private checkFoodCollection(ant: AntEntity, aiState: AntAIState): boolean {
    const food = this.ctx.getNearestFood(ant.x, ant.y);
    if (!food) return false;

    const dist = this.ctx.distance(ant.x, ant.y, food.x, food.y);
    if (dist < 15 && !ant.isCarrying) {
      ant.pickUp(food.type);
      aiState.state.isCarrying = true;
      aiState.state.targetX = ant.homeX;
      aiState.state.targetY = ant.homeY;
      food.amount = Math.max(0, food.amount - 5);
      return true;
    }
    return false;
  }

  private checkFoodDeposit(ant: AntEntity, aiState: AntAIState): boolean {
    const homeDist = this.ctx.distance(ant.x, ant.y, ant.homeX, ant.homeY);
    if (homeDist < 30 && ant.isCarrying) {
      const carried = ant.dropOff();
      if (carried) {
        const colony = this.ctx.getColony();
        colony.addResources(carried, 5);
        aiState.state.isCarrying = false;
        return true;
      }
    }
    return false;
  }

  removeAnt(id: string): void {
    this.antAIStates.delete(id);
  }

  getAntState(id: string): AntStateData | undefined {
    return this.antAIStates.get(id)?.state;
  }

  getAntBehavior(id: string): BaseAntAI | undefined {
    return this.antAIStates.get(id)?.behavior;
  }

  setNestPosition(entranceX: number, entranceY: number, broodChamberX: number, broodChamberY: number): void {
    this.nest.entranceX = entranceX;
    this.nest.entranceY = entranceY;
    this.nest.broodChamberX = broodChamberX;
    this.nest.broodChamberY = broodChamberY;
    this.nest.queenChamberX = entranceX;
    this.nest.queenChamberY = broodChamberY + 100;

    this.ctx.update({ nest: this.nest });
  }

  addPredator(x: number, y: number, type: string, threatLevel: number = 1): void {
    const predator: Predator = {
      id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      type,
      threatLevel,
    };
    this.predators.push(predator);
  }

  removePredator(id: string): void {
    this.predators = this.predators.filter(p => p.id !== id);
  }

  updatePredator(id: string, x: number, y: number): void {
    const pred = this.predators.find(p => p.id === id);
    if (pred) {
      pred.x = x;
      pred.y = y;
    }
  }

  getPheromones(): Pheromone[] {
    return this.ctx.getPheromones();
  }
}
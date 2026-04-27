import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class QueenAI extends BaseAntAI {
  readonly role = 'queen' as const;
  readonly displayName = 'Queen';

  private eggLayTimer = 0;
  private eggLayInterval = 30;
  private layingEggs = false;

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 8;
  }

  protected getRoleTurnSpeed(): number {
    return 2;
  }

  protected getRoleDetectionRadius(): number {
    return 50;
  }

  protected getRoleMaxDistance(): number {
    return 80;
  }

  protected getRoleWanderChance(): number {
    return 0.01;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'layEggs',
        priority: () => {
          const colony = this.ctx.getColony();
          const resources = this.ctx.getResources();
          if (resources.sugar < 5) return 1;
          const broodHunger = this.ctx.getBroodHunger();
          return 7 + broodHunger * 2;
        },
        isValid: () => {
          const colony = this.ctx.getColony();
          return colony.population.queens > 0;
        },
      },
      {
        name: 'survive',
        priority: () => 9,
        isValid: () => true,
      },
      {
        name: 'groomSelf',
        priority: () => 3,
        isValid: () => true,
      },
      {
        name: 'wander',
        priority: () => 0.5,
        isValid: () => true,
      },
    ];
  }

  private buildActions(): GOAPAction[] {
    return [
      this.createLayEggsAction(),
      this.createRestAction(),
      this.createWanderAction(),
    ];
  }

  private createLayEggsAction(): GOAPAction {
    return {
      name: 'layEggs',
      cost: 2,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        this.layingEggs = true;
        this.eggLayTimer += 0.016;
        const nest = ctx.getNest();
        const queenDist = ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY);
        if (queenDist > 30) {
          this.steerToward(state, nest.queenChamberX, nest.queenChamberY);
          return { done: false, success: true };
        }
        const resources = ctx.getResources();
        if (resources.sugar < 5) {
          this.layingEggs = false;
          return { done: true, success: false };
        }
        if (this.eggLayTimer >= this.eggLayInterval) {
          this.eggLayTimer = 0;
          this.layingEggs = false;
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const nest = ctx.getNest();
        return ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY) < 30;
      },
    };
  }

  private createRestAction(): GOAPAction {
    return {
      name: 'rest',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const nest = ctx.getNest();
        this.steerToward(state, nest.queenChamberX, nest.queenChamberY);
        const dist = ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY);
        if (dist < 40) {
          return { done: false, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const nest = ctx.getNest();
        return ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY) < 40;
      },
    };
  }

  private createWanderAction(): GOAPAction {
    return {
      name: 'wander',
      cost: 3,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const nest = ctx.getNest();
        const dist = ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY);
        if (dist > 60) {
          this.steerToward(state, nest.queenChamberX, nest.queenChamberY);
        } else if (state.targetX === null) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 10 + Math.random() * 20;
          state.targetX = state.x + Math.cos(angle) * distance;
          state.targetY = state.y + Math.sin(angle) * distance;
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }
}
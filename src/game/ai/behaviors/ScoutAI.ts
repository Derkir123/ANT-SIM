import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class ScoutAI extends BaseAntAI {
  readonly role = 'scout' as const;
  readonly displayName = 'Scout';

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 60;
  }

  protected getRoleTurnSpeed(): number {
    return 10;
  }

  protected getRoleDetectionRadius(): number {
    return 400;
  }

  protected getRoleMaxDistance(): number {
    return 500;
  }

  protected getRoleWanderChance(): number {
    return 0.15;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'survive',
        priority: () => 8,
        isValid: () => true,
      },
      {
        name: 'explore',
        priority: () => {
          const urgency = this.ctx.getFoodUrgency();
          return 5 + (1 - urgency) * 3;
        },
        isValid: () => true,
      },
      {
        name: 'markFood',
        priority: () => {
          const food = this.ctx.getNearestFood(this.ctx.getColonyPosition().x, this.ctx.getColonyPosition().y);
          return food ? 4 : 1;
        },
        isValid: () => this.ctx.getFoodSources().length > 0,
      },
      {
        name: 'return',
        priority: () => 2,
        isValid: () => true,
      },
    ];
  }

  private buildActions(): GOAPAction[] {
    return [
      this.createExploreAction(),
      this.createMarkFoodAction(),
      this.createForageAction(),
      this.createReturnHomeAction(),
      this.createWanderAction(),
    ];
  }

  private createExploreAction(): GOAPAction {
    return {
      name: 'explore',
      cost: 2,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (state.targetX === null) {
          const angle = state.angle + (Math.random() - 0.5) * Math.PI;
          const distance = 80 + Math.random() * 120;
          state.targetX = state.x + Math.cos(angle) * distance;
          state.targetY = state.y + Math.sin(angle) * distance;
        }
        const homeDist = ctx.distance(state.x, state.y, state.homeX, state.homeY);
        if (homeDist > this.maxDistance * 0.9) {
          const toHome = Math.atan2(state.homeY - state.y, state.homeX - state.x);
          state.targetX = state.x + Math.cos(toHome) * 50;
          state.targetY = state.y + Math.sin(toHome) * 50;
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createMarkFoodAction(): GOAPAction {
    return {
      name: 'markFood',
      cost: 1,
      preconditions: {
        distToFood: 1,
        isCarrying: false,
      },
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const food = ctx.getNearestFood(state.x, state.y);
        if (!food) {
          return { done: true, success: false };
        }
        this.steerToward(state, food.x, food.y);
        if (ctx.distance(state.x, state.y, food.x, food.y) < 15) {
          ctx.addPheromone(food.x, food.y, 'food', 1);
          ctx.addPheromone(state.x, state.y, 'trail', 0.8);
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => ctx.getNearestFood(state.x, state.y) !== null,
    };
  }

  private createForageAction(): GOAPAction {
    return {
      name: 'forage',
      cost: 1,
      preconditions: {
        isCarrying: false,
        distToFood: 1,
      },
      effects: {
        set: { isCarrying: true },
      },
      execute: (ctx, state) => {
        const food = ctx.getNearestFood(state.x, state.y);
        if (!food) {
          return { done: true, success: false };
        }
        this.steerToward(state, food.x, food.y);
        if (ctx.distance(state.x, state.y, food.x, food.y) < 15) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => ctx.getNearestFood(state.x, state.y) !== null,
    };
  }

  private createReturnHomeAction(): GOAPAction {
    return {
      name: 'returnHome',
      cost: 2,
      preconditions: {
        isCarrying: true,
      },
      effects: {
        set: { isCarrying: false },
      },
      execute: (ctx, state) => {
        this.steerToward(state, state.homeX, state.homeY);
        const homeDist = ctx.distance(state.x, state.y, state.homeX, state.homeY);
        if (homeDist < 30) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
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
        if (state.targetX === null) {
          this.setWanderTarget(state);
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }
}
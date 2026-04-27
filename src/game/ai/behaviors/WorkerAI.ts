import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData, ActionResult } from '../types';
import { AntEntity } from '../../AntEntity';

export class WorkerAI extends BaseAntAI {
  readonly role = 'worker' as const;
  readonly displayName = 'Worker';

  constructor(ctx: AIContext) {
    super(ctx);
    this.speed = this.getRoleSpeed();
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 40;
  }

  protected getRoleDetectionRadius(): number {
    return 180;
  }

  protected getRoleMaxDistance(): number {
    return 280;
  }

  protected getRoleWanderChance(): number {
    return 0.05;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'survive',
        priority: () => {
          const nearestThreat = this.ctx.getNearestPredator(this.ctx.getColonyPosition().x, this.ctx.getColonyPosition().y, 300);
          if (nearestThreat) return 9;
          return 7;
        },
        isValid: () => true,
      },
      {
        name: 'forage',
        priority: () => {
          const urgency = this.ctx.getFoodUrgency();
          const brood = this.ctx.getBroodHunger();
          return Math.max(urgency, brood) * 6 + 3;
        },
        isValid: (ctx) => {
          const foods = ctx.getFoodSources();
          return foods.length > 0;
        },
      },
      {
        name: 'deposit',
        priority: () => 4,
        isValid: () => true,
      },
      {
        name: 'wander',
        priority: () => 1,
        isValid: () => true,
      },
    ];
  }

  private buildActions(): GOAPAction[] {
    return [
      this.createForageAction(),
      this.createDepositAction(),
      this.createReturnHomeAction(),
      this.createWanderAction(),
    ];
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
        unset: { distToFood: -1 },
      },
      execute: (ctx, state) => {
        const food = ctx.getNearestFood(state.x, state.y);
        if (!food) {
          return { done: true, success: false };
        }
        this.steerToward(state, food.x, food.y);
        if (ctx.distance(state.x, state.y, food.x, food.y) < 15) {
          return { done: true, success: true, nextAction: this.actions.find(a => a.name === 'collect') };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const food = ctx.getNearestFood(state.x, state.y);
        return food !== null;
      },
    };
  }

  private createCollectAction(): GOAPAction {
    return {
      name: 'collect',
      cost: 0.5,
      preconditions: {
        isCarrying: false,
        distToFood: 1,
      },
      effects: {
        set: { isCarrying: true },
      },
      execute: (ctx, state) => {
        return { done: true, success: true, nextAction: this.actions.find(a => a.name === 'deposit') };
      },
      inRange: (ctx, state) => true,
    };
  }

  private createDepositAction(): GOAPAction {
    return {
      name: 'deposit',
      cost: 1,
      preconditions: {
        isCarrying: true,
        distToHome: 1,
      },
      effects: {
        set: { isCarrying: false },
        unset: { distToFood: 0 },
      },
      execute: (ctx, state) => {
        const home = ctx.getColonyPosition();
        this.steerToward(state, home.x, home.y);
        if (ctx.distance(state.x, state.y, home.x, home.y) < 30) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const home = ctx.getColonyPosition();
        return ctx.distance(state.x, state.y, home.x, home.y) < 30;
      },
    };
  }

  private createReturnHomeAction(): GOAPAction {
    return {
      name: 'returnHome',
      cost: 2,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const home = ctx.getColonyPosition();
        const homeDist = ctx.distance(state.x, state.y, home.x, home.y);
        this.steerToward(state, home.x, home.y);
        if (homeDist < 30) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => true,
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
      inRange: (ctx, state) => true,
    };
  }
}
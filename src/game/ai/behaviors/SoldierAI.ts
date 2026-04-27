import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class SoldierAI extends BaseAntAI {
  readonly role = 'soldier' as const;
  readonly displayName = 'Soldier';

  private patrolAngle = 0;
  private patrolTimer = 0;
  private patrolInterval = 5;

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 30;
  }

  protected getRoleTurnSpeed(): number {
    return 6;
  }

  protected getRoleDetectionRadius(): number {
    return 250;
  }

  protected getRoleMaxDistance(): number {
    return 200;
  }

  protected getRoleWanderChance(): number {
    return 0.02;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'defend',
        priority: () => {
          const threat = this.ctx.getNearestPredator(
            this.ctx.getColonyPosition().x,
            this.ctx.getColonyPosition().y,
            400
          );
          return threat ? 9 : 1;
        },
        isValid: () => true,
      },
      {
        name: 'patrol',
        priority: () => 6,
        isValid: () => true,
      },
      {
        name: 'forage',
        priority: () => this.ctx.getFoodUrgency() * 4,
        isValid: () => this.ctx.getFoodUrgency() > 0.3,
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
      this.createDefendAction(),
      this.createPatrolAction(),
      this.createAttackAction(),
      this.createForageAction(),
      this.createWanderAction(),
    ];
  }

  private createDefendAction(): GOAPAction {
    return {
      name: 'defend',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const threat = ctx.getNearestPredator(state.x, state.y, 300);
        if (threat) {
          this.steerToward(state, threat.x, threat.y);
          if (ctx.distance(state.x, state.y, threat.x, threat.y) < 30) {
            return { done: true, success: true };
          }
          return { done: false, success: true };
        }
        return { done: true, success: true };
      },
      inRange: (ctx) => ctx.getNearestPredator(ctx.getColonyPosition().x, ctx.getColonyPosition().y, 300) !== null,
    };
  }

  private createPatrolAction(): GOAPAction {
    return {
      name: 'patrol',
      cost: 2,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        this.patrolTimer += 0.016;
        if (this.patrolTimer >= this.patrolInterval || state.targetX === null) {
          this.patrolTimer = 0;
          const home = ctx.getColonyPosition();
          this.patrolAngle += (Math.random() - 0.5) * 0.8;
          const patrolDist = 80 + Math.random() * 60;
          state.targetX = home.x + Math.cos(this.patrolAngle) * patrolDist;
          state.targetY = home.y + Math.sin(this.patrolAngle) * patrolDist;
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createAttackAction(): GOAPAction {
    return {
      name: 'attack',
      cost: 0.5,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const threat = ctx.getNearestPredator(state.x, state.y, 200);
        if (!threat) {
          return { done: true, success: false };
        }
        this.steerToward(state, threat.x, threat.y);
        return { done: false, success: true };
      },
      inRange: (ctx, state) => ctx.getNearestPredator(state.x, state.y, 60) !== null,
    };
  }

  private createForageAction(): GOAPAction {
    return {
      name: 'forage',
      cost: 2,
      preconditions: {
        isCarrying: false,
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
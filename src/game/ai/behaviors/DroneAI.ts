import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class DroneAI extends BaseAntAI {
  readonly role = 'drone' as const;
  readonly displayName = 'Drone';

  private matingSeason = false;
  private hasMated = false;
  private wanderTimer = 0;

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 45;
  }

  protected getRoleTurnSpeed(): number {
    return 5;
  }

  protected getRoleDetectionRadius(): number {
    return 300;
  }

  protected getRoleMaxDistance(): number {
    return 400;
  }

  protected getRoleWanderChance(): number {
    return 0.2;
  }

  getGoals(): Goal[] {
    const season = this.ctx.getSeason();
    const isMatingSeason = season === 'spring' || season === 'summer';

    if (isMatingSeason && !this.hasMated) {
      this.matingSeason = true;
    }

    return [
      {
        name: 'survive',
        priority: () => 8,
        isValid: () => true,
      },
      {
        name: 'matingFlight',
        priority: () => this.matingSeason ? 9 : 1,
        isValid: () => this.matingSeason,
      },
      {
        name: 'wander',
        priority: () => this.matingSeason ? 2 : 5,
        isValid: () => true,
      },
    ];
  }

  private buildActions(): GOAPAction[] {
    return [
      this.createMatingFlightAction(),
      this.createForageAction(),
      this.createWanderAction(),
      this.createDieAction(),
    ];
  }

  private createMatingFlightAction(): GOAPAction {
    return {
      name: 'matingFlight',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (!this.matingSeason || this.hasMated) {
          return { done: true, success: false };
        }
        if (state.targetX === null || this.wanderTimer <= 0) {
          this.wanderTimer = 3 + Math.random() * 3;
          const angle = Math.random() * Math.PI * 2;
          const dist = 100 + Math.random() * 200;
          state.targetX = state.x + Math.cos(angle) * dist;
          state.targetY = state.y + Math.sin(angle) * dist;
          const homeDist = ctx.distance(state.x, state.y, state.homeX, state.homeY);
          if (homeDist > this.maxDistance) {
            state.targetX = state.homeX + Math.cos(angle) * 50;
            state.targetY = state.homeY + Math.sin(angle) * 50;
          }
        }
        this.wanderTimer -= 0.016;
        if (Math.random() < 0.001) {
          this.hasMated = true;
          this.matingSeason = false;
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }

  private createForageAction(): GOAPAction {
    return {
      name: 'forage',
      cost: 2,
      preconditions: {},
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

  private createDieAction(): GOAPAction {
    return {
      name: 'die',
      cost: 0,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (this.hasMated) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }
}
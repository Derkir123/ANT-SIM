import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class GuardAI extends BaseAntAI {
  readonly role = 'guard' as const;
  readonly displayName = 'Guard';

  private stationary = true;
  private guardStation?: { x: number; y: number };
  private alertLevel = 0;

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 15;
  }

  protected getRoleTurnSpeed(): number {
    return 4;
  }

  protected getRoleDetectionRadius(): number {
    return 180;
  }

  protected getRoleMaxDistance(): number {
    return 60;
  }

  protected getRoleWanderChance(): number {
    return 0.0;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'guard',
        priority: () => 9,
        isValid: () => true,
      },
      {
        name: 'attack',
        priority: () => {
          const threat = this.ctx.getNearestPredator(
            this.ctx.getColonyPosition().x,
            this.ctx.getColonyPosition().y,
            200
          );
          return threat ? 10 : 1;
        },
        isValid: () => true,
      },
      {
        name: 'forage',
        priority: () => this.ctx.getFoodUrgency() * 6,
        isValid: () => this.ctx.getFoodUrgency() > 0.7,
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
      this.createGuardAction(),
      this.createAttackAction(),
      this.createBroadcastAlarmAction(),
      this.createForageAction(),
    ];
  }

  private createGuardAction(): GOAPAction {
    return {
      name: 'guard',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (!this.guardStation) {
          const entrance = ctx.getNest().entranceX;
          const entranceY = ctx.getNest().entranceY;
          this.guardStation = { x: entrance, y: entranceY };
        }
        const dx = this.guardStation.x - state.x;
        const dy = this.guardStation.y - state.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 20) {
          state.targetX = this.guardStation.x;
          state.targetY = this.guardStation.y;
        } else {
          const threat = ctx.getNearestPredator(state.x, state.y, this.detectionRadius);
          if (!threat) {
            state.targetX = this.guardStation.x + (Math.random() - 0.5) * 15;
            state.targetY = this.guardStation.y + (Math.random() - 0.5) * 15;
            if (this.stationary) {
              return { done: false, success: true };
            }
          }
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
        const threat = ctx.getNearestPredator(state.x, state.y, 100);
        if (!threat) {
          this.alertLevel = Math.max(0, this.alertLevel - 0.01);
          return { done: true, success: false };
        }
        this.alertLevel = Math.min(1, this.alertLevel + 0.05);
        this.steerToward(state, threat.x, threat.y);
        return { done: false, success: true };
      },
      inRange: (ctx, state) => ctx.getNearestPredator(state.x, state.y, 100) !== null,
    };
  }

  private createBroadcastAlarmAction(): GOAPAction {
    return {
      name: 'broadcastAlarm',
      cost: 0.5,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        if (this.alertLevel > 0.3) {
          const nest = ctx.getNest();
          ctx.addPheromone(nest.entranceX, nest.entranceY, 'alarm', this.alertLevel);
        }
        return { done: true, success: true };
      },
      inRange: () => true,
    };
  }

  private createForageAction(): GOAPAction {
    return {
      name: 'forage',
      cost: 3,
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
        const homeDist = ctx.distance(state.x, state.y, state.homeX, state.homeY);
        if (homeDist > 100) {
          this.steerToward(state, state.homeX, state.homeY);
          return { done: false, success: true };
        }
        this.steerToward(state, food.x, food.y);
        if (ctx.distance(state.x, state.y, food.x, food.y) < 15) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const food = ctx.getNearestFood(state.x, state.y);
        return food !== null && ctx.distance(state.x, state.y, state.homeX, state.homeY) < 100;
      },
    };
  }
}
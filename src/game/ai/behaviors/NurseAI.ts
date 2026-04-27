import { BaseAntAI } from './BaseAntAI';
import { AIContext } from '../AIContext';
import { GOAPAction, Goal, AntStateData } from '../types';

export class NurseAI extends BaseAntAI {
  readonly role = 'nurse' as const;
  readonly displayName = 'Nurse';

  constructor(ctx: AIContext) {
    super(ctx);
    this.actions = this.buildActions();
  }

  protected getRoleSpeed(): number {
    return 25;
  }

  protected getRoleTurnSpeed(): number {
    return 7;
  }

  protected getRoleDetectionRadius(): number {
    return 80;
  }

  protected getRoleMaxDistance(): number {
    return 120;
  }

  protected getRoleWanderChance(): number {
    return 0.03;
  }

  getGoals(): Goal[] {
    return [
      {
        name: 'tendBrood',
        priority: () => {
          const broodHunger = this.ctx.getBroodHunger();
          const brood = this.ctx.getBroodCount();
          return 5 + broodHunger * 4 + Math.log(1 + brood.eggs + brood.larvae + brood.pupae);
        },
        isValid: () => {
          const brood = this.ctx.getBroodCount();
          return brood.eggs + brood.larvae + brood.pupae > 0;
        },
      },
      {
        name: 'forage',
        priority: () => this.ctx.getFoodUrgency() * 5,
        isValid: () => this.ctx.getFoodUrgency() > 0.5,
      },
      {
        name: 'survive',
        priority: () => 8,
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
      this.createTendBroodAction(),
      this.createGroomQueenAction(),
      this.createForageAction(),
      this.createWanderAction(),
    ];
  }

  private createTendBroodAction(): GOAPAction {
    return {
      name: 'tendBrood',
      cost: 1,
      preconditions: {},
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const nest = ctx.getNest();
        const broodDist = ctx.distance(state.x, state.y, nest.broodChamberX, nest.broodChamberY);
        if (broodDist > 30) {
          this.steerToward(state, nest.broodChamberX, nest.broodChamberY);
          return { done: false, success: true };
        }
        if (state.wanderTimer > 2) {
          state.wanderTimer = 0;
          const offsetX = (Math.random() - 0.5) * 40;
          const offsetY = (Math.random() - 0.5) * 40;
          state.targetX = nest.broodChamberX + offsetX;
          state.targetY = nest.broodChamberY + offsetY;
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const nest = ctx.getNest();
        return ctx.distance(state.x, state.y, nest.broodChamberX, nest.broodChamberY) < 40;
      },
    };
  }

  private createGroomQueenAction(): GOAPAction {
    return {
      name: 'groomQueen',
      cost: 2,
      preconditions: {
        distToHome: 1,
      },
      effects: {
        set: {},
      },
      execute: (ctx, state) => {
        const nest = ctx.getNest();
        this.steerToward(state, nest.queenChamberX, nest.queenChamberY);
        const dist = ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY);
        if (dist < 50) {
          return { done: true, success: true };
        }
        return { done: false, success: true };
      },
      inRange: (ctx, state) => {
        const nest = ctx.getNest();
        return ctx.distance(state.x, state.y, nest.queenChamberX, nest.queenChamberY) < 50;
      },
    };
  }

  private createForageAction(): GOAPAction {
    return {
      name: 'forage',
      cost: 2,
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
          const nest = ctx.getNest();
          const angle = Math.random() * Math.PI * 2;
          const dist = 20 + Math.random() * 40;
          state.targetX = nest.broodChamberX + Math.cos(angle) * dist;
          state.targetY = nest.broodChamberY + Math.sin(angle) * dist;
        }
        return { done: false, success: true };
      },
      inRange: () => true,
    };
  }
}